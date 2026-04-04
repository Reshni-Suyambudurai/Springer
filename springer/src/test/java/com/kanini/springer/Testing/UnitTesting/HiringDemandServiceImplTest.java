package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Hiring.HiringDemandRequest;
import com.kanini.springer.dto.Hiring.HiringDemandResponse;
import com.kanini.springer.entity.Drive.RequisitionSkill;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.HiringDemand;
import com.kanini.springer.entity.HiringReq.Skill;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApprovalStatus;
import com.kanini.springer.entity.enums.Enums.BusinessUnit;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.HiringDemandMapper;
import com.kanini.springer.repository.Drive.RequisitionSkillRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.HiringDemandRepository;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Hiring.impl.HiringDemandServiceImpl;
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
 * Unit tests for {@link HiringDemandServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class HiringDemandServiceImplTest {

    @InjectMocks
    private HiringDemandServiceImpl service;

    @Mock
    private HiringDemandRepository demandRepository;

    @Mock
    private HiringCycleRepository cycleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private RequisitionSkillRepository requisitionSkillRepository;

    @Mock
    private HiringDemandMapper mapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private HiringCycle buildCycle(Long id, CycleStatus status) {
        HiringCycle cycle = new HiringCycle();
        cycle.setCycleId(id);
        cycle.setCycleYear(2026);
        cycle.setCycleName("Cycle 2026");
        cycle.setStatus(status);
        return cycle;
    }

    private User buildUser(Long id) {
        User user = new User();
        user.setUserId(id);
        user.setUsername("testuser");
        return user;
    }

    private Skill buildSkill(Long id, String name) {
        Skill skill = new Skill();
        skill.setSkillId(id);
        skill.setSkillName(name);
        return skill;
    }

    private HiringDemand buildDemand(Long id, HiringCycle cycle, User user) {
        HiringDemand demand = new HiringDemand();
        demand.setDemandId(id);
        demand.setCycle(cycle);
        demand.setBusinessUnit(BusinessUnit.DATA_ANALYTICS_AND_AI);
        demand.setDemandCount(5);
        demand.setCompensationBand("Band A");
        demand.setApprovalStatus(ApprovalStatus.DRAFT);
        demand.setCreatedBy(user);
        return demand;
    }

    private HiringDemandResponse buildResponse(Long id) {
        HiringDemandResponse r = new HiringDemandResponse();
        r.setDemandId(id);
        r.setCycleId(1L);
        r.setCycleName("Cycle 2026");
        r.setBusinessUnit("DATA_ANALYTICS_AND_AI");
        r.setDemandCount(5);
        r.setApprovalStatus("DRAFT");
        return r;
    }

    // =========================================================================
    // createDemand
    // =========================================================================

    @Nested
    @DisplayName("createDemand")
    class CreateDemand {

        @Test
        @DisplayName("success - creates demand with valid inputs")
        void createDemand_valid_success() {
            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(1L);
            request.setBusinessUnit("DATA_ANALYTICS_AND_AI");
            request.setDemandCount(5);
            request.setCompensationBand("Band A");
            request.setApprovalStatus(ApprovalStatus.DRAFT);
            request.setSkillIds(List.of(1L));

            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            Skill skill = buildSkill(1L, "Java");
            HiringDemand saved = buildDemand(1L, cycle, user);
            HiringDemandResponse response = buildResponse(1L);

            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
            when(demandRepository.save(any(HiringDemand.class))).thenReturn(saved);
            when(requisitionSkillRepository.saveAll(anyList())).thenReturn(List.of());
            when(demandRepository.findById(1L)).thenReturn(Optional.of(saved));
            when(mapper.toResponse(saved)).thenReturn(response);

            HiringDemandResponse result = service.createDemand(request, 1L);

            assertThat(result).isNotNull();
            assertThat(result.getDemandId()).isEqualTo(1L);
            verify(demandRepository).save(any(HiringDemand.class));
            verify(requisitionSkillRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when cycle does not exist")
        void createDemand_cycleNotFound_throwsNotFound() {
            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(99L);
            request.setSkillIds(List.of(1L));

            when(cycleRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createDemand(request, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when cycle is CLOSED")
        void createDemand_closedCycle_throwsValidation() {
            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(1L);
            request.setSkillIds(List.of(1L));

            HiringCycle cycle = buildCycle(1L, CycleStatus.CLOSED);
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));

            assertThatThrownBy(() -> service.createDemand(request, 1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("closed hiring cycle");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when user does not exist")
        void createDemand_userNotFound_throwsNotFound() {
            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(1L);
            request.setDemandCount(5);
            request.setSkillIds(List.of(1L));

            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createDemand(request, 99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when demandCount is zero")
        void createDemand_zeroDemandCount_throwsValidation() {
            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(1L);
            request.setDemandCount(0);
            request.setSkillIds(List.of(1L));

            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> service.createDemand(request, 1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("greater than zero");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when skill does not exist")
        void createDemand_skillNotFound_throwsNotFound() {
            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(1L);
            request.setDemandCount(5);
            request.setBusinessUnit("DATA_ANALYTICS_AND_AI");
            request.setSkillIds(List.of(99L));

            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(skillRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createDemand(request, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getDemandById
    // =========================================================================

    @Nested
    @DisplayName("getDemandById")
    class GetDemandById {

        @Test
        @DisplayName("success - returns demand for valid ID")
        void getDemandById_found_returnsResponse() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            HiringDemandResponse response = buildResponse(1L);

            when(demandRepository.findById(1L)).thenReturn(Optional.of(demand));
            when(mapper.toResponse(demand)).thenReturn(response);

            HiringDemandResponse result = service.getDemandById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getDemandId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when ID does not exist")
        void getDemandById_notFound_throwsNotFound() {
            when(demandRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getDemandById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getAllDemands
    // =========================================================================

    @Nested
    @DisplayName("getAllDemands")
    class GetAllDemands {

        @Test
        @DisplayName("success - returns list of all demands")
        void getAllDemands_returnsList() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            HiringDemandResponse response = buildResponse(1L);

            when(demandRepository.findAll()).thenReturn(List.of(demand));
            when(mapper.toResponse(demand)).thenReturn(response);

            List<HiringDemandResponse> result = service.getAllDemands();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("success - returns empty list when no demands")
        void getAllDemands_empty_returnsEmptyList() {
            when(demandRepository.findAll()).thenReturn(Collections.emptyList());

            List<HiringDemandResponse> result = service.getAllDemands();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // getDemandsByCycle
    // =========================================================================

    @Nested
    @DisplayName("getDemandsByCycle")
    class GetDemandsByCycle {

        @Test
        @DisplayName("success - returns demands for valid cycle")
        void getDemandsByCycle_found_returnsList() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            HiringDemandResponse response = buildResponse(1L);

            when(cycleRepository.existsById(1L)).thenReturn(true);
            when(demandRepository.findByCycleCycleId(1L)).thenReturn(List.of(demand));
            when(mapper.toResponse(demand)).thenReturn(response);

            List<HiringDemandResponse> result = service.getDemandsByCycle(1L);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when cycle does not exist")
        void getDemandsByCycle_cycleNotFound_throwsNotFound() {
            when(cycleRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> service.getDemandsByCycle(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getDemandsByStatus
    // =========================================================================

    @Nested
    @DisplayName("getDemandsByStatus")
    class GetDemandsByStatus {

        @Test
        @DisplayName("success - returns demands for valid status")
        void getDemandsByStatus_valid_returnsList() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            HiringDemandResponse response = buildResponse(1L);

            when(demandRepository.findByApprovalStatus(ApprovalStatus.DRAFT)).thenReturn(List.of(demand));
            when(mapper.toResponse(demand)).thenReturn(response);

            List<HiringDemandResponse> result = service.getDemandsByStatus("DRAFT");

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid status")
        void getDemandsByStatus_invalid_throwsValidation() {
            assertThatThrownBy(() -> service.getDemandsByStatus("INVALID_STATUS"))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid approval status");
        }
    }

    // =========================================================================
    // updateDemand
    // =========================================================================

    @Nested
    @DisplayName("updateDemand")
    class UpdateDemand {

        @Test
        @DisplayName("success - updates demand count")
        void updateDemand_updateCount_success() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            HiringDemand updated = buildDemand(1L, cycle, user);
            updated.setDemandCount(10);
            HiringDemandResponse response = buildResponse(1L);
            response.setDemandCount(10);

            HiringDemandRequest request = new HiringDemandRequest();
            request.setDemandCount(10);

            when(demandRepository.findById(1L)).thenReturn(Optional.of(demand));
            when(demandRepository.save(any(HiringDemand.class))).thenReturn(updated);
            when(demandRepository.findById(1L)).thenReturn(Optional.of(updated));
            when(mapper.toResponse(updated)).thenReturn(response);

            HiringDemandResponse result = service.updateDemand(1L, request);

            assertThat(result.getDemandCount()).isEqualTo(10);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when demand does not exist")
        void updateDemand_notFound_throwsNotFound() {
            when(demandRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateDemand(99L, new HiringDemandRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when demandCount is zero")
        void updateDemand_zeroDemandCount_throwsValidation() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);

            HiringDemandRequest request = new HiringDemandRequest();
            request.setDemandCount(0);

            when(demandRepository.findById(1L)).thenReturn(Optional.of(demand));

            assertThatThrownBy(() -> service.updateDemand(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("greater than zero");
        }

        @Test
        @DisplayName("failure - throws ValidationException when moving demand to closed cycle")
        void updateDemand_moveToClosedCycle_throwsValidation() {
            HiringCycle openCycle = buildCycle(1L, CycleStatus.OPEN);
            HiringCycle closedCycle = buildCycle(2L, CycleStatus.CLOSED);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, openCycle, user);

            HiringDemandRequest request = new HiringDemandRequest();
            request.setCycleId(2L);

            when(demandRepository.findById(1L)).thenReturn(Optional.of(demand));
            when(cycleRepository.findById(2L)).thenReturn(Optional.of(closedCycle));

            assertThatThrownBy(() -> service.updateDemand(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("closed hiring cycle");
        }
    }

    // =========================================================================
    // deleteDemand
    // =========================================================================

    @Nested
    @DisplayName("deleteDemand")
    class DeleteDemand {

        @Test
        @DisplayName("success - deletes DRAFT demand")
        void deleteDemand_draft_success() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            demand.setApprovalStatus(ApprovalStatus.DRAFT);

            when(demandRepository.findById(1L)).thenReturn(Optional.of(demand));

            service.deleteDemand(1L);

            verify(requisitionSkillRepository).deleteByDemandDemandId(1L);
            verify(demandRepository).delete(demand);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when demand does not exist")
        void deleteDemand_notFound_throwsNotFound() {
            when(demandRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteDemand(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when demand is APPROVED")
        void deleteDemand_approved_throwsValidation() {
            HiringCycle cycle = buildCycle(1L, CycleStatus.OPEN);
            User user = buildUser(1L);
            HiringDemand demand = buildDemand(1L, cycle, user);
            demand.setApprovalStatus(ApprovalStatus.APPROVED);

            when(demandRepository.findById(1L)).thenReturn(Optional.of(demand));

            assertThatThrownBy(() -> service.deleteDemand(1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot delete approved");

            verify(demandRepository, never()).delete(any());
        }
    }
}
