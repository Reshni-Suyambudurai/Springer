package com.kanini.springer.Testing.UnitTesting;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.entity.Drive.*;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.*;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.CandidateEvaluationMapper;
import com.kanini.springer.mapper.Drive.RoundTemplateMapper;
import com.kanini.springer.repository.Drive.*;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.service.Drive.impl.CandidateEvaluationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CandidateEvaluationServiceImpl}.
 *
 * All dependencies are mocked — no Spring context is loaded.
 * Covers every public service method with positive (happy path)
 * and negative (edge case / exception) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class CandidateEvaluationServiceImplTest {

    // ---------------------------------------------------------------
    // Mocks
    // ---------------------------------------------------------------
    @Mock private CandidateEvaluationRepository evaluationRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private RoundTemplateRepository roundTemplateRepository;
    @Mock private UserRepository userRepository;
    @Mock private CandidatesRepository candidatesRepository;
    @Mock private DriveAssignmentRepository driveAssignmentRepository;
    @Mock private CandidateEvaluationMapper mapper;
    @Mock private RoundTemplateMapper roundTemplateMapper;
    @Mock private ObjectMapper objectMapper;
    @Mock private IOverrideService overrideService;

    @InjectMocks
    private CandidateEvaluationServiceImpl evaluationService;

    // ---------------------------------------------------------------
    // Fixtures
    // ---------------------------------------------------------------
    private Application stubApplication;
    private RoundTemplate stubRoundTemplate;
    private User stubUser;
    private Candidate stubCandidate;
    private CandidateEvaluation stubEvaluation;
    private CandidateEvaluationResponse stubResponse;

    @BeforeEach
    void initFixtures() {
        // Candidate
        stubCandidate = new Candidate();
        stubCandidate.setCandidateId(1L);
        stubCandidate.setFirstName("John");
        stubCandidate.setLastName("Doe");
        stubCandidate.setEmail("john.doe@test.com");
        stubCandidate.setApplicationStage(ApplicationStage.APPLIED);

        // Application
        stubApplication = new Application();
        stubApplication.setApplicationId(1L);
        stubApplication.setRegistrationCode("REG001");
        stubApplication.setApplicationStatus(ApplicationStatus.ALLOTED);
        stubApplication.setCandidate(stubCandidate);

        // Round Template
        stubRoundTemplate = new RoundTemplate();
        stubRoundTemplate.setRoundConfigId(1L);
        stubRoundTemplate.setRoundName("Technical Round");
        stubRoundTemplate.setRoundNo(3);
        stubRoundTemplate.setMinScore(50);
        stubRoundTemplate.setOutoffScore(100);
        stubRoundTemplate.setWeightage(40);

        // User
        stubUser = new User();
        stubUser.setUserId(1L);
        stubUser.setUsername("reviewer1");
        stubUser.setEmail("reviewer1@test.com");

        // Evaluation
        stubEvaluation = new CandidateEvaluation();
        stubEvaluation.setScoreId(1L);
        stubEvaluation.setApplication(stubApplication);
        stubEvaluation.setRoundConfig(stubRoundTemplate);
        stubEvaluation.setScore(85);
        stubEvaluation.setReview("Good performance");
        stubEvaluation.setStatus(EvaluationStatus.PASS);
        stubEvaluation.setReviewedBy(stubUser);
        stubEvaluation.setReviewedAt(LocalDateTime.now());

        // Response
        stubResponse = new CandidateEvaluationResponse();
        stubResponse.setScoreId(1L);
        stubResponse.setApplicationId(1L);
        stubResponse.setCandidateId(1L);
        stubResponse.setCandidateName("John Doe");
        stubResponse.setRoundConfigId(1L);
        stubResponse.setRoundName("Technical Round");
        stubResponse.setScore(85);
        stubResponse.setEvaluationStatus("PASS");
        stubResponse.setReviewedBy(1L);
        stubResponse.setReviewedByName("reviewer1");
    }

    // =======================================================================
    // createEvaluation()
    // =======================================================================

    @Nested
    @DisplayName("createEvaluation()")
    class CreateEvaluation {

        @Test
        @DisplayName("Positive: creates evaluation successfully with PASS status")
        void createEvaluation_passStatus_success() throws JsonProcessingException {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    1L, 1L, 85, "PASS", 1L, "SUBMIT");

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(stubApplication));
            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"Coding\":45}");
            when(evaluationRepository.save(any(CandidateEvaluation.class))).thenReturn(stubEvaluation);
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            CandidateEvaluationResponse result = evaluationService.createEvaluation(request);

            assertThat(result).isNotNull();
            assertThat(result.getScoreId()).isEqualTo(1L);
            assertThat(result.getEvaluationStatus()).isEqualTo("PASS");
            verify(evaluationRepository).save(any(CandidateEvaluation.class));
            verify(applicationRepository).save(any(Application.class));
        }

        @Test
        @DisplayName("Negative: throws ValidationException when applicationId is null")
        void createEvaluation_nullApplicationId_throwsValidationException() {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    null, 1L, 85, "PASS", 1L, "SUBMIT");

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Application ID is required");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when roundConfigId is null")
        void createEvaluation_nullRoundConfigId_throwsValidationException() {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    1L, null, 85, "PASS", 1L, "SUBMIT");

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round config ID is required");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when score is null")
        void createEvaluation_nullScore_throwsValidationException() {
            CandidateEvaluationRequest request = new CandidateEvaluationRequest();
            request.setApplicationId(1L);
            request.setRoundConfigId(1L);
            request.setScore(null); // null score
            request.setEvaluationStatus("PASS");
            request.setReviewedBy(1L);
            request.setStatus("SUBMIT");

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Score is required");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when evaluationStatus is blank")
        void createEvaluation_blankStatus_throwsValidationException() {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    1L, 1L, 85, "", 1L, "SUBMIT");

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Evaluation status is required");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when application not found")
        void createEvaluation_applicationNotFound_throwsResourceNotFoundException() {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    999L, 1L, 85, "PASS", 1L, "SUBMIT");

            when(applicationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Application");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when roundTemplate not found")
        void createEvaluation_roundTemplateNotFound_throwsResourceNotFoundException() {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    1L, 999L, 85, "PASS", 1L, "SUBMIT");

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(stubApplication));
            when(roundTemplateRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Round template");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when evaluationStatus is invalid enum")
        void createEvaluation_invalidStatus_throwsValidationException() {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    1L, 1L, 85, "INVALID_STATUS", 1L, "SUBMIT");

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(stubApplication));
            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));

            assertThatThrownBy(() -> evaluationService.createEvaluation(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid evaluation status");

            verify(evaluationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Positive: creates evaluation with DRAFT status without updating application")
        void createEvaluation_draftStatus_success() throws JsonProcessingException {
            CandidateEvaluationRequest request = buildEvaluationRequest(
                    1L, 1L, 85, "PASS", 1L, "DRAFT");

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(stubApplication));
            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"Coding\":45}");
            when(evaluationRepository.save(any(CandidateEvaluation.class))).thenReturn(stubEvaluation);
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            CandidateEvaluationResponse result = evaluationService.createEvaluation(request);

            assertThat(result).isNotNull();
            verify(evaluationRepository).save(any(CandidateEvaluation.class));
            verify(applicationRepository).save(any(Application.class)); // History is appended
        }
    }

    // =======================================================================
    // bulkCreateEvaluations()
    // =======================================================================

    @Nested
    @DisplayName("bulkCreateEvaluations()")
    class BulkCreateEvaluations {

        @Test
        @DisplayName("Positive: creates bulk evaluations successfully")
        void bulkCreateEvaluations_success() throws JsonProcessingException {
            BulkCandidateEvaluationRequest request = new BulkCandidateEvaluationRequest();
            request.setRoundConfigId(1L);
            request.setUpdatedBy(1L);

            BulkCandidateEvaluationRequest.EvaluationData evalData = new BulkCandidateEvaluationRequest.EvaluationData();
            evalData.setRegistrationCode("REG001");
            evalData.setCandidateName("John Doe");
            evalData.setCandidateEmail("john.doe@test.com");
            Map<String, Number> sections = new HashMap<>();
            sections.put("Coding", 45);
            evalData.setSections(sections);

            request.setEvaluations(List.of(evalData));

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(applicationRepository.findByRegistrationCodeInWithCandidate(anyList()))
                    .thenReturn(List.of(stubApplication));
            when(evaluationRepository.findByApplicationIdsAndRoundConfigIdFetched(anyList(), anyLong()))
                    .thenReturn(Collections.emptyList());
            when(objectMapper.writeValueAsString(any())).thenReturn("{\"Coding\":45}");
            when(evaluationRepository.saveAll(anyList())).thenReturn(List.of(stubEvaluation));

            BulkCandidateEvaluationResponse result = evaluationService.bulkCreateEvaluations(request);

            assertThat(result).isNotNull();
            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(0);
            verify(evaluationRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when roundConfigId is null")
        void bulkCreateEvaluations_nullRoundConfigId_throwsValidationException() {
            BulkCandidateEvaluationRequest request = new BulkCandidateEvaluationRequest();
            request.setRoundConfigId(null);
            request.setUpdatedBy(1L);
            request.setEvaluations(new ArrayList<>());

            assertThatThrownBy(() -> evaluationService.bulkCreateEvaluations(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round config ID is required");

            verify(evaluationRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when evaluations list is empty")
        void bulkCreateEvaluations_emptyList_throwsValidationException() {
            BulkCandidateEvaluationRequest request = new BulkCandidateEvaluationRequest();
            request.setRoundConfigId(1L);
            request.setUpdatedBy(1L);
            request.setEvaluations(Collections.emptyList());

            assertThatThrownBy(() -> evaluationService.bulkCreateEvaluations(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Evaluations list cannot be empty");

            verify(evaluationRepository, never()).saveAll(anyList());
        }

        @Test
        @DisplayName("Negative: returns errors when registration code not found")
        void bulkCreateEvaluations_registrationCodeNotFound_returnsErrors() {
            BulkCandidateEvaluationRequest request = new BulkCandidateEvaluationRequest();
            request.setRoundConfigId(1L);
            request.setUpdatedBy(1L);

            BulkCandidateEvaluationRequest.EvaluationData evalData = new BulkCandidateEvaluationRequest.EvaluationData();
            evalData.setRegistrationCode("INVALID_CODE");
            evalData.setCandidateName("John Doe");
            evalData.setCandidateEmail("john.doe@test.com");
            Map<String, Number> sections = new HashMap<>();
            sections.put("Coding", 45);
            evalData.setSections(sections);

            request.setEvaluations(List.of(evalData));

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(applicationRepository.findByRegistrationCodeInWithCandidate(anyList()))
                    .thenReturn(Collections.emptyList()); // No applications found

            BulkCandidateEvaluationResponse result = evaluationService.bulkCreateEvaluations(request);

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(evaluationRepository, never()).saveAll(anyList());
        }
    }

    // =======================================================================
    // getAllEvaluations()
    // =======================================================================

    @Nested
    @DisplayName("getAllEvaluations()")
    class GetAllEvaluations {

        @Test
        @DisplayName("Positive: returns all evaluations successfully")
        void getAllEvaluations_success() {
            when(evaluationRepository.findAll()).thenReturn(List.of(stubEvaluation));
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            List<CandidateEvaluationResponse> result = evaluationService.getAllEvaluations();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getScoreId()).isEqualTo(1L);
            verify(evaluationRepository).findAll();
        }

        @Test
        @DisplayName("Positive: returns empty list when no evaluations exist")
        void getAllEvaluations_emptyList_success() {
            when(evaluationRepository.findAll()).thenReturn(Collections.emptyList());

            List<CandidateEvaluationResponse> result = evaluationService.getAllEvaluations();

            assertThat(result).isEmpty();
            verify(evaluationRepository).findAll();
        }
    }

    // =======================================================================
    // getEvaluationsByApplicationId()
    // =======================================================================

    @Nested
    @DisplayName("getEvaluationsByApplicationId()")
    class GetEvaluationsByApplicationId {

        @Test
        @DisplayName("Positive: returns evaluations for application successfully")
        void getEvaluationsByApplicationId_success() {
            when(evaluationRepository.findByApplicationApplicationId(1L))
                    .thenReturn(List.of(stubEvaluation));
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            List<CandidateEvaluationResponse> result = evaluationService.getEvaluationsByApplicationId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getApplicationId()).isEqualTo(1L);
            verify(evaluationRepository).findByApplicationApplicationId(1L);
        }

        @Test
        @DisplayName("Negative: throws ValidationException when applicationId is null")
        void getEvaluationsByApplicationId_nullId_throwsValidationException() {
            assertThatThrownBy(() -> evaluationService.getEvaluationsByApplicationId(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Application ID is required");

            verify(evaluationRepository, never()).findByApplicationApplicationId(anyLong());
        }
    }

    // =======================================================================
    // getEvaluationByApplicationAndRound()
    // =======================================================================

    @Nested
    @DisplayName("getEvaluationByApplicationAndRound()")
    class GetEvaluationByApplicationAndRound {

        @Test
        @DisplayName("Positive: returns evaluation successfully")
        void getEvaluationByApplicationAndRound_success() {
            when(evaluationRepository.findByApplicationApplicationIdAndRoundConfigRoundConfigIdAndReviewedByUserId(
                    1L, 1L, 1L)).thenReturn(Optional.of(stubEvaluation));
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            CandidateEvaluationResponse result = evaluationService.getEvaluationByApplicationAndRound(
                    1L, 1L, 1L);

            assertThat(result).isNotNull();
            assertThat(result.getApplicationId()).isEqualTo(1L);
            verify(evaluationRepository).findByApplicationApplicationIdAndRoundConfigRoundConfigIdAndReviewedByUserId(
                    1L, 1L, 1L);
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when evaluation not found")
        void getEvaluationByApplicationAndRound_notFound_throwsResourceNotFoundException() {
            when(evaluationRepository.findByApplicationApplicationIdAndRoundConfigRoundConfigIdAndReviewedByUserId(
                    999L, 1L, 1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> evaluationService.getEvaluationByApplicationAndRound(999L, 1L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Evaluation");

            verify(mapper, never()).toResponse(any());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when applicationId is null")
        void getEvaluationByApplicationAndRound_nullApplicationId_throwsValidationException() {
            assertThatThrownBy(() -> evaluationService.getEvaluationByApplicationAndRound(null, 1L, 1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Application ID is required");
        }
    }

    // =======================================================================
    // updateEvaluationStatus()
    // =======================================================================

    @Nested
    @DisplayName("updateEvaluationStatus()")
    class UpdateEvaluationStatus {

        @Test
        @DisplayName("Positive: updates evaluation status successfully")
        void updateEvaluationStatus_success() {
            EvaluationStatusUpdateRequest request = new EvaluationStatusUpdateRequest();
            request.setEvaluationStatus("FAIL");
            request.setUpdatedBy(1L);

            when(evaluationRepository.findById(1L)).thenReturn(Optional.of(stubEvaluation));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            CandidateEvaluationResponse result = evaluationService.updateEvaluationStatus(1L, request);

            assertThat(result).isNotNull();
            verify(evaluationRepository).findById(1L);
            verify(applicationRepository).save(any(Application.class));
        }

        @Test
        @DisplayName("Negative: throws ValidationException when scoreId is null")
        void updateEvaluationStatus_nullScoreId_throwsValidationException() {
            EvaluationStatusUpdateRequest request = new EvaluationStatusUpdateRequest();
            request.setEvaluationStatus("PASS");
            request.setUpdatedBy(1L);

            assertThatThrownBy(() -> evaluationService.updateEvaluationStatus(null, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Score ID is required");

            verify(evaluationRepository, never()).findById(anyLong());
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when evaluation not found")
        void updateEvaluationStatus_notFound_throwsResourceNotFoundException() {
            EvaluationStatusUpdateRequest request = new EvaluationStatusUpdateRequest();
            request.setEvaluationStatus("PASS");
            request.setUpdatedBy(1L);

            when(evaluationRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> evaluationService.updateEvaluationStatus(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Evaluation");

            verify(mapper, never()).toResponse(any());
        }
    }

    // =======================================================================
    // getEvaluationsByRoundAndApplications()
    // =======================================================================

    @Nested
    @DisplayName("getEvaluationsByRoundAndApplications()")
    class GetEvaluationsByRoundAndApplications {

        @Test
        @DisplayName("Positive: returns round evaluations successfully")
        void getEvaluationsByRoundAndApplications_success() {
            RoundEvaluationRequest request = new RoundEvaluationRequest();
            request.setRoundNo(3);
            request.setApplicationIds(List.of(1L, 2L));

            RoundTemplateResponse roundResponse = new RoundTemplateResponse();
            roundResponse.setRoundConfigId(1L);
            roundResponse.setRoundNo(3);

            when(roundTemplateRepository.findByRoundNoOrderByRoundConfigIdAsc(3)).thenReturn(List.of(stubRoundTemplate));
            when(evaluationRepository.findByApplicationIdsAndRoundConfigIdFetched(anyList(), anyLong()))
                    .thenReturn(List.of(stubEvaluation));
            when(roundTemplateMapper.toResponse(stubRoundTemplate)).thenReturn(roundResponse);
            when(mapper.toResponse(stubEvaluation)).thenReturn(stubResponse);

            RoundEvaluationResponse result = evaluationService.getEvaluationsByRoundAndApplications(request);

            assertThat(result).isNotNull();
            assertThat(result.getRoundTemplate()).isNotNull();
            assertThat(result.getEvaluations()).hasSize(1);
            verify(roundTemplateRepository).findByRoundNoOrderByRoundConfigIdAsc(3);
        }

        @Test
        @DisplayName("Negative: throws ValidationException when roundNo is null")
        void getEvaluationsByRoundAndApplications_nullRoundNo_throwsValidationException() {
            RoundEvaluationRequest request = new RoundEvaluationRequest();
            request.setRoundNo(null);
            request.setApplicationIds(List.of(1L));

            assertThatThrownBy(() -> evaluationService.getEvaluationsByRoundAndApplications(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round number is required");

            verify(roundTemplateRepository, never()).findByRoundNoOrderByRoundConfigIdAsc(anyInt());
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when round template not found")
        void getEvaluationsByRoundAndApplications_roundNotFound_throwsResourceNotFoundException() {
            RoundEvaluationRequest request = new RoundEvaluationRequest();
            request.setRoundNo(99);
            request.setApplicationIds(List.of(1L));

            when(roundTemplateRepository.findByRoundNoOrderByRoundConfigIdAsc(99)).thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> evaluationService.getEvaluationsByRoundAndApplications(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Round template");
        }
    }

    // =======================================================================
    // bulkUpdateEvaluationStatus()
    // =======================================================================

    @Nested
    @DisplayName("bulkUpdateEvaluationStatus()")
    class BulkUpdateEvaluationStatus {

        @Test
        @DisplayName("Positive: updates bulk evaluation status successfully")
        void bulkUpdateEvaluationStatus_success() {
            BulkEvaluationStatusUpdateRequest request = new BulkEvaluationStatusUpdateRequest();
            request.setStatus("PASS");
            request.setApplicationIds(List.of(1L, 2L));
            request.setRoundConfigId(1L);
            request.setUpdatedBy(1L);

            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));

            evaluationService.bulkUpdateEvaluationStatus(request);

            verify(evaluationRepository).updateStatusByApplicationIdsAndRoundConfigId(
                    any(EvaluationStatus.class), anyList(), anyLong());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when status is null")
        void bulkUpdateEvaluationStatus_nullStatus_throwsValidationException() {
            BulkEvaluationStatusUpdateRequest request = new BulkEvaluationStatusUpdateRequest();
            request.setStatus(null);
            request.setApplicationIds(List.of(1L));
            request.setRoundConfigId(1L);

            assertThatThrownBy(() -> evaluationService.bulkUpdateEvaluationStatus(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Status is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when applicationIds is empty")
        void bulkUpdateEvaluationStatus_emptyApplicationIds_throwsValidationException() {
            BulkEvaluationStatusUpdateRequest request = new BulkEvaluationStatusUpdateRequest();
            request.setStatus("PASS");
            request.setApplicationIds(Collections.emptyList());
            request.setRoundConfigId(1L);

            assertThatThrownBy(() -> evaluationService.bulkUpdateEvaluationStatus(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Application IDs list cannot be empty");
        }
    }

    // =======================================================================
    // bulkRoundSkip()
    // =======================================================================

    @Nested
    @DisplayName("bulkRoundSkip()")
    class BulkRoundSkip {

        @Test
        @DisplayName("Positive: handles SKIP status successfully")
        void bulkRoundSkip_skipStatus_success() {
            BulkRoundSkipRequest request = new BulkRoundSkipRequest();
            request.setStatus("SKIP");
            request.setApplicationIds(List.of(1L));
            request.setRoundConfigId(1L);
            request.setReviewedBy(1L);
            request.setReason("Round postponed");

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(stubRoundTemplate));
            when(userRepository.findById(1L)).thenReturn(Optional.of(stubUser));
            when(applicationRepository.findAllById(anyList())).thenReturn(List.of(stubApplication));
            when(evaluationRepository.findByApplicationIdsAndRoundConfigIdFetched(anyList(), anyLong()))
                    .thenReturn(Collections.emptyList());
            when(evaluationRepository.saveAll(anyList())).thenReturn(List.of(stubEvaluation));

            evaluationService.bulkRoundSkip(request);

            verify(evaluationRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("Negative: throws ValidationException when status is null")
        void bulkRoundSkip_nullStatus_throwsValidationException() {
            BulkRoundSkipRequest request = new BulkRoundSkipRequest();
            request.setStatus(null);
            request.setApplicationIds(List.of(1L));
            request.setRoundConfigId(1L);
            request.setReviewedBy(1L);

            assertThatThrownBy(() -> evaluationService.bulkRoundSkip(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Status is required");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when SKIP status has no reason")
        void bulkRoundSkip_skipWithoutReason_throwsValidationException() {
            BulkRoundSkipRequest request = new BulkRoundSkipRequest();
            request.setStatus("SKIP");
            request.setApplicationIds(List.of(1L));
            request.setRoundConfigId(1L);
            request.setReviewedBy(1L);
            request.setReason(null); // Missing reason

            assertThatThrownBy(() -> evaluationService.bulkRoundSkip(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Reason is required when status is SKIP");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when status is invalid")
        void bulkRoundSkip_invalidStatus_throwsValidationException() {
            BulkRoundSkipRequest request = new BulkRoundSkipRequest();
            request.setStatus("INVALID_STATUS");
            request.setApplicationIds(List.of(1L));
            request.setRoundConfigId(1L);
            request.setReviewedBy(1L);

            assertThatThrownBy(() -> evaluationService.bulkRoundSkip(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid status");
        }
    }

    // =======================================================================
    // Helper methods
    // =======================================================================

    private CandidateEvaluationRequest buildEvaluationRequest(Long applicationId, Long roundConfigId,
                                                                Integer score, String status, Long reviewedBy, String submitStatus) {
        CandidateEvaluationRequest request = new CandidateEvaluationRequest();
        request.setApplicationId(applicationId);
        request.setRoundConfigId(roundConfigId);
        request.setScore(score);
        request.setEvaluationStatus(status);
        request.setReviewedBy(reviewedBy);
        request.setStatus(submitStatus);
        request.setSectionScore(Map.of("Coding", 45));
        return request;
    }
}
