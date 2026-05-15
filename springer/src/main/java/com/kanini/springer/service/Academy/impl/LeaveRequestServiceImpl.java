package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.LeaveRequestRequest;
import com.kanini.springer.dto.Academy.LeaveRequestResponse;
import com.kanini.springer.dto.Academy.LeaveReviewRequest;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.LeaveRequest;
import com.kanini.springer.entity.enums.Enums.LeaveStatus;
import com.kanini.springer.entity.enums.Enums.LeaveType;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.LeaveRequestRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.ILeaveRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaveRequestServiceImpl implements ILeaveRequestService {

    private final LeaveRequestRepository leaveRepository;
    private final BatchAllocationRepository allocationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public LeaveRequestResponse applyLeave(LeaveRequestRequest request) {
        if (request.getStudentId() == null)
            throw new ValidationException("Student ID is required");
        if (request.getFromDate() == null || request.getToDate() == null)
            throw new ValidationException("From date and To date are required");
        if (request.getReason() == null || request.getReason().isBlank())
            throw new ValidationException("Reason is required");

        BatchAllocation student = allocationRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + request.getStudentId()));

        // Active student check
        if (!Boolean.TRUE.equals(student.getIsActive())) {
            throw new ValidationException("Cannot apply leave for an inactive student.");
        }

        LocalDate from = LocalDate.parse(request.getFromDate());
        LocalDate to   = LocalDate.parse(request.getToDate());

        if (to.isBefore(from))
            throw new ValidationException("To date cannot be before From date");

        // Past date validation — leave cannot start in the past (allow today)
        if (from.isBefore(LocalDate.now()))
            throw new ValidationException("Leave start date cannot be in the past. Earliest allowed date is today.");

        // Maximum leave duration check (30 days)
        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        if (days > 30)
            throw new ValidationException("Leave duration cannot exceed 30 days. Requested: " + days + " days.");

        // Overlapping leave check — no PENDING or APPROVED leave should overlap
        if (leaveRepository.existsOverlappingLeave(request.getStudentId(), from, to)) {
            throw new ValidationException("You already have a leave request (pending or approved) that overlaps with these dates.");
        }

        LeaveType leaveType;
        try {
            leaveType = LeaveType.valueOf(request.getLeaveType().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid leave type: '" + request.getLeaveType()
                    + "'. Valid values: SICK, PERSONAL, EMERGENCY, OTHER");
        }

        LeaveRequest leave = new LeaveRequest();
        leave.setStudent(student);
        leave.setFromDate(from);
        leave.setToDate(to);
        leave.setLeaveType(leaveType);
        leave.setReason(request.getReason().trim());
        leave.setStatus(LeaveStatus.PENDING);

        LeaveRequest saved = leaveRepository.save(leave);
        log.info("Leave applied by student: {} from {} to {}", request.getStudentId(), from, to);
        return toResponse(saved);
    }

    // TA Recruiter approves or rejects — TC can only view
    @Override
    @Transactional
    public LeaveRequestResponse reviewLeave(Long leaveId, LeaveReviewRequest request) {
        if (!"APPROVE".equalsIgnoreCase(request.getDecision()) && !"REJECT".equalsIgnoreCase(request.getDecision()))
            throw new ValidationException("Decision must be APPROVE or REJECT");

        LeaveRequest leave = leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found: " + leaveId));

        if (leave.getStatus() != LeaveStatus.PENDING)
            throw new ValidationException("Leave has already been reviewed. Current status: " + leave.getStatus());

        boolean approve = "APPROVE".equalsIgnoreCase(request.getDecision());
        leave.setStatus(approve ? LeaveStatus.APPROVED : LeaveStatus.REJECTED);
        leave.setRemarks(request.getRemarks());
        leave.setReviewedAt(LocalDateTime.now());

        if (request.getReviewedBy() != null) {
            userRepository.findById(request.getReviewedBy()).ifPresent(leave::setReviewedBy);
        }

        LeaveRequest saved = leaveRepository.save(leave);
        log.info("Leave {} reviewed: {}", leaveId, leave.getStatus());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getLeavesByStudent(Long studentId) {
        allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        return leaveRepository.findByStudent_StudentIdOrderByAppliedAtDesc(studentId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getAllLeaves() {
        return leaveRepository.findAllByOrderByAppliedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> getLeavesByBatch(Integer programId, Integer batchNumber) {
        return leaveRepository
                .findByStudent_Program_ProgramIdAndStudent_BatchNumberOrderByAppliedAtDesc(programId, batchNumber)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveRequestResponse getLeaveById(Long leaveId) {
        return toResponse(leaveRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found: " + leaveId)));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LeaveRequestResponse> getLeavesFiltered(
            Integer programId, List<Integer> programIds, Integer batchNumber, String status, String search, int page, int size) {
        LeaveStatus leaveStatus = null;
        if (status != null && !status.isBlank()) {
            try { leaveStatus = LeaveStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT)); }
            catch (IllegalArgumentException ignored) { /* invalid status — treat as no filter */ }
        }
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        List<Integer> ids = (programIds != null && !programIds.isEmpty()) ? programIds : null;
        return leaveRepository.findFiltered(programId, ids, batchNumber, leaveStatus, searchParam,
                PageRequest.of(page, size)).map(this::toResponse);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private LeaveRequestResponse toResponse(LeaveRequest l) {
        int totalDays = (int) ChronoUnit.DAYS.between(l.getFromDate(), l.getToDate()) + 1;
        String studentName = l.getStudent().getCandidate().getFirstName()
                + (l.getStudent().getCandidate().getLastName() != null
                   ? " " + l.getStudent().getCandidate().getLastName() : "");

        return new LeaveRequestResponse(
                l.getLeaveId(),
                l.getStudent().getStudentId(),
                studentName,
                l.getStudent().getProgram().getProgramName(),
                l.getStudent().getBatchNumber(),
                l.getFromDate().toString(),
                l.getToDate().toString(),
                totalDays,
                l.getLeaveType().name(),
                l.getReason(),
                l.getStatus().name(),
                l.getRemarks(),
                l.getReviewedBy() != null ? l.getReviewedBy().getUsername() : null,
                l.getReviewedAt() != null ? l.getReviewedAt().toString() : null,
                l.getAppliedAt() != null ? l.getAppliedAt().toString() : null
        );
    }
}
