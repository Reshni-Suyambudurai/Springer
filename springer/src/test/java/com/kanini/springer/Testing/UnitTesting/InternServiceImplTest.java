package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Trainee.InternDashboardResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.Academy.BatchSchedule;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.TrainingLocation;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.BatchScheduleRepository;
import com.kanini.springer.repository.Academy.LeaveRequestRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.service.Trainee.impl.InternServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InternServiceImplTest {

    @InjectMocks private InternServiceImpl service;

    @Mock private CandidatesRepository candidatesRepository;
    @Mock private BatchAllocationRepository allocationRepository;
    @Mock private TrainingScoreRepository scoreRepository;
    @Mock private TrainingDayAttendanceRepository attendanceRepository;
    @Mock private BatchCourseRepository batchCourseRepository;
    @Mock private BatchScheduleRepository batchScheduleRepository;
    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private com.kanini.springer.mapper.Academy.TrainingScoreMapper scoreMapper;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Candidate buildCandidate(Long candidateId) {
        Candidate c = new Candidate();
        c.setCandidateId(candidateId);
        c.setFirstName("Ravi");
        c.setLastName("Kumar");
        c.setEmail("ravi@kanini.com");
        c.setDepartment("CSE");
        return c;
    }

    private TrainingProgram buildProgram(Integer programId) {
        TrainingProgram p = new TrainingProgram();
        p.setProgramId(programId);
        p.setProgramName("Fresher Training 2026");
        p.setProgramYear(2026);
        p.setLocation(TrainingLocation.CHENNAI);
        return p;
    }

    private BatchAllocation buildActiveAllocation(Long studentId, Long candidateId) {
        BatchAllocation alloc = new BatchAllocation();
        alloc.setStudentId(studentId);
        alloc.setBatchNumber(1);
        alloc.setIsActive(true);
        alloc.setProgram(buildProgram(1));
        alloc.setCandidate(buildCandidate(candidateId));
        return alloc;
    }

    private BatchCourse buildBatchCourse(Integer courseId, String courseName) {
        BatchCourse bc = new BatchCourse();
        bc.setBatchCourseId(courseId);
        bc.setCourse(buildCourse(courseId, courseName));
        bc.setBatchNo(1);
        return bc;
    }

    private TrainingCourse buildCourse(Integer courseId, String name) {
        TrainingCourse c = new TrainingCourse();
        c.setCourseId(courseId);
        c.setCourseName(name);
        c.setWeightage(30);
        c.setMinScore(60);
        return c;
    }

    /** Stubs all common mocks needed for getDashboard to complete */
    private void stubDashboard(Candidate candidate, BatchAllocation alloc) {
        when(candidatesRepository.findByUser_UserId(10L)).thenReturn(Optional.of(candidate));
        when(allocationRepository.findByCandidate_CandidateId(candidate.getCandidateId())).thenReturn(List.of(alloc));
        when(scoreRepository.findByStudent_StudentId(alloc.getStudentId())).thenReturn(Collections.emptyList());
        when(batchCourseRepository.findByProgram_ProgramIdAndBatchNo(1, 1)).thenReturn(Collections.emptyList());
        when(attendanceRepository.findByStudent_StudentId(alloc.getStudentId())).thenReturn(Collections.emptyList());
        when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(Optional.empty());
        when(allocationRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(List.of(alloc));
        when(leaveRequestRepository.sumApprovedLeaveDays(alloc.getStudentId())).thenReturn(null);
        when(scoreRepository.findByStudent_StudentIdIn(any())).thenReturn(Collections.emptyList());
    }

    // ── getDashboard ──────────────────────────────────────────────────────────

    @Nested @DisplayName("getDashboard")
    class GetDashboard {

        @Test @DisplayName("success - returns dashboard for valid user with active allocation")
        void getDashboard_validUser_returnsDashboard() {
            Candidate candidate = buildCandidate(1L);
            BatchAllocation alloc = buildActiveAllocation(101L, 1L);
            BatchCourse batchCourse = buildBatchCourse(1, "Java Fundamentals");

            when(candidatesRepository.findByUser_UserId(10L)).thenReturn(Optional.of(candidate));
            when(allocationRepository.findByCandidate_CandidateId(1L)).thenReturn(List.of(alloc));
            when(scoreRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());
            when(batchCourseRepository.findByProgram_ProgramIdAndBatchNo(1, 1)).thenReturn(List.of(batchCourse));
            when(attendanceRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());
            when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(Optional.empty());
            when(allocationRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(List.of(alloc));
            when(leaveRequestRepository.sumApprovedLeaveDays(101L)).thenReturn(null);
            when(scoreRepository.findByStudent_StudentIdIn(any())).thenReturn(Collections.emptyList());

            InternDashboardResponse result = service.getDashboard(10L);

            assertThat(result).isNotNull();
            assertThat(result.getStudentId()).isEqualTo(101L);
            assertThat(result.getCandidateName()).isEqualTo("Ravi Kumar");
            assertThat(result.getProgramName()).isEqualTo("Fresher Training 2026");
            assertThat(result.getBatchNumber()).isEqualTo(1);
            assertThat(result.getCourseScores()).hasSize(1);
        }

        @Test @DisplayName("success - returns dashboard with batch schedule dates when schedule exists")
        void getDashboard_withSchedule_returnsDates() {
            Candidate candidate = buildCandidate(1L);
            BatchAllocation alloc = buildActiveAllocation(101L, 1L);

            BatchSchedule schedule = new BatchSchedule();
            schedule.setStartDate(java.time.LocalDate.of(2026, 1, 1));
            schedule.setEndDate(java.time.LocalDate.of(2026, 6, 30));

            when(candidatesRepository.findByUser_UserId(10L)).thenReturn(Optional.of(candidate));
            when(allocationRepository.findByCandidate_CandidateId(1L)).thenReturn(List.of(alloc));
            when(scoreRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());
            when(batchCourseRepository.findByProgram_ProgramIdAndBatchNo(1, 1)).thenReturn(Collections.emptyList());
            when(attendanceRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());
            when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(Optional.of(schedule));
            when(allocationRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(List.of(alloc));
            when(leaveRequestRepository.sumApprovedLeaveDays(101L)).thenReturn(null);
            when(scoreRepository.findByStudent_StudentIdIn(any())).thenReturn(Collections.emptyList());

            InternDashboardResponse result = service.getDashboard(10L);

            assertThat(result.getBatchStartDate()).isEqualTo("2026-01-01");
            assertThat(result.getBatchEndDate()).isEqualTo("2026-06-30");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when no candidate linked to user")
        void getDashboard_noCandidateLinked_throwsNotFound() {
            when(candidatesRepository.findByUser_UserId(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getDashboard(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when no active allocation found")
        void getDashboard_noActiveAllocation_throwsNotFound() {
            Candidate candidate = buildCandidate(1L);
            BatchAllocation inactiveAlloc = buildActiveAllocation(101L, 1L);
            inactiveAlloc.setIsActive(false);

            when(candidatesRepository.findByUser_UserId(10L)).thenReturn(Optional.of(candidate));
            when(allocationRepository.findByCandidate_CandidateId(1L)).thenReturn(List.of(inactiveAlloc));

            assertThatThrownBy(() -> service.getDashboard(10L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("active batch allocation");
        }

        @Test @DisplayName("success - returns rank 1 when intern is top of batch")
        void getDashboard_topRankedIntern_returnsRank1() {
            Candidate candidate = buildCandidate(1L);
            BatchAllocation alloc = buildActiveAllocation(101L, 1L);
            alloc.setOverallWeightedScore(new java.math.BigDecimal("95.0"));

            when(candidatesRepository.findByUser_UserId(10L)).thenReturn(Optional.of(candidate));
            when(allocationRepository.findByCandidate_CandidateId(1L)).thenReturn(List.of(alloc));
            when(scoreRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());
            when(batchCourseRepository.findByProgram_ProgramIdAndBatchNo(1, 1)).thenReturn(Collections.emptyList());
            when(attendanceRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());
            when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(Optional.empty());
            when(allocationRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(List.of(alloc));
            when(leaveRequestRepository.sumApprovedLeaveDays(101L)).thenReturn(null);
            when(scoreRepository.findByStudent_StudentIdIn(any())).thenReturn(Collections.emptyList());

            InternDashboardResponse result = service.getDashboard(10L);

            assertThat(result.getRank()).isEqualTo(1);
            assertThat(result.getTotalInBatch()).isEqualTo(1);
        }
    }
}
