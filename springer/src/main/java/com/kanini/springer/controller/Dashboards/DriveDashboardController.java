package com.kanini.springer.controller.Dashboards;

import com.kanini.springer.dto.Analytics.CollegeAnalysisResponse;
import com.kanini.springer.dto.Analytics.DriveDetailsAnalysisResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;
import com.kanini.springer.dto.Drive.CycleIdRequest;
import com.kanini.springer.service.Dashboards.IDriveDashboardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/dashboards/drive")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','TA_HEAD','TA_MANAGER')")
public class DriveDashboardController {

    private final IDriveDashboardService driveDashboardService;

    @PostMapping("/summary")
    public ResponseEntity<ApiResponse<DriveDashboardResponse>> getDriveSummary(@Valid @RequestBody CycleIdRequest request) {
        DriveDashboardResponse response = driveDashboardService.getDriveSummary(request.getCycleId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Drive summary retrieved successfully", response));
    }

    @PostMapping("/drive-details-analysis")
    public ResponseEntity<ApiResponse<DriveDetailsAnalysisResponse>> getDriveDetailsAnalysis(@RequestBody CycleIdRequest request) {
        DriveDetailsAnalysisResponse response = driveDashboardService.getDriveDetailsAnalysis(request.getCycleId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Drive details analysis retrieved successfully", response));
    }

    @PostMapping("/college-analysis")
    public ResponseEntity<ApiResponse<List<CollegeAnalysisResponse>>> getCollegeAnalysis(@RequestBody CycleIdRequest request) {
        List<CollegeAnalysisResponse> response = driveDashboardService.getCollegeAnalysis(request.getCycleId());
        return ResponseEntity.ok(new ApiResponse<>(true, "College analysis retrieved successfully", response));
    }
}
