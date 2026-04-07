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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingScoreServiceImpl implements ITrainingScoreService {
    
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
        
        TrainingScore score = mapper.toEntity(request);
        score.setCourse(course);
        score.setStudent(student);
        User reviewer = userRepository.findById(request.getReviewedBy())
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + request.getReviewedBy()));
        score.setReviewedBy(reviewer);
        
        // Validate score is within range
        if (request.getScore() < 0 || request.getScore() > 100) {
            throw new IllegalArgumentException("Score must be between 0 and 100");
        }
        
        // Set status based on score
        // EXCELLENT: >= 90, GOOD: >= minScore, AVERAGE: >= minScore-10, BELOW_AVERAGE: below that
        score.setStatus(calculateScoreStatus(request.getScore(), course.getMinScore()));
        
        TrainingScore savedScore = scoreRepository.save(score);
        recalculateOverallScore(student);
        return mapper.toResponse(savedScore);
    }
    
    @Override
    @Transactional(readOnly = true)
    public TrainingScoreResponse getScoreById(Integer scoreId) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Score not found with ID: " + scoreId));
        return mapper.toResponse(score);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getAllScores() {
        return scoreRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByStudent(Long studentId) {
        // Validate student (batch allocation) exists first
        allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation (Student) not found with ID: " + studentId));
        
        return scoreRepository.findByStudent_StudentId(studentId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByCourse(Integer courseId) {
        // Validate course exists first
        courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        
        return scoreRepository.findByCourse_CourseId(courseId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByStatus(String status) {
        try {
            ScoreStatus scoreStatus = ScoreStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
            return scoreRepository.findByStatus(scoreStatus).stream()
                    .map(mapper::toResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid score status: " + status);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByReviewer(Long reviewerId) {
        // Validate reviewer (user) exists first
        userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User (Reviewer) not found with ID: " + reviewerId));
        
        return scoreRepository.findByReviewedBy_UserId(reviewerId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public TrainingScoreResponse updateScore(Integer scoreId, TrainingScoreRequest request) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Score not found with ID: " + scoreId));
        
        // Only update fields that are provided (not null) - PATCH behavior
        if (request.getScore() != null) {
            // Validate score is within range
            if (request.getScore() < 0 || request.getScore() > 100) {
                throw new IllegalArgumentException("Score must be between 0 and 100");
            }
            score.setScore(request.getScore());
            
            // Recalculate status based on updated score
            if (score.getCourse() != null) {
                score.setStatus(calculateScoreStatus(request.getScore(), score.getCourse().getMinScore()));
            }
        }
        if (request.getReview() != null) {
            score.setReview(request.getReview());
        }
        if (request.getCourseId() != null) {
            TrainingCourse course = courseRepository.findByCourseId(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + request.getCourseId()));
            score.setCourse(course);
        }
        if (request.getReviewedBy() != null) {
            User reviewer = userRepository.findById(request.getReviewedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + request.getReviewedBy()));
            score.setReviewedBy(reviewer);
        }
        
        TrainingScore updatedScore = scoreRepository.save(score);
        recalculateOverallScore(updatedScore.getStudent());
        return mapper.toResponse(updatedScore);
    }
    
    @Override
    @Transactional
    public void deleteScore(Integer scoreId) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Score not found with ID: " + scoreId));
        scoreRepository.delete(score);
    }

    /**
     * Calculate score status based on score and course minScore
     * EXCELLENT : score >= 90
     * GOOD      : score >= minScore
     * AVERAGE   : score >= minScore - 10
     * BELOW_AVERAGE: score < minScore - 10
     */
    private ScoreStatus calculateScoreStatus(int score, int minScore) {
        if (score >= 90) return ScoreStatus.EXCELLENT;
        if (score >= minScore) return ScoreStatus.GOOD;
        if (score >= minScore - 10) return ScoreStatus.AVERAGE;
        return ScoreStatus.BELOW_AVERAGE;
    }

    /**
     * Recalculates and persists the overall weighted score for a student.
     *
     * Formula (auto-normalized — weights need NOT sum to 100):
     *   overallWeightedScore = sum(score_i × weight_i) / sum(weight_i)
     *
     * Only courses that have a score entered are included in the calculation.
     * This means the score reflects progress so far, not penalising missing courses.
     *
     * Example:
     *   Angular (weight=90): score=75  →  75 × 90 = 6750
     *   React   (weight=30): score=85  →  85 × 30 = 2550
     *   Node.js (weight=20): score=90  →  90 × 20 = 1800
     *   total weight = 140, weighted sum = 11100
     *   overallWeightedScore = 11100 / 140 = 79.29
     */
    private void recalculateOverallScore(BatchAllocation student) {
        List<TrainingScore> scores = scoreRepository.findByStudent_StudentId(student.getStudentId());

        if (scores.isEmpty()) {
            student.setOverallWeightedScore(BigDecimal.ZERO);
            allocationRepository.save(student);
            return;
        }

        double weightedSum = 0.0;
        double totalWeight = 0.0;

        for (TrainingScore ts : scores) {
            if (ts.getCourse() == null || ts.getScore() == null) continue;
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

    // ── Excel Upload ──────────────────────────────────────────────────────────
    // Expected columns: Student ID | Candidate Name | Candidate Email | Score | Review
    // Backward compatibility: older files with Student Name | Score | Review are still accepted.
    // Row 1 = header, Row 2+ = data
    @Override
    @Transactional
    public ExcelUploadResponse uploadScoresFromExcel(MultipartFile file, Integer programId, Integer batchNumber, Integer courseId, Long reviewedBy) {
        List<String> errors = new ArrayList<>();
        int savedCount = 0;
        int totalRows = 0;

        // Validate file type
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are supported. Please download the template and use Excel format.");
        }
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));
        User reviewer = userRepository.findById(reviewedBy)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewedBy));
        List<BatchAllocation> batchStudents = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                .stream().filter(a -> Boolean.TRUE.equals(a.getIsActive())).collect(Collectors.toList());

        if (batchStudents.isEmpty()) {
            throw new ResourceNotFoundException("No active students found for Program: " + programId + ", Batch: " + batchNumber);
        }

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            if (sheet.getLastRowNum() < 1) {
                throw new IllegalArgumentException("Excel file has no data rows. Row 1 should be the header, Row 2+ should be data.");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                // Skip completely blank rows
                String firstCell = getCellString(row.getCell(0));
                if (firstCell.isBlank()) continue;
                totalRows++;
                int rowNum = i + 1;

                try {
                    String studentIdStr = firstCell;
                    String studentName  = getCellString(row.getCell(1));
                    String scoreStr     = getCellString(row.getCell(3));
                    String review       = row.getCell(4) != null ? getCellString(row.getCell(4)) : "";

                    boolean newTemplateFormat = !scoreStr.isBlank() || !review.isBlank();
                    if (!newTemplateFormat) {
                        // Backward-compatible fallback for old files: Student Name | Score | Review
                        studentName = studentIdStr;
                        scoreStr = getCellString(row.getCell(1));
                        review = row.getCell(2) != null ? getCellString(row.getCell(2)) : "";
                        studentIdStr = "";
                    }

                    if (scoreStr.isBlank()) { errors.add("Row " + rowNum + ": Score is empty"); continue; }

                    double scoreDouble;
                    try { scoreDouble = Double.parseDouble(scoreStr); }
                    catch (NumberFormatException e) { errors.add("Row " + rowNum + ": Invalid score '" + scoreStr + "' — must be a number"); continue; }

                    // Round to nearest integer instead of truncating
                    int score = (int) Math.round(scoreDouble);

                    if (score < 0 || score > 100) { errors.add("Row " + rowNum + ": Score " + score + " out of range (0-100)"); continue; }

                    Optional<BatchAllocation> studentOpt = Optional.empty();

                    if (!studentIdStr.isBlank()) {
                        try {
                            Long studentId = Long.parseLong(studentIdStr.trim());
                            studentOpt = batchStudents.stream()
                                    .filter(a -> a.getStudentId().equals(studentId))
                                    .findFirst();
                        } catch (NumberFormatException ignored) {
                            errors.add("Row " + rowNum + ": Invalid Student ID '" + studentIdStr + "'");
                            continue;
                        }
                    }

                    if (studentOpt.isEmpty()) {
                        final String nameLower = studentName.trim().toLowerCase();
                        List<BatchAllocation> matches = batchStudents.stream()
                                .filter(a -> {
                                    String full = (a.getCandidate().getFirstName() + " " + a.getCandidate().getLastName()).toLowerCase();
                                    return full.equals(nameLower);
                                })
                                .collect(Collectors.toList());

                        if (matches.size() > 1) {
                            errors.add("Row " + rowNum + ": Multiple students found with name '" + studentName + "'. Use the latest template with Student ID.");
                            continue;
                        }
                        if (matches.size() == 1) {
                            studentOpt = Optional.of(matches.get(0));
                        }
                    }

                    if (studentOpt.isEmpty()) { errors.add("Row " + rowNum + ": Student not found for Student ID '" + studentIdStr + "' / Name '" + studentName + "' in Batch " + batchNumber); continue; }

                    BatchAllocation student = studentOpt.get();

                    // Upsert — update if exists, create if not
                    List<TrainingScore> existing = scoreRepository.findByStudent_StudentIdAndCourse_CourseId(student.getStudentId(), courseId);
                    TrainingScore scoreEntity = existing.isEmpty() ? new TrainingScore() : existing.get(0);
                    scoreEntity.setCourse(course);
                    scoreEntity.setStudent(student);
                    scoreEntity.setScore(score);
                    scoreEntity.setReview(review);
                    scoreEntity.setReviewedBy(reviewer);
                    scoreEntity.setStatus(calculateScoreStatus(score, course.getMinScore()));
                    scoreRepository.save(scoreEntity);
                    recalculateOverallScore(student);
                    savedCount++;

                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file. Make sure it is a valid .xlsx file: " + e.getMessage());
        }

        if (totalRows == 0) {
            errors.add("No data rows found in the file. Make sure Row 1 is the header and data starts from Row 2.");
        }

        return new ExcelUploadResponse(savedCount, totalRows - savedCount, totalRows, errors);
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
