package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.LeaveRequestRequest;
import com.kanini.springer.dto.Academy.LeaveRequestResponse;
import com.kanini.springer.dto.Academy.LeaveReviewRequest;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.LeaveRequest;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.LeaveStatus;
import com.kanini.springer.entity.enums.Enums.LeaveType;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.LeaveRequestRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.impl.LeaveRequestServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link LeaveRequestServiceImpl}.
 * TC can only VIEW. TA Recruiter approves/rejects.
 * Email sent to TC (active course trainer) + TA Recruiter on apply.
 */
@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceImplTest {

    @InjectMocks private LeaveRequestServiceImpl service;
    @Mock private LeaveRequestRepository leaveRepository;
    @Mock private BatchAllocationRepository allocationRepository;
    @Mock private UserRepository userRepository;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BatchAllocation buildAllocation(Long studentId) {
        TrainingProgram program = new TrainingProgram();
        program.setProgramId(1);
        program.setProgramName("Fresher Training 2026");

        Candidate candidate = new Candidate();
        candidate.setCandidateId(10L);
        candidate.setFirstName("Ravi");
        candidate.setLastName("Kumar");
        candidate.setEmail("ravi@kanini.com");

        BatchAllocation alloc = new BatchAllocation();
        alloc.setStudentId(studentId);
        alloc.setProgram(program);
        alloc.setBatchNumber(1);
        alloc.setIsActive(true);
        alloc.setCandidate(candidate);
        return alloc;
    }

    private LeaveRequest buildLeave(Long id, LeaveStatus status) {
        LeaveRequest leave = new LeaveRequest();
        leave.setLeaveId(id);
        leave.setStudent(buildAllocation(101L));
        leave.setFromDate(LocalDate.of(2026, 6, 10));
        leave.setToDate(LocalDate.of(2026, 6, 11));
        leave.setLeaveType(LeaveType.SICK);
        leave.setReason("Fever");
        leave.setStatus(status);
        return leave;
    }

    private LeaveRequestRequest buildRequest(Long studentId) {
        LeaveRequestRequest req = new LeaveRequestRequest();
        req.setStudentId(studentId);
        req.setFromDate("2026-06-10");
        req.setToDate("2026-06-11");
        req.setLeaveType("SICK");
        req.setReason("Fever");
        return req;
    }

    private LeaveReviewRequest buildReview(String decision, String remarks) {
        LeaveReviewRequest req = new LeaveReviewRequest();
        req.setDecision(decision);
        req.setRemarks(remarks);
        req.setReviewedBy(5L);
        return req;
    }

    // ── applyLeave ────────────────────────────────────────────────────────────

    @Nested @DisplayName("applyLeave")
    class ApplyLeave {

        @Test @DisplayName("success - applies leave and status is PENDING")
        void apply_valid_success() {
            BatchAllocation alloc = buildAllocation(101L);
            LeaveRequest saved = buildLeave(1L, LeaveStatus.PENDING);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(leaveRepository.save(any())).thenReturn(saved);

            LeaveRequestResponse result = service.applyLeave(buildRequest(101L));

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo("PENDING");
            verify(leaveRepository).save(any());
        }

        @Test @DisplayName("failure - throws ValidationException when studentId is null")
        void apply_nullStudentId_throwsValidation() {
            assertThatThrownBy(() -> service.applyLeave(buildRequest(null)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Student ID is required");
        }

        @Test @DisplayName("failure - throws ValidationException when reason is blank")
        void apply_blankReason_throwsValidation() {
            LeaveRequestRequest req = buildRequest(101L);
            req.setReason("  ");
            assertThatThrownBy(() -> service.applyLeave(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Reason is required");
        }

        @Test @DisplayName("failure - throws ValidationException when toDate before fromDate")
        void apply_toDateBeforeFromDate_throwsValidation() {
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(buildAllocation(101L)));
            LeaveRequestRequest req = buildRequest(101L);
            req.setFromDate("2026-06-15");
            req.setToDate("2026-06-10");
            assertThatThrownBy(() -> service.applyLeave(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("To date cannot be before From date");
        }

        @Test @DisplayName("failure - throws ValidationException for invalid leave type")
        void apply_invalidLeaveType_throwsValidation() {
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(buildAllocation(101L)));
            LeaveRequestRequest req = buildRequest(101L);
            req.setLeaveType("VACATION");
            assertThatThrownBy(() -> service.applyLeave(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid leave type");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void apply_studentNotFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.applyLeave(buildRequest(999L)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── reviewLeave (TA Recruiter only) ───────────────────────────────────────

    @Nested @DisplayName("reviewLeave")
    class ReviewLeave {

        @Test @DisplayName("success - TA approves pending leave")
        void review_approve_success() {
            LeaveRequest leave = buildLeave(1L, LeaveStatus.PENDING);
            User reviewer = new User(); reviewer.setUserId(5L); reviewer.setUsername("Sudha");

            when(leaveRepository.findById(1L)).thenReturn(Optional.of(leave));
            when(userRepository.findById(5L)).thenReturn(Optional.of(reviewer));
            when(leaveRepository.save(any())).thenReturn(leave);

            LeaveRequestResponse result = service.reviewLeave(1L, buildReview("APPROVE", "Approved"));

            assertThat(result.getStatus()).isEqualTo("APPROVED");
        }

        @Test @DisplayName("success - TA rejects pending leave")
        void review_reject_success() {
            LeaveRequest leave = buildLeave(1L, LeaveStatus.PENDING);

            when(leaveRepository.findById(1L)).thenReturn(Optional.of(leave));
            when(userRepository.findById(5L)).thenReturn(Optional.empty());
            when(leaveRepository.save(any())).thenReturn(leave);

            LeaveRequestResponse result = service.reviewLeave(1L, buildReview("REJECT", "Not valid"));

            assertThat(result.getStatus()).isEqualTo("REJECTED");
        }

        @Test @DisplayName("failure - throws ValidationException for invalid decision")
        void review_invalidDecision_throwsValidation() {
            assertThatThrownBy(() -> service.reviewLeave(1L, buildReview("MAYBE", null)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Decision must be APPROVE or REJECT");
        }

        @Test @DisplayName("failure - throws ValidationException when already reviewed")
        void review_alreadyReviewed_throwsValidation() {
            LeaveRequest leave = buildLeave(1L, LeaveStatus.APPROVED);
            when(leaveRepository.findById(1L)).thenReturn(Optional.of(leave));
            assertThatThrownBy(() -> service.reviewLeave(1L, buildReview("APPROVE", null)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already been reviewed");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when leave not found")
        void review_notFound_throwsNotFound() {
            when(leaveRepository.findById(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.reviewLeave(999L, buildReview("APPROVE", null)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── getLeavesByStudent ────────────────────────────────────────────────────

    @Nested @DisplayName("getLeavesByStudent")
    class GetByStudent {

        @Test @DisplayName("success - returns leaves for valid student")
        void getByStudent_found_returnsList() {
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(buildAllocation(101L)));
            when(leaveRepository.findByStudent_StudentIdOrderByAppliedAtDesc(101L)).thenReturn(List.of(buildLeave(1L, LeaveStatus.PENDING)));
            assertThat(service.getLeavesByStudent(101L)).hasSize(1);
        }

        @Test @DisplayName("success - returns empty list when no leaves")
        void getByStudent_noLeaves_returnsEmpty() {
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(buildAllocation(101L)));
            when(leaveRepository.findByStudent_StudentIdOrderByAppliedAtDesc(101L)).thenReturn(Collections.emptyList());
            assertThat(service.getLeavesByStudent(101L)).isEmpty();
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void getByStudent_notFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getLeavesByStudent(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── getAllLeaves ──────────────────────────────────────────────────────────

    @Nested @DisplayName("getAllLeaves")
    class GetAll {

        @Test @DisplayName("success - returns all leaves")
        void getAll_returnsList() {
            when(leaveRepository.findAllByOrderByAppliedAtDesc()).thenReturn(List.of(buildLeave(1L, LeaveStatus.PENDING)));
            assertThat(service.getAllLeaves()).hasSize(1);
        }

        @Test @DisplayName("success - returns empty list when no leaves")
        void getAll_empty_returnsEmptyList() {
            when(leaveRepository.findAllByOrderByAppliedAtDesc()).thenReturn(Collections.emptyList());
            assertThat(service.getAllLeaves()).isEmpty();
        }
    }

    // ── getLeaveById ──────────────────────────────────────────────────────────

    @Nested @DisplayName("getLeaveById")
    class GetById {

        @Test @DisplayName("success - returns leave for valid ID")
        void getById_found_returnsResponse() {
            when(leaveRepository.findById(1L)).thenReturn(Optional.of(buildLeave(1L, LeaveStatus.PENDING)));
            LeaveRequestResponse result = service.getLeaveById(1L);
            assertThat(result.getLeaveId()).isEqualTo(1L);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void getById_notFound_throwsNotFound() {
            when(leaveRepository.findById(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getLeaveById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
