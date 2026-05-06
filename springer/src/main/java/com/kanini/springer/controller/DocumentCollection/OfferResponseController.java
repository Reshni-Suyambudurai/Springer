package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.DocumentCollection.BulkOfferResponseRequest;
import com.kanini.springer.dto.DocumentCollection.OfferResponseRequest;
import com.kanini.springer.dto.DocumentCollection.OfferResponseResponse;
import com.kanini.springer.service.DocumentCollection.IOfferResponseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
@Validated
public class OfferResponseController {

    private final IOfferResponseService responseService;

    @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
    @PatchMapping("/{offerId}/response")
    public ResponseEntity<ApiResponse<OfferResponseResponse>> recordResponse(
            @PathVariable Long offerId,
            @Valid @RequestBody OfferResponseRequest request) {
        OfferResponseResponse response = responseService.recordResponse(offerId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Offer response recorded successfully", response));
    }

    @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
    @PostMapping("/bulk-response")
    public ResponseEntity<ApiResponse<List<OfferResponseResponse>>> bulkRecordResponse(
            @Valid @RequestBody List<BulkOfferResponseRequest> requests) {
        List<OfferResponseResponse> response = responseService.bulkRecordResponse(requests);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Bulk offer responses recorded successfully", response));
    }

    @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<ApiResponse<OfferResponseResponse>> getCandidateOffer(
            @PathVariable Long candidateId) {
        OfferResponseResponse response = responseService.getCandidateOffer(candidateId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Candidate offer retrieved successfully", response));
    }

        @PreAuthorize("hasAnyRole('TA_MANAGER','TA_HEAD')")
        @PutMapping("/{offerId}/response")
        public ResponseEntity<ApiResponse<OfferResponseResponse>> updateResponse(
                        @PathVariable Long offerId,
                        @Valid @RequestBody OfferResponseRequest request) {
                OfferResponseResponse response = responseService.updateResponse(offerId, request);
                return ResponseEntity.ok(ApiResponse.success("Offer response updated successfully", response));
        }
}
