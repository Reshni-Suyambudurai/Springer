package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.HiringDemandResponse;
import com.kanini.springer.dto.Hiring.SkillResponse;
import com.kanini.springer.entity.HiringReq.HiringDemand;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class HiringDemandMapper {
    
    public HiringDemandResponse toResponse(HiringDemand demand) {
        HiringDemandResponse response = new HiringDemandResponse();
        response.setDemandId(demand.getDemandId());
        response.setCycleId(demand.getCycle().getCycleId());
        response.setCycleName(demand.getCycle().getCycleName());
        
        response.setBusinessUnit(demand.getBusinessUnit().toString());
        response.setDemandCount(demand.getDemandCount());
        response.setCompensationBand(demand.getCompensationBand());
        response.setApprovalStatus(demand.getApprovalStatus().toString());
        response.setCreatedByUsername(demand.getCreatedBy().getUsername());
        response.setCreatedAt(demand.getCreatedAt());
        
        // Map requisition skills to skill responses
        List<SkillResponse> skillResponses = Collections.emptyList();
        if (demand.getRequisitionSkills() != null && !demand.getRequisitionSkills().isEmpty()) {
            skillResponses = demand.getRequisitionSkills().stream()
                    .map(rs -> {
                        SkillResponse skillResponse = new SkillResponse();
                        skillResponse.setSkillId(rs.getSkill().getSkillId());
                        skillResponse.setSkillName(rs.getSkill().getSkillName());
                        return skillResponse;
                    })
                    .collect(Collectors.toList());
        }
        response.setSkills(skillResponses);
        
        return response;
    }
}
