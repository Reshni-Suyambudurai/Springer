package com.kanini.springer.service.Trainee;

import com.kanini.springer.dto.Trainee.InternDashboardResponse;

public interface IInternService {
    InternDashboardResponse getDashboard(Long userId);
}
