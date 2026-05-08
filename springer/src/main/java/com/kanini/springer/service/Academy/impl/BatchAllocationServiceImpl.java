package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.dto.Academy.BatchTransferRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BatchAllocationServiceImpl implements IBatchAllocationService {

    private static final String ALLOCATION_NOT_FOUND = "Batch Allocation not found with Student ID: ";

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
                .orElseThrow(() -> new ResourceNotFoundException(ALLOCATION_NOT_FOUND + studentId));
        return mapper.toResponse(allocation);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllAllocations() {
        return allocationRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllocationsByProgram(Integer programId) {
        return allocationRepository.findByProgram_ProgramId(programId).stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchAllocationResponse> getAllocationsByBatch(Integer programId, Integer batchNumber) {
        return allocationRepository.findByProgram_ProgramIdAndBatchNumber(programId, batchNumber).stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional
    public BatchAllocationResponse updateAllocation(Long studentId, BatchAllocationRequest request) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(ALLOCATION_NOT_FOUND + studentId));
        
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
                .orElseThrow(() -> new ResourceNotFoundException(ALLOCATION_NOT_FOUND + studentId));
        
        allocation.setIsActive(false); // Soft delete
        allocationRepository.save(allocation);
    }
    
    @Override
    @Transactional
    public BatchAllocationResponse markProjectReady(Long studentId) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(ALLOCATION_NOT_FOUND + studentId));

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

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<BatchAllocationResponse> getAllocationsByProgramFiltered(
            Integer programId, Integer batchNumber, Boolean isActive,
            String search, int page, int size) {
        org.springframework.data.domain.Pageable pageable =
            org.springframework.data.domain.PageRequest.of(page, size);
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return allocationRepository
            .findByProgramFiltered(programId, batchNumber, isActive, searchParam, pageable)
            .map(mapper::toResponse);
    }

    @Override
    @Transactional
    public BatchAllocationResponse transferStudent(Long studentId, BatchTransferRequest request) {
        // 1. Load the current (source) allocation
        BatchAllocation source = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(ALLOCATION_NOT_FOUND + studentId));

        if (!Boolean.TRUE.equals(source.getIsActive())) {
            throw new IllegalArgumentException("Cannot transfer an already inactive allocation.");
        }

        // 2. Validate target program and batch
        TrainingProgram targetProgram = programRepository.findByProgramId(request.getTargetProgramId())
                .orElseThrow(() -> new ResourceNotFoundException("Target program not found: " + request.getTargetProgramId()));

        if (request.getTargetBatchNumber() < 1 || request.getTargetBatchNumber() > targetProgram.getNumberOfBatches()) {
            throw new IllegalArgumentException("Invalid target batch number: " + request.getTargetBatchNumber());
        }

        // Prevent transferring to the same batch
        if (source.getProgram().getProgramId().equals(request.getTargetProgramId())
                && source.getBatchNumber().equals(request.getTargetBatchNumber())) {
            throw new IllegalArgumentException("Candidate is already in this batch.");
        }

        // Prevent duplicate active allocation in target batch for same candidate
        boolean alreadyInTarget = allocationRepository
                .findByProgram_ProgramIdAndBatchNumber(request.getTargetProgramId(), request.getTargetBatchNumber())
                .stream()
                .anyMatch(a -> a.getCandidate().getCandidateId().equals(source.getCandidate().getCandidateId())
                        && Boolean.TRUE.equals(a.getIsActive()));
        if (alreadyInTarget) {
            throw new IllegalArgumentException("Candidate already has an active allocation in the target batch.");
        }

        // 3. Deactivate source allocation
        source.setIsActive(false);
        allocationRepository.save(source);

        // 4. Create new allocation in target batch
        BatchAllocation newAllocation = new BatchAllocation();
        newAllocation.setProgram(targetProgram);
        newAllocation.setCandidate(source.getCandidate());
        newAllocation.setBatchNumber(request.getTargetBatchNumber());
        newAllocation.setIsActive(true);
        newAllocation.setAttendancePercentage(BigDecimal.ZERO); // Fresh attendance start
        newAllocation.setOverallWeightedScore(source.getOverallWeightedScore()); // Carry forward until recalculated
        newAllocation.setTransferredFromStudentId(source.getStudentId());
        // Carry forward performance rating if set
        newAllocation.setPerformance(source.getPerformance());

        BatchAllocation saved = allocationRepository.save(newAllocation);
        return mapper.toResponse(saved);
    }
}
