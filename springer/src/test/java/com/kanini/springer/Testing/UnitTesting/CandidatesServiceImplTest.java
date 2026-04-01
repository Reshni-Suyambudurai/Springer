package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Drive.BulkCandidateCreateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateResponse;
import com.kanini.springer.dto.Drive.CandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateUpdateRequest;
import com.kanini.springer.dto.Drive.EligibilityValidationResult;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.entity.enums.Enums.LifecycleStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.CandidateMapper;
import com.kanini.springer.repository.Drive.CandidateSkillRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.service.Drive.IEligibilityRuleService;
import com.kanini.springer.service.Drive.impl.CandidatesServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CandidatesServiceImpl}.
 *
 * All external dependencies are mocked, so no Spring context is loaded.
 * Tests cover every public service method with both positive (happy path)
 * and negative (edge case / exception) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class CandidatesServiceImplTest {

    // ---------------------------------------------------------------
    // Mocks for every dependency injected by @RequiredArgsConstructor
    // ---------------------------------------------------------------
    @Mock private CandidatesRepository  candidatesRepository;
    @Mock private InstituteRepository   instituteRepository;
    @Mock private HiringCycleRepository hiringCycleRepository;
    @Mock private CandidateMapper       mapper;
    @Mock private IOverrideService      overrideService;
    @Mock private IEligibilityRuleService eligibilityRuleService;
    @Mock private SkillRepository        skillRepository;
    @Mock private CandidateSkillRepository candidateSkillRepository;
    @Mock private UserRepository         userRepository;

    @InjectMocks
    private CandidatesServiceImpl candidatesService;

    // ---------------------------------------------------------------
    // Common test fixtures
    // ---------------------------------------------------------------
    private Institute    stubInstitute;
    private HiringCycle  openCycle;
    private HiringCycle  closedCycle;
    private Candidate    stubCandidate;
    private CandidateResponse stubResponse;
    private User         stubUser;

    @BeforeEach
    void initFixtures() {
        stubInstitute = new Institute();
        stubInstitute.setInstituteId(1L);
        stubInstitute.setInstituteName("Anna University");

        openCycle = new HiringCycle();
        openCycle.setCycleId(3L);
        openCycle.setCycleName("2026 Campus Hiring");
        openCycle.setStatus(CycleStatus.OPEN);

        closedCycle = new HiringCycle();
        closedCycle.setCycleId(1L);
        closedCycle.setCycleName("2024 Campus Hiring");
        closedCycle.setStatus(CycleStatus.CLOSED);

        stubCandidate = new Candidate();
        stubCandidate.setCandidateId(1L);
        stubCandidate.setFirstName("Arjun");
        stubCandidate.setLastName("Kumar");
        stubCandidate.setEmail("arjun@test.com");
        stubCandidate.setMobile("9876543210");
        stubCandidate.setCgpa(new BigDecimal("8.5"));
        stubCandidate.setIsEligible(true);
        stubCandidate.setApplicationStage(ApplicationStage.APPLIED);
        stubCandidate.setLifecycleStatus(LifecycleStatus.ACTIVE);
        stubCandidate.setInstitute(stubInstitute);
        stubCandidate.setCycle(openCycle);
        stubCandidate.setCandidateSkills(new ArrayList<>());

        stubResponse = new CandidateResponse();
        stubResponse.setCandidateId(1L);
        stubResponse.setFirstName("Arjun");
        stubResponse.setEmail("arjun@test.com");
        stubResponse.setApplicationStage("APPLIED");
        stubResponse.setLifecycleStatus("ACTIVE");
        stubResponse.setIsEligible(true);

        stubUser = new User();
        stubUser.setUserId(1L);
        stubUser.setUsername("Sudha");
        stubUser.setEmail("sudha@kanini.com");
    }

    // =======================================================================
    // createCandidate
    // =======================================================================

    @Nested
    @DisplayName("createCandidate()")
    class CreateCandidate {

        private CandidateRequest buildValidRequest() {
            CandidateRequest req = new CandidateRequest();
            req.setInstituteId(1L);
            req.setCycleId(3L);
            req.setFirstName("Arjun");
            req.setLastName("Kumar");
            req.setEmail("arjun@test.com");
            req.setMobile("9876543210");
            req.setCgpa(new BigDecimal("8.5"));
            req.setHistoryOfArrears(0);
            req.setDegree("B.Tech");
            req.setDepartment("CSE");
            req.setPassoutYear(2026);
            return req;
        }

        @Test
        @DisplayName("Positive: creates and returns new candidate successfully")
        void createCandidate_newCandidate_success() {
            CandidateRequest req = buildValidRequest();

            when(hiringCycleRepository.findById(3L)).thenReturn(Optional.of(openCycle));
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(candidatesRepository.findMatchingCandidates(
                    anyString(), any(), anyString(), anyString(), anyString(),
                    any(), any(), any())).thenReturn(Collections.emptyList());
            when(candidatesRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            when(candidatesRepository.findByAadhaarNumber(any())).thenReturn(Optional.empty());
            when(mapper.toEntity(req)).thenReturn(stubCandidate);
            when(eligibilityRuleService.checkEligibility(any(), any(), any(), any(), any()))
                    .thenReturn(eligibleResult());
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(stubCandidate);
            when(candidatesRepository.findByIdWithInstitute(1L)).thenReturn(Optional.of(stubCandidate));
            when(mapper.toResponse(stubCandidate)).thenReturn(stubResponse);

            CandidateResponse result = candidatesService.createCandidate(req);

            assertThat(result).isNotNull();
            assertThat(result.getFirstName()).isEqualTo("Arjun");
            assertThat(result.getApplicationStage()).isEqualTo("APPLIED");
            verify(candidatesRepository).save(any(Candidate.class));
        }

        @Test
        @DisplayName("Negative: throws ValidationException when firstName is null")
        void createCandidate_nullFirstName_throwsValidation() {
            CandidateRequest req = buildValidRequest();
            req.setFirstName(null);

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("First name is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when firstName is blank")
        void createCandidate_blankFirstName_throwsValidation() {
            CandidateRequest req = buildValidRequest();
            req.setFirstName("   ");

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("First name is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when email is null")
        void createCandidate_nullEmail_throwsValidation() {
            CandidateRequest req = buildValidRequest();
            req.setEmail(null);

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Email is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when mobile is blank")
        void createCandidate_blankMobile_throwsValidation() {
            CandidateRequest req = buildValidRequest();
            req.setMobile("  ");

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Mobile number is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when cycle is CLOSED")
        void createCandidate_closedCycle_throwsValidation() {
            CandidateRequest req = buildValidRequest();
            req.setCycleId(1L);

            when(hiringCycleRepository.findById(1L)).thenReturn(Optional.of(closedCycle));

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot add candidates to cycle");
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when institute does not exist")
        void createCandidate_instituteNotFound_throwsResourceNotFound() {
            CandidateRequest req = buildValidRequest();

            when(hiringCycleRepository.findById(3L)).thenReturn(Optional.of(openCycle));
            when(instituteRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Negative: throws ValidationException when email already exists")
        void createCandidate_duplicateEmail_throwsValidation() {
            CandidateRequest req = buildValidRequest();

            when(hiringCycleRepository.findById(3L)).thenReturn(Optional.of(openCycle));
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(candidatesRepository.findMatchingCandidates(
                    anyString(), any(), anyString(), anyString(), anyString(),
                    any(), any(), any())).thenReturn(Collections.emptyList());
            when(candidatesRepository.findByEmail(anyString())).thenReturn(Optional.of(stubCandidate));
            when(mapper.toEntity(req)).thenReturn(stubCandidate);
            when(eligibilityRuleService.checkEligibility(any(), any(), any(), any(), any()))
                    .thenReturn(eligibleResult());

            assertThatThrownBy(() -> candidatesService.createCandidate(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Email already exists");
        }

        @Test
        @DisplayName("Positive: candidate is marked ineligible when eligibility check fails")
        void createCandidate_ineligibleCandidate_setsIsEligibleFalse() {
            CandidateRequest req = buildValidRequest();

            EligibilityValidationResult ineligible = new EligibilityValidationResult();
            ineligible.setEligible(false);
            ineligible.addReason("CGPA below minimum");

            when(hiringCycleRepository.findById(3L)).thenReturn(Optional.of(openCycle));
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(candidatesRepository.findMatchingCandidates(
                    anyString(), any(), anyString(), anyString(), anyString(),
                    any(), any(), any())).thenReturn(Collections.emptyList());
            when(candidatesRepository.findByEmail(anyString())).thenReturn(Optional.empty());
            when(candidatesRepository.findByAadhaarNumber(any())).thenReturn(Optional.empty());

            Candidate ineligibleCandidate = new Candidate();
            ineligibleCandidate.setCandidateId(2L);
            ineligibleCandidate.setFirstName("Arjun");
            ineligibleCandidate.setEmail("arjun@test.com");
            ineligibleCandidate.setApplicationStage(ApplicationStage.APPLIED);
            ineligibleCandidate.setLifecycleStatus(LifecycleStatus.ACTIVE);
            ineligibleCandidate.setCandidateSkills(new ArrayList<>());

            when(mapper.toEntity(req)).thenReturn(ineligibleCandidate);
            when(eligibilityRuleService.checkEligibility(any(), any(), any(), any(), any()))
                    .thenReturn(ineligible);
            when(candidatesRepository.save(any(Candidate.class))).thenAnswer(inv -> {
                Candidate c = inv.getArgument(0);
                c.setCandidateId(2L);
                return c;
            });
            when(candidatesRepository.findByIdWithInstitute(2L)).thenReturn(Optional.of(ineligibleCandidate));

            CandidateResponse ineligibleResponse = new CandidateResponse();
            ineligibleResponse.setCandidateId(2L);
            ineligibleResponse.setIsEligible(false);
            ineligibleResponse.setReason("CGPA below minimum");
            when(mapper.toResponse(ineligibleCandidate)).thenReturn(ineligibleResponse);

            CandidateResponse result = candidatesService.createCandidate(req);

            assertThat(result.getIsEligible()).isFalse();
            assertThat(ineligibleCandidate.getIsEligible()).isFalse();
        }
    }

    // =======================================================================
    // getAllCandidates
    // =======================================================================

    @Nested
    @DisplayName("getAllCandidates()")
    class GetAllCandidates {

        @Test
        @DisplayName("Positive: returns mapped list of all candidates")
        void getAllCandidates_returnsList() {
            when(candidatesRepository.findAllWithInstitute())
                    .thenReturn(List.of(stubCandidate));
            when(mapper.toResponseList(List.of(stubCandidate)))
                    .thenReturn(List.of(stubResponse));

            List<CandidateResponse> result = candidatesService.getAllCandidates();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getFirstName()).isEqualTo("Arjun");
        }

        @Test
        @DisplayName("Positive: returns empty list when no candidates exist")
        void getAllCandidates_emptyDatabase_returnsEmptyList() {
            when(candidatesRepository.findAllWithInstitute()).thenReturn(Collections.emptyList());
            when(mapper.toResponseList(Collections.emptyList())).thenReturn(Collections.emptyList());

            List<CandidateResponse> result = candidatesService.getAllCandidates();

            assertThat(result).isEmpty();
        }
    }

    // =======================================================================
    // getCandidateById
    // =======================================================================

    @Nested
    @DisplayName("getCandidateById()")
    class GetCandidateById {

        @Test
        @DisplayName("Positive: returns candidate when found by ID")
        void getCandidateById_found_returnsResponse() {
            when(candidatesRepository.findByIdWithInstitute(1L)).thenReturn(Optional.of(stubCandidate));
            when(mapper.toResponse(stubCandidate)).thenReturn(stubResponse);

            CandidateResponse result = candidatesService.getCandidateById(1L);

            assertThat(result.getCandidateId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when ID does not exist")
        void getCandidateById_notFound_throwsException() {
            when(candidatesRepository.findByIdWithInstitute(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> candidatesService.getCandidateById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Candidate");
        }
    }

    // =======================================================================
    // getCandidatesByInstituteId
    // =======================================================================

    @Nested
    @DisplayName("getCandidatesByInstituteId()")
    class GetCandidatesByInstituteId {

        @Test
        @DisplayName("Positive: returns candidates for valid institute")
        void getCandidatesByInstituteId_found_returnsList() {
            when(instituteRepository.existsById(1L)).thenReturn(true);
            when(candidatesRepository.findByInstituteIdWithInstitute(1L))
                    .thenReturn(List.of(stubCandidate));
            when(mapper.toResponseList(List.of(stubCandidate)))
                    .thenReturn(List.of(stubResponse));

            List<CandidateResponse> result = candidatesService.getCandidatesByInstituteId(1L);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when institute does not exist")
        void getCandidatesByInstituteId_instituteNotFound_throwsException() {
            when(instituteRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> candidatesService.getCandidatesByInstituteId(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Institute");
        }
    }

    // =======================================================================
    // getCandidatesByCycleId
    // =======================================================================

    @Nested
    @DisplayName("getCandidatesByCycleId()")
    class GetCandidatesByCycleId {

        @Test
        @DisplayName("Positive: returns candidates for valid cycle")
        void getCandidatesByCycleId_found_returnsList() {
            when(hiringCycleRepository.existsById(3L)).thenReturn(true);
            when(candidatesRepository.findByCycleIdWithDetails(3L))
                    .thenReturn(List.of(stubCandidate));
            when(mapper.toResponseList(List.of(stubCandidate)))
                    .thenReturn(List.of(stubResponse));

            List<CandidateResponse> result = candidatesService.getCandidatesByCycleId(3L);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when cycle does not exist")
        void getCandidatesByCycleId_cycleNotFound_throwsException() {
            when(hiringCycleRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> candidatesService.getCandidatesByCycleId(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Hiring cycle");
        }
    }

    // =======================================================================
    // updateCandidate  (eligibility update)
    // =======================================================================

    @Nested
    @DisplayName("updateCandidate()")
    class UpdateCandidate {

        @Test
        @DisplayName("Positive: updates eligibility and logs override")
        void updateCandidate_validRequest_success() {
            CandidateUpdateRequest req = new CandidateUpdateRequest(false, "Low CGPA", 1L);

            when(userRepository.existsById(1L)).thenReturn(true);
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));
            when(overrideService.detectChanges(any(Candidate.class), any(Candidate.class)))
                    .thenReturn(List.of());
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(stubCandidate);
            when(mapper.toResponse(stubCandidate)).thenReturn(stubResponse);

            CandidateResponse result = candidatesService.updateCandidate(1L, req);

            assertThat(result).isNotNull();
            verify(candidatesRepository).save(any(Candidate.class));
        }

        @Test
        @DisplayName("Negative: throws ValidationException when reason is blank")
        void updateCandidate_blankReason_throwsValidation() {
            CandidateUpdateRequest req = new CandidateUpdateRequest(false, "  ", 1L);

            assertThatThrownBy(() -> candidatesService.updateCandidate(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Reason is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when isEligible is null")
        void updateCandidate_nullIsEligible_throwsValidation() {
            CandidateUpdateRequest req = new CandidateUpdateRequest(null, "Some reason", 1L);

            assertThatThrownBy(() -> candidatesService.updateCandidate(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Eligibility status is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when updatedBy is null")
        void updateCandidate_nullUpdatedBy_throwsValidation() {
            CandidateUpdateRequest req = new CandidateUpdateRequest(true, "Reason here", null);

            assertThatThrownBy(() -> candidatesService.updateCandidate(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("User ID");
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when updatedBy user does not exist")
        void updateCandidate_userNotFound_throwsResourceNotFound() {
            CandidateUpdateRequest req = new CandidateUpdateRequest(true, "Valid reason", 99L);

            when(userRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> candidatesService.updateCandidate(1L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when candidate does not exist")
        void updateCandidate_candidateNotFound_throwsResourceNotFound() {
            CandidateUpdateRequest req = new CandidateUpdateRequest(true, "Valid reason", 1L);

            when(userRepository.existsById(1L)).thenReturn(true);
            when(candidatesRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> candidatesService.updateCandidate(99L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Candidate");
        }
    }

    // =======================================================================
    // updateCandidateStatus
    // =======================================================================

    @Nested
    @DisplayName("updateCandidateStatus()")
    class UpdateCandidateStatus {

        @Test
        @DisplayName("Positive: updates application stage for eligible candidate")
        void updateCandidateStatus_eligibleCandidate_success() {
            CandidateStatusUpdateRequest req = new CandidateStatusUpdateRequest("SHORTLISTED", 1L);
            stubCandidate.setIsEligible(true);

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(stubCandidate);
            when(mapper.toResponse(stubCandidate)).thenReturn(stubResponse);

            CandidateResponse result = candidatesService.updateCandidateStatus(1L, req);

            assertThat(result).isNotNull();
            assertThat(stubCandidate.getApplicationStage()).isEqualTo(ApplicationStage.SHORTLISTED);
        }

        @Test
        @DisplayName("Negative: throws ValidationException when ineligible candidate tries to advance")
        void updateCandidateStatus_ineligibleCandidateAdvancing_throwsValidation() {
            CandidateStatusUpdateRequest req = new CandidateStatusUpdateRequest("SHORTLISTED", 1L);
            stubCandidate.setIsEligible(false);

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));

            assertThatThrownBy(() -> candidatesService.updateCandidateStatus(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("not eligible");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when status is blank")
        void updateCandidateStatus_blankStatus_throwsValidation() {
            CandidateStatusUpdateRequest req = new CandidateStatusUpdateRequest("", 1L);

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));

            assertThatThrownBy(() -> candidatesService.updateCandidateStatus(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Status is required");
        }

        @Test
        @DisplayName("Negative: throws IllegalArgumentException for unknown status value")
        void updateCandidateStatus_unknownStatus_throwsException() {
            CandidateStatusUpdateRequest req = new CandidateStatusUpdateRequest("UNKNOWN_STATUS", 1L);
            stubCandidate.setIsEligible(true);

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));

            assertThatThrownBy(() -> candidatesService.updateCandidateStatus(1L, req))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when candidate does not exist")
        void updateCandidateStatus_candidateNotFound_throwsResourceNotFound() {
            CandidateStatusUpdateRequest req = new CandidateStatusUpdateRequest("SHORTLISTED", 1L);

            when(candidatesRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> candidatesService.updateCandidateStatus(99L, req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =======================================================================
    // bulkUpdateCandidateStatus
    // =======================================================================

    @Nested
    @DisplayName("bulkUpdateCandidateStatus()")
    class BulkUpdateCandidateStatus {

        @Test
        @DisplayName("Positive: updates status for all eligible candidates in the list")
        void bulkUpdateStatus_allEligible_allSucceed() {
            stubCandidate.setIsEligible(true);
            BulkCandidateStatusUpdateRequest req = new BulkCandidateStatusUpdateRequest(
                    List.of(1L), "SHORTLISTED", "Bulk shortlist", 1L
            );

            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(stubCandidate);

            BulkCandidateStatusUpdateResponse result = candidatesService.bulkUpdateCandidateStatus(req);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(0);
            assertThat(result.getSuccessfulCandidateIds()).contains(1L);
        }

        @Test
        @DisplayName("Positive: ineligible candidate is skipped with error message, others succeed")
        void bulkUpdateStatus_ineligibleSkipped_errorRecorded() {
            Candidate eligible   = candidate(10L, true);
            Candidate ineligible = candidate(11L, false);
            BulkCandidateStatusUpdateRequest req = new BulkCandidateStatusUpdateRequest(
                    List.of(10L, 11L), "SHORTLISTED", "Bulk test", null
            );

            when(candidatesRepository.findById(10L)).thenReturn(Optional.of(eligible));
            when(candidatesRepository.findById(11L)).thenReturn(Optional.of(ineligible));
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(eligible);

            BulkCandidateStatusUpdateResponse result = candidatesService.bulkUpdateCandidateStatus(req);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getErrorMessages()).hasSize(1);
        }

        @Test
        @DisplayName("Negative: throws ValidationException when candidateIds list is null")
        void bulkUpdateStatus_nullCandidateIds_throwsValidation() {
            BulkCandidateStatusUpdateRequest req = new BulkCandidateStatusUpdateRequest(
                    null, "SHORTLISTED", "Reason", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Candidate IDs list cannot be empty");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when candidateIds list is empty")
        void bulkUpdateStatus_emptyCandidateIds_throwsValidation() {
            BulkCandidateStatusUpdateRequest req = new BulkCandidateStatusUpdateRequest(
                    Collections.emptyList(), "SHORTLISTED", "Reason", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Candidate IDs list cannot be empty");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when status is null")
        void bulkUpdateStatus_nullStatus_throwsValidation() {
            BulkCandidateStatusUpdateRequest req = new BulkCandidateStatusUpdateRequest(
                    List.of(1L), null, "Reason", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Status is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when status string is invalid enum value")
        void bulkUpdateStatus_invalidStatus_throwsValidation() {
            BulkCandidateStatusUpdateRequest req = new BulkCandidateStatusUpdateRequest(
                    List.of(1L), "INVALID_STATUS", "Reason", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid status");
        }
    }

    // =======================================================================
    // bulkUpdateCandidateLifecycleStatus
    // =======================================================================

    @Nested
    @DisplayName("bulkUpdateCandidateLifecycleStatus()")
    class BulkUpdateLifecycleStatus {

        @Test
        @DisplayName("Positive: sets lifecycle to CLOSED for all candidates in list")
        void bulkUpdateLifecycle_valid_allSucceed() {
            BulkCandidateLifecycleUpdateRequest req = new BulkCandidateLifecycleUpdateRequest(
                    List.of(1L), "CLOSED", 1L
            );

            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(stubCandidate);

            BulkCandidateLifecycleUpdateResponse result = candidatesService.bulkUpdateCandidateLifecycleStatus(req);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(0);
            assertThat(stubCandidate.getLifecycleStatus()).isEqualTo(LifecycleStatus.CLOSED);
        }

        @Test
        @DisplayName("Positive: records error for non-existent ID without aborting others")
        void bulkUpdateLifecycle_oneNotFound_errorRecordedForMissing() {
            BulkCandidateLifecycleUpdateRequest req = new BulkCandidateLifecycleUpdateRequest(
                    List.of(1L, 99L), "ACTIVE", null
            );

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(stubCandidate));
            when(candidatesRepository.findById(99L)).thenReturn(Optional.empty());
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(stubCandidate);

            BulkCandidateLifecycleUpdateResponse result = candidatesService.bulkUpdateCandidateLifecycleStatus(req);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getErrorMessages().get(0)).contains("99");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when candidateIds is null")
        void bulkUpdateLifecycle_nullCandidateIds_throwsValidation() {
            BulkCandidateLifecycleUpdateRequest req = new BulkCandidateLifecycleUpdateRequest(
                    null, "CLOSED", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateLifecycleStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Candidate IDs list cannot be empty");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when lifecycleStatus is blank")
        void bulkUpdateLifecycle_blankLifecycleStatus_throwsValidation() {
            BulkCandidateLifecycleUpdateRequest req = new BulkCandidateLifecycleUpdateRequest(
                    List.of(1L), "  ", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateLifecycleStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Lifecycle status is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException for invalid lifecycle status string")
        void bulkUpdateLifecycle_invalidStatus_throwsValidation() {
            BulkCandidateLifecycleUpdateRequest req = new BulkCandidateLifecycleUpdateRequest(
                    List.of(1L), "EXPIRED", 1L
            );

            assertThatThrownBy(() -> candidatesService.bulkUpdateCandidateLifecycleStatus(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid lifecycle status");
        }
    }

    // =======================================================================
    // bulkCreateCandidates — key scenarios
    // =======================================================================

    @Nested
    @DisplayName("bulkCreateCandidates()")
    class BulkCreateCandidates {

        @Test
        @DisplayName("Negative: fails all when one email is duplicate within the batch")
        void bulkCreate_duplicateEmailInBatch_allFail() {
            CandidateRequest req1 = simpleCandidateRequest("Ram",  "same@test.com", "9111111111", "111111111111", 1L, 3L);
            CandidateRequest req2 = simpleCandidateRequest("Ravi", "same@test.com", "9222222222", "222222222222", 1L, 3L);

            BulkCandidateCreateResponse result = candidatesService.bulkCreateCandidates(List.of(req1, req2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getFailureCount()).isGreaterThan(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(candidatesRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("Negative: fails all when one aadhaar is duplicate within the batch")
        void bulkCreate_duplicateAadhaarInBatch_allFail() {
            CandidateRequest req1 = simpleCandidateRequest("A", "a@test.com", "9100000001", "999999999999", 1L, 3L);
            CandidateRequest req2 = simpleCandidateRequest("B", "b@test.com", "9100000002", "999999999999", 1L, 3L);

            BulkCandidateCreateResponse result = candidatesService.bulkCreateCandidates(List.of(req1, req2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
        }
    }

    // =======================================================================
    // Private helpers
    // =======================================================================

    /** Returns a passing EligibilityValidationResult */
    private EligibilityValidationResult eligibleResult() {
        EligibilityValidationResult r = new EligibilityValidationResult();
        r.setEligible(true);
        return r;
    }

    /** Builds a minimal Candidate stub with given ID and eligibility */
    private Candidate candidate(Long id, boolean eligible) {
        Candidate c = new Candidate();
        c.setCandidateId(id);
        c.setFirstName("Candidate" + id);
        c.setIsEligible(eligible);
        c.setApplicationStage(ApplicationStage.APPLIED);
        c.setLifecycleStatus(LifecycleStatus.ACTIVE);
        c.setCandidateSkills(new ArrayList<>());
        return c;
    }

    /** Builds a minimal CandidateRequest for bulk tests */
    private CandidateRequest simpleCandidateRequest(String firstName, String email,
                                                     String mobile, String aadhaar,
                                                     Long instituteId, Long cycleId) {
        CandidateRequest req = new CandidateRequest();
        req.setFirstName(firstName);
        req.setEmail(email);
        req.setMobile(mobile);
        req.setAadhaarNumber(aadhaar);
        req.setInstituteId(instituteId);
        req.setCycleId(cycleId);
        req.setCgpa(new BigDecimal("7.5"));
        req.setPassoutYear(2026);
        return req;
    }
}
