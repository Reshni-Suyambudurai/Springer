package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.service.DocumentCollection.IDocumentLinkService;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionStatusResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Validated
@Slf4j
public class DocumentSubmissionStatusController {

    private final IDocumentLinkService documentLinkService;

    /**
     * Get document submission status for candidate
     * Public endpoint - authenticated by JWT token in URL
     * Shows which documents are required, uploaded, approved, or rejected
     */
    @GetMapping("/submission-status")
    public ResponseEntity<ApiResponse<DocumentSubmissionStatusResponse>> getSubmissionStatus(
            @RequestParam @NotBlank(message = "Token is required") String token) {
        log.info("Fetching submission status with provided token");

        // Validate token and extract claims
        var tokenData = documentLinkService.validateAndTrackLink(token);

        // Get submission status
        DocumentSubmissionStatusResponse response = documentLinkService.getSubmissionStatus(
            tokenData.getCandidateId(),
            tokenData.getCycleId(),
            token
        );

        return ResponseEntity.ok(
            new ApiResponse<>(
                true,
                "Document submission status retrieved successfully",
                response
            )
        );
    }
}
