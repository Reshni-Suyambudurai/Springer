package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateRequest;
import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateResponse;
import com.kanini.springer.dto.DocumentCollection.OfferLetterRequest;
import com.kanini.springer.dto.DocumentCollection.OfferLetterResponse;
import com.kanini.springer.service.DocumentCollection.IOfferLetterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
@Validated
public class OfferLetterController {

    private final IOfferLetterService offerService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<OfferLetterResponse>> generateOfferLetter(
            @Valid @RequestBody OfferLetterRequest request) {
        OfferLetterResponse response = offerService.generateOfferLetter(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Offer generated successfully", response));
    }

    @PostMapping("/bulk-generate")
    public ResponseEntity<ApiResponse<BulkOfferGenerateResponse>> bulkGenerateOfferLetters(
            @Valid @RequestBody BulkOfferGenerateRequest request) {
        BulkOfferGenerateResponse response = offerService.bulkGenerateOfferLetters(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulk offer generation completed", response));
    }

    @GetMapping("/{offerId}")
    public ResponseEntity<ApiResponse<OfferLetterResponse>> getOfferById(
            @PathVariable Long offerId) {
        OfferLetterResponse response = offerService.getOfferById(offerId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Offer retrieved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OfferLetterResponse>>> getAllOffers(
            @RequestParam(required = false) String offerResponse,
            @RequestParam(required = false) Long cycleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<OfferLetterResponse> offers = offerService.getAllOffers(offerResponse, cycleId, page, size);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Offers retrieved successfully", offers));
    }

    @GetMapping("/offer-ready")
    public ResponseEntity<ApiResponse<List<OfferLetterResponse>>> getOfferReadyCandidates(
            @RequestParam Long cycleId) {
        List<OfferLetterResponse> response = offerService.getOfferReadyCandidates(cycleId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Offer-ready candidates retrieved successfully", response));
    }
}
