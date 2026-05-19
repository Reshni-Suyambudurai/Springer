package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.service.DocumentCollection.IDocumentLinkService;
import com.kanini.springer.dto.DocumentCollection.BulkDocumentLinkRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentLinkRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentLinkResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Validated
@Slf4j
public class DocumentLinkController {

    private final IDocumentLinkService documentLinkService;

    /**
     * Send document submission link to candidate
     * Initiates document collection process via secure link
     */
    @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
    @PostMapping("/send-submission-link")
    public ResponseEntity<ApiResponse<DocumentLinkResponse>> sendSubmissionLink(
            @Valid @RequestBody DocumentLinkRequest request) {

        log.info("Sending submission link for candidate: {}", request.getCandidateId());

        DocumentLinkResponse response = documentLinkService.generateSubmissionLink(
            request.getCandidateId(),
            request.getCycleId(),
            request.getRequiredDocumentTypeIds(),
            request.getSubmissionDeadline()
        );

        return new ResponseEntity<>(
            new ApiResponse<>(
                true,
                "Document submission link sent to candidate successfully",
                response
            ),
            HttpStatus.CREATED
        );
    }

    /**
     * Resend document submission link to candidate
     * Used when candidate needs the link again or wants to submit additional documents
     * @param documentTypeIds optional comma-separated list of document type IDs to resend
     */
    @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
    @PostMapping("/resend-submission-link")
    public ResponseEntity<ApiResponse<String>> resendSubmissionLink(
            @RequestParam @NotNull(message = "Candidate ID required") Long candidateId,
            @RequestParam @NotNull(message = "Cycle ID required") Long cycleId,
            @RequestParam(required = false) String documentTypeIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime submissionDeadline) {

        log.info("Resending submission link for candidate: {}", candidateId);

        java.util.List<Long> docTypeIds = new java.util.ArrayList<>();
        if (documentTypeIds != null && !documentTypeIds.trim().isEmpty()) {
            docTypeIds = java.util.Arrays.stream(documentTypeIds.split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .toList();
        }

        boolean sent = documentLinkService.resendSubmissionLink(candidateId, cycleId, docTypeIds, submissionDeadline);

        if (sent) {
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Submission link resent to candidate successfully", null)
            );
        } else {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(
                new ApiResponse<>(false, "No pending or rejected documents to resend for this candidate.", null)
            );
        }
    }

    /**
     * Send submission links to multiple candidates in bulk
     * Efficiently distribute document collection links to multiple candidates
     * All candidates receive the same document type list and deadline
     */
    @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
    @PostMapping("/send-submission-link/bulk")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendBulkSubmissionLinks(
            @Valid @RequestBody BulkDocumentLinkRequest request) {

        log.info("Sending bulk submission links to {} candidates for cycle {}",
                request.getCandidateIds().size(), request.getCycleId());

        Map<Long, String> rawResults = documentLinkService.sendBulkSubmissionLinks(
                request.getCandidateIds(),
                request.getCycleId(),
            request.getDocumentTypeIds(),
            request.getSubmissionDeadline()
        );

        // Convert Long keys to String so JSON serializes as {"1": "SUCCESS"} not numeric
        Map<String, String> results = new java.util.LinkedHashMap<>();
        rawResults.forEach((k, v) -> results.put(String.valueOf(k), v));

        long successCount = results.values().stream().filter(v -> v.equals("SUCCESS")).count();
        String message = successCount + "/" + request.getCandidateIds().size()
                + " submission links sent successfully";

        return ResponseEntity.status(HttpStatus.OK)
                .body(new ApiResponse<>(true, message, results));
    }
}
