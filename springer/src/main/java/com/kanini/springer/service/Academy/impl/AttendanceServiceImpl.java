package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.dto.Academy.BulkAttendanceMarkRequest;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingDayAttendance;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Academy.AttendanceMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.service.Academy.IAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
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
}
