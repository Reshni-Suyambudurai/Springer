package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteContactRequest;
import com.kanini.springer.dto.Hiring.InstituteContactResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteContact;
import com.kanini.springer.entity.enums.Enums.ContactStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.InstituteContactMapper;
import com.kanini.springer.repository.Hiring.InstituteContactRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.service.Hiring.IInstituteTPOService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstituteTPOServiceImpl implements IInstituteTPOService {
    
    private final InstituteContactRepository contactRepository;
    private final InstituteRepository instituteRepository;
    private final InstituteContactMapper mapper;
    
    // Validation patterns
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    private static final Pattern MOBILE_PATTERN = Pattern.compile(
        "^[6-9][0-9]{9}$"
    );
    private static final Pattern NAME_PATTERN = Pattern.compile(
        "^[A-Za-z ]+$"
    );
    
    @Override
    @Transactional
    public InstituteContactResponse createContact(InstituteContactRequest request) {
        // Validate that the institute exists
        Institute institute = instituteRepository.findById(request.getInstituteId())
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", request.getInstituteId()));
        
        // Validate that email is unique
        if (contactRepository.findByTpoEmail(request.getTpoEmail()).isPresent()) {
            throw new ValidationException("Contact already exists with email: " + request.getTpoEmail());
        }
        
        InstituteContact contact = new InstituteContact();
        contact.setInstitute(institute);
        contact.setTpoName(request.getTpoName());
        contact.setTpoEmail(request.getTpoEmail());
        contact.setTpoMobile(request.getTpoMobile());
        contact.setTpoDesignation(request.getTpoDesignation());
        
        if (request.getTpoStatus() != null && !request.getTpoStatus().isBlank()) {
            contact.setTpoStatus(ContactStatus.valueOf(request.getTpoStatus()));
        } else {
            contact.setTpoStatus(ContactStatus.ACTIVE);
        }
        
        contact.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false);
        
        InstituteContact savedContact = contactRepository.save(contact);
        return mapper.toResponse(savedContact);
    }
    
    @Override
    @Transactional
    public BulkInsertResponse<InstituteContactResponse> bulkCreateContacts(Long instituteId, List<InstituteContactRequest> requests) {
        List<InstituteContact> contactsToInsert = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        int totalProcessed = requests.size();
        
        // Validate that the institute exists
        Institute institute = instituteRepository.findById(instituteId).orElse(null);
        if (institute == null) {
            errorMessages.add("Institute ID: " + instituteId + ": Institute not found");
            BulkInsertResponse<InstituteContactResponse> response = new BulkInsertResponse<>();
            response.setSuccessfulInserts(new ArrayList<>());
            response.setErrorMessages(errorMessages);
            response.setTotalProcessed(totalProcessed);
            response.setSuccessCount(0);
            response.setFailureCount(errorMessages.size());
            return response;
        }
        
        // Phase 1: Validate ALL records first
        for (int i = 0; i < requests.size(); i++) {
            InstituteContactRequest request = requests.get(i);
            String identifier = request.getTpoEmail() != null ? request.getTpoEmail() : 
                               request.getTpoName() != null ? request.getTpoName() : "Record #" + (i + 1);
            
            try {
                // Validate required fields
                if (request.getTpoName() == null || request.getTpoName().isBlank()) {
                    errorMessages.add(identifier + ": TPO name is required");
                    continue;
                }
                
                if (request.getTpoEmail() == null || request.getTpoEmail().isBlank()) {
                    errorMessages.add(identifier + ": TPO email is required");
                    continue;
                }
                
                if (request.getTpoMobile() == null || request.getTpoMobile().isBlank()) {
                    errorMessages.add(identifier + ": TPO mobile is required");
                    continue;
                }
                
                // Validate patterns
                if (!NAME_PATTERN.matcher(request.getTpoName()).matches()) {
                    errorMessages.add(identifier + ": TPO name must contain only letters and spaces");
                    continue;
                }
                
                if (!EMAIL_PATTERN.matcher(request.getTpoEmail()).matches()) {
                    errorMessages.add(identifier + ": Invalid email format");
                    continue;
                }
                
                if (!MOBILE_PATTERN.matcher(request.getTpoMobile()).matches()) {
                    errorMessages.add(identifier + ": Invalid mobile number (must be 10-digit Indian number starting with 6-9)");
                    continue;
                }
                
                // Check if email already exists
                if (contactRepository.findByTpoEmail(request.getTpoEmail()).isPresent()) {
                    errorMessages.add(identifier + ": Contact already exists with this email");
                    continue;
                }
                
                // Validate enum if provided
                if (request.getTpoStatus() != null && !request.getTpoStatus().isBlank()) {
                    try {
                        ContactStatus.valueOf(request.getTpoStatus());
                    } catch (IllegalArgumentException e) {
                        errorMessages.add(identifier + ": Invalid TPO status: " + request.getTpoStatus());
                  }
                }
                // Prepare contact for insertion
                InstituteContact contact = new InstituteContact();
                contact.setInstitute(institute);
                contact.setTpoName(request.getTpoName());
                contact.setTpoEmail(request.getTpoEmail());
                contact.setTpoMobile(request.getTpoMobile());
                contact.setTpoDesignation(request.getTpoDesignation());
                
                if (request.getTpoStatus() != null && !request.getTpoStatus().isBlank()) {
                    contact.setTpoStatus(ContactStatus.valueOf(request.getTpoStatus()));
                } else {
                    contact.setTpoStatus(ContactStatus.ACTIVE);
                }
                
                contact.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false);
                
                contactsToInsert.add(contact);
            
            } catch (Exception e) {
                errorMessages.add(identifier + ": Validation error: " + e.getMessage());
            }
        }
        
        
        // Phase 2: If ANY errors exist, rollback and return errors (all-or-nothing)
        if (!errorMessages.isEmpty()) {
            BulkInsertResponse<InstituteContactResponse> response = new BulkInsertResponse<>();
            response.setSuccessfulInserts(new ArrayList<>());
            response.setErrorMessages(errorMessages);
            response.setTotalProcessed(totalProcessed);
            response.setSuccessCount(0);
            response.setFailureCount(errorMessages.size());
            return response;
        }
        
        // Phase 3: Insert all records (within transaction, will auto-rollback on exception)
        List<InstituteContact> savedContacts = contactRepository.saveAll(contactsToInsert);
        List<InstituteContactResponse> responses = savedContacts.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
        
        BulkInsertResponse<InstituteContactResponse> response = new BulkInsertResponse<>();
        response.setSuccessfulInserts(responses);
        response.setErrorMessages(new ArrayList<>());
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(responses.size());
        response.setFailureCount(0);
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InstituteContactResponse> getContactsByInstituteId(Long instituteId) {
        // Validate that institute exists
        if (!instituteRepository.existsById(instituteId)) {
            throw new RuntimeException("Institute not found with ID: " + instituteId);
        }
        
        return contactRepository.findByInstituteInstituteId(instituteId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public InstituteContactResponse getContactById(Integer tpoId) {
        InstituteContact contact = contactRepository.findByIdWithInstitute(tpoId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", "ID", tpoId));
        return mapper.toResponse(contact);
    }
    
    @Override
    @Transactional
    public InstituteContactResponse updateContact(Integer tpoId, InstituteContactRequest request) {
        InstituteContact contact = contactRepository.findById(tpoId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", "ID", tpoId));
        
        // Partial update - only update fields that are provided
        if (request.getInstituteId() != null) {
            Institute institute = instituteRepository.findById(request.getInstituteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", request.getInstituteId()));
            contact.setInstitute(institute);
        }
        
        if (request.getTpoName() != null && !request.getTpoName().isBlank()) {
            contact.setTpoName(request.getTpoName());
        }
        
        if (request.getTpoEmail() != null && !request.getTpoEmail().isBlank()) {
            // Check if new email already exists (excluding current contact)
            contactRepository.findByTpoEmail(request.getTpoEmail())
                    .ifPresent(existingContact -> {
                        if (!existingContact.getTpoId().equals(tpoId)) {
                            throw new ValidationException("Contact already exists with email: " + request.getTpoEmail());
                        }
                    });
            contact.setTpoEmail(request.getTpoEmail());
        }
        
        if (request.getTpoMobile() != null && !request.getTpoMobile().isBlank()) {
            contact.setTpoMobile(request.getTpoMobile());
        }
        
        if (request.getTpoDesignation() != null) {
            contact.setTpoDesignation(request.getTpoDesignation());
        }
        
        if (request.getTpoStatus() != null && !request.getTpoStatus().isBlank()) {
            contact.setTpoStatus(ContactStatus.valueOf(request.getTpoStatus()));
        }
        
        if (request.getIsPrimary() != null) {
            contact.setIsPrimary(request.getIsPrimary());
        }
        
        InstituteContact updatedContact = contactRepository.save(contact);
        return mapper.toResponse(updatedContact);
    }
    
    @Override
    @Transactional
    public void deleteContact(Integer tpoId) {
        InstituteContact contact = contactRepository.findById(tpoId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", "ID", tpoId));
        
        // Toggle tpoStatus between ACTIVE and INACTIVE
        if (contact.getTpoStatus() == ContactStatus.ACTIVE) {
            contact.setTpoStatus(ContactStatus.INACTIVE);
        } else {
            contact.setTpoStatus(ContactStatus.ACTIVE);
        }
        contactRepository.save(contact);
    }
    
    @Override
    @Transactional
    public BulkInsertResponse<InstituteContactResponse> bulkCreateAllContacts(List<InstituteContactRequest> requests) {
        List<InstituteContact> contactsToInsert = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        int totalProcessed = requests.size();
        
        // Phase 1: Validate ALL records first
        for (int i = 0; i < requests.size(); i++) {
            InstituteContactRequest request = requests.get(i);
            String identifier = request.getTpoEmail() != null ? request.getTpoEmail() : 
                               request.getTpoName() != null ? request.getTpoName() : "Record #" + (i + 1);
            
            try {
                // Validate required fields
                if (request.getInstituteId() == null) {
                    errorMessages.add(identifier + ": Institute ID is required");
                    continue;
                }
                
                if (request.getTpoName() == null || request.getTpoName().isBlank()) {
                    errorMessages.add(identifier + ": TPO name is required");
                    continue;
                }
                
                if (request.getTpoEmail() == null || request.getTpoEmail().isBlank()) {
                    errorMessages.add(identifier + ": TPO email is required");
                    continue;
                }
                
                if (request.getTpoMobile() == null || request.getTpoMobile().isBlank()) {
                    errorMessages.add(identifier + ": TPO mobile is required");
                    continue;
                }
                
                // Validate that the institute exists
                Institute institute = instituteRepository.findById(request.getInstituteId()).orElse(null);
                if (institute == null) {
                    errorMessages.add(identifier + ": Institute not found with ID: " + request.getInstituteId());
                    continue;
                }
                
                // Validate patterns
                if (!NAME_PATTERN.matcher(request.getTpoName()).matches()) {
                    errorMessages.add(identifier + ": TPO name must contain only letters and spaces");
                    continue;
                }
                
                if (!EMAIL_PATTERN.matcher(request.getTpoEmail()).matches()) {
                    errorMessages.add(identifier + ": Invalid email format");
                    continue;
                }
                
                if (!MOBILE_PATTERN.matcher(request.getTpoMobile()).matches()) {
                    errorMessages.add(identifier + ": Invalid mobile number (must be 10-digit Indian number starting with 6-9)");
                    continue;
                }
                
                // Check if email already exists
                if (contactRepository.findByTpoEmail(request.getTpoEmail()).isPresent()) {
                    errorMessages.add(identifier + ": Contact already exists with this email");
                    continue;
                }
                
                // Validate enum if provided
                if (request.getTpoStatus() != null && !request.getTpoStatus().isBlank()) {
                    try {
                        ContactStatus.valueOf(request.getTpoStatus());
                    } catch (IllegalArgumentException e) {
                        errorMessages.add(identifier + ": Invalid TPO status: " + request.getTpoStatus());
                        continue;
                    }
                }
                
                // Prepare contact for insertion
                InstituteContact contact = new InstituteContact();
                contact.setInstitute(institute);
                contact.setTpoName(request.getTpoName());
                contact.setTpoEmail(request.getTpoEmail());
                contact.setTpoMobile(request.getTpoMobile());
                contact.setTpoDesignation(request.getTpoDesignation());
                
                if (request.getTpoStatus() != null && !request.getTpoStatus().isBlank()) {
                    contact.setTpoStatus(ContactStatus.valueOf(request.getTpoStatus()));
                } else {
                    contact.setTpoStatus(ContactStatus.ACTIVE);
                }
                
                contact.setIsPrimary(request.getIsPrimary() != null ? request.getIsPrimary() : false);
                
                contactsToInsert.add(contact);
                
            } catch (Exception e) {
                errorMessages.add(identifier + ": Validation error: " + e.getMessage());
            }
        }
        
        // Phase 2: If ANY errors exist, rollback and return errors (all-or-nothing)
        if (!errorMessages.isEmpty()) {
            BulkInsertResponse<InstituteContactResponse> response = new BulkInsertResponse<>();
            response.setSuccessfulInserts(new ArrayList<>());
            response.setErrorMessages(errorMessages);
            response.setTotalProcessed(totalProcessed);
            response.setSuccessCount(0);
            response.setFailureCount(errorMessages.size());
            return response;
        }
        
        // Phase 3: Insert all records (within transaction, will auto-rollback on exception)
        List<InstituteContact> savedContacts = contactRepository.saveAll(contactsToInsert);
        List<InstituteContactResponse> responses = savedContacts.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
        
        BulkInsertResponse<InstituteContactResponse> response = new BulkInsertResponse<>();
        response.setSuccessfulInserts(responses);
        response.setErrorMessages(new ArrayList<>());
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(responses.size());
        response.setFailureCount(0);
        return response;
    }
}


