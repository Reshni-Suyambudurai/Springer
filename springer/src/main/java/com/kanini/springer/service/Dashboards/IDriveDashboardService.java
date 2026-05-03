package com.kanini.springer.service.Dashboards;

import com.kanini.springer.dto.Analytics.CollegeAnalysisResponse;
import com.kanini.springer.dto.Analytics.DriveDetailsAnalysisResponse;
import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;

import java.util.List;

public interface IDriveDashboardService {
    DriveDashboardResponse getDriveSummary(Long cycleId);
    DriveDetailsAnalysisResponse getDriveDetailsAnalysis(Long cycleId);
    List<CollegeAnalysisResponse> getCollegeAnalysis(Long cycleId);
}
