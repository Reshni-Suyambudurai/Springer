package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.TrainingProgramRequest;
import com.kanini.springer.dto.Academy.TrainingProgramResponse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.entity.enums.Enums.TrainingLocation;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingProgramMapper;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.Academy.impl.TrainingProgramServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link TrainingProgramServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class TrainingProgramServiceImplTest {

    @InjectMocks
    private TrainingProgramServiceImpl service;

    @Mock
    private TrainingProgramRepository programRepository;

    @Mock
    private HiringCycleRepository cycleRepository;

    @Mock
    private TrainingProgramMapper mapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private HiringCycle buildCycle(Long id, CycleStatus status) {
        HiringCycle cycle = new HiringCycle();
        cycle.setCycleId(id);
        cycle.setCycleYear(2026);
        cycle.setCycleName("Kanini Campus Hiring 2026");
        cycle.setStatus(status);
        return cycle;
    }

    private TrainingProgram buildProgram(Integer id, String name) {
        TrainingProgram p = new TrainingProgram();
        p.setProgramId(id);
        p.setProgramName(name);
        p.setProgramYear(2026);
        p.setCapacity(60);
        p.setNumberOfBatches(2);
        p.setLocation(TrainingLocation.CHENNAI);
        p.setStatus(true);
        return p;
    }

    private TrainingProgramResponse buildResponse(Integer id, String name) {
        TrainingProgramResponse r = new TrainingProgramResponse();
        r.setProgramId(id);
        r.setProgramName(name);
        r.setProgramYear(2026);
        r.setCapacity(60);
        r.setNumberOfBatches(2);
        r.setLocation(TrainingLocation.CHENNAI);
        r.setStatus(true);
        return r;
    }

    private TrainingProgramRequest buildRequest(Long cycleId) {
        TrainingProgramRequest req = new TrainingProgramRequest();
        req.setProgramName("Fresher Training 2026");
        req.setProgramYear(2026);
        req.setCapacity(60);
        req.setNumberOfBatches(2);
        req.setLocation(TrainingLocation.CHENNAI);
        req.setCycleId(cycleId);
        return req;
    }

    // =========================================================================
    // createProgram
    // =========================================================================

    @Nested
    @DisplayName("createProgram")
    class CreateProgram {

        @Test
        @DisplayName("success - creates program for OPEN cycle")
        void createProgram_openCycle_success() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            TrainingProgram saved = buildProgram(1, "Fresher Training 2026");
            TrainingProgramResponse response = buildResponse(1, "Fresher Training 2026");
            TrainingProgramRequest request = buildRequest(1L);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(mapper.toEntity(request)).thenReturn(saved);
            when(programRepository.save(any(TrainingProgram.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            TrainingProgramResponse result = service.createProgram(request);

            assertThat(result).isNotNull();
            assertThat(result.getProgramName()).isEqualTo("Fresher Training 2026");
            verify(programRepository).save(any(TrainingProgram.class));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when cycle not found")
        void createProgram_cycleNotFound_throwsNotFound() {
            TrainingProgramRequest request = buildRequest(99L);
            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createProgram(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("99");
        }

        @Test
        @DisplayName("failure - throws IllegalArgumentException when cycle is CLOSED")
        void createProgram_closedCycle_throwsIllegalArgument() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.CLOSED);
            TrainingProgramRequest request = buildRequest(1L);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            assertThatThrownBy(() -> service.createProgram(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("OPEN");
        }
    }

    // =========================================================================
    // getProgramById
    // =========================================================================

    @Nested
    @DisplayName("getProgramById")
    class GetProgramById {

        @Test
        @DisplayName("success - returns program for valid ID")
        void getProgramById_found_returnsResponse() {
            TrainingProgram program = buildProgram(1, "Fresher Training 2026");
            TrainingProgramResponse response = buildResponse(1, "Fresher Training 2026");

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(mapper.toResponse(program)).thenReturn(response);

            TrainingProgramResponse result = service.getProgramById(1);

            assertThat(result).isNotNull();
            assertThat(result.getProgramId()).isEqualTo(1);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent ID")
        void getProgramById_notFound_throwsNotFound() {
            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getProgramById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getAllPrograms
    // =========================================================================

    @Nested
    @DisplayName("getAllPrograms")
    class GetAllPrograms {

        @Test
        @DisplayName("success - returns list of all programs")
        void getAllPrograms_returnsList() {
            TrainingProgram program = buildProgram(1, "Fresher Training 2026");
            TrainingProgramResponse response = buildResponse(1, "Fresher Training 2026");

            when(programRepository.findAll()).thenReturn(List.of(program));
            when(mapper.toResponse(program)).thenReturn(response);

            List<TrainingProgramResponse> result = service.getAllPrograms();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("success - returns empty list when no programs exist")
        void getAllPrograms_empty_returnsEmptyList() {
            when(programRepository.findAll()).thenReturn(Collections.emptyList());

            List<TrainingProgramResponse> result = service.getAllPrograms();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // getProgramsByStatus
    // =========================================================================

    @Nested
    @DisplayName("getProgramsByStatus")
    class GetProgramsByStatus {

        @Test
        @DisplayName("success - returns active programs")
        void getProgramsByStatus_active_returnsList() {
            TrainingProgram program = buildProgram(1, "Fresher Training 2026");
            TrainingProgramResponse response = buildResponse(1, "Fresher Training 2026");

            when(programRepository.findByStatus(true)).thenReturn(List.of(program));
            when(mapper.toResponse(program)).thenReturn(response);

            List<TrainingProgramResponse> result = service.getProgramsByStatus(true);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).isStatus()).isTrue();
        assertThat(result.get(0).getLocation()).isEqualTo(TrainingLocation.CHENNAI);
        }

        @Test
        @DisplayName("success - returns empty list when no inactive programs")
        void getProgramsByStatus_inactive_emptyList() {
            when(programRepository.findByStatus(false)).thenReturn(Collections.emptyList());

            List<TrainingProgramResponse> result = service.getProgramsByStatus(false);

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // updateProgram
    // =========================================================================

    @Nested
    @DisplayName("updateProgram")
    class UpdateProgram {

        @Test
        @DisplayName("success - updates program name")
        void updateProgram_updateName_success() {
            TrainingProgram program = buildProgram(1, "Old Name");
            TrainingProgram updated = buildProgram(1, "New Name");
            TrainingProgramResponse response = buildResponse(1, "New Name");

            TrainingProgramRequest request = new TrainingProgramRequest();
            request.setProgramName("New Name");

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(programRepository.save(any(TrainingProgram.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            TrainingProgramResponse result = service.updateProgram(1, request);

            assertThat(result.getProgramName()).isEqualTo("New Name");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when program not found")
        void updateProgram_notFound_throwsNotFound() {
            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateProgram(99, new TrainingProgramRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws IllegalArgumentException when updating to CLOSED cycle")
        void updateProgram_closedCycle_throwsIllegalArgument() {
            TrainingProgram program = buildProgram(1, "Fresher Training 2026");
            HiringCycle closedCycle = buildCycle(2L, CycleStatus.CLOSED);

            TrainingProgramRequest request = new TrainingProgramRequest();
            request.setCycleId(2L);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(cycleRepository.findById(2L)).thenReturn(Optional.of(closedCycle));

            assertThatThrownBy(() -> service.updateProgram(1, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("OPEN");
        }
    }

    // =========================================================================
    // deleteProgram (soft delete)
    // =========================================================================

    @Nested
    @DisplayName("deleteProgram")
    class DeleteProgram {

        @Test
        @DisplayName("success - soft deletes program by setting status to false")
        void deleteProgram_found_setsStatusFalse() {
            TrainingProgram program = buildProgram(1, "Fresher Training 2026");

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(programRepository.save(any(TrainingProgram.class))).thenReturn(program);

            service.deleteProgram(1);

            assertThat(program.isStatus()).isFalse();
            verify(programRepository).save(program);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when program not found")
        void deleteProgram_notFound_throwsNotFound() {
            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteProgram(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
