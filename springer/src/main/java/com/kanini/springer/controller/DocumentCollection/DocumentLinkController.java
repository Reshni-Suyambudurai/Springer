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

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

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
     * Generate and send document submission link to candidate
     * Initiates document collection process
     */
    @PostMapping("/send-submission-link")
    public ResponseEntity<ApiResponse<DocumentLinkResponse>> sendSubmissionLink(
            @Valid @RequestBody DocumentLinkRequest request) {

        log.info("Sending submission link for candidate: {}", request.getCandidateId());

        DocumentLinkResponse response = documentLinkService.generateSubmissionLink(
            request.getCandidateId(),
            request.getCycleId(),
            request.getRequiredDocumentTypeIds()
        );

        return new ResponseEntity<>(
            new ApiResponse<>(
                true,
                "Document submission link sent to candidate email successfully",
                response
            ),
            HttpStatus.CREATED
        );
    }

    /**
     * Resend document submission link (if candidate didn't receive)
     */
    @PostMapping("/resend-submission-link")
    public ResponseEntity<ApiResponse<String>> resendSubmissionLink(
            @RequestParam @NotNull(message = "Candidate ID required") Long candidateId,
            @RequestParam @NotNull(message = "Cycle ID required") Long cycleId) {

        log.info("Resending submission link for candidate: {}", candidateId);

        boolean sent = documentLinkService.resendSubmissionLink(candidateId, cycleId);

        if (sent) {
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Submission link resent to candidate email successfully", null)
            );
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiResponse<>(false, "Failed to resend submission link. Please try again.", null)
            );
        }
    }

    /**
     * Send submission links to multiple candidates at once
     * All candidates receive the same document type list
     * One click from UI to notify all selected candidates
     */
    @PostMapping("/send-submission-link/bulk")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendBulkSubmissionLinks(
            @Valid @RequestBody BulkDocumentLinkRequest request) {

        log.info("Sending bulk submission links to {} candidates for cycle {}",
                request.getCandidateIds().size(), request.getCycleId());

        Map<Long, String> rawResults = documentLinkService.sendBulkSubmissionLinks(
                request.getCandidateIds(),
                request.getCycleId(),
                request.getDocumentTypeIds()
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
