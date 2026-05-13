package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Drive.CandidateRegistrationRequest;
import com.kanini.springer.dto.Drive.CandidateRegistrationResponse;
import com.kanini.springer.entity.Drive.CandidateRegistration;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.Form;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.CandidateRegistrationMapper;
import com.kanini.springer.repository.Drive.CandidateRegistrationRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Drive.FormRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.service.Drive.ICandidateRegistrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for candidate registration operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateRegistrationServiceImpl implements ICandidateRegistrationService {

    private final CandidateRegistrationRepository registrationRepository;
    private final DriveRepository driveRepository;
    private final FormRepository formRepository;
    private final InstituteRepository instituteRepository;
    private final CandidateRegistrationMapper mapper;

    @Override
    @Transactional
    public CandidateRegistrationResponse submitRegistration(Long driveId, CandidateRegistrationRequest request) {
        log.info("Submitting registration for drive ID: {}, email: {}, formId: {}", driveId, request.getEmail(), request.getFormId());

        // Validate drive exists (1 DB hit)
        Drive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", driveId));

        // Validate form exists and is active (1 DB hit)
        Form form = formRepository.findByIdWithDetails(request.getFormId())
                .orElseThrow(() -> new ResourceNotFoundException("Form", "ID", request.getFormId()));
        
        if (!form.getStatus()) {
            throw new ValidationException("Form is inactive and cannot accept registrations");
        }
        
        // Validate form belongs to the specified drive
        if (!form.getDrive().getDriveId().equals(driveId)) {
            throw new ValidationException("Form does not belong to the specified drive");
        }

        // Convert to entity and save - Pass pre-fetched drive and form to avoid duplicate queries
        CandidateRegistration registration = mapper.toEntity(request, drive, form);
        
        // Set institute if provided
        if (request.getInstituteId() != null) {
            Institute institute = instituteRepository.findById(request.getInstituteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", request.getInstituteId()));
            registration.setInstitute(institute);
        }
        
        CandidateRegistration savedRegistration = registrationRepository.save(registration);

        log.info("Registration successful. Registration ID: {}", savedRegistration.getRegistrationId());
        return mapper.toResponse(savedRegistration);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateRegistrationResponse> getAllRegistrations(Long driveId) {
        log.info("Fetching all registrations for drive ID: {}", driveId);

        // Validate drive exists (1 DB hit)
        if (!driveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Drive", "ID", driveId);
        }

        // Fetch with eager loading to prevent N+1 problem (1 DB hit with JOIN FETCH)
        List<CandidateRegistration> registrations = registrationRepository.findByDriveDriveId(driveId);
        return registrations.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateRegistrationResponse> getRegistrationsByFormId(Long formId) {
        log.info("Fetching all registrations for form ID: {}", formId);

        // Validate form exists
        if (!formRepository.existsById(formId)) {
            throw new ResourceNotFoundException("Form", "ID", formId);
        }

        List<CandidateRegistration> registrations = registrationRepository.findByFormFormId(formId);
        return registrations.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CandidateRegistrationResponse getRegistrationById(Long registrationId) {
        log.info("Fetching registration by ID: {}", registrationId);

        // Use eager loading to prevent lazy load (1 DB hit with JOIN FETCH)
        CandidateRegistration registration = registrationRepository.findByIdWithDetails(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "ID", registrationId));

        return mapper.toResponse(registration);
    }

    @Override
    @Transactional
    public void deleteRegistration(Long registrationId) {
        log.info("Deleting registration ID: {}", registrationId);

        // Find first to throw proper exception if not found (1 DB hit)
        // This is better than existsById + deleteById (2 hits)
        CandidateRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException("Registration", "ID", registrationId));

        registrationRepository.delete(registration);
        log.info("Registration deleted successfully");
    }

    @Override
    @Transactional
    public void bulkDeleteRegistrations(List<Long> registrationIds) {
        log.info("Bulk deleting {} registrations", registrationIds.size());

        if (registrationIds == null || registrationIds.isEmpty()) {
            throw new ValidationException("Registration IDs list cannot be empty");
        }

        // Fetch all registrations to validate they exist (1 DB hit with JOIN FETCH)
        List<CandidateRegistration> registrations = registrationRepository.findByRegistrationIdIn(registrationIds);

        // Check if all IDs were found
        if (registrations.size() != registrationIds.size()) {
            List<Long> foundIds = registrations.stream()
                    .map(CandidateRegistration::getRegistrationId)
                    .toList();
            List<Long> notFoundIds = registrationIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            log.warn("Some registration IDs not found: {}", notFoundIds);
            throw new ResourceNotFoundException("Registration", "IDs", notFoundIds.toString());
        }

        // Bulk delete all registrations (1 DB hit)
        registrationRepository.deleteAllInBatch(registrations);
        log.info("Successfully deleted {} registrations", registrations.size());
    }
}
