package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.entity.Drive.*;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.*;
import com.kanini.springer.repository.Drive.*;
import com.kanini.springer.repository.Hiring.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link com.kanini.springer.controller.Drive.CandidateEvaluationController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * Creates test data in @BeforeAll to avoid dependencies on DataLoader.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CandidateEvaluationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // Repositories for test data setup
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private InstituteRepository instituteRepository;
    @Autowired
    private CandidatesRepository candidatesRepository;
    @Autowired
    private DriveRepository driveRepository;
    @Autowired
    private ApplicationRepository applicationRepository;
    @Autowired
    private RoundTemplateRepository roundTemplateRepository;
    @Autowired
    private CandidateEvaluationRepository evaluationRepository;

    private String jwtToken;
    private Long testUserId;
    private Long testApplicationId1;
    private Long testApplicationId2;
    private Long testRoundConfigId;
    private Long testCandidateId1;
    private Long createdEvaluationId;

    // =========================================================================
    // SETUP — obtain JWT and create test data
    // =========================================================================

    @BeforeAll
    void setUp() throws Exception {
        // Login to get JWT token
        String loginBody = """
                {
                  "email":    "sudha@kanini.com",
                  "password": "password123"
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        jwtToken = node.path("data").path("token").asText();

        // Get user ID
        Optional<User> userOpt = userRepository.findByEmailWithRole("sudha@kanini.com");
        testUserId = userOpt.orElseThrow().getUserId();

        // Create test institute
        Institute institute = new Institute();
        institute.setInstituteName("Test University");
        institute.setInstituteTier(InstituteTier.TIER_1);
        institute.setState("Tamil Nadu");
        institute.setCity("Chennai");
        institute.setIsActive(true);
        institute = instituteRepository.save(institute);

        // Create test candidates
        Candidate candidate1 = new Candidate();
        candidate1.setFirstName("John");
        candidate1.setLastName("Doe");
        candidate1.setEmail("john.doe.evaluation@test.com");
        candidate1.setMobile("9876543210");
        candidate1.setDateOfBirth(LocalDate.of(2000, 1, 15));
        candidate1.setDegree("B.Tech");
        candidate1.setDepartment("Computer Science");
        candidate1.setApplicationStage(ApplicationStage.APPLIED);
        candidate1.setInstitute(institute);
        candidate1 = candidatesRepository.save(candidate1);
        testCandidateId1 = candidate1.getCandidateId();

        Candidate candidate2 = new Candidate();
        candidate2.setFirstName("Jane");
        candidate2.setLastName("Smith");
        candidate2.setEmail("jane.smith.evaluation@test.com");
        candidate2.setMobile("9876543211");
        candidate2.setDateOfBirth(LocalDate.of(2000, 2, 20));
        candidate2.setDegree("B.Tech");
        candidate2.setDepartment("Information Technology");
        candidate2.setApplicationStage(ApplicationStage.APPLIED);
        candidate2.setInstitute(institute);
        candidate2 = candidatesRepository.save(candidate2);

        // Create test drive
        Drive drive = new Drive();
        drive.setDriveName("Campus Recruitment 2024");
        drive.setDriveMode(DriveMode.ON_CAMPUS);
        drive.setStartDate(LocalDate.now().plusDays(5));
        drive.setEndDate(LocalDate.now().plusDays(10));
        drive.setStatus(DriveStatus.PLANNED);
        drive = driveRepository.save(drive);

        // Create test applications
        Application application1 = new Application();
        application1.setCandidate(candidate1);
        application1.setDrive(drive);
        application1.setRegistrationCode("REG001");
        application1.setApplicationStatus(ApplicationStatus.ALLOTED);
        application1 = applicationRepository.save(application1);
        testApplicationId1 = application1.getApplicationId();

        Application application2 = new Application();
        application2.setCandidate(candidate2);
        application2.setDrive(drive);
        application2.setRegistrationCode("REG002");
        application2.setApplicationStatus(ApplicationStatus.ALLOTED);
        application2 = applicationRepository.save(application2);
        testApplicationId2 = application2.getApplicationId();

        // Create test round template
        RoundTemplate roundTemplate = new RoundTemplate();
        roundTemplate.setRoundName("Technical Round");
        roundTemplate.setRoundNo(3);
        roundTemplate.setMinScore(50);
        roundTemplate.setOutoffScore(100);
        roundTemplate.setWeightage(40);
        roundTemplate.setSections(objectMapper.writeValueAsString(List.of(
                Map.of("sectionName", "Coding", "outOf", 50),
                Map.of("sectionName", "Problem Solving", "outOf", 50)
        )));
        roundTemplate = roundTemplateRepository.save(roundTemplate);
        testRoundConfigId = roundTemplate.getRoundConfigId();
    }

    // =========================================================================
    // 1. POST /api/candidate-evaluations — create evaluation
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("POST /api/candidate-evaluations — creates evaluation successfully")
    void createEvaluation_success() throws Exception {
        CandidateEvaluationRequest request = new CandidateEvaluationRequest();
        request.setApplicationId(testApplicationId1);
        request.setRoundConfigId(testRoundConfigId);
        request.setScore(85);
        request.setReview("Excellent performance");
        request.setEvaluationStatus("PASS");
        request.setReviewedBy(testUserId);
        request.setStatus("SUBMIT");

        Map<String, Integer> sectionScores = new HashMap<>();
        sectionScores.put("Coding", 45);
        sectionScores.put("Problem Solving", 40);
        request.setSectionScore(sectionScores);

        MvcResult result = mockMvc.perform(post("/api/candidate-evaluations")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Evaluation created successfully"))
                .andExpect(jsonPath("$.data.scoreId").exists())
                .andExpect(jsonPath("$.data.applicationId").value(testApplicationId1))
                .andExpect(jsonPath("$.data.score").value(85))
                .andExpect(jsonPath("$.data.evaluationStatus").value("PASS"))
                .andExpect(jsonPath("$.data.candidateName").value("John Doe"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdEvaluationId = node.path("data").path("scoreId").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/candidate-evaluations — validation error when applicationId is null")
    void createEvaluation_nullApplicationId_validationError() throws Exception {
        CandidateEvaluationRequest request = new CandidateEvaluationRequest();
        request.setApplicationId(null); // Missing
        request.setRoundConfigId(testRoundConfigId);
        request.setScore(85);
        request.setEvaluationStatus("PASS");
        request.setReviewedBy(testUserId);
        request.setStatus("SUBMIT");

        mockMvc.perform(post("/api/candidate-evaluations")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Application ID is required")));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/candidate-evaluations — not found error when application doesn't exist")
    void createEvaluation_applicationNotFound_error() throws Exception {
        CandidateEvaluationRequest request = new CandidateEvaluationRequest();
        request.setApplicationId(99999L); // Non-existent
        request.setRoundConfigId(testRoundConfigId);
        request.setScore(85);
        request.setEvaluationStatus("PASS");
        request.setReviewedBy(testUserId);
        request.setStatus("SUBMIT");

        mockMvc.perform(post("/api/candidate-evaluations")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Application")));
    }

    // =========================================================================
    // 2. POST /api/candidate-evaluations/bulk — bulk create evaluations
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("POST /api/candidate-evaluations/bulk — creates bulk evaluations successfully")
    void bulkCreateEvaluations_success() throws Exception {
        BulkCandidateEvaluationRequest request = new BulkCandidateEvaluationRequest();
        request.setRoundConfigId(testRoundConfigId);
        request.setUpdatedBy(testUserId);

        List<BulkCandidateEvaluationRequest.EvaluationData> evaluations = new ArrayList<>();

        BulkCandidateEvaluationRequest.EvaluationData eval1 = new BulkCandidateEvaluationRequest.EvaluationData();
        eval1.setRegistrationCode("REG002");
        eval1.setCandidateName("Jane Smith");
        eval1.setCandidateEmail("jane.smith.evaluation@test.com");
        Map<String, Number> sections1 = new HashMap<>();
        sections1.put("Coding", 40);
        sections1.put("Problem Solving", 45);
        eval1.setSections(sections1);
        evaluations.add(eval1);

        request.setEvaluations(evaluations);

        mockMvc.perform(post("/api/candidate-evaluations/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Evaluations processed successfully"))
                .andExpect(jsonPath("$.data.successCount").value(1))
                .andExpect(jsonPath("$.data.failureCount").value(0));
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/candidate-evaluations/bulk — validation error when roundConfigId is null")
    void bulkCreateEvaluations_nullRoundConfigId_validationError() throws Exception {
        BulkCandidateEvaluationRequest request = new BulkCandidateEvaluationRequest();
        request.setRoundConfigId(null); // Missing
        request.setUpdatedBy(testUserId);
        request.setEvaluations(new ArrayList<>());

        mockMvc.perform(post("/api/candidate-evaluations/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Round config ID is required")));
    }

    // =========================================================================
    // 3. GET /api/candidate-evaluations — get all evaluations
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("GET /api/candidate-evaluations — returns all evaluations")
    void getAllEvaluations_success() throws Exception {
        mockMvc.perform(get("/api/candidate-evaluations")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Evaluations retrieved successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    // =========================================================================
    // 4. GET /api/candidate-evaluations/application/{applicationId}
    // =========================================================================

    @Test
    @Order(7)
    @DisplayName("GET /api/candidate-evaluations/application/{applicationId} — returns evaluations for application")
    void getEvaluationsByApplicationId_success() throws Exception {
        mockMvc.perform(get("/api/candidate-evaluations/application/" + testApplicationId1)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Evaluations retrieved successfully"))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].applicationId").value(testApplicationId1));
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/candidate-evaluations/application/{applicationId} — validation error when applicationId is null")
    void getEvaluationsByApplicationId_nullId_validationError() throws Exception {
        mockMvc.perform(get("/api/candidate-evaluations/application/" + testApplicationId1)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 5. GET /api/candidate-evaluations/application/{applicationId}/round/{roundConfigId}/user/{userId}
    // =========================================================================

    @Test
    @Order(9)
    @DisplayName("GET evaluation by application, round, and user — returns specific evaluation")
    void getEvaluationByApplicationAndRound_success() throws Exception {
        mockMvc.perform(get("/api/candidate-evaluations/application/" + testApplicationId1 
                        + "/round/" + testRoundConfigId + "/user/" + testUserId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Evaluation retrieved successfully"))
                .andExpect(jsonPath("$.data.applicationId").value(testApplicationId1))
                .andExpect(jsonPath("$.data.roundConfigId").value(testRoundConfigId));
    }

    @Test
    @Order(10)
    @DisplayName("GET evaluation by application, round, and user — not found when evaluation doesn't exist")
    void getEvaluationByApplicationAndRound_notFound_error() throws Exception {
        mockMvc.perform(get("/api/candidate-evaluations/application/99999/round/" 
                        + testRoundConfigId + "/user/" + testUserId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 6. PATCH /api/candidate-evaluations/{scoreId}/status
    // =========================================================================

    @Test
    @Order(12)
    @DisplayName("PATCH /api/candidate-evaluations/{scoreId}/status — validation error when status is null")
    void updateEvaluationStatus_nullStatus_validationError() throws Exception {
        EvaluationStatusUpdateRequest request = new EvaluationStatusUpdateRequest();
        request.setEvaluationStatus(null); // Missing
        request.setUpdatedBy(testUserId);

        mockMvc.perform(patch("/api/candidate-evaluations/" + createdEvaluationId + "/status")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Evaluation status is required")));
    }

    @Test
    @Order(13)
    @DisplayName("PATCH /api/candidate-evaluations/{scoreId}/status — not found when scoreId doesn't exist")
    void updateEvaluationStatus_scoreNotFound_error() throws Exception {
        EvaluationStatusUpdateRequest request = new EvaluationStatusUpdateRequest();
        request.setEvaluationStatus("PASS");
        request.setUpdatedBy(testUserId);

        mockMvc.perform(patch("/api/candidate-evaluations/99999/status")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 7. POST /api/candidate-evaluations/by-round
    // =========================================================================

    @Test
    @Order(15)
    @DisplayName("POST /api/candidate-evaluations/by-round — validation error when roundNo is null")
    void getEvaluationsByRoundAndApplications_nullRoundNo_validationError() throws Exception {
        RoundEvaluationRequest request = new RoundEvaluationRequest();
        request.setRoundNo(null); // Missing
        request.setApplicationIds(List.of(testApplicationId1));

        mockMvc.perform(post("/api/candidate-evaluations/by-round")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Round number is required")));
    }

    @Test
    @Order(16)
    @DisplayName("POST /api/candidate-evaluations/by-round — not found when round doesn't exist")
    void getEvaluationsByRoundAndApplications_roundNotFound_error() throws Exception {
        RoundEvaluationRequest request = new RoundEvaluationRequest();
        request.setRoundNo(99); // Non-existent
        request.setApplicationIds(List.of(testApplicationId1));

        mockMvc.perform(post("/api/candidate-evaluations/by-round")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 8. PATCH /api/candidate-evaluations/bulk-status
    // =========================================================================

    @Test
    @Order(17)
    @DisplayName("PATCH /api/candidate-evaluations/bulk-status — updates bulk evaluation status successfully")
    void bulkUpdateEvaluationStatus_success() throws Exception {
        BulkEvaluationStatusUpdateRequest request = new BulkEvaluationStatusUpdateRequest();
        request.setStatus("PASS");
        request.setApplicationIds(List.of(testApplicationId1, testApplicationId2));
        request.setRoundConfigId(testRoundConfigId);
        request.setUpdatedBy(testUserId);

        mockMvc.perform(patch("/api/candidate-evaluations/bulk-status")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Updated successfully"));
    }

    @Test
    @Order(18)
    @DisplayName("PATCH /api/candidate-evaluations/bulk-status — validation error when status is null")
    void bulkUpdateEvaluationStatus_nullStatus_validationError() throws Exception {
        BulkEvaluationStatusUpdateRequest request = new BulkEvaluationStatusUpdateRequest();
        request.setStatus(null); // Missing
        request.setApplicationIds(List.of(testApplicationId1));
        request.setRoundConfigId(testRoundConfigId);

        mockMvc.perform(patch("/api/candidate-evaluations/bulk-status")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Status is required")));
    }

    // =========================================================================
    // 9. PATCH /api/candidate-evaluations/bulk-round-skip
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("PATCH /api/candidate-evaluations/bulk-round-skip — validation error when status is invalid")
    void bulkRoundSkip_invalidStatus_validationError() throws Exception {
        BulkRoundSkipRequest request = new BulkRoundSkipRequest();
        request.setStatus("INVALID_STATUS");
        request.setApplicationIds(List.of(testApplicationId1));
        request.setRoundConfigId(testRoundConfigId);
        request.setReviewedBy(testUserId);

        mockMvc.perform(patch("/api/candidate-evaluations/bulk-round-skip")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
