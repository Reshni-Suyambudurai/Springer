package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.InstituteProgramRequest;
import com.kanini.springer.dto.Hiring.ProgramResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteProgram;
import com.kanini.springer.entity.HiringReq.Program;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Hiring.InstituteProgramRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.ProgramRepository;
import com.kanini.springer.service.Hiring.IProgramService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgramServiceImpl implements IProgramService {
    
    private final ProgramRepository programRepository;
    private final InstituteProgramRepository instituteProgramRepository;
    private final InstituteRepository instituteRepository;
    
    @Override
    public List<ProgramResponse> getAllPrograms() {
        return programRepository.findAll().stream()
                .map(program -> new ProgramResponse(
                        program.getProgramId(),
                        program.getProgramName().name()
                ))
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void addProgramsToInstitute(List<InstituteProgramRequest> requests) {
        for (InstituteProgramRequest request : requests) {
            // Validate institute exists
            Institute institute = instituteRepository.findById(request.getInstituteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", request.getInstituteId()));
            
            // Validate program exists
            Program program = programRepository.findById(request.getProgramId())
                    .orElseThrow(() -> new ResourceNotFoundException("Program", "ID", request.getProgramId()));
            
            // Check if mapping already exists
            List<InstituteProgram> existing = instituteProgramRepository.findByInstituteInstituteId(request.getInstituteId());
            boolean alreadyExists = existing.stream()
                    .anyMatch(ip -> ip.getProgram().getProgramId().equals(request.getProgramId()));
            
            if (!alreadyExists) {
                InstituteProgram instituteProgram = new InstituteProgram();
                instituteProgram.setInstitute(institute);
                instituteProgram.setProgram(program);
                instituteProgramRepository.save(instituteProgram);
            }
        }
    }
    
    @Override
    @Transactional
    public void removeInstituteProgramMapping(Long instituteProgramId) {
        InstituteProgram instituteProgram = instituteProgramRepository.findById(instituteProgramId)
                .orElseThrow(() -> new ResourceNotFoundException("Institute-Program mapping", "ID", instituteProgramId));
        
        instituteProgramRepository.delete(instituteProgram);
    }
}
