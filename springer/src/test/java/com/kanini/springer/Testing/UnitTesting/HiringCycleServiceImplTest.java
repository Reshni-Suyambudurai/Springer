package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Hiring.HiringCycleRequest;
import com.kanini.springer.dto.Hiring.HiringCycleResponse;
import com.kanini.springer.dto.Hiring.HiringCycleSummaryResponse;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.HiringCycleMapper;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.Hiring.impl.HiringCycleServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link HiringCycleServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class HiringCycleServiceImplTest {

    @InjectMocks
    private HiringCycleServiceImpl service;

    @Mock
    private HiringCycleRepository cycleRepository;

    @Mock
    private HiringCycleMapper mapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private HiringCycle buildCycle(Long id, Integer year, CycleStatus status) {
        HiringCycle cycle = new HiringCycle();
        cycle.setCycleId(id);
        cycle.setCycleYear(year);
        cycle.setCycleName("Cycle " + year);
        cycle.setStatus(status);
        return cycle;
    }

    private HiringCycleResponse buildResponse(Long id, Integer year, String status) {
        HiringCycleResponse r = new HiringCycleResponse();
        r.setCycleId(id);
        r.setCycleYear(year);
        r.setCycleName("Cycle " + year);
        r.setStatus(status);
        return r;
    }

    // =========================================================================
    // createCycle
    // =========================================================================

    @Nested
    @DisplayName("createCycle")
    class CreateCycle {

        @Test
        @DisplayName("success - creates cycle with valid year")
        void createCycle_valid_success() {
            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleYear(2030);
            request.setCycleName("Cycle 2030");

            HiringCycle saved = buildCycle(1L, 2030, CycleStatus.OPEN);
            HiringCycleResponse response = buildResponse(1L, 2030, "OPEN");

            when(cycleRepository.findByCycleYear(2030)).thenReturn(Optional.empty());
            when(cycleRepository.save(any(HiringCycle.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            HiringCycleResponse result = service.createCycle(request);

            assertThat(result).isNotNull();
            assertThat(result.getCycleYear()).isEqualTo(2030);
            assertThat(result.getStatus()).isEqualTo("OPEN");
            verify(cycleRepository).save(any(HiringCycle.class));
        }

        @Test
        @DisplayName("success - creates cycle with JD file")
        void createCycle_withJd_success() {
            MockMultipartFile jd = new MockMultipartFile("jd", "test.pdf", "application/pdf", "content".getBytes());
            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleYear(2030);
            request.setCycleName("Cycle 2030");
            request.setJd(jd);

            HiringCycle saved = buildCycle(1L, 2030, CycleStatus.OPEN);
            saved.setJd("content".getBytes());
            HiringCycleResponse response = buildResponse(1L, 2030, "OPEN");
            response.setHasJd(true);

            when(cycleRepository.findByCycleYear(2030)).thenReturn(Optional.empty());
            when(cycleRepository.save(any(HiringCycle.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            HiringCycleResponse result = service.createCycle(request);

            assertThat(result.isHasJd()).isTrue();
        }

        @Test
        @DisplayName("failure - throws ValidationException for duplicate year")
        void createCycle_duplicateYear_throwsValidation() {
            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleYear(2026);
            request.setCycleName("Dup");

            when(cycleRepository.findByCycleYear(2026)).thenReturn(Optional.of(buildCycle(1L, 2026, CycleStatus.OPEN)));

            assertThatThrownBy(() -> service.createCycle(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("failure - throws ValidationException for past year")
        void createCycle_pastYear_throwsValidation() {
            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleYear(2020);
            request.setCycleName("Past");

            when(cycleRepository.findByCycleYear(2020)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createCycle(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("past");
        }
    }

    // =========================================================================
    // getCycleById
    // =========================================================================

    @Nested
    @DisplayName("getCycleById")
    class GetCycleById {

        @Test
        @DisplayName("success - returns cycle for valid ID")
        void getCycleById_found_returnsResponse() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycleResponse response = buildResponse(1L, 2026, "OPEN");

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(mapper.toResponse(cycle)).thenReturn(response);

            HiringCycleResponse result = service.getCycleById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getCycleId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent ID")
        void getCycleById_notFound_throwsNotFound() {
            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getCycleById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getAllCycles
    // =========================================================================

    @Nested
    @DisplayName("getAllCycles")
    class GetAllCycles {

        @Test
        @DisplayName("success - returns list of all cycles")
        void getAllCycles_returnsList() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycleResponse response = buildResponse(1L, 2026, "OPEN");

            when(cycleRepository.findAll()).thenReturn(List.of(cycle));
            when(mapper.toResponse(cycle)).thenReturn(response);

            List<HiringCycleResponse> result = service.getAllCycles();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("success - returns empty list when no cycles")
        void getAllCycles_empty_returnsEmptyList() {
            when(cycleRepository.findAll()).thenReturn(Collections.emptyList());

            List<HiringCycleResponse> result = service.getAllCycles();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // getAllCycleSummaries
    // =========================================================================

    @Nested
    @DisplayName("getAllCycleSummaries")
    class GetAllCycleSummaries {

        @Test
        @DisplayName("success - returns summary list")
        void getAllCycleSummaries_returnsList() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);

            when(cycleRepository.findAll()).thenReturn(List.of(cycle));

            List<HiringCycleSummaryResponse> result = service.getAllCycleSummaries();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCycleId()).isEqualTo(1L);
            assertThat(result.get(0).getStatus()).isEqualTo("OPEN");
        }
    }

    // =========================================================================
    // getCyclesByStatus
    // =========================================================================

    @Nested
    @DisplayName("getCyclesByStatus")
    class GetCyclesByStatus {

        @Test
        @DisplayName("success - returns cycles for OPEN status")
        void getCyclesByStatus_open_returnsList() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycleResponse response = buildResponse(1L, 2026, "OPEN");

            when(cycleRepository.findByStatus(CycleStatus.OPEN)).thenReturn(List.of(cycle));
            when(mapper.toResponse(cycle)).thenReturn(response);

            List<HiringCycleResponse> result = service.getCyclesByStatus("OPEN");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid status")
        void getCyclesByStatus_invalid_throwsValidation() {
            assertThatThrownBy(() -> service.getCyclesByStatus("INVALID"))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid cycle status");
        }
    }

    // =========================================================================
    // updateCycle
    // =========================================================================

    @Nested
    @DisplayName("updateCycle")
    class UpdateCycle {

        @Test
        @DisplayName("success - updates cycle name")
        void updateCycle_updateName_success() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycle updated = buildCycle(1L, 2026, CycleStatus.OPEN);
            updated.setCycleName("Updated Name");
            HiringCycleResponse response = buildResponse(1L, 2026, "OPEN");
            response.setCycleName("Updated Name");

            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleName("Updated Name");

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(cycleRepository.save(any(HiringCycle.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            HiringCycleResponse result = service.updateCycle(1L, request);

            assertThat(result.getCycleName()).isEqualTo("Updated Name");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when cycle does not exist")
        void updateCycle_notFound_throwsNotFound() {
            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateCycle(99L, new HiringCycleRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when changing to duplicate year")
        void updateCycle_duplicateYear_throwsValidation() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleYear(2027);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(cycleRepository.findByCycleYear(2027)).thenReturn(Optional.of(buildCycle(2L, 2027, CycleStatus.OPEN)));

            assertThatThrownBy(() -> service.updateCycle(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("success - changing to same year does not throw duplicate error")
        void updateCycle_sameYear_noFalsePositive() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycleResponse response = buildResponse(1L, 2026, "OPEN");

            HiringCycleRequest request = new HiringCycleRequest();
            request.setCycleYear(2026);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(cycleRepository.save(any(HiringCycle.class))).thenReturn(cycle);
            when(mapper.toResponse(cycle)).thenReturn(response);

            HiringCycleResponse result = service.updateCycle(1L, request);

            assertThat(result).isNotNull();
        }
    }

    // =========================================================================
    // deleteCycle
    // =========================================================================

    @Nested
    @DisplayName("deleteCycle")
    class DeleteCycle {

        @Test
        @DisplayName("success - deletes cycle with no demands")
        void deleteCycle_noDemands_success() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            cycle.setHiringDemands(Collections.emptyList());

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            service.deleteCycle(1L);

            verify(cycleRepository).delete(cycle);
        }

        @Test
        @DisplayName("success - deletes cycle when demands list is null")
        void deleteCycle_nullDemands_success() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            cycle.setHiringDemands(null);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            service.deleteCycle(1L);

            verify(cycleRepository).delete(cycle);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when cycle does not exist")
        void deleteCycle_notFound_throwsNotFound() {
            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteCycle(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when cycle has demands")
        void deleteCycle_hasDemands_throwsValidation() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            cycle.setHiringDemands(List.of(new com.kanini.springer.entity.HiringReq.HiringDemand()));

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            assertThatThrownBy(() -> service.deleteCycle(1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("existing hiring demands");

            verify(cycleRepository, never()).delete(any());
        }
    }

    // =========================================================================
    // toggleCycleStatus
    // =========================================================================

    @Nested
    @DisplayName("toggleCycleStatus")
    class ToggleCycleStatus {

        @Test
        @DisplayName("success - toggles OPEN to CLOSED")
        void toggleStatus_openToClosed_success() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycle toggled = buildCycle(1L, 2026, CycleStatus.CLOSED);
            HiringCycleResponse response = buildResponse(1L, 2026, "CLOSED");

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(cycleRepository.save(any(HiringCycle.class))).thenReturn(toggled);
            when(mapper.toResponse(toggled)).thenReturn(response);

            HiringCycleResponse result = service.toggleCycleStatus(1L);

            assertThat(result.getStatus()).isEqualTo("CLOSED");
        }

        @Test
        @DisplayName("success - toggles CLOSED to OPEN")
        void toggleStatus_closedToOpen_success() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.CLOSED);
            HiringCycle toggled = buildCycle(1L, 2026, CycleStatus.OPEN);
            HiringCycleResponse response = buildResponse(1L, 2026, "OPEN");

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(cycleRepository.save(any(HiringCycle.class))).thenReturn(toggled);
            when(mapper.toResponse(toggled)).thenReturn(response);

            HiringCycleResponse result = service.toggleCycleStatus(1L);

            assertThat(result.getStatus()).isEqualTo("OPEN");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent cycle")
        void toggleStatus_notFound_throwsNotFound() {
            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.toggleCycleStatus(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getJdByCycleId
    // =========================================================================

    @Nested
    @DisplayName("getJdByCycleId")
    class GetJdByCycleId {

        @Test
        @DisplayName("success - returns JD bytes")
        void getJd_exists_returnsBytes() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            cycle.setJd("PDF content".getBytes());

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            byte[] result = service.getJdByCycleId(1L);

            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when no JD uploaded")
        void getJd_noFile_throwsNotFound() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            cycle.setJd(null);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            assertThatThrownBy(() -> service.getJdByCycleId(1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when JD is empty array")
        void getJd_emptyArray_throwsNotFound() {
            HiringCycle cycle = buildCycle(1L, 2026, CycleStatus.OPEN);
            cycle.setJd(new byte[0]);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            assertThatThrownBy(() -> service.getJdByCycleId(1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent cycle")
        void getJd_cycleNotFound_throwsNotFound() {
            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getJdByCycleId(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
