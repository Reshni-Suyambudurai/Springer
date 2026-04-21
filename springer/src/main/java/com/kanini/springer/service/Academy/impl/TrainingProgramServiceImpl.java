package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.TrainingProgramRequest;
import com.kanini.springer.dto.Academy.TrainingProgramResponse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingProgramMapper;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.Academy.ITrainingProgramService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingProgramServiceImpl implements ITrainingProgramService {

    private static final String PROGRAM_NOT_FOUND = "Training Program not found with ID: ";

    private final TrainingProgramRepository programRepository;
    private final HiringCycleRepository cycleRepository;
    private final TrainingProgramMapper mapper;
    
    @Override
    @Transactional
    public TrainingProgramResponse createProgram(TrainingProgramRequest request) {
        // Validate cycle exists
        HiringCycle cycle = cycleRepository.findById(request.getCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("Hiring Cycle not found with ID: " + request.getCycleId()));
        
        // Validate cycle is OPEN
        if (cycle.getStatus() != com.kanini.springer.entity.enums.Enums.CycleStatus.OPEN) {
            throw new IllegalArgumentException("Cannot create program for non-open hiring cycle with ID: " + request.getCycleId() + ". Status must be OPEN, current status: " + cycle.getStatus());
        }
        
        TrainingProgram program = mapper.toEntity(request);
        program.setCycle(cycle);
        
        TrainingProgram savedProgram = programRepository.save(program);
        return mapper.toResponse(savedProgram);
    }
    
    @Override
    @Transactional(readOnly = true)
    public TrainingProgramResponse getProgramById(Integer programId) {
        TrainingProgram program = programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException(PROGRAM_NOT_FOUND + programId));
        return mapper.toResponse(program);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingProgramResponse> getAllPrograms() {
        return programRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingProgramResponse> getProgramsByStatus(boolean status) {
        return programRepository.findByStatus(status).stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional
    public TrainingProgramResponse updateProgram(Integer programId, TrainingProgramRequest request) {
        TrainingProgram program = programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException(PROGRAM_NOT_FOUND + programId));
        
        // Only update fields that are provided (not null) - PATCH behavior
        if (request.getProgramName() != null) {
            program.setProgramName(request.getProgramName());
        }
        if (request.getProgramYear() != null) {
            program.setProgramYear(request.getProgramYear());
        }
        if (request.getCapacity() != null) {
            program.setCapacity(request.getCapacity());
        }
        if (request.getNumberOfBatches() != null) {
            program.setNumberOfBatches(request.getNumberOfBatches());
        }
        if (request.getLocation() != null) {
            program.setLocation(request.getLocation());
        }
        if (request.getCycleId() != null) {
            HiringCycle cycle = cycleRepository.findById(request.getCycleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hiring Cycle not found with ID: " + request.getCycleId()));
            
            // Validate cycle is OPEN
            if (cycle.getStatus() != com.kanini.springer.entity.enums.Enums.CycleStatus.OPEN) {
                throw new IllegalArgumentException("Cannot link program to non-open hiring cycle with ID: " + request.getCycleId() + ". Status must be OPEN, current status: " + cycle.getStatus());
            }
            
            program.setCycle(cycle);
        }
        
        TrainingProgram updatedProgram = programRepository.save(program);
        return mapper.toResponse(updatedProgram);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Integer> getAllDistinctYears() {
        return programRepository.findDistinctYears();
    }
    
    @Override
    @Transactional
    public void deleteProgram(Integer programId) {
        TrainingProgram program = programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException(PROGRAM_NOT_FOUND + programId));
        
        program.setStatus(false); // Soft delete
        programRepository.save(program);
    }
}
