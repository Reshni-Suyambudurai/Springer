package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.BatchScheduleRequest;
import com.kanini.springer.dto.Academy.BatchScheduleResponse;
import com.kanini.springer.entity.Academy.BatchSchedule;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.BatchScheduleMapper;
import com.kanini.springer.repository.Academy.BatchScheduleRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.service.Academy.impl.BatchScheduleServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchScheduleServiceImplTest {

    @InjectMocks private BatchScheduleServiceImpl service;
    @Mock private BatchScheduleRepository batchScheduleRepository;
    @Mock private TrainingProgramRepository programRepository;
    @Mock private BatchScheduleMapper mapper;

    private TrainingProgram buildProgram(Integer id, int batches) {
        TrainingProgram p = new TrainingProgram();
        p.setProgramId(id);
        p.setProgramName("Fresher Training 2026");
        p.setNumberOfBatches(batches);
        return p;
    }

    private BatchScheduleResponse buildResponse(Integer id) {
        BatchScheduleResponse r = new BatchScheduleResponse();
        r.setBatchScheduleId(id);
        r.setBatchNumber(1);
        return r;
    }

    private BatchScheduleRequest buildRequest(Integer programId, Integer batchNo, LocalDate start, LocalDate end) {
        BatchScheduleRequest r = new BatchScheduleRequest();
        r.setProgramId(programId);
        r.setBatchNumber(batchNo);
        r.setStartDate(start);
        r.setEndDate(end);
        return r;
    }

    @Nested @DisplayName("saveOrUpdateBatchSchedule")
    class SaveOrUpdate {

        @Test @DisplayName("success - creates new schedule")
        void saveOrUpdate_newSchedule_success() {
            TrainingProgram program = buildProgram(1, 2);
            BatchScheduleRequest req = buildRequest(1, 1, LocalDate.of(2026,1,1), LocalDate.of(2026,6,30));
            BatchSchedule saved = new BatchSchedule();
            BatchScheduleResponse response = buildResponse(1);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(Optional.empty());
            when(batchScheduleRepository.save(any())).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            BatchScheduleResponse result = service.saveOrUpdateBatchSchedule(req);

            assertThat(result).isNotNull();
            verify(batchScheduleRepository).save(any());
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when program not found")
        void saveOrUpdate_programNotFound_throwsNotFound() {
            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());
            BatchScheduleRequest req = buildRequest(99, 1, LocalDate.now(), LocalDate.now().plusDays(1));
            assertThatThrownBy(() -> service.saveOrUpdateBatchSchedule(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws IllegalArgumentException for invalid batch number")
        void saveOrUpdate_invalidBatchNumber_throwsIllegalArgument() {
            TrainingProgram program = buildProgram(1, 2);
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            BatchScheduleRequest req = buildRequest(1, 5, LocalDate.now(), LocalDate.now().plusDays(1));
            assertThatThrownBy(() -> service.saveOrUpdateBatchSchedule(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid batch number");
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when end date before start date")
        void saveOrUpdate_endBeforeStart_throwsIllegalArgument() {
            TrainingProgram program = buildProgram(1, 2);
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            BatchScheduleRequest req = buildRequest(1, 1, LocalDate.of(2026,6,30), LocalDate.of(2026,1,1));
            assertThatThrownBy(() -> service.saveOrUpdateBatchSchedule(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("End date cannot be before start date");
        }
    }

    @Nested @DisplayName("getSchedulesByProgram")
    class GetByProgram {

        @Test @DisplayName("success - returns schedules for valid program")
        void getByProgram_found_returnsList() {
            TrainingProgram program = buildProgram(1, 2);
            BatchSchedule schedule = new BatchSchedule();
            BatchScheduleResponse response = buildResponse(1);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(batchScheduleRepository.findByProgram_ProgramId(1)).thenReturn(List.of(schedule));
            when(mapper.toResponse(schedule)).thenReturn(response);

            List<BatchScheduleResponse> result = service.getSchedulesByProgram(1);
            assertThat(result).hasSize(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when program not found")
        void getByProgram_notFound_throwsNotFound() {
            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getSchedulesByProgram(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getScheduleByProgramAndBatch")
    class GetByProgramAndBatch {

        @Test @DisplayName("success - returns schedule for valid program and batch")
        void getByProgramAndBatch_found_returnsResponse() {
            BatchSchedule schedule = new BatchSchedule();
            BatchScheduleResponse response = buildResponse(1);

            when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 1)).thenReturn(Optional.of(schedule));
            when(mapper.toResponse(schedule)).thenReturn(response);

            BatchScheduleResponse result = service.getScheduleByProgramAndBatch(1, 1);
            assertThat(result).isNotNull();
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void getByProgramAndBatch_notFound_throwsNotFound() {
            when(batchScheduleRepository.findByProgram_ProgramIdAndBatchNumber(1, 99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getScheduleByProgramAndBatch(1, 99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
