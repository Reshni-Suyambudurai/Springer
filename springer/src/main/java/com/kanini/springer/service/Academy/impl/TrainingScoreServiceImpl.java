package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.ExcelUploadResponse;
import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.enums.Enums.ScoreStatus;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.mapper.Academy.TrainingScoreMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.ITrainingScoreService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrainingScoreServiceImpl implements ITrainingScoreService {

    private static final String REVIEWER_NOT_FOUND = "Reviewer not found with ID: ";
    private static final String SCORE_NOT_FOUND = "Training Score not found with ID: ";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private final TrainingScoreRepository scoreRepository;
    private final TrainingCourseRepository courseRepository;
    private final BatchAllocationRepository allocationRepository;
    private final BatchCourseRepository batchCourseRepository;
    private final UserRepository userRepository;
    private final TrainingScoreMapper mapper;
    
    @Override
    @Transactional
    public TrainingScoreResponse createScore(TrainingScoreRequest request) {
        TrainingCourse course = courseRepository.findByCourseId(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + request.getCourseId()));

        BatchAllocation student = allocationRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation (Student) not found with ID: " + request.getStudentId()));

        User reviewer = userRepository.findById(request.getReviewedBy())
                .orElseThrow(() -> new ResourceNotFoundException(REVIEWER_NOT_FOUND + request.getReviewedBy()));

        TrainingScore score = mapper.toEntity(request);
        score.setCourse(course);
        score.setStudent(student);
        score.setReviewedBy(reviewer);

        if (Boolean.TRUE.equals(course.getIsCommunication())) {
            int computedScore = validateAndComputeCommunicationScore(request.getCommunicationBreakdown(), course);
            score.setScore(computedScore);
            score.setStatus(calculateScoreStatus(normalizeScore(computedScore, course), course.getMinScore()));
        } else {
            if (request.getScore() == null) throw new IllegalArgumentException("Score is required for technical courses");
            if (request.getScore() < 0 || request.getScore() > 100) throw new IllegalArgumentException("Score must be between 0 and 100");
            score.setStatus(calculateScoreStatus(request.getScore(), course.getMinScore()));
        }

        TrainingScore savedScore = scoreRepository.save(score);
        recalculateOverallScore(student);
        return mapper.toResponse(savedScore);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByStudent(Long studentId) {
        // Validate student (batch allocation) exists first
        allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation (Student) not found with ID: " + studentId));
        
        return scoreRepository.findByStudent_StudentId(studentId).stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByBatchAndCourse(Integer programId, Integer batchNumber, Integer courseId) {
        return scoreRepository.findByBatchAndCourse(programId, batchNumber, courseId).stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional
    public TrainingScoreResponse updateScore(Integer scoreId, TrainingScoreRequest request) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException(SCORE_NOT_FOUND + scoreId));

        TrainingCourse course = score.getCourse();

        if (request.getReview() != null) score.setReview(request.getReview());
        if (request.getReviewedBy() != null) {
            User reviewer = userRepository.findById(request.getReviewedBy())
                    .orElseThrow(() -> new ResourceNotFoundException(REVIEWER_NOT_FOUND + request.getReviewedBy()));
            score.setReviewedBy(reviewer);
        }

        if (Boolean.TRUE.equals(course.getIsCommunication())) {
            if (request.getCommunicationBreakdown() != null) {
                int computedScore = validateAndComputeCommunicationScore(request.getCommunicationBreakdown(), course);
                score.setScore(computedScore);
                score.setCommunicationBreakdown(request.getCommunicationBreakdown());
                score.setStatus(calculateScoreStatus(normalizeScore(computedScore, course), course.getMinScore()));
            }
        } else {
            if (request.getScore() != null) {
                if (request.getScore() < 0 || request.getScore() > 100) throw new IllegalArgumentException("Score must be between 0 and 100");
                score.setScore(request.getScore());
                score.setStatus(calculateScoreStatus(request.getScore(), course.getMinScore()));
            }
        }

        TrainingScore updatedScore = scoreRepository.save(score);
        recalculateOverallScore(updatedScore.getStudent());
        return mapper.toResponse(updatedScore);
    }
    
    @Override
    @Transactional
    public void deleteScore(Integer scoreId) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException(SCORE_NOT_FOUND + scoreId));
        scoreRepository.delete(score);
    }

    /**
     * For technical: score is already 0-100.
     * For communication: pass the normalized score (0-100) so thresholds are consistent.
     * minScore for communication is stored as a normalized value (0-100) set when creating the course.
     */
    private ScoreStatus calculateScoreStatus(int score, int minScore) {
        if (score >= 90) return ScoreStatus.EXCELLENT;
        if (score >= minScore) return ScoreStatus.GOOD;
        if (score >= minScore - 10) return ScoreStatus.AVERAGE;
        return ScoreStatus.BELOW_AVERAGE;
    }

    /**
     * Normalizes a raw communication score to 0-100 scale.
     * e.g. raw=38, maxTotal=50 → (38/50)*100 = 76
     */
    private int normalizeScore(int rawScore, TrainingCourse course) {
        int maxTotal = mapper.sumMaxScoresFromTemplate(course.getCommunicationTemplate());
        if (maxTotal <= 0) return 0;
        return (int) Math.round((rawScore * 100.0) / maxTotal);
    }

    /**
     * Parses communicationBreakdown JSON, validates each sub-score against its maxScore,
     * and returns the raw sum of sub-scores.
     * Expected format: [{"name":"Fluency","score":16,"maxScore":20}, ...]
     */
    private int validateAndComputeCommunicationScore(String breakdownJson, TrainingCourse course) {
        if (breakdownJson == null || breakdownJson.isBlank())
            throw new IllegalArgumentException("communicationBreakdown is required for communication courses");

        // Parse template to get allowed fields and their maxScores
        List<Map<String, Object>> template;
        List<Map<String, Object>> breakdown;
        try {
            template  = OBJECT_MAPPER.readValue(course.getCommunicationTemplate(), new TypeReference<>() {});
            breakdown = OBJECT_MAPPER.readValue(breakdownJson, new TypeReference<>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON in communicationBreakdown: " + e.getMessage());
        }

        // Build a map of fieldName → maxScore from template
        Map<String, Integer> templateMaxScores = new java.util.LinkedHashMap<>();
        for (Map<String, Object> field : template) {
            String name = (String) field.get("name");
            int max = field.get("maxScore") instanceof Number n ? n.intValue() : 0;
            templateMaxScores.put(name, max);
        }

        int total = 0;
        for (Map<String, Object> entry : breakdown) {
            String name  = (String) entry.get("name");
            int subScore = entry.get("score") instanceof Number n ? n.intValue() : -1;
            Integer maxScore = templateMaxScores.get(name);

            if (maxScore == null)
                throw new IllegalArgumentException("Unknown communication field: '" + name + "'");
            if (subScore < 0 || subScore > maxScore)
                throw new IllegalArgumentException(
                    "Score for '" + name + "' must be between 0 and " + maxScore + ", got " + subScore);
            total += subScore;
        }
        return total;
    }

    /**
     * Recalculates and persists the overall weighted score for a student.
     *
     * Uses BEST score per course across ALL batch allocations for the same candidate.
     * This ensures a transferred student is not penalised — their best performance counts.
     *
     * Formula (auto-normalized — weights need NOT sum to 100):
     *   overallWeightedScore = sum(bestScore_i × weight_i) / sum(weight_i)
     */
    private void recalculateOverallScore(BatchAllocation student) {
        Long candidateId = student.getCandidate().getCandidateId();

        // Fetch all scores across ALL allocations for this candidate
        List<TrainingScore> allScores = scoreRepository.findAllByCandidateId(candidateId);

        if (allScores.isEmpty()) {
            student.setOverallWeightedScore(BigDecimal.ZERO);
            allocationRepository.save(student);
            return;
        }

        // Best score per course (by courseId) — exclude communication courses
        java.util.Map<Integer, TrainingScore> bestPerCourse = new java.util.LinkedHashMap<>();
        for (TrainingScore ts : allScores) {
            if (ts.getCourse() == null || ts.getScore() == null) continue;
            if (Boolean.TRUE.equals(ts.getCourse().getIsCommunication())) continue;
            Integer courseId = ts.getCourse().getCourseId();
            TrainingScore existing = bestPerCourse.get(courseId);
            if (existing == null || ts.getScore() > existing.getScore()) {
                bestPerCourse.put(courseId, ts);
            }
        }

        double weightedSum = 0.0;
        double totalWeight = 0.0;
        for (TrainingScore ts : bestPerCourse.values()) {
            int weight = ts.getCourse().getWeightage() != null ? ts.getCourse().getWeightage() : 1;
            weightedSum += ts.getScore() * weight;
            totalWeight += weight;
        }

        BigDecimal overall = totalWeight > 0
            ? BigDecimal.valueOf(weightedSum / totalWeight).setScale(2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        student.setOverallWeightedScore(overall);
        allocationRepository.save(student);
    }

    @Override
    @Transactional
    public ExcelUploadResponse uploadScoresFromExcel(MultipartFile file, Integer programId, Integer batchNumber, Integer courseId, Long reviewedBy) {
        List<String> errors = new ArrayList<>();
        int savedCount = 0;
        int totalRows = 0;

        validateScoreExcelFile(file);

        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));
        User reviewer = userRepository.findById(reviewedBy)
                .orElseThrow(() -> new ResourceNotFoundException(REVIEWER_NOT_FOUND + reviewedBy));
        List<BatchAllocation> batchStudents = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                .stream().filter(a -> Boolean.TRUE.equals(a.getIsActive())).toList();

        if (batchStudents.isEmpty())
            throw new ResourceNotFoundException("No active students found for Program: " + programId + ", Batch: " + batchNumber);

        ScoreRowContext ctx = new ScoreRowContext(batchStudents, batchNumber, course, reviewer);
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getLastRowNum() < 1)
                throw new IllegalArgumentException("Excel file has no data rows. Row 1 should be the header, Row 2+ should be data.");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String firstCell = getCellString(row.getCell(0));
                if (firstCell.isBlank()) continue;
                totalRows++;
                savedCount += processScoreRow(row, i + 1, firstCell, ctx, errors);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to parse Excel file. Make sure it is a valid .xlsx file: " + e.getMessage());
        }

        if (totalRows == 0)
            errors.add("No data rows found in the file. Make sure Row 1 is the header and data starts from Row 2.");

        return new ExcelUploadResponse(savedCount, totalRows - savedCount, totalRows, errors);
    }

    private void validateScoreExcelFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String filenameLower = filename != null ? filename.toLowerCase() : "";
        if (!filenameLower.endsWith(".xlsx"))
            throw new IllegalArgumentException("Only .xlsx files are supported. Please download the template and use Excel format.");
        if (file.isEmpty())
            throw new IllegalArgumentException("Uploaded file is empty.");
    }

    private record ScoreRowContext(List<BatchAllocation> batchStudents, Integer batchNumber,
                                   TrainingCourse course, User reviewer) {}

    private int processScoreRow(Row row, int rowNum, String firstCell,
            ScoreRowContext ctx, List<String> errors) {
        try {
            String studentIdStr = firstCell;
            String studentName  = getCellString(row.getCell(1));
            String scoreStr     = getCellString(row.getCell(3));
            String review       = row.getCell(4) != null ? getCellString(row.getCell(4)) : "";

            boolean newTemplateFormat = !scoreStr.isBlank() || !review.isBlank();
            if (!newTemplateFormat) {
                studentName  = studentIdStr;
                scoreStr     = getCellString(row.getCell(1));
                review       = row.getCell(2) != null ? getCellString(row.getCell(2)) : "";
                studentIdStr = "";
            }

            if (scoreStr.isBlank()) { errors.add("Row " + rowNum + ": Score is empty"); return 0; }

            int score = parseScore(scoreStr, rowNum, errors);
            if (score < 0) return 0;
            if (score > 100) { errors.add("Row " + rowNum + ": Score " + score + " out of range (0-100)"); return 0; }

            Optional<BatchAllocation> studentOpt = resolveScoreStudent(studentIdStr, studentName, ctx.batchStudents(), rowNum, errors);
            if (studentOpt.isEmpty()) {
                errors.add("Row " + rowNum + ": Student not found for Student ID '" + studentIdStr + "' / Name '" + studentName + "' in Batch " + ctx.batchNumber());
                return 0;
            }

            BatchAllocation student = studentOpt.get();
            List<TrainingScore> existing = scoreRepository.findByStudent_StudentIdAndCourse_CourseId(student.getStudentId(), ctx.course().getCourseId());
            TrainingScore scoreEntity = existing.isEmpty() ? new TrainingScore() : existing.get(0);
            scoreEntity.setCourse(ctx.course());
            scoreEntity.setStudent(student);
            scoreEntity.setScore(score);
            scoreEntity.setReview(review);
            scoreEntity.setReviewedBy(ctx.reviewer());
            scoreEntity.setStatus(calculateScoreStatus(score, ctx.course().getMinScore()));
            scoreRepository.save(scoreEntity);
            recalculateOverallScore(student);
            return 1;
        } catch (Exception e) {
            errors.add("Row " + rowNum + ": " + e.getMessage());
            return 0;
        }
    }

    private int parseScore(String scoreStr, int rowNum, List<String> errors) {
        try {
            return (int) Math.round(Double.parseDouble(scoreStr));
        } catch (NumberFormatException e) {
            errors.add("Row " + rowNum + ": Invalid score '" + scoreStr + "' — must be a number");
            return -1;
        }
    }

    private Optional<BatchAllocation> resolveScoreStudent(String studentIdStr, String studentName,
            List<BatchAllocation> batchStudents, int rowNum, List<String> errors) {
        if (!studentIdStr.isBlank()) {
            try {
                Long studentId = Long.parseLong(studentIdStr.trim());
                return batchStudents.stream().filter(a -> a.getStudentId().equals(studentId)).findFirst();
            } catch (NumberFormatException e) {
                errors.add("Row " + rowNum + ": Invalid Student ID '" + studentIdStr + "'");
                return Optional.empty();
            }
        }
        final String nameLower = studentName.trim().toLowerCase();
        List<BatchAllocation> matches = batchStudents.stream()
                .filter(a -> (a.getCandidate().getFirstName() + " " + a.getCandidate().getLastName()).toLowerCase().equals(nameLower))
                .toList();
        if (matches.size() > 1) {
            errors.add("Row " + rowNum + ": Multiple students found with name '" + studentName + "'. Use the latest template with Student ID.");
            return Optional.empty();
        }
        return matches.size() == 1 ? Optional.of(matches.get(0)) : Optional.empty();
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }
}
