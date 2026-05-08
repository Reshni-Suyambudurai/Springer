package com.kanini.springer.mapper.Drive;

import com.kanini.springer.dto.Drive.CandidateRegistrationRequest;
import com.kanini.springer.dto.Drive.CandidateRegistrationResponse;
import com.kanini.springer.entity.Drive.CandidateRegistration;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.Form;
import org.springframework.stereotype.Component;

/**
 * Mapper for CandidateRegistration entity and DTOs
 */
@Component
public class CandidateRegistrationMapper {

    /**
     * Convert CandidateRegistrationRequest to CandidateRegistration entity
     * Accepts pre-fetched drive and form to avoid duplicate DB queries
     */
    public CandidateRegistration toEntity(CandidateRegistrationRequest request, Drive drive, Form form) {
        if (request == null) {
            return null;
        }

        CandidateRegistration registration = new CandidateRegistration();
        registration.setDrive(drive);
        registration.setForm(form);
        registration.setFname(request.getFname());
        registration.setLname(request.getLname());
        registration.setEmail(request.getEmail());
        registration.setPhone(request.getPhone());
        registration.setCollegeName(request.getCollegeName());
        registration.setGraduationYear(request.getGraduationYear());
        registration.setDegree(request.getDegree());
        registration.setDepartment(request.getDepartment());
        registration.setCgpa(request.getCgpa());
        registration.setHistoryOfArrears(request.getHistoryOfArrears());
        registration.setSkills(request.getSkills());
        registration.setDob(request.getDob());
        registration.setAadhaarNo(request.getAadhaarNo());
        registration.setApplicationType(request.getApplicationType());

        return registration;
    }

    /**
     * Convert CandidateRegistration entity to CandidateRegistrationResponse
     */
    public CandidateRegistrationResponse toResponse(CandidateRegistration registration) {
        if (registration == null) {
            return null;
        }

        CandidateRegistrationResponse response = new CandidateRegistrationResponse();
        response.setRegistrationId(registration.getRegistrationId());
        response.setFname(registration.getFname());
        response.setLname(registration.getLname());
        response.setEmail(registration.getEmail());
        response.setPhone(registration.getPhone());
        response.setCollegeName(registration.getCollegeName());
        response.setGraduationYear(registration.getGraduationYear());
        response.setDegree(registration.getDegree());
        response.setDepartment(registration.getDepartment());
        response.setCgpa(registration.getCgpa());
        response.setHistoryOfArrears(registration.getHistoryOfArrears());
        response.setSkills(registration.getSkills());
        response.setDob(registration.getDob());
        response.setAadhaarNo(registration.getAadhaarNo());
        response.setApplicationType(registration.getApplicationType());
        response.setStatus(registration.getStatus());
        response.setSubmittedAt(registration.getSubmittedAt());

        // Map drive details
        if (registration.getDrive() != null) {
            response.setDriveId(registration.getDrive().getDriveId());
            response.setDriveName(registration.getDrive().getDriveName());
        }

        // Map form details
        if (registration.getForm() != null) {
            response.setFormId(registration.getForm().getFormId());
            response.setFormName(registration.getForm().getFormName());
        }

        // Map institute details
        if (registration.getInstitute() != null) {
            response.setInstituteId(registration.getInstitute().getInstituteId());
            response.setInstituteName(registration.getInstitute().getInstituteName());
        }

        return response;
    }
}
