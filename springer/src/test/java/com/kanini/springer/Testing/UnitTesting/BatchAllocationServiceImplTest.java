package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.dto.Academy.BatchTransferRequest;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.BatchAllocationMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.TrainingDayAttendanceRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.service.Academy.impl.BatchAllocationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchAllocationServiceImplTest {

    @InjectMocks private BatchAllocationServiceImpl service;
    @Mock private BatchAllocationRepository allocationRepository;
    @Mock private TrainingProgramRepository programRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private TrainingScoreRepository trainingScoreRepository;
    @Mock private TrainingDayAttendanceRepository trainingDayAttendanceRepository;
    @Mock private BatchAllocationMapper mapper;

    private TrainingProgram buildProgram(Integer id, int batches) {
        TrainingProgram p = new TrainingProgram();
        p.setProgramId(id);
        p.setProgramName("Fresher Training 2026");
        p.setNumberOfBatches(batches);
        return p;
    }

    private BatchAllocation buildAllocation(Long studentId) {
        Candidate candidate = new Candidate();
        candidate.setCandidateId(10L);
        BatchAllocation a = new BatchAllocation();
        a.setStudentId(studentId);
        a.setBatchNumber(1);
        a.setIsActive(true);
        a.setAttendancePercentage(BigDecimal.ZERO);
        a.setProgram(buildProgram(1, 2));
        a.setCandidate(candidate);
        return a;
    }

    private BatchAllocationResponse buildResponse(Long studentId) {
        BatchAllocationResponse r = new BatchAllocationResponse();
        r.setStudentId(studentId);
        return r;
    }

    @Nested @DisplayName("createAllocation")
    class CreateAllocation {

        @Test @DisplayName("success - creates allocation for valid program and candidate")
        void create_valid_success() {
            TrainingProgram program = buildProgram(1, 2);
            Candidate candidate = new Candidate();
            candidate.setCandidateId(10L);
            BatchAllocation saved = buildAllocation(101L);
            BatchAllocationResponse response = buildResponse(101L);

            BatchAllocationRequest req = new BatchAllocationRequest();
            req.setProgramId(1);
            req.setBatchNumber(1);
            req.setCandidateId(10L);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(candidateRepository.findById(10L)).thenReturn(Optional.of(candidate));
            when(mapper.toEntity(req)).thenReturn(saved);
            when(allocationRepository.save(any())).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            BatchAllocationResponse result = service.createAllocation(req);
            assertThat(result).isNotNull();
            assertThat(result.getStudentId()).isEqualTo(101L);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when program not found")
        void create_programNotFound_throwsNotFound() {
            BatchAllocationRequest req = new BatchAllocationRequest();
            req.setProgramId(99);
            req.setBatchNumber(1);
            req.setCandidateId(10L);

            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createAllocation(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws IllegalArgumentException for invalid batch number")
        void create_invalidBatchNumber_throwsIllegalArgument() {
            TrainingProgram program = buildProgram(1, 2);
            BatchAllocationRequest req = new BatchAllocationRequest();
            req.setProgramId(1);
            req.setBatchNumber(5); // program only has 2 batches
            req.setCandidateId(10L);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            assertThatThrownBy(() -> service.createAllocation(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid batch number");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when candidate not found")
        void create_candidateNotFound_throwsNotFound() {
            TrainingProgram program = buildProgram(1, 2);
            BatchAllocationRequest req = new BatchAllocationRequest();
            req.setProgramId(1);
            req.setBatchNumber(1);
            req.setCandidateId(999L);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(candidateRepository.findById(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createAllocation(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getAllocationById")
    class GetById {

        @Test @DisplayName("success - returns allocation for valid studentId")
        void getById_found_returnsResponse() {
            BatchAllocation alloc = buildAllocation(101L);
            BatchAllocationResponse response = buildResponse(101L);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(mapper.toResponse(alloc)).thenReturn(response);

            BatchAllocationResponse result = service.getAllocationById(101L);
            assertThat(result.getStudentId()).isEqualTo(101L);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void getById_notFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getAllocationById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getAllAllocations")
    class GetAll {

        @Test @DisplayName("success - returns all allocations")
        void getAll_returnsList() {
            BatchAllocation alloc = buildAllocation(101L);
            BatchAllocationResponse response = buildResponse(101L);

            when(allocationRepository.findAll()).thenReturn(List.of(alloc));
            when(mapper.toResponse(alloc)).thenReturn(response);

            List<BatchAllocationResponse> result = service.getAllAllocations();
            assertThat(result).hasSize(1);
        }

        @Test @DisplayName("success - returns empty list when no allocations")
        void getAll_empty_returnsEmptyList() {
            when(allocationRepository.findAll()).thenReturn(Collections.emptyList());
            assertThat(service.getAllAllocations()).isEmpty();
        }
    }

    @Nested @DisplayName("deleteAllocation")
    class DeleteAllocation {

        @Test @DisplayName("success - soft deletes allocation")
        void delete_found_setsInactive() {
            BatchAllocation alloc = buildAllocation(101L);
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(allocationRepository.save(any())).thenReturn(alloc);

            service.deleteAllocation(101L);

            assertThat(alloc.getIsActive()).isFalse();
            verify(allocationRepository).save(alloc);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void delete_notFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.deleteAllocation(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("markProjectReady")
    class MarkProjectReady {

        @Test @DisplayName("failure - throws IllegalArgumentException when attendance below 75%")
        void markProjectReady_lowAttendance_throwsIllegalArgument() {
            BatchAllocation alloc = buildAllocation(101L);
            alloc.setAttendancePercentage(new BigDecimal("60.00"));
            alloc.setOverallWeightedScore(new BigDecimal("80.00"));

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            assertThatThrownBy(() -> service.markProjectReady(101L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("75%");
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when score below 70")
        void markProjectReady_lowScore_throwsIllegalArgument() {
            BatchAllocation alloc = buildAllocation(101L);
            alloc.setAttendancePercentage(new BigDecimal("80.00"));
            alloc.setOverallWeightedScore(new BigDecimal("60.00"));

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            assertThatThrownBy(() -> service.markProjectReady(101L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("70");
        }
    }

    @Nested @DisplayName("transferStudent")
    class TransferStudent {

        @Test @DisplayName("success - transfers student to a different batch")
        void transfer_valid_success() {
            BatchAllocation source = buildAllocation(101L);
            source.setBatchNumber(1);
            TrainingProgram targetProgram = buildProgram(1, 2);
            BatchAllocation newAlloc = buildAllocation(102L);
            newAlloc.setBatchNumber(2);
            BatchAllocationResponse response = buildResponse(102L);

            BatchTransferRequest req = new BatchTransferRequest();
            req.setTargetProgramId(1);
            req.setTargetBatchNumber(2);
            req.setTransferReason("Low performance in Batch 1");

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(source));
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(targetProgram));
            when(allocationRepository.findByProgram_ProgramIdAndBatchNumber(1, 2))
                    .thenReturn(Collections.emptyList());
            when(allocationRepository.save(any())).thenReturn(newAlloc);
            when(mapper.toResponse(any())).thenReturn(response);

            BatchAllocationResponse result = service.transferStudent(101L, req);
            assertThat(result).isNotNull();
            assertThat(result.getStudentId()).isEqualTo(102L);
            // Old allocation should be deactivated
            assertThat(source.getIsActive()).isFalse();
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when transferring to same batch")
        void transfer_sameBatch_throwsIllegalArgument() {
            BatchAllocation source = buildAllocation(101L);
            source.setBatchNumber(1);
            TrainingProgram targetProgram = buildProgram(1, 2);

            BatchTransferRequest req = new BatchTransferRequest();
            req.setTargetProgramId(1);
            req.setTargetBatchNumber(1); // same batch
            req.setTransferReason("Test");

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(source));
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(targetProgram));

            assertThatThrownBy(() -> service.transferStudent(101L, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("already in this batch");
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when source allocation is inactive")
        void transfer_inactiveSource_throwsIllegalArgument() {
            BatchAllocation source = buildAllocation(101L);
            source.setIsActive(false);

            BatchTransferRequest req = new BatchTransferRequest();
            req.setTargetProgramId(1);
            req.setTargetBatchNumber(2);
            req.setTransferReason("Test");

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(source));

            assertThatThrownBy(() -> service.transferStudent(101L, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("inactive");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void transfer_studentNotFound_throwsNotFound() {
            BatchTransferRequest req = new BatchTransferRequest();
            req.setTargetProgramId(1);
            req.setTargetBatchNumber(2);
            req.setTransferReason("Test");

            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.transferStudent(999L, req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when invalid target batch number")
        void transfer_invalidBatchNumber_throwsIllegalArgument() {
            BatchAllocation source = buildAllocation(101L);
            source.setBatchNumber(1);
            TrainingProgram targetProgram = buildProgram(1, 2);

            BatchTransferRequest req = new BatchTransferRequest();
            req.setTargetProgramId(1);
            req.setTargetBatchNumber(5); // program only has 2 batches
            req.setTransferReason("Test");

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(source));
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(targetProgram));

            assertThatThrownBy(() -> service.transferStudent(101L, req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid target batch");
        }
    }
}
