package com.kanini.springer.service.Dashboards;

import com.kanini.springer.dto.Dashboards.DriveDashboardResponse;

public interface IDriveDashboardService {
    DriveDashboardResponse getDriveSummary(Long cycleId);
}
