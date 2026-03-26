package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import org.springframework.stereotype.Component;

@Component
public class InstituteMapper {
    
    public InstituteResponse toResponse(Institute institute) {
        InstituteResponse response = new InstituteResponse();
        response.setInstituteId(institute.getInstituteId());
        response.setInstituteName(institute.getInstituteName());
        response.setInstituteTier(institute.getInstituteTier() != null ? institute.getInstituteTier().toString() : null);
     
        response.setState(institute.getState());
        response.setCity(institute.getCity());
        response.setIsActive(institute.getIsActive());
        response.setCreatedAt(institute.getCreatedAt());
        return response;
    }
}
