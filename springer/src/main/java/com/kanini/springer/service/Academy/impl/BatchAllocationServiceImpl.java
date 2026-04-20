package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.Performance;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.BatchAllocationMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.service.Academy.IBatchAllocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BatchAllocationServiceImpl implements IBatchAllocationService {
    
    private final BatchAllocationRepository allocationRepository;
    private final TrainingProgramRepository programRepository;
    private final CandidateRepository candidateRepository;
    private final TrainingScoreRepository trainingScoreRepository;
    private final TrainingDayAttendanceRepository trainingDayAttendanceRepository;
    private final BatchAllocationMapper mapper;
    
    @Override
    @Transactional
    public BatchAllocationResponse createAllocation(BatchAllocationRequest request) {
        TrainingProgram program = programRepository.findByProgramId(request.getProgramId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Program not found with ID: " + request.getProgramId()));
        
        // Validate batch number is valid for this program
        if (request.getBatchNumber() == null || request.getBatchNumber() < 1 || request.getBatchNumber() > program.getNumberOfBatches()) {
            throw new IllegalArgumentException("Invalid batch number: " + request.getBatchNumber() + ". Program has only " + program.getNumberOfBatches() + " batches. Valid range: 1-" + program.getNumberOfBatches());
        }
        
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + request.getCandidateId()));
        
        BatchAllocation allocation = mapper.toEntity(request);
        allocation.setProgram(program);
        allocation.setCandidate(candidate);
        allocation.setAttendancePercentage(BigDecimal.ZERO);
        
        BatchAllocation savedAllocation = allocationRepository.save(allocation);
        return mapper.toResponse(savedAllocation);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BatchAllocationResponse getAllocationById(Long studentId) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation not found with Student ID: " + studentId));
        return mapper.toResponse(allocation);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllAllocations() {
        return allocationRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllocationsByProgram(Integer programId) {
        return allocationRepository.findByProgram_ProgramId(programId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllocationsByBatch(Integer programId, Integer batchNumber) {
        return allocationRepository.findByProgram_ProgramIdAndBatchNumber(programId, batchNumber).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllocationsByCandidate(Long candidateId) {
        return allocationRepository.findByCandidate_CandidateId(candidateId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public BatchAllocationResponse updateAllocation(Long studentId, BatchAllocationRequest request) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation not found with Student ID: " + studentId));
        
        // Only update fields that are provided (not null) - PATCH behavior
        if (request.getBatchNumber() != null) {
            // Validate batch number is valid for this program
            if (request.getBatchNumber() < 1 || request.getBatchNumber() > allocation.getProgram().getNumberOfBatches()) {
                throw new IllegalArgumentException("Invalid batch number: " + request.getBatchNumber() + ". Program has only " + allocation.getProgram().getNumberOfBatches() + " batches. Valid range: 1-" + allocation.getProgram().getNumberOfBatches());
            }

            boolean batchChanged = !request.getBatchNumber().equals(allocation.getBatchNumber());
            if (batchChanged) {
                boolean hasScoreHistory = !trainingScoreRepository.findByStudent_StudentId(studentId).isEmpty();
                boolean hasAttendanceHistory = !trainingDayAttendanceRepository.findByStudent_StudentId(studentId).isEmpty();

                if (hasScoreHistory || hasAttendanceHistory) {
                    throw new IllegalArgumentException(
                        "Batch cannot be changed after attendance or training scores are recorded. " +
                        "Create a separate transfer flow if batch movement must preserve history.");
                }
            }

            allocation.setBatchNumber(request.getBatchNumber());
        }
        if (request.getImage() != null) {
            allocation.setImage(request.getImage());
        }
        if (request.getIsActive() != null) {
            allocation.setIsActive(request.getIsActive());
        }
        if (request.getPerformance() != null) {
            try {
                Performance performance = Performance.valueOf(request.getPerformance().toUpperCase(java.util.Locale.ROOT));
                allocation.setPerformance(performance);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid performance status: " + request.getPerformance());
            }
        }
        
        BatchAllocation updatedAllocation = allocationRepository.save(allocation);
        return mapper.toResponse(updatedAllocation);
    }
    
    @Override
    @Transactional
    public void deleteAllocation(Long studentId) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation not found with Student ID: " + studentId));
        
        allocation.setIsActive(false); // Soft delete
        allocationRepository.save(allocation);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllocationsByMinAttendance(Integer programId, double minAttendancePercentage) {
        return allocationRepository.findByProgramAndMinAttendance(programId, BigDecimal.valueOf(minAttendancePercentage)).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BatchAllocationResponse markProjectReady(Long studentId) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation not found with Student ID: " + studentId));

        // Check attendance >= 75%
        if (allocation.getAttendancePercentage() == null || allocation.getAttendancePercentage().compareTo(BigDecimal.valueOf(75)) < 0) {
            throw new IllegalArgumentException("Student attendance is below 75% required for project ready");
        }

        // Check overall weighted score >= 70 (all courses are mandatory, weightage auto-normalized)
        if (allocation.getOverallWeightedScore() == null || allocation.getOverallWeightedScore().compareTo(BigDecimal.valueOf(70)) < 0) {
            BigDecimal current = allocation.getOverallWeightedScore() != null ? allocation.getOverallWeightedScore() : BigDecimal.ZERO;
            throw new IllegalArgumentException(
                "Student overall weighted score (" + current + ") is below 70 required for project ready");
        }

        allocation.setPerformance(Performance.PROJECT_READY);
        BatchAllocation updatedAllocation = allocationRepository.save(allocation);
        return mapper.toResponse(updatedAllocation);
    }
}
