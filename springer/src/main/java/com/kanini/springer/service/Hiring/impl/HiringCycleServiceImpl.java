package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.HiringCycleRequest;
import com.kanini.springer.dto.Hiring.HiringCycleResponse;
import com.kanini.springer.dto.Hiring.HiringCycleSummaryResponse;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.HiringCycleMapper;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.Hiring.IHiringCycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HiringCycleServiceImpl implements IHiringCycleService {
    
    private final HiringCycleRepository cycleRepository;
    private final HiringCycleMapper mapper;
    
    @Override
    @Transactional
    public HiringCycleResponse createCycle(HiringCycleRequest request) {
        // Validation: Check if cycle year already exists
        if (cycleRepository.findByCycleYear(request.getCycleYear()).isPresent()) {
            throw new ValidationException("Hiring cycle for year " + request.getCycleYear() + " already exists");
        }
        
        // Validation: Cycle year should be current year or future
        if (request.getCycleYear() < java.time.Year.now().getValue()) {
            throw new ValidationException("Cycle year cannot be in the past");
        }
        
        HiringCycle cycle = new HiringCycle();
        cycle.setCycleYear(request.getCycleYear());
        cycle.setCycleName(request.getCycleName());
        cycle.setCompensationBand(request.getCompensationBand());
        cycle.setBudget(request.getBudget());
        cycle.setStatus(CycleStatus.OPEN); // Always set to OPEN on creation
        
        // Handle JD file upload
        if (request.getJd() != null && !request.getJd().isEmpty()) {
            try {
                cycle.setJd(request.getJd().getBytes());
            } catch (IOException e) {
                throw new ValidationException("Failed to upload job description file: " + e.getMessage());
            }
        }
        
        HiringCycle savedCycle = cycleRepository.save(cycle);
        return mapper.toResponse(savedCycle);
    }
    
    @Override
    public HiringCycleResponse getCycleById(Long cycleId) {
        HiringCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", cycleId));
        return mapper.toResponse(cycle);
    }
    
    @Override
    public List<HiringCycleResponse> getAllCycles() {
        return cycleRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<HiringCycleSummaryResponse> getAllCycleSummaries() {
        return cycleRepository.findAll().stream()
                .map(cycle -> new HiringCycleSummaryResponse(
                    cycle.getCycleId(),
                    cycle.getCycleYear(),
                    cycle.getCycleName(),
                    cycle.getStatus().toString()
                ))
                .collect(Collectors.toList());
    }
    
    @Override
    public List<HiringCycleResponse> getCyclesByStatus(String status) {
        try {
            CycleStatus cycleStatus = CycleStatus.valueOf(status.toUpperCase());
            return cycleRepository.findByStatus(cycleStatus).stream()
                    .map(mapper::toResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid cycle status: " + status + ". Valid values are: OPEN, CLOSED");
        }
    }
    
    @Override
    @Transactional
    public HiringCycleResponse updateCycle(Long cycleId, HiringCycleRequest request) {
        HiringCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", cycleId));

        // Partial update - only update fields that are provided
        
        // Update cycleYear if provided
        if (request.getCycleYear() != null) {
            // Validation: If changing year, check if new year already exists
            if (!cycle.getCycleYear().equals(request.getCycleYear())) {
                if (cycleRepository.findByCycleYear(request.getCycleYear()).isPresent()) {
                    throw new ValidationException("Hiring cycle for year " + request.getCycleYear() + " already exists");
                }
            }
            cycle.setCycleYear(request.getCycleYear());
        }
        
        // Update cycleName if provided
        if (request.getCycleName() != null && !request.getCycleName().isBlank()) {
            cycle.setCycleName(request.getCycleName());
        }
         
        // Update compensationBand if provided
        if (request.getCompensationBand() != null) {
            cycle.setCompensationBand(request.getCompensationBand());
        }
        
        // Update budget if provided
        if (request.getBudget() != null) {
            cycle.setBudget(request.getBudget());
        }
        
        // Handle JD file upload (only update if new file is provided)
        if (request.getJd() != null && !request.getJd().isEmpty()) {
            try {
                cycle.setJd(request.getJd().getBytes());
            } catch (IOException e) {
                throw new ValidationException("Failed to upload job description file: " + e.getMessage());
            }
        }
        
        HiringCycle updatedCycle = cycleRepository.save(cycle);
        return mapper.toResponse(updatedCycle);
    }
    
    @Override
    
    public void deleteCycle(Long cycleId) {
        HiringCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", cycleId));
        
        // Validation: Cannot delete cycle if it has demands
        if (cycle.getHiringDemands() != null && !cycle.getHiringDemands().isEmpty()) {
            throw new ValidationException("Cannot delete cycle with existing hiring demands");
        }
        
        cycleRepository.delete(cycle);
    }
    
    @Override
    public HiringCycleResponse toggleCycleStatus(Long cycleId) {
        HiringCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", cycleId));
        
        // Toggle status between OPEN and CLOSED
        if (cycle.getStatus() == CycleStatus.OPEN) {
            cycle.setStatus(CycleStatus.CLOSED);
        } else {
            cycle.setStatus(CycleStatus.OPEN);
        }
        
        HiringCycle updatedCycle = cycleRepository.save(cycle);
        return mapper.toResponse(updatedCycle);
    }
    
    @Override
    public byte[] getJdByCycleId(Long cycleId) {
        HiringCycle cycle = cycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", cycleId));
        
        if (cycle.getJd() == null || cycle.getJd().length == 0) {
            throw new ResourceNotFoundException("Job description file", "cycle ID", cycleId);
        }
        
        return cycle.getJd();
    }
}
