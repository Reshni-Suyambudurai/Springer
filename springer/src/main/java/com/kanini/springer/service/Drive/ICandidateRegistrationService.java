package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.CandidateRegistrationRequest;
import com.kanini.springer.dto.Drive.CandidateRegistrationResponse;
import com.kanini.springer.dto.Drive.CandidateRegistrationUpdateRequest;

import java.util.List;

/**
 * Service interface for candidate registration operations
 */
public interface ICandidateRegistrationService {

    /**
     * Submit a new candidate registration
     */
    CandidateRegistrationResponse submitRegistration(Long driveId, CandidateRegistrationRequest request);

    /**
     * Get all registrations for a drive
     */
    List<CandidateRegistrationResponse> getAllRegistrations(Long driveId);

    /**
     * Get all registrations for a form
     */
    List<CandidateRegistrationResponse> getRegistrationsByFormId(Long formId);

    /**
     * Get registration by ID
     */
    CandidateRegistrationResponse getRegistrationById(Long registrationId);

    /**
     * Partially update a registration (collegeName, email, mobile)
     */
    CandidateRegistrationResponse updateRegistration(Long registrationId, CandidateRegistrationUpdateRequest request);

    /**
     * Delete registration by ID
     */
    void deleteRegistration(Long registrationId);

    /**
     * Bulk delete registrations by IDs
     */
    void bulkDeleteRegistrations(List<Long> registrationIds);
}
