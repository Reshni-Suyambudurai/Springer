package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Hiring.HiringCycleRequest;
import com.kanini.springer.dto.Hiring.HiringCycleResponse;
import com.kanini.springer.dto.Hiring.HiringCycleSummaryResponse;
import com.kanini.springer.service.Hiring.IHiringCycleService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/hiring/cycles")
@RequiredArgsConstructor
@Validated
public class HiringCycleController {
    
    private final IHiringCycleService cycleService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<HiringCycleResponse>> createCycle(
            @RequestParam("cycleYear") @NotNull(message = "Cycle year is required") Integer cycleYear,
            @RequestParam("cycleName") @NotBlank(message = "Cycle name is required") String cycleName,
            @RequestParam(value = "compensationBand", required = false) Integer compensationBand,
            @RequestParam(value = "budget", required = false) Integer budget,
            @RequestPart(value = "jd", required = false) MultipartFile jd) {
        
        // Build request object
        HiringCycleRequest request = new HiringCycleRequest();
        request.setCycleYear(cycleYear);
        request.setCycleName(cycleName);
        request.setCompensationBand(compensationBand);
        request.setBudget(budget);
        request.setJd(jd);
        
        HiringCycleResponse response = cycleService.createCycle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Hiring cycle created successfully", response));
    }
    
    @GetMapping("/{cycleId}")
    public ResponseEntity<ApiResponse<HiringCycleResponse>> getCycleById(@PathVariable Long cycleId) {
        HiringCycleResponse response = cycleService.getCycleById(cycleId);
        return ResponseEntity.ok(ApiResponse.success("Hiring cycle retrieved successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<HiringCycleResponse>>> getAllCycles(@RequestParam(required = false) String status) {
        List<HiringCycleResponse> responses = (status != null && !status.isEmpty()) 
                ? cycleService.getCyclesByStatus(status)
                : cycleService.getAllCycles();
        return ResponseEntity.ok(ApiResponse.success("Hiring cycles retrieved successfully", responses));
    }
    
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<List<HiringCycleSummaryResponse>>> getAllCycleSummaries() {
        List<HiringCycleSummaryResponse> responses = cycleService.getAllCycleSummaries();
        return ResponseEntity.ok(ApiResponse.success("Hiring cycle summaries retrieved successfully", responses));
    }
    
    @PatchMapping(value = "/{cycleId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<HiringCycleResponse>> updateCycle(
            @PathVariable Long cycleId,
            @RequestParam(value = "cycleYear", required = false) Integer cycleYear,
            @RequestParam(value = "cycleName", required = false) String cycleName,
            @RequestParam(value = "compensationBand", required = false) Integer compensationBand,
            @RequestParam(value = "budget", required = false) Integer budget,
            @RequestPart(value = "jd", required = false) MultipartFile jd) {
        
        // Build request object with only provided fields
        HiringCycleRequest request = new HiringCycleRequest();
        request.setCycleYear(cycleYear);
        request.setCycleName(cycleName);
        request.setCompensationBand(compensationBand);
        request.setBudget(budget);
        request.setJd(jd);
        
        HiringCycleResponse response = cycleService.updateCycle(cycleId, request);
        return ResponseEntity.ok(ApiResponse.success("Hiring cycle updated successfully", response));
    }
    
    @DeleteMapping("/{cycleId}")
    public ResponseEntity<ApiResponse<Void>> deleteCycle(@PathVariable Long cycleId) {
        cycleService.deleteCycle(cycleId);
        return ResponseEntity.ok(ApiResponse.success("Hiring cycle deleted successfully", null));
    }
    
    @PatchMapping("/{cycleId}/toggle-status")
    public ResponseEntity<ApiResponse<HiringCycleResponse>> toggleCycleStatus(@PathVariable Long cycleId) {
        HiringCycleResponse response = cycleService.toggleCycleStatus(cycleId);
        return ResponseEntity.ok(ApiResponse.success("Cycle status toggled successfully", response));
    }
    
    @GetMapping("/{cycleId}/jd")
    public ResponseEntity<byte[]> downloadJd(@PathVariable Long cycleId) {
        byte[] jd = cycleService.getJdByCycleId(cycleId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"hiring-cycle-" + cycleId + "-jd.pdf\"")
                .header("Content-Type", "application/pdf")
                .body(jd);
    }
}
