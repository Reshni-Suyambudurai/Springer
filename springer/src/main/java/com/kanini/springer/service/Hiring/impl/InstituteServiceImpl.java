package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteCreateRequest;
import com.kanini.springer.dto.Hiring.InstituteNameResponse;
import com.kanini.springer.dto.Hiring.InstituteRequest;
import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.dto.Hiring.InstituteUpdateRequest;
import com.kanini.springer.dto.Hiring.InstituteWithTPOsResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteContact;
import com.kanini.springer.entity.HiringReq.InstituteProgram;
import com.kanini.springer.entity.HiringReq.Program;
import com.kanini.springer.entity.enums.Enums.ContactStatus;
import com.kanini.springer.entity.enums.Enums.InstituteTier;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.InstituteMapper;
import com.kanini.springer.mapper.Hiring.InstituteWithTPOsMapper;
import com.kanini.springer.repository.Hiring.InstituteContactRepository;
import com.kanini.springer.repository.Hiring.InstituteProgramRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.ProgramRepository;
import com.kanini.springer.service.Hiring.IInstituteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstituteServiceImpl implements IInstituteService {
    
    private final InstituteRepository instituteRepository;
    private final InstituteContactRepository contactRepository;
    private final InstituteProgramRepository instituteProgramRepository;
    private final ProgramRepository programRepository;
    private final InstituteMapper mapper;
    private final InstituteWithTPOsMapper withTPOsMapper;
    
    @Override
    @Transactional
    public InstituteResponse createInstitute(InstituteRequest request) {
        // Validation: Check if institute name already exists
        if (instituteRepository.findByInstituteName(request.getInstituteName()).isPresent()) {
            throw new ValidationException("Institute already exists with name: " + request.getInstituteName());
        }
        
        Institute institute = new Institute();
        institute.setInstituteName(request.getInstituteName());
        
        if (request.getInstituteTier() != null && !request.getInstituteTier().isBlank()) {
            institute.setInstituteTier(InstituteTier.valueOf(request.getInstituteTier()));
        }
        
        institute.setState(request.getState());
        institute.setCity(request.getCity());
        institute.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        Institute savedInstitute = instituteRepository.save(institute);
        
        // If TPO contact data is provided, create the contact record
        if (request.getTpoContact() != null) {
            InstituteRequest.TPOContactRequest tpo = request.getTpoContact();
            if (tpo.getTpoName() != null && !tpo.getTpoName().isBlank()
                    && tpo.getTpoEmail() != null && !tpo.getTpoEmail().isBlank()
                    && tpo.getTpoMobile() != null && !tpo.getTpoMobile().isBlank()) {
                InstituteContact contact = new InstituteContact();
                contact.setInstitute(savedInstitute);
                contact.setTpoName(tpo.getTpoName());
                contact.setTpoEmail(tpo.getTpoEmail());
                contact.setTpoMobile(tpo.getTpoMobile());
                contact.setTpoDesignation(tpo.getTpoDesignation());
                contact.setTpoStatus(ContactStatus.ACTIVE);
                contact.setIsPrimary(true);
                contactRepository.save(contact);
            }
        }
        
        return mapper.toResponse(savedInstitute);
    }
    
    @Override
    @Transactional
    public BulkInsertResponse<InstituteResponse> bulkCreateInstitutes(List<InstituteRequest> requests) {
        List<Institute> institutesToInsert = new ArrayList<>();
        List<InstituteRequest> validRequests = new ArrayList<>(); // Track requests that passed validation
        List<String> errorMessages = new ArrayList<>();
        int totalProcessed = requests.size();
        
        // Pre-fetch all existing institute names in ONE query
        Set<String> allNames = requests.stream()
                .map(InstituteRequest::getInstituteName)
                .filter(name -> name != null && !name.isBlank())
                .collect(Collectors.toSet());
        Set<String> existingNames = instituteRepository.findByInstituteNameIn(allNames).stream()
                .map(Institute::getInstituteName)
                .collect(Collectors.toSet());
        
        // Phase 1: Validate ALL records first
        for (int i = 0; i < requests.size(); i++) {
            InstituteRequest request = requests.get(i);
            String identifier = request.getInstituteName() != null ? request.getInstituteName() : "Record #" + (i + 1);
            
            try {
                // Validate required fields
                if (request.getInstituteName() == null || request.getInstituteName().isBlank()) {
                    errorMessages.add(identifier + ": Institute name is required");
                    continue;
                }
                
                // Check if institute already exists (using pre-fetched set)
                if (existingNames.contains(request.getInstituteName())) {
                    errorMessages.add(identifier + ": Institute already exists with this name");
                    continue;
                }
                
                // Validate enum if provided
                if (request.getInstituteTier() != null && !request.getInstituteTier().isBlank()) {
                    try {
                        InstituteTier.valueOf(request.getInstituteTier());
                    } catch (IllegalArgumentException e) {
                        errorMessages.add(identifier + ": Invalid institute tier: " + request.getInstituteTier());
                        continue;
                    }
                }
                
                // Prepare institute for insertion
                Institute institute = new Institute();
                institute.setInstituteName(request.getInstituteName());
                
                if (request.getInstituteTier() != null && !request.getInstituteTier().isBlank()) {
                    institute.setInstituteTier(InstituteTier.valueOf(request.getInstituteTier()));
                }
                
              
                institute.setState(request.getState());
                institute.setCity(request.getCity());
                institute.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
                
                institutesToInsert.add(institute);
                validRequests.add(request);
                
            } catch (Exception e) {
                errorMessages.add(identifier + ": Validation error: " + e.getMessage());
            }
        }
        
        // Phase 2: If ANY errors exist, rollback and return errors (all-or-nothing)
        if (!errorMessages.isEmpty()) {
            BulkInsertResponse<InstituteResponse> response = new BulkInsertResponse<>();
            response.setSuccessfulInserts(new ArrayList<>());
            response.setErrorMessages(errorMessages);
            response.setTotalProcessed(totalProcessed);
            response.setSuccessCount(0);
            response.setFailureCount(errorMessages.size());
            return response;
        }
        
        // Phase 3: Insert all records (within transaction, will auto-rollback on exception)
        List<Institute> savedInstitutes = instituteRepository.saveAll(institutesToInsert);
        
        // Phase 4: Batch create TPO contacts for institutes that have TPO data
        List<InstituteContact> contactsToSave = new ArrayList<>();
        for (int i = 0; i < savedInstitutes.size(); i++) {
            InstituteRequest req = validRequests.get(i);
            if (req.getTpoContact() != null) {
                InstituteRequest.TPOContactRequest tpo = req.getTpoContact();
                if (tpo.getTpoName() != null && !tpo.getTpoName().isBlank()
                        && tpo.getTpoEmail() != null && !tpo.getTpoEmail().isBlank()
                        && tpo.getTpoMobile() != null && !tpo.getTpoMobile().isBlank()) {
                    InstituteContact contact = new InstituteContact();
                    contact.setInstitute(savedInstitutes.get(i));
                    contact.setTpoName(tpo.getTpoName());
                    contact.setTpoEmail(tpo.getTpoEmail());
                    contact.setTpoMobile(tpo.getTpoMobile());
                    contact.setTpoDesignation(tpo.getTpoDesignation());
                    contact.setTpoStatus(ContactStatus.ACTIVE);
                    contact.setIsPrimary(true);
                    contactsToSave.add(contact);
                }
            }
        }
        if (!contactsToSave.isEmpty()) {
            contactRepository.saveAll(contactsToSave);
        }
        
        List<InstituteResponse> responses = savedInstitutes.stream()
                .map(mapper::toResponse)
                .toList();
        
        BulkInsertResponse<InstituteResponse> response = new BulkInsertResponse<>();
        response.setSuccessfulInserts(responses);
        response.setErrorMessages(new ArrayList<>());
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(responses.size());
        response.setFailureCount(0);
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InstituteResponse> getAllInstitutes() {
        return instituteRepository.findAllWithPrograms().stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public InstituteResponse getInstituteById(Long instituteId) {
        Institute institute = instituteRepository.findByIdWithPrograms(instituteId)
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", instituteId));
        return mapper.toResponse(institute);
    }
    
    @Override
    @Transactional
    public InstituteResponse updateInstitute(Long instituteId, InstituteRequest request) {
        Institute institute = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", instituteId));
        
        // Partial update - only update fields that are provided
        if (request.getInstituteName() != null && !request.getInstituteName().isBlank()) {
            // Only check uniqueness if the name actually changed
            if (!institute.getInstituteName().equalsIgnoreCase(request.getInstituteName())) {
                if (instituteRepository.findByInstituteName(request.getInstituteName()).isPresent()) {
                    throw new ValidationException("Institute already exists with name: " + request.getInstituteName());
                }
            }
            institute.setInstituteName(request.getInstituteName());
        }
        
        if (request.getInstituteTier() != null && !request.getInstituteTier().isBlank()) {
            institute.setInstituteTier(InstituteTier.valueOf(request.getInstituteTier()));
        }        
     
        
        if (request.getState() != null) {
            institute.setState(request.getState());
        }
        
        if (request.getCity() != null) {
            institute.setCity(request.getCity());
        }
        
        if (request.getIsActive() != null) {
            institute.setIsActive(request.getIsActive());
        }
        
        // Handle program mappings if provided
        if (request.getProgramIds() != null && !request.getProgramIds().isEmpty()) {
            // Remove existing program mappings
            List<InstituteProgram> existingMappings = instituteProgramRepository.findByInstituteInstituteId(instituteId);
            instituteProgramRepository.deleteAll(existingMappings);
            
            // Add new program mappings
            for (Long programId : request.getProgramIds()) {
                Program program = programRepository.findById(programId)
                        .orElseThrow(() -> new ResourceNotFoundException("Program", "ID", programId));
                
                InstituteProgram instituteProgram = new InstituteProgram();
                instituteProgram.setInstitute(institute);
                instituteProgram.setProgram(program);
                instituteProgramRepository.save(instituteProgram);
            }
        }
        
        Institute updatedInstitute = instituteRepository.save(institute);
        return mapper.toResponse(updatedInstitute);
    }
    
    @Override
    @Transactional
    public void deleteInstitute(Long instituteId) {
        Institute institute = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", instituteId));
        
        // Toggle isActive status (true <-> false)
        institute.setIsActive(!institute.getIsActive());
        instituteRepository.save(institute);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<InstituteWithTPOsResponse> getAllInstitutesWithTPOs(Pageable pageable) {
        Page<Institute> institutesPage = instituteRepository.findAll(pageable);
        
        return institutesPage.map(institute -> {
            List<InstituteContact> contacts = contactRepository.findByInstituteInstituteId(institute.getInstituteId());
            List<InstituteProgram> programs = instituteProgramRepository.findByInstituteInstituteId(institute.getInstituteId());
            return withTPOsMapper.toResponse(institute, contacts, programs);
        });
    }
    
    @Override
    @Transactional(readOnly = true)
    public InstituteWithTPOsResponse getInstituteWithTPOsById(Long instituteId) {
        Institute institute = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", instituteId));
        
        List<InstituteContact> contacts = contactRepository.findByInstituteInstituteId(institute.getInstituteId());
        List<InstituteProgram> programs = instituteProgramRepository.findByInstituteInstituteId(institute.getInstituteId());
        
        return withTPOsMapper.toResponse(institute, contacts, programs);
    }
    
    @Override
    public List<InstituteNameResponse> getAllInstituteNames() {
        List<Institute> institutes = instituteRepository.findAll();
        
        return institutes.stream()
                .map(institute -> new InstituteNameResponse(
                        institute.getInstituteId(),
                        institute.getInstituteName()
                ))
                .toList();
    }

    @Override
    @Transactional
    public InstituteWithTPOsResponse fullUpdateInstitute(Long instituteId, InstituteUpdateRequest request) {
        // HIT 1 — load institute
        Institute institute = instituteRepository.findById(instituteId)
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", instituteId));

        // ── 1. Update basic fields ─────────────────────────────────────────────
        if (request.getInstituteName() != null && !request.getInstituteName().isBlank()) {
            if (!institute.getInstituteName().equalsIgnoreCase(request.getInstituteName())) {
                // HIT 2 (conditional) — uniqueness check only when name changed
                if (instituteRepository.findByInstituteName(request.getInstituteName()).isPresent()) {
                    throw new ValidationException("Institute already exists with name: " + request.getInstituteName());
                }
            }
            institute.setInstituteName(request.getInstituteName());
        }
        if (request.getInstituteTier() != null && !request.getInstituteTier().isBlank())
            institute.setInstituteTier(InstituteTier.valueOf(request.getInstituteTier()));
        if (request.getState() != null) institute.setState(request.getState());
        if (request.getCity() != null) institute.setCity(request.getCity());
        if (request.getIsActive() != null) institute.setIsActive(request.getIsActive());
        // HIT 3 — single UPDATE for all basic field changes
        instituteRepository.save(institute);

        // ── 2. Replace program mappings (2 hits regardless of list size) ───────
        if (request.getProgramIds() != null) {
            // HIT 4 — single bulk DELETE via JPQL
            instituteProgramRepository.deleteByInstituteId(instituteId);

            if (!request.getProgramIds().isEmpty()) {
                // HIT 5 — single SELECT IN to fetch all programs at once
                List<Program> programs = programRepository.findAllById(request.getProgramIds());
                if (programs.size() != request.getProgramIds().size()) {
                    throw new ResourceNotFoundException("One or more Program IDs not found", "IDs", request.getProgramIds());
                }
                List<InstituteProgram> newMappings = programs.stream().map(program -> {
                    InstituteProgram ip = new InstituteProgram();
                    ip.setInstitute(institute);
                    ip.setProgram(program);
                    return ip;
                }).toList();
                // HIT 6 — single batch INSERT
                instituteProgramRepository.saveAll(newMappings);
            }
        }

        // ── 3. Update existing TPO contacts (2 hits regardless of list size) ──
        if (request.getTpoContacts() != null && !request.getTpoContacts().isEmpty()) {
            List<Integer> tpoIds = request.getTpoContacts().stream()
                    .map(InstituteUpdateRequest.ExistingTPORequest::getTpoId)
                    .toList();
            // HIT 7 — single SELECT IN for all TPO contacts
            List<InstituteContact> existingContacts = contactRepository.findAllById(tpoIds);
            if (existingContacts.size() != tpoIds.size()) {
                throw new ResourceNotFoundException("One or more TPO contacts not found", "IDs", tpoIds);
            }
            Map<Integer, InstituteContact> contactMap = existingContacts.stream()
                    .collect(Collectors.toMap(InstituteContact::getTpoId, c -> c));
            for (InstituteUpdateRequest.ExistingTPORequest tpoReq : request.getTpoContacts()) {
                InstituteContact contact = contactMap.get(tpoReq.getTpoId());
                if (tpoReq.getTpoName() != null) contact.setTpoName(tpoReq.getTpoName());
                if (tpoReq.getTpoEmail() != null) contact.setTpoEmail(tpoReq.getTpoEmail());
                if (tpoReq.getTpoMobile() != null) contact.setTpoMobile(tpoReq.getTpoMobile());
                if (tpoReq.getTpoDesignation() != null) contact.setTpoDesignation(tpoReq.getTpoDesignation());
                if (tpoReq.getIsPrimary() != null) contact.setIsPrimary(tpoReq.getIsPrimary());
            }
            // HIT 8 — single batch UPDATE
            contactRepository.saveAll(existingContacts);
        }

        // ── 4. Create new TPO contacts (1 hit regardless of list size) ─────────
        if (request.getNewTpoContacts() != null) {
            List<InstituteContact> newContacts = request.getNewTpoContacts().stream()
                    .filter(t -> t.getTpoName() != null && !t.getTpoName().isBlank()
                              && t.getTpoEmail() != null && !t.getTpoEmail().isBlank())
                    .map(newTpo -> {
                        InstituteContact contact = new InstituteContact();
                        contact.setInstitute(institute);
                        contact.setTpoName(newTpo.getTpoName());
                        contact.setTpoEmail(newTpo.getTpoEmail());
                        contact.setTpoMobile(newTpo.getTpoMobile() != null ? newTpo.getTpoMobile() : "");
                        contact.setTpoDesignation(newTpo.getTpoDesignation());
                        contact.setTpoStatus(ContactStatus.ACTIVE);
                        contact.setIsPrimary(newTpo.getIsPrimary() != null ? newTpo.getIsPrimary() : false);
                        return contact;
                    }).toList();
            if (!newContacts.isEmpty()) {
                // HIT 9 — single batch INSERT
                contactRepository.saveAll(newContacts);
            }
        }

        // ── 5. Return fresh full response (2 hits) ─────────────────────────────
        // HIT 10 — load final contacts
        List<InstituteContact> contacts = contactRepository.findByInstituteInstituteId(instituteId);
        // HIT 11 — load final programs
        List<InstituteProgram> finalPrograms = instituteProgramRepository.findByInstituteInstituteId(instituteId);
        return withTPOsMapper.toResponse(institute, contacts, finalPrograms);
    }

    // ── createInstituteFull ────────────────────────────────────────────────────
    // DB hits: HIT 1 uniqueness check | HIT 2 save institute
    //          HIT 3 batch fetch programs (optional) | HIT 4 batch insert programs (optional)
    //          HIT 5 batch insert TPO contacts (optional) | HIT 6+7 load response
    // Max 7 hits — min 4 hits (no programs, no contacts)
    @Override
    @Transactional
    public InstituteWithTPOsResponse createInstituteFull(InstituteCreateRequest request) {
        // HIT 1 — uniqueness check
        if (instituteRepository.findByInstituteName(request.getInstituteName()).isPresent()) {
            throw new ValidationException("Institute already exists with name: " + request.getInstituteName());
        }

        // ── 1. Build and save institute ────────────────────────────────────────
        Institute institute = new Institute();
        institute.setInstituteName(request.getInstituteName());
        if (request.getInstituteTier() != null && !request.getInstituteTier().isBlank()) {
            institute.setInstituteTier(InstituteTier.valueOf(request.getInstituteTier()));
        }
        institute.setState(request.getState());
        institute.setCity(request.getCity());
        institute.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        // HIT 2 — INSERT institute
        Institute savedInstitute = instituteRepository.save(institute);
        Long newId = savedInstitute.getInstituteId();

        // ── 2. Map programs (2 optional hits) ─────────────────────────────────
        if (request.getProgramIds() != null && !request.getProgramIds().isEmpty()) {
            // HIT 3 — batch SELECT programs
            List<Program> programs = programRepository.findAllById(request.getProgramIds());
            if (programs.size() != request.getProgramIds().size()) {
                throw new ResourceNotFoundException("One or more Program IDs not found", "IDs", request.getProgramIds());
            }
            List<InstituteProgram> mappings = programs.stream().map(program -> {
                InstituteProgram ip = new InstituteProgram();
                ip.setInstitute(savedInstitute);
                ip.setProgram(program);
                return ip;
            }).toList();
            // HIT 4 — batch INSERT program mappings
            instituteProgramRepository.saveAll(mappings);
        }

        // ── 3. Create TPO contacts (1 optional hit) ────────────────────────────
        if (request.getTpoContacts() != null && !request.getTpoContacts().isEmpty()) {
            List<InstituteContact> contacts = request.getTpoContacts().stream()
                    .filter(t -> t.getTpoName() != null && !t.getTpoName().isBlank()
                              && t.getTpoEmail() != null && !t.getTpoEmail().isBlank())
                    .map(t -> {
                        InstituteContact contact = new InstituteContact();
                        contact.setInstitute(savedInstitute);
                        contact.setTpoName(t.getTpoName());
                        contact.setTpoEmail(t.getTpoEmail());
                        contact.setTpoMobile(t.getTpoMobile() != null ? t.getTpoMobile() : "");
                        contact.setTpoDesignation(t.getTpoDesignation());
                        contact.setTpoStatus(ContactStatus.ACTIVE);
                        contact.setIsPrimary(t.getIsPrimary() != null ? t.getIsPrimary() : false);
                        return contact;
                    }).toList();
            if (!contacts.isEmpty()) {
                // HIT 5 — batch INSERT contacts
                contactRepository.saveAll(contacts);
            }
        }

        // ── 4. Return fresh full response ──────────────────────────────────────
        // HIT 6 — load contacts
        List<InstituteContact> savedContacts = contactRepository.findByInstituteInstituteId(newId);
        // HIT 7 — load program mappings
        List<InstituteProgram> savedPrograms = instituteProgramRepository.findByInstituteInstituteId(newId);
        return withTPOsMapper.toResponse(savedInstitute, savedContacts, savedPrograms);
    }
}
