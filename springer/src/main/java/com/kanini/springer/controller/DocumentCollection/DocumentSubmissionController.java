package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionResponse;
import com.kanini.springer.service.DocumentCollection.IDocumentSubmissionService;
import com.kanini.springer.service.DocumentCollection.IDocumentLinkService;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents/submissions")
@RequiredArgsConstructor
@Validated
public class DocumentSubmissionController {
    
    private final IDocumentSubmissionService submissionService;
    private final IDocumentLinkService documentLinkService;
    private final CandidateRepository candidateRepository;
    
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<DocumentSubmissionResponse>> submitDocument(
            @RequestParam Long documentTypeId,
            @RequestParam(required = false) Long candidateId,
            @RequestParam(required = false) Long cycleId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String token) {

        // If token provided, extract candidateId and cycleId FROM token — ignore user-supplied values
        if (token != null && !token.isEmpty()) {
            var tokenClaims = documentLinkService.validateAndTrackLink(token);
            candidateId = tokenClaims.getCandidateId();
            cycleId = tokenClaims.getCycleId();

            // Validate candidate email matches token — prevents using someone else's link
            if (tokenClaims.getCandidateEmail() != null) {
                var candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new ValidationException("Candidate not found"));
                if (!tokenClaims.getCandidateEmail().equalsIgnoreCase(candidate.getEmail())) {
                    throw new ValidationException("Token is not valid for this candidate");
                }
            }
        }

        if (candidateId == null || cycleId == null) {
            throw new ValidationException("candidateId and cycleId are required when no token is provided");
        }
        
        DocumentSubmissionRequest request = new DocumentSubmissionRequest();
        request.setDocumentTypeId(documentTypeId);
        request.setCandidateId(candidateId);
        request.setCycleId(cycleId);
        request.setFile(file);
        request.setToken(token);
        
        DocumentSubmissionResponse response = submissionService.submitDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded successfully", response));
    }
    
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<ApiResponse<List<DocumentSubmissionResponse>>> getSubmissionsByCandidate(
            @PathVariable Long candidateId) {
        List<DocumentSubmissionResponse> response = submissionService.getSubmissionsByCandidate(candidateId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Candidate documents retrieved successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentSubmissionResponse>>> getAllSubmissions(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<DocumentSubmissionResponse> response = submissionService.getAllSubmissions(status, cycleId, page, size);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("All submissions retrieved successfully", response));
    }
    
    @GetMapping("/{documentId}")
    public ResponseEntity<ApiResponse<DocumentSubmissionResponse>> getSubmissionById(
            @PathVariable Long documentId) {
        DocumentSubmissionResponse response = submissionService.getSubmissionById(documentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document retrieved successfully", response));
    }
    
    @GetMapping("/{documentId}/file")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long documentId) {
        byte[] fileContent = submissionService.downloadDocument(documentId);

        // Detect content type from file bytes
        String contentType = "application/octet-stream";
        if (fileContent.length > 3) {
            if (fileContent[0] == (byte) 0xFF && fileContent[1] == (byte) 0xD8) {
                contentType = "image/jpeg";
            } else if (fileContent[0] == (byte) 0x89 && fileContent[1] == (byte) 0x50) {
                contentType = "image/png";
            } else if (fileContent[0] == (byte) 0x25 && fileContent[1] == (byte) 0x50
                    && fileContent[2] == (byte) 0x44 && fileContent[3] == (byte) 0x46) {
                contentType = "application/pdf";
            }
        }

        String disposition = contentType.startsWith("image") || contentType.equals("application/pdf")
                ? "inline" : "attachment";

        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .header("Content-Disposition", disposition + "; filename=document_" + documentId)
                .body(fileContent);
    }
    
    @DeleteMapping("/{documentId}")
    public ResponseEntity<ApiResponse<Void>> deleteSubmission(
            @PathVariable Long documentId) {
        submissionService.deleteSubmission(documentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document deleted successfully"));
    }
}


