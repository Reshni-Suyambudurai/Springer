package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteNameResponse;
import com.kanini.springer.dto.Hiring.InstituteRequest;
import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.dto.Hiring.InstituteWithTPOsResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteContact;
import com.kanini.springer.entity.HiringReq.InstituteProgram;
import com.kanini.springer.entity.HiringReq.Program;
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
        return mapper.toResponse(savedInstitute);
    }
    
    @Override
    @Transactional
    public BulkInsertResponse<InstituteResponse> bulkCreateInstitutes(List<InstituteRequest> requests) {
        List<Institute> institutesToInsert = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        int totalProcessed = requests.size();
        
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
                
                // Check if institute already exists
                if (instituteRepository.findByInstituteName(request.getInstituteName()).isPresent()) {
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
        List<InstituteResponse> responses = savedInstitutes.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
        
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
        return instituteRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public InstituteResponse getInstituteById(Long instituteId) {
        Institute institute = instituteRepository.findById(instituteId)
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
            // Check if new name already exists (excluding current institute)
            instituteRepository.findByInstituteName(request.getInstituteName())
                    .ifPresent(existingInstitute -> {
                        if (!existingInstitute.getInstituteId().equals(instituteId)) {
                            throw new ValidationException("Institute already exists with name: " + request.getInstituteName());
                        }
                    });
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
                .collect(Collectors.toList());
    }
}
