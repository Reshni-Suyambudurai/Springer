package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.HiringCycleResponse;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import org.springframework.stereotype.Component;

@Component
public class HiringCycleMapper {
    
    public HiringCycleResponse toResponse(HiringCycle cycle) {
        HiringCycleResponse response = new HiringCycleResponse();
        response.setCycleId(cycle.getCycleId());
        response.setCycleYear(cycle.getCycleYear());
        response.setCycleName(cycle.getCycleName());
        response.setCompensationBand(cycle.getCompensationBand());
        response.setBudget(cycle.getBudget());
        response.setHasJd(cycle.getJd() != null && cycle.getJd().length > 0);
        response.setStatus(cycle.getStatus().toString());
        response.setCreatedAt(cycle.getCreatedAt());
        return response;
    }
}
