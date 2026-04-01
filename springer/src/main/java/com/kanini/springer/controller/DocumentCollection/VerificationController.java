package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.DocumentCollection.DocumentCompletionResponse;
import com.kanini.springer.dto.DocumentCollection.VerificationRequest;
import com.kanini.springer.dto.DocumentCollection.VerificationResponse;
import com.kanini.springer.service.DocumentCollection.IVerificationService;
import com.kanini.springer.service.DocumentCollection.IDocumentLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents/verification")
@RequiredArgsConstructor
@Validated
@Slf4j
public class VerificationController {
    
    private final IVerificationService verificationService;
    private final IDocumentLinkService documentLinkService;
    
    @PatchMapping("/{documentId}/approve")
    public ResponseEntity<ApiResponse<VerificationResponse>> approveDocument(
            @PathVariable Long documentId,
            @Valid @RequestBody VerificationRequest request) {
        VerificationResponse response = verificationService.approveDocument(documentId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document approved successfully", response));
    }
    
    @PatchMapping("/{documentId}/reject")
    public ResponseEntity<ApiResponse<VerificationResponse>> rejectDocument(
            @PathVariable Long documentId,
            @Valid @RequestBody VerificationRequest request) {
        VerificationResponse response = verificationService.rejectDocument(documentId, request);
        
        // *** NEW: Send rejection email to candidate with reason and resubmit link ***
        boolean emailSent = documentLinkService.sendRejectionEmail(documentId, request.getRejectionReason());
        if (!emailSent) {
            log.warn("Failed to send rejection email for document: {}", documentId);
        }
        
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document rejected successfully. Candidate has been notified.", response));
    }
    
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<VerificationResponse>>> getPendingVerifications(
            @RequestParam(required = false) Long cycleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<VerificationResponse> response = verificationService.getPendingVerifications(cycleId, page, size);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Pending documents retrieved successfully", response));
    }
    
    @GetMapping("/{documentId}/history")
    public ResponseEntity<ApiResponse<List<VerificationResponse>>> getVerificationHistory(
            @PathVariable Long documentId) {
        List<VerificationResponse> response = verificationService.getVerificationHistory(documentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Verification history retrieved successfully", response));
    }
    
    @GetMapping("/candidate/{candidateId}/completion")
    public ResponseEntity<ApiResponse<DocumentCompletionResponse>> checkDocumentCompletion(
            @PathVariable Long candidateId,
            @RequestParam Long cycleId) {
        DocumentCompletionResponse response = verificationService.getDocumentCompletionStatus(candidateId, cycleId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document completion status retrieved", response));
    }
}
