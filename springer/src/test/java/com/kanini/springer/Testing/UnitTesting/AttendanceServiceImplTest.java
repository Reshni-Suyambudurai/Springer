package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingDayAttendance;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Academy.AttendanceMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.service.Academy.impl.AttendanceServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceImplTest {

    @InjectMocks private AttendanceServiceImpl service;
    @Mock private TrainingDayAttendanceRepository attendanceRepository;
    @Mock private BatchAllocationRepository allocationRepository;
    @Mock private AttendanceMapper mapper;

    private BatchAllocation buildAllocation(Long studentId) {
        BatchAllocation a = new BatchAllocation();
        a.setStudentId(studentId);
        a.setIsActive(true);
        a.setAttendancePercentage(BigDecimal.ZERO);
        return a;
    }

    private AttendanceMarkRequest buildRequest(Long studentId, LocalDate date, boolean present) {
        AttendanceMarkRequest req = new AttendanceMarkRequest();
        req.setStudentId(studentId);
        req.setAttendanceDate(date);
        req.setIsPresent(present);
        return req;
    }

    @Nested @DisplayName("markAttendance")
    class MarkAttendance {

        @Test @DisplayName("success - marks attendance for valid student")
        void mark_valid_success() {
            BatchAllocation student = buildAllocation(101L);
            TrainingDayAttendance attendanceRecord = new TrainingDayAttendance();
            AttendanceResponse response = new AttendanceResponse();
            LocalDate today = LocalDate.now();

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(attendanceRepository.findByStudent_StudentIdAndAttendanceDate(101L, today)).thenReturn(Optional.empty());
            when(attendanceRepository.save(any())).thenReturn(attendanceRecord);
            when(attendanceRepository.countPresentDays(101L)).thenReturn(1L);
            when(attendanceRepository.countAbsentDays(101L)).thenReturn(0L);
            when(allocationRepository.save(any())).thenReturn(student);
            when(mapper.toAttendanceResponse(eq(student), any(), eq(1L), eq(0L))).thenReturn(response);

            AttendanceResponse result = service.markAttendance(buildRequest(101L, today, true));
            assertThat(result).isNotNull();
            verify(attendanceRepository).save(any());
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void mark_studentNotFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            AttendanceMarkRequest req = buildRequest(999L, LocalDate.now(), true);
            assertThatThrownBy(() -> service.markAttendance(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws ValidationException when attendance already marked")
        void mark_alreadyMarked_throwsValidation() {
            BatchAllocation student = buildAllocation(101L);
            LocalDate today = LocalDate.now();
            TrainingDayAttendance existing = new TrainingDayAttendance();

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(attendanceRepository.findByStudent_StudentIdAndAttendanceDate(101L, today)).thenReturn(Optional.of(existing));

            AttendanceMarkRequest req = buildRequest(101L, today, true);
            assertThatThrownBy(() -> service.markAttendance(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already marked");
        }

        @Test @DisplayName("failure - throws ValidationException for future date")
        void mark_futureDate_throwsValidation() {
            BatchAllocation student = buildAllocation(101L);
            LocalDate future = LocalDate.now().plusDays(5);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));

            AttendanceMarkRequest req = buildRequest(101L, future, true);
            assertThatThrownBy(() -> service.markAttendance(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("future date");
        }
    }

    @Nested @DisplayName("getAttendanceRecords")
    class GetRecords {

        @Test @DisplayName("success - returns attendance records for valid student")
        void getRecords_found_returnsList() {
            BatchAllocation student = buildAllocation(101L);
            TrainingDayAttendance attendanceRecord = new TrainingDayAttendance();
            AttendanceResponse response = new AttendanceResponse();

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(attendanceRepository.countPresentDays(101L)).thenReturn(5L);
            when(attendanceRepository.countAbsentDays(101L)).thenReturn(1L);
            when(attendanceRepository.findByStudent_StudentId(101L)).thenReturn(List.of(attendanceRecord));
            when(mapper.toAttendanceResponse(eq(student), eq(attendanceRecord), eq(5L), eq(1L))).thenReturn(response);

            List<AttendanceResponse> result = service.getAttendanceRecords(101L);
            assertThat(result).hasSize(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void getRecords_notFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getAttendanceRecords(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getAttendanceSummary")
    class GetSummary {

        @Test @DisplayName("success - returns attendance stats for valid student")
        void getSummary_found_returnsStats() {
            BatchAllocation student = buildAllocation(101L);
            AttendanceStatsResponse stats = new AttendanceStatsResponse();

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(attendanceRepository.countPresentDays(101L)).thenReturn(8L);
            when(attendanceRepository.countAbsentDays(101L)).thenReturn(2L);
            when(mapper.toStatsResponse(student, 8L, 2L)).thenReturn(stats);

            AttendanceStatsResponse result = service.getAttendanceSummary(101L);
            assertThat(result).isNotNull();
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void getSummary_notFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getAttendanceSummary(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
