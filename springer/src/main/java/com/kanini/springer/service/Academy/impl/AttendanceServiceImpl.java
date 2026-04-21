package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.dto.Academy.BulkAttendanceMarkRequest;
import com.kanini.springer.dto.Academy.ExcelUploadResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingDayAttendance;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Academy.AttendanceMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.service.Academy.IAttendanceService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements IAttendanceService {

    private static final String STUDENT_NOT_FOUND = "Student not found with ID: ";

    private final TrainingDayAttendanceRepository attendanceRepository;
    private final BatchAllocationRepository allocationRepository;
    private final AttendanceMapper mapper;

    @Override
    @Transactional
    public AttendanceResponse markAttendance(AttendanceMarkRequest request) {
        BatchAllocation student = allocationRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException(STUDENT_NOT_FOUND + request.getStudentId()));

        validateAttendanceDate(request.getAttendanceDate());

        // Prevent duplicate marking on same day
        if (attendanceRepository.findByStudent_StudentIdAndAttendanceDate(
                request.getStudentId(), request.getAttendanceDate()).isPresent()) {
            throw new ValidationException("Attendance already marked for student ID: "
                    + request.getStudentId() + " on " + request.getAttendanceDate());
        }

        TrainingDayAttendance attendanceEntry = new TrainingDayAttendance();
        attendanceEntry.setStudent(student);
        attendanceEntry.setAttendanceDate(request.getAttendanceDate());
        attendanceEntry.setIsPresent(request.getIsPresent());
        attendanceRepository.save(attendanceEntry);

        long presentDays = attendanceRepository.countPresentDays(student.getStudentId());
        long absentDays  = attendanceRepository.countAbsentDays(student.getStudentId());

        // Update cached attendancePercentage on BatchAllocation
        long total = presentDays + absentDays;
        student.setAttendancePercentage(total > 0
                ? java.math.BigDecimal.valueOf((double) presentDays / total * 100)
                        .setScale(2, java.math.RoundingMode.HALF_UP)
                : java.math.BigDecimal.ZERO);
        allocationRepository.save(student);

        return mapper.toAttendanceResponse(student, attendanceEntry, presentDays, absentDays);
    }

    @Override
    @Transactional
    public List<AttendanceResponse> markAttendanceBulk(BulkAttendanceMarkRequest request) {
        List<BatchAllocation> students = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(request.getProgramId(), request.getBatchNumber())
                .stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .toList();

        if (students.isEmpty()) {
            throw new ResourceNotFoundException("No active students found for Program: "
                    + request.getProgramId() + ", Batch: " + request.getBatchNumber());
        }

        // Validate date once — all students in same program share same programYear
        validateAttendanceDate(request.getAttendanceDate());

        return students.stream().map(student -> {
            // Skip if already marked today — don't throw, just skip
            if (attendanceRepository.findByStudent_StudentIdAndAttendanceDate(
                    student.getStudentId(), request.getAttendanceDate()).isPresent()) {
                return null;
            }

            TrainingDayAttendance attendance = new TrainingDayAttendance();
            attendance.setStudent(student);
            attendance.setAttendanceDate(request.getAttendanceDate());
            attendance.setIsPresent(request.getIsPresent());
            attendanceRepository.save(attendance);

            long presentDays = attendanceRepository.countPresentDays(student.getStudentId());
            long absentDays  = attendanceRepository.countAbsentDays(student.getStudentId());

            // Update cached attendancePercentage
            long total = presentDays + absentDays;
            student.setAttendancePercentage(total > 0
                    ? java.math.BigDecimal.valueOf((double) presentDays / total * 100)
                            .setScale(2, java.math.RoundingMode.HALF_UP)
                    : java.math.BigDecimal.ZERO);
            allocationRepository.save(student);

            return mapper.toAttendanceResponse(student, attendance, presentDays, absentDays);
        })
        .filter(r -> r != null)
        .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceRecords(Long studentId) {
        BatchAllocation student = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(STUDENT_NOT_FOUND + studentId));

        long presentDays = attendanceRepository.countPresentDays(studentId);
        long absentDays  = attendanceRepository.countAbsentDays(studentId);

        return attendanceRepository.findByStudent_StudentId(studentId).stream()
                .map(att -> mapper.toAttendanceResponse(student, att, presentDays, absentDays))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceStatsResponse getAttendanceSummary(Long studentId) {
        BatchAllocation student = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(STUDENT_NOT_FOUND + studentId));

        long presentDays = attendanceRepository.countPresentDays(studentId);
        long absentDays  = attendanceRepository.countAbsentDays(studentId);

        return mapper.toStatsResponse(student, presentDays, absentDays);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceStatsResponse> getAttendanceSummaryByBatch(Integer programId, Integer batchNumber) {
        // Single DB query returns [studentId, presentCount, absentCount] for all students
        List<Object[]> rows = attendanceRepository.findAttendanceStatsByBatch(programId, batchNumber);

        // Fetch all active allocations for this batch in one query
        List<BatchAllocation> allocations = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                .stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .toList();

        // Build a map of studentId -> stats from the aggregate query
        java.util.Map<Long, long[]> statsMap = new java.util.HashMap<>();
        for (Object[] row : rows) {
            Long studentId   = ((Number) row[0]).longValue();
            long presentDays = ((Number) row[1]).longValue();
            long absentDays  = ((Number) row[2]).longValue();
            statsMap.put(studentId, new long[]{presentDays, absentDays});
        }

        // Build response — students with no attendance records get 0/0
        return allocations.stream().map(student -> {
            long[] stats = statsMap.getOrDefault(student.getStudentId(), new long[]{0L, 0L});
            return mapper.toStatsResponse(student, stats[0], stats[1]);
        }).toList();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private void validateAttendanceDate(LocalDate attendanceDate) {
        if (attendanceDate.isAfter(LocalDate.now())) {
            throw new ValidationException("Attendance date cannot be a future date: " + attendanceDate);
        }
    }

    // ── Excel Upload ──────────────────────────────────────────────────────────
    @Override
    @Transactional
    public ExcelUploadResponse uploadAttendanceFromExcel(MultipartFile file, Integer programId, Integer batchNumber) {
        List<String> errors = new ArrayList<>();
        int savedCount = 0;
        int totalRows = 0;

        validateExcelFile(file);

        List<BatchAllocation> batchStudents = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                .stream().filter(a -> Boolean.TRUE.equals(a.getIsActive())).toList();

        if (batchStudents.isEmpty())
            throw new ResourceNotFoundException("No active students found for Program: " + programId + ", Batch: " + batchNumber);

        java.util.Set<Long> updatedStudentIds = new java.util.HashSet<>();

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
                savedCount += processAttendanceRow(row, i + 1, firstCell, batchStudents, batchNumber, errors, updatedStudentIds);
            }
        } catch (IOException e) {
            throw new ValidationException("Failed to parse Excel file. Make sure it is a valid .xlsx file: " + e.getMessage());
        }

        updateAttendancePercentages(updatedStudentIds);

        if (totalRows == 0)
            errors.add("No data rows found in the file. Make sure Row 1 is the header and data starts from Row 2.");

        return new ExcelUploadResponse(savedCount, totalRows - savedCount, totalRows, errors);
    }

    private void validateExcelFile(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String filenameLower = filename != null ? filename.toLowerCase() : "";
        if (!filenameLower.endsWith(".xlsx"))
            throw new IllegalArgumentException("Only .xlsx files are supported. Please download the template and use Excel format.");
        if (file.isEmpty())
            throw new IllegalArgumentException("Uploaded file is empty.");
    }

    private int processAttendanceRow(Row row, int rowNum, String firstCell,
            List<BatchAllocation> batchStudents, Integer batchNumber,
            List<String> errors, java.util.Set<Long> updatedStudentIds) {
        try {
            String studentIdStr = firstCell;
            String studentName  = getCellString(row.getCell(1));
            String dateStr      = getCellString(row.getCell(3));
            String presentStr   = getCellString(row.getCell(4));

            boolean newTemplateFormat = !dateStr.isBlank() || !presentStr.isBlank();
            if (!newTemplateFormat) {
                studentName  = studentIdStr;
                dateStr      = getCellString(row.getCell(1));
                presentStr   = getCellString(row.getCell(2));
                studentIdStr = "";
            }

            if (dateStr.isBlank())    { errors.add("Row " + rowNum + ": Date is empty"); return 0; }
            if (presentStr.isBlank()) { errors.add("Row " + rowNum + ": Present/Absent column is empty"); return 0; }

            LocalDate attendanceDate = parseFlexibleDate(dateStr);
            if (attendanceDate == null) {
                errors.add("Row " + rowNum + ": Invalid date '" + dateStr + "' — use YYYY-MM-DD (e.g. 2026-01-15)");
                return 0;
            }
            if (attendanceDate.isAfter(LocalDate.now())) {
                errors.add("Row " + rowNum + ": Date " + dateStr + " cannot be in the future");
                return 0;
            }
            if (!isPresentValue(presentStr) && !isAbsentValue(presentStr)) {
                errors.add("Row " + rowNum + ": Invalid value '" + presentStr + "' — use true/false, 1/0, yes/no, P/A, or Present/Absent");
                return 0;
            }

            Optional<BatchAllocation> studentOpt = resolveStudent(studentIdStr, studentName, batchStudents, rowNum, errors);
            if (studentOpt.isEmpty()) {
                errors.add("Row " + rowNum + ": Student not found for Student ID '" + studentIdStr + "' / Name '" + studentName + "' in Batch " + batchNumber);
                return 0;
            }

            BatchAllocation student = studentOpt.get();
            if (attendanceRepository.findByStudent_StudentIdAndAttendanceDate(student.getStudentId(), attendanceDate).isPresent()) {
                errors.add("Row " + rowNum + ": Attendance already marked for '" + studentName + "' on " + dateStr);
                return 0;
            }

            TrainingDayAttendance attendanceEntry = new TrainingDayAttendance();
            attendanceEntry.setStudent(student);
            attendanceEntry.setAttendanceDate(attendanceDate);
            attendanceEntry.setIsPresent(parsePresent(presentStr));
            attendanceRepository.save(attendanceEntry);
            updatedStudentIds.add(student.getStudentId());
            return 1;
        } catch (Exception e) {
            errors.add("Row " + rowNum + ": " + e.getMessage());
            return 0;
        }
    }

    private Optional<BatchAllocation> resolveStudent(String studentIdStr, String studentName,
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

    private void updateAttendancePercentages(java.util.Set<Long> updatedStudentIds) {
        for (Long studentId : updatedStudentIds) {
            allocationRepository.findByStudentId(studentId).ifPresent(student -> {
                long presentDays = attendanceRepository.countPresentDays(studentId);
                long absentDays  = attendanceRepository.countAbsentDays(studentId);
                long total = presentDays + absentDays;
                student.setAttendancePercentage(total > 0
                        ? java.math.BigDecimal.valueOf((double) presentDays / total * 100)
                                .setScale(2, java.math.RoundingMode.HALF_UP)
                        : java.math.BigDecimal.ZERO);
                allocationRepository.save(student);
            });
        }
    }

    private LocalDate parseFlexibleDate(String dateStr) {
        String[] patterns = { "yyyy-MM-dd", "dd-MM-yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd" };
        for (String pattern : patterns) {
            try {
                return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ofPattern(pattern));
            } catch (DateTimeParseException ignored) {
                // try next pattern
            }
        }
        return null;
    }

    private boolean isPresentValue(String val) {
        String v = val.trim().toLowerCase();
        return v.equals("true") || v.equals("1") || v.equals("yes") || v.equals("p") || v.equals("present");
    }

    private boolean isAbsentValue(String val) {
        String v = val.trim().toLowerCase();
        return v.equals("false") || v.equals("0") || v.equals("no") || v.equals("a") || v.equals("absent");
    }

    private boolean parsePresent(String val) {
        return isPresentValue(val);
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell))
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                yield String.valueOf((long) cell.getNumericCellValue());
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }
}
