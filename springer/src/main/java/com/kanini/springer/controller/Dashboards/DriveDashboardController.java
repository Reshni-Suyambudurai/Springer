package com.kanini.springer.controller.Dashboards;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;
import com.kanini.springer.dto.Drive.CycleIdRequest;
import com.kanini.springer.service.Dashboards.IDriveDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboards/drive")
@RequiredArgsConstructor
public class DriveDashboardController {

    private final IDriveDashboardService driveDashboardService;

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<DriveDashboardResponse>> getDriveSummary(@Valid @RequestBody CycleIdRequest request) {
        DriveDashboardResponse response = driveDashboardService.getDriveSummary(request.getCycleId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Drive summary retrieved successfully", response));
    }
}