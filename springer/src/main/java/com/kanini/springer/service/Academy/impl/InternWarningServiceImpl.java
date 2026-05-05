package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.InternWarningRequest;
import com.kanini.springer.dto.Academy.InternWarningResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.InternWarning;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.WarningSeverity;
import com.kanini.springer.entity.enums.Enums.WarningStatus;
import com.kanini.springer.entity.enums.Enums.WarningType;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.InternWarningRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.IInternWarningService;
import com.kanini.springer.service.DocumentCollection.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternWarningServiceImpl implements IInternWarningService {

    private final InternWarningRepository warningRepository;
    private final BatchAllocationRepository allocationRepository;
    private final UserRepository userRepository;
    private final IEmailService emailService;

    @Override
    @Transactional
    public InternWarningResponse issueWarning(InternWarningRequest request) {
        BatchAllocation student = allocationRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + request.getStudentId()));

        // Active student check
        if (!Boolean.TRUE.equals(student.getIsActive())) {
            throw new ValidationException("Cannot issue a warning to an inactive student.");
        }

        User issuedBy = userRepository.findById(request.getIssuedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getIssuedBy()));

        // Deduplication — prevent same type+severity active warning for same student
        WarningType wType = WarningType.valueOf(request.getWarningType());
        WarningSeverity wSeverity = WarningSeverity.valueOf(request.getSeverity());
        if (warningRepository.existsActiveWarning(request.getStudentId(), wType, wSeverity)) {
            throw new ValidationException("An active warning of the same type ('" + request.getWarningType()
                    + "') and severity ('" + request.getSeverity() + "') already exists for this student. "
                    + "Wait for the student to acknowledge it before issuing another.");
        }

        InternWarning warning = new InternWarning();
        warning.setStudent(student);
        warning.setIssuedBy(issuedBy);
        warning.setWarningType(WarningType.valueOf(request.getWarningType()));
        warning.setSeverity(WarningSeverity.valueOf(request.getSeverity()));
        warning.setMessage(request.getMessage());
        warning.setCourseId(request.getCourseId());
        warning.setStatus(WarningStatus.ACTIVE);
        warning.setIssuedAt(LocalDateTime.now());

        InternWarning saved = warningRepository.save(warning);
        log.info("Warning issued to studentId={} by userId={} type={} severity={}",
                request.getStudentId(), request.getIssuedBy(), request.getWarningType(), request.getSeverity());

        // Collect email data before transaction closes
        String internEmail = student.getCandidate().getEmail();
        String internName  = student.getCandidate().getFirstName()
                + (student.getCandidate().getLastName() != null ? " " + student.getCandidate().getLastName() : "");
        String issuedByName = issuedBy.getUsername();

        InternWarningResponse response = toResponse(saved);

        // Send email after transaction — failure does not roll back the warning save
        sendWarningEmailSafe(internEmail, internName, request.getWarningType(),
                request.getSeverity(), request.getMessage(), issuedByName);

        return response;
    }

    private void sendWarningEmailSafe(String internEmail, String internName,
            String warningType, String severity, String message, String issuedByName) {
        try {
            emailService.sendWarningEmail(internEmail, internName, warningType, severity, message, issuedByName);
        } catch (Exception e) {
            log.warn("Warning email failed to send to {} — warning was saved successfully. Error: {}",
                    internEmail, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<InternWarningResponse> getAllWarnings() {
        return warningRepository.findAllByOrderByIssuedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InternWarningResponse> getWarningsByStudent(Long studentId) {
        return warningRepository.findByStudent_StudentIdOrderByIssuedAtDesc(studentId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<InternWarningResponse> getWarningsByBatch(Integer programId, Integer batchNumber) {
        return warningRepository
                .findByStudent_Program_ProgramIdAndStudent_BatchNumberOrderByIssuedAtDesc(programId, batchNumber)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public InternWarningResponse acknowledgeWarning(Long warningId, String acknowledgementComment) {
        InternWarning warning = findById(warningId);
        if (warning.getStatus() != WarningStatus.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE warnings can be acknowledged");
        }
        if (acknowledgementComment == null || acknowledgementComment.trim().isEmpty()) {
            throw new IllegalStateException("Acknowledgement comment is required");
        }
        if (acknowledgementComment.trim().length() > 1000) {
            throw new IllegalStateException("Acknowledgement comment cannot exceed 1000 characters");
        }
        warning.setStatus(WarningStatus.ACKNOWLEDGED);
        warning.setAcknowledgedAt(LocalDateTime.now());
        warning.setAcknowledgementComment(acknowledgementComment.trim());
        log.info("Warning {} acknowledged by intern with comment", warningId);
        return toResponse(warningRepository.save(warning));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InternWarningResponse> getWarningsFiltered(
            Integer programId, Integer batchNumber, String status, String warningType, String search, int page, int size) {
        WarningStatus warningStatus = null;
        if (status != null && !status.isBlank()) {
            try { warningStatus = WarningStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT)); }
            catch (IllegalArgumentException ignored) { /* invalid status — treat as no filter */ }
        }
        WarningType warnType = null;
        if (warningType != null && !warningType.isBlank()) {
            try { warnType = WarningType.valueOf(warningType.toUpperCase(java.util.Locale.ROOT)); }
            catch (IllegalArgumentException ignored) { /* invalid type — treat as no filter */ }
        }
        String searchParam = (search != null && !search.isBlank()) ? search.trim() : null;
        return warningRepository.findFiltered(programId, batchNumber, warningStatus, warnType, searchParam,
                PageRequest.of(page, size)).map(this::toResponse);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private InternWarning findById(Long warningId) {
        return warningRepository.findById(warningId)
                .orElseThrow(() -> new ResourceNotFoundException("Warning not found: " + warningId));
    }

    private InternWarningResponse toResponse(InternWarning w) {
        String studentName = w.getStudent().getCandidate().getFirstName()
                + (w.getStudent().getCandidate().getLastName() != null
                    ? " " + w.getStudent().getCandidate().getLastName() : "");
        return new InternWarningResponse(
                w.getWarningId(),
                w.getStudent().getStudentId(),
                studentName,
                w.getStudent().getProgram().getProgramName(),
                w.getStudent().getBatchNumber(),
                w.getIssuedBy().getUsername(),
                w.getWarningType().name(),
                w.getSeverity().name(),
                w.getMessage(),
                w.getCourseId(),
                w.getStatus().name(),
                w.getIssuedAt() != null ? w.getIssuedAt().toString() : null,
                w.getAcknowledgedAt() != null ? w.getAcknowledgedAt().toString() : null,
                w.getAcknowledgementComment()
        );
    }
}
