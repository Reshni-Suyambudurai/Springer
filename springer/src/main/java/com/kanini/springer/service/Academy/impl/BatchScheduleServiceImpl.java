package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.BatchScheduleRequest;
import com.kanini.springer.dto.Academy.BatchScheduleResponse;
import com.kanini.springer.entity.Academy.BatchSchedule;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.BatchScheduleMapper;
import com.kanini.springer.repository.Academy.BatchScheduleRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.service.Academy.IBatchScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BatchScheduleServiceImpl implements IBatchScheduleService {

    private final BatchScheduleRepository batchScheduleRepository;
    private final TrainingProgramRepository programRepository;
    private final BatchScheduleMapper mapper;

    @Override
    @Transactional
    public BatchScheduleResponse saveOrUpdateBatchSchedule(BatchScheduleRequest request) {

        TrainingProgram program = programRepository.findByProgramId(request.getProgramId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Training Program not found with ID: " + request.getProgramId()));

        if (request.getBatchNumber() < 1 || request.getBatchNumber() > program.getNumberOfBatches()) {
            throw new IllegalArgumentException(
                    "Invalid batch number: " + request.getBatchNumber()
                    + ". Program has " + program.getNumberOfBatches() + " batch(es).");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        // Upsert — create if not exists, update if exists
        Optional<BatchSchedule> existing = batchScheduleRepository
                .findByProgram_ProgramIdAndBatchNumber(request.getProgramId(), request.getBatchNumber());

        BatchSchedule schedule = existing.orElse(new BatchSchedule());
        schedule.setProgram(program);
        schedule.setBatchNumber(request.getBatchNumber());
        schedule.setStartDate(request.getStartDate());
        schedule.setEndDate(request.getEndDate());

        return mapper.toResponse(batchScheduleRepository.save(schedule));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchScheduleResponse> getSchedulesByProgram(Integer programId) {
        programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Training Program not found with ID: " + programId));
        return batchScheduleRepository.findByProgram_ProgramId(programId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BatchScheduleResponse getScheduleByProgramAndBatch(Integer programId, Integer batchNumber) {
        return mapper.toResponse(
                batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(programId, batchNumber)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "No schedule found for program " + programId + " batch " + batchNumber)));
    }
}
