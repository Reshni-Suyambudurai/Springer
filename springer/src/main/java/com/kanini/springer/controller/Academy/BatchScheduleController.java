package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.BatchScheduleRequest;
import com.kanini.springer.dto.Academy.BatchScheduleResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IBatchScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/batch-schedules")
@RequiredArgsConstructor
@Validated
public class BatchScheduleController {

    private final IBatchScheduleService batchScheduleService;

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR')")
    @PostMapping
    public ResponseEntity<ApiResponse<BatchScheduleResponse>> saveOrUpdateBatchSchedule(
            @Valid @RequestBody BatchScheduleRequest request) {
        BatchScheduleResponse response = batchScheduleService.saveOrUpdateBatchSchedule(request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Batch schedule saved successfully", response));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_HEAD','TA_MANAGER','INTERN')")
    @GetMapping("/program/{programId}")
    public ResponseEntity<ApiResponse<List<BatchScheduleResponse>>> getSchedulesByProgram(
            @PathVariable Integer programId) {
        List<BatchScheduleResponse> response = batchScheduleService.getSchedulesByProgram(programId);
        return ResponseEntity.ok(ApiResponse.success("Batch schedules retrieved successfully", response));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_HEAD','TA_MANAGER','INTERN')")
    @GetMapping("/program/{programId}/batch/{batchNumber}")
    public ResponseEntity<ApiResponse<BatchScheduleResponse>> getScheduleByProgramAndBatch(
            @PathVariable Integer programId,
            @PathVariable Integer batchNumber) {
        BatchScheduleResponse response = batchScheduleService.getScheduleByProgramAndBatch(programId, batchNumber);
        return ResponseEntity.ok(ApiResponse.success("Batch schedule retrieved successfully", response));
    }
}
