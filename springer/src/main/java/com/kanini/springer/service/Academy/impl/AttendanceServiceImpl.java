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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements IAttendanceService {

    private final TrainingDayAttendanceRepository attendanceRepository;
    private final BatchAllocationRepository allocationRepository;
    private final AttendanceMapper mapper;

    @Override
    @Transactional
    public AttendanceResponse markAttendance(AttendanceMarkRequest request) {
        BatchAllocation student = allocationRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + request.getStudentId()));

        validateAttendanceDate(request.getAttendanceDate(), student);

        // Prevent duplicate marking on same day
        if (attendanceRepository.findByStudent_StudentIdAndAttendanceDate(
                request.getStudentId(), request.getAttendanceDate()).isPresent()) {
            throw new ValidationException("Attendance already marked for student ID: "
                    + request.getStudentId() + " on " + request.getAttendanceDate());
        }

        TrainingDayAttendance record = new TrainingDayAttendance();
        record.setStudent(student);
        record.setAttendanceDate(request.getAttendanceDate());
        record.setIsPresent(request.getIsPresent());
        attendanceRepository.save(record);

        long presentDays = attendanceRepository.countPresentDays(student.getStudentId());
        long absentDays  = attendanceRepository.countAbsentDays(student.getStudentId());

        // Update cached attendancePercentage on BatchAllocation
        long total = presentDays + absentDays;
        student.setAttendancePercentage(total > 0
                ? java.math.BigDecimal.valueOf((double) presentDays / total * 100)
                        .setScale(2, java.math.RoundingMode.HALF_UP)
                : java.math.BigDecimal.ZERO);
        allocationRepository.save(student);

        return mapper.toAttendanceResponse(student, record, presentDays, absentDays);
    }

    @Override
    @Transactional
    public List<AttendanceResponse> markAttendanceBulk(BulkAttendanceMarkRequest request) {
        List<BatchAllocation> students = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(request.getProgramId(), request.getBatchNumber())
                .stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .collect(Collectors.toList());

        if (students.isEmpty()) {
            throw new ResourceNotFoundException("No active students found for Program: "
                    + request.getProgramId() + ", Batch: " + request.getBatchNumber());
        }

        // Validate date once using first student — all students in same program share same programYear
        validateAttendanceDate(request.getAttendanceDate(), students.get(0));

        return students.stream().map(student -> {
            // Skip if already marked today — don't throw, just skip
            if (attendanceRepository.findByStudent_StudentIdAndAttendanceDate(
                    student.getStudentId(), request.getAttendanceDate()).isPresent()) {
                return null;
            }

            TrainingDayAttendance record = new TrainingDayAttendance();
            record.setStudent(student);
            record.setAttendanceDate(request.getAttendanceDate());
            record.setIsPresent(request.getIsPresent());
            attendanceRepository.save(record);

            long presentDays = attendanceRepository.countPresentDays(student.getStudentId());
            long absentDays  = attendanceRepository.countAbsentDays(student.getStudentId());

            // Update cached attendancePercentage
            long total = presentDays + absentDays;
            student.setAttendancePercentage(total > 0
                    ? java.math.BigDecimal.valueOf((double) presentDays / total * 100)
                            .setScale(2, java.math.RoundingMode.HALF_UP)
                    : java.math.BigDecimal.ZERO);
            allocationRepository.save(student);

            return mapper.toAttendanceResponse(student, record, presentDays, absentDays);
        })
        .filter(r -> r != null)
        .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceRecords(Long studentId) {
        BatchAllocation student = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        long presentDays = attendanceRepository.countPresentDays(studentId);
        long absentDays  = attendanceRepository.countAbsentDays(studentId);

        return attendanceRepository.findByStudent_StudentId(studentId).stream()
                .map(record -> mapper.toAttendanceResponse(student, record, presentDays, absentDays))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceStatsResponse getAttendanceSummary(Long studentId) {
        BatchAllocation student = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        long presentDays = attendanceRepository.countPresentDays(studentId);
        long absentDays  = attendanceRepository.countAbsentDays(studentId);

        return mapper.toStatsResponse(student, presentDays, absentDays);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private void validateAttendanceDate(LocalDate attendanceDate, BatchAllocation student) {
        if (attendanceDate.isAfter(LocalDate.now())) {
            throw new ValidationException("Attendance date cannot be a future date: " + attendanceDate);
        }
    }

    // ── Excel Upload ──────────────────────────────────────────────────────────
    // Expected columns: Student ID | Candidate Name | Candidate Email | Date | Present
    // Backward compatibility: older files with Student Name | Date | Present are still accepted.
    // Row 1 = header, Row 2+ = data
    @Override
    @Transactional
    public ExcelUploadResponse uploadAttendanceFromExcel(MultipartFile file, Integer programId, Integer batchNumber) {
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

        List<BatchAllocation> batchStudents = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                .stream().filter(a -> Boolean.TRUE.equals(a.getIsActive())).collect(Collectors.toList());

        if (batchStudents.isEmpty())
            throw new ResourceNotFoundException("No active students found for Program: " + programId + ", Batch: " + batchNumber);

        // Track which students were updated to batch-update attendance percentage at end
        java.util.Set<Long> updatedStudentIds = new java.util.HashSet<>();

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
                    String dateStr      = getCellString(row.getCell(3));
                    String presentStr   = getCellString(row.getCell(4));

                    boolean newTemplateFormat = !dateStr.isBlank() || !presentStr.isBlank();
                    if (!newTemplateFormat) {
                        // Backward-compatible fallback for old files: Student Name | Date | Present
                        studentName = studentIdStr;
                        dateStr = getCellString(row.getCell(1));
                        presentStr = getCellString(row.getCell(2));
                        studentIdStr = "";
                    }

                    if (dateStr.isBlank())     { errors.add("Row " + rowNum + ": Date is empty"); continue; }
                    if (presentStr.isBlank())  { errors.add("Row " + rowNum + ": Present/Absent column is empty"); continue; }

                    // Parse date — support multiple formats
                    LocalDate attendanceDate = parseFlexibleDate(dateStr);
                    if (attendanceDate == null) {
                        errors.add("Row " + rowNum + ": Invalid date '" + dateStr + "' — use YYYY-MM-DD (e.g. 2026-01-15)");
                        continue;
                    }

                    if (attendanceDate.isAfter(LocalDate.now())) {
                        errors.add("Row " + rowNum + ": Date " + dateStr + " cannot be in the future");
                        continue;
                    }

                    // Parse present/absent — support true/false/1/0/yes/no/P/A/present/absent
                    boolean isPresent = parsePresent(presentStr);
                    if (isPresent == false && !isAbsentValue(presentStr) && !isPresentValue(presentStr)) {
                        errors.add("Row " + rowNum + ": Invalid value '" + presentStr + "' — use true/false, 1/0, yes/no, P/A, or Present/Absent");
                        continue;
                    }

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

                    if (studentOpt.isEmpty()) {
                        errors.add("Row " + rowNum + ": Student not found for Student ID '" + studentIdStr + "' / Name '" + studentName + "' in Batch " + batchNumber);
                        continue;
                    }

                    BatchAllocation student = studentOpt.get();

                    // Skip if already marked for this date
                    if (attendanceRepository.findByStudent_StudentIdAndAttendanceDate(student.getStudentId(), attendanceDate).isPresent()) {
                        errors.add("Row " + rowNum + ": Attendance already marked for '" + studentName + "' on " + dateStr);
                        continue;
                    }

                    TrainingDayAttendance record = new TrainingDayAttendance();
                    record.setStudent(student);
                    record.setAttendanceDate(attendanceDate);
                    record.setIsPresent(isPresent);
                    attendanceRepository.save(record);
                    updatedStudentIds.add(student.getStudentId());
                    savedCount++;

                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse Excel file. Make sure it is a valid .xlsx file: " + e.getMessage());
        }

        // Batch update attendance percentage for all affected students
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

        if (totalRows == 0) {
            errors.add("No data rows found in the file. Make sure Row 1 is the header and data starts from Row 2.");
        }

        return new ExcelUploadResponse(savedCount, totalRows - savedCount, totalRows, errors);
    }

    private LocalDate parseFlexibleDate(String dateStr) {
        String[] patterns = { "yyyy-MM-dd", "dd-MM-yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd" };
        for (String pattern : patterns) {
            try {
                return LocalDate.parse(dateStr.trim(), DateTimeFormatter.ofPattern(pattern));
            } catch (DateTimeParseException ignored) {}
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
