package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.DocumentCollection.PipelineStatusResponse;
import com.kanini.springer.service.DocumentCollection.IReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {
    
    private final IReportService reportService;
    
    @GetMapping("/document-completion")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDocumentCompletionReport(
            @RequestParam Long cycleId) {
        Map<String, Object> report = reportService.getDocumentCompletionReport(cycleId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document completion report retrieved successfully", report));
    }
    
    @GetMapping("/offer-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOfferStatusReport(
            @RequestParam Long cycleId) {
        Map<String, Object> report = reportService.getOfferStatusReport(cycleId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Offer status report retrieved successfully", report));
    }
    
    @GetMapping("/pipeline-status")
    public ResponseEntity<ApiResponse<PipelineStatusResponse>> getPipelineStatusReport(
            @RequestParam Long cycleId) {
        PipelineStatusResponse report = reportService.getPipelineStatusReport(cycleId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Pipeline status report retrieved successfully", report));
    }
}
