package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

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
        
        // Map programs
        if (institute.getInstitutePrograms() != null) {
            response.setPrograms(
                institute.getInstitutePrograms().stream()
                    .map(ip -> new InstituteResponse.ProgramDetails(
                        ip.getProgram().getProgramId(),
                        ip.getProgram().getProgramName().toString()
                    ))
                    .collect(Collectors.toList())
            );
        }
        
        return response;
    }
}
