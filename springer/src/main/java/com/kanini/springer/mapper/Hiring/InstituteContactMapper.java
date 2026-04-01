package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.InstituteContactResponse;
import com.kanini.springer.entity.HiringReq.InstituteContact;
import org.springframework.stereotype.Component;

@Component
public class InstituteContactMapper {
    
    public InstituteContactResponse toResponse(InstituteContact contact) {
        InstituteContactResponse response = new InstituteContactResponse();
        response.setTpoId(contact.getTpoId());
        response.setInstituteId(contact.getInstitute().getInstituteId());
        response.setInstituteName(contact.getInstitute().getInstituteName());
        response.setTpoName(contact.getTpoName());
        response.setTpoEmail(contact.getTpoEmail());
        response.setTpoMobile(contact.getTpoMobile());
        response.setTpoDesignation(contact.getTpoDesignation());
        response.setTpoStatus(contact.getTpoStatus() != null ? contact.getTpoStatus().toString() : null);
        response.setIsPrimary(contact.getIsPrimary());
        response.setCreatedAt(contact.getCreatedAt());
        return response;
    }
}
