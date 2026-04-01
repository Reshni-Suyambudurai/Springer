package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateFilterRequest;
import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateValidationRequest;
import com.kanini.springer.entity.enums.Enums.ApplicationType;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for CandidatesController.
 *
 * Uses the H2 in-memory database (test profile) with DataLoader seed data:
 *   - Hiring Cycles: ID=1 (2024 CLOSED), ID=2 (2025 CLOSED), ID=3 (2026 OPEN)
 *   - Institutes  : ID=1 Anna University … ID=8 CEG
 *   - Users       : sudha@kanini.com / password123 (TA_HEAD)
 *
 * Test order ensures a candidate is created before read/update tests run.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class CandidatesControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // --- shared state across ordered tests ---
    private String jwtToken;
    private Long createdCandidateId;
    private Long secondCandidateId;

    // Seed-data IDs (DataLoader inserts them in this order)
    private static final Long OPEN_CYCLE_ID      = 3L;   // 2026 Campus Hiring – OPEN
    private static final Long CLOSED_CYCLE_ID    = 1L;   // 2024 Campus Hiring – CLOSED
    private static final Long INSTITUTE_ID        = 1L;   // Anna University
    private static final Long USER_ID             = 1L;   // Sudha (TA_HEAD)

    // =========================================================================
    // SETUP — obtain JWT that is reused across all tests
    // =========================================================================

    @BeforeAll
    void setUp() throws Exception {
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

        String responseBody = result.getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(responseBody);
        jwtToken = node.path("data").path("token").asText();
    }

    // =========================================================================
    // 1. GET /api/candidates — returns list (empty before any candidate created)
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/candidates - returns 200 with candidate list")
    void getAllCandidates_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // =========================================================================
    // 2. POST /api/candidates — create a single candidate (happy path)
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("POST /api/candidates - creates candidate and returns 201")
    void createCandidate_success_returns201() throws Exception {
        CandidateRequest request = new CandidateRequest();
        request.setInstituteId(INSTITUTE_ID);
        request.setCycleId(OPEN_CYCLE_ID);
        request.setFirstName("Arjun");
        request.setLastName("Kumar");
        request.setEmail("arjun.kumar@test.com");
        request.setMobile("9876543210");
        request.setCgpa(new BigDecimal("8.5"));
        request.setHistoryOfArrears(0);
        request.setDegree("B.Tech");
        request.setDepartment("Computer Science");
        request.setPassoutYear(2026);
        request.setDateOfBirth(LocalDate.of(2003, 6, 15));
        request.setAadhaarNumber("123456789012");
        request.setApplicationType(ApplicationType.STANDARD);

        MvcResult result = mockMvc.perform(post("/api/candidates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.candidateId").exists())
                .andExpect(jsonPath("$.data.firstName").value("Arjun"))
                .andExpect(jsonPath("$.data.email").value("arjun.kumar@test.com"))
                .andExpect(jsonPath("$.data.applicationStage").value("APPLIED"))
                .andExpect(jsonPath("$.data.lifecycleStatus").value("ACTIVE"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdCandidateId = node.path("data").path("candidateId").asLong();
    }

    // =========================================================================
    // 3. POST /api/candidates — second candidate for bulk tests
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("POST /api/candidates - creates second candidate for later bulk tests")
    void createSecondCandidate_success() throws Exception {
        CandidateRequest request = new CandidateRequest();
        request.setInstituteId(INSTITUTE_ID);
        request.setCycleId(OPEN_CYCLE_ID);
        request.setFirstName("Priya");
        request.setLastName("Rajan");
        request.setEmail("priya.rajan@test.com");
        request.setMobile("9876500001");
        request.setCgpa(new BigDecimal("7.8"));
        request.setHistoryOfArrears(0);
        request.setDegree("B.Tech");
        request.setDepartment("Electronics");
        request.setPassoutYear(2026);
        request.setDateOfBirth(LocalDate.of(2003, 3, 10));
        request.setAadhaarNumber("987654321098");
        request.setApplicationType(ApplicationType.STANDARD);

        MvcResult result = mockMvc.perform(post("/api/candidates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        secondCandidateId = node.path("data").path("candidateId").asLong();
    }

    // =========================================================================
    // 4. GET /api/candidates/{id} — fetch by valid ID
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("GET /api/candidates/{id} - returns candidate by ID")
    void getCandidateById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/{id}", createdCandidateId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.candidateId").value(createdCandidateId))
                .andExpect(jsonPath("$.data.firstName").value("Arjun"));
    }

    // =========================================================================
    // 5. GET /api/candidates/by-institute/{instituteId}
    // =========================================================================

    @Test
    @Order(5)
    @DisplayName("GET /api/candidates/by-institute/{instituteId} - returns candidates for institute")
    void getCandidatesByInstituteId_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/by-institute/{instituteId}", INSTITUTE_ID)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    // =========================================================================
    // 6. GET /api/candidates/cycle/{cycleId}
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("GET /api/candidates/cycle/{cycleId} - returns candidates for cycle")
    void getCandidatesByCycleId_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/cycle/{cycleId}", OPEN_CYCLE_ID)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    // =========================================================================
    // 7. GET /api/candidates/active/paginated?cycleId=3
    // =========================================================================

    @Test
    @Order(7)
    @DisplayName("GET /api/candidates/active/paginated - returns paginated active candidates")
    void getActiveCandidatesPaginated_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/active/paginated")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("cycleId", String.valueOf(OPEN_CYCLE_ID))
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "candidateId")
                        .param("sortDirection", "DESC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.totalElements").value(greaterThanOrEqualTo(1)));
    }

    // =========================================================================
    // 8. POST /api/candidates/filter — advanced filtering
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("POST /api/candidates/filter - filters candidates by cycle and lifecycleStatus")
    void getCandidatesWithFilters_returnsOk() throws Exception {
        CandidateFilterRequest filter = new CandidateFilterRequest();
        filter.setCycleId(OPEN_CYCLE_ID);
        filter.setLifecycleStatus("ACTIVE");
        filter.setPage(0);
        filter.setSize(10);
        filter.setSortBy("candidateId");
        filter.setSortDirection("DESC");

        mockMvc.perform(post("/api/candidates/filter")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(filter)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    // =========================================================================
    // 9. GET /api/candidates/filter-options?cycleId=3
    // =========================================================================

    @Test
    @Order(9)
    @DisplayName("GET /api/candidates/filter-options - returns distinct filter values for cycle")
    void getFilterOptions_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/filter-options")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("cycleId", String.valueOf(OPEN_CYCLE_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());
    }

    // =========================================================================
    // 10. POST /api/candidates/validate/bulk — validate before bulk insert
    // =========================================================================

    @Test
    @Order(10)
    @DisplayName("POST /api/candidates/validate/bulk - returns NEW status for unseen candidate")
    void bulkValidateCandidates_newCandidate_returnsNew() throws Exception {
        CandidateValidationRequest req = new CandidateValidationRequest();
        req.setTempId("temp-001");
        req.setInstituteId(INSTITUTE_ID);
        req.setCycleId(OPEN_CYCLE_ID);
        req.setFirstName("Hari");
        req.setLastName("Prasad");
        req.setEmail("hari.prasad@test.com");
        req.setMobile("9000000001");
        req.setCgpa(new BigDecimal("8.0"));
        req.setPassoutYear(2026);
        req.setDegree("B.Tech");
        req.setDepartment("IT");
        req.setApplicationType(ApplicationType.STANDARD);

        mockMvc.perform(post("/api/candidates/validate/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(req))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].tempId").value("temp-001"))
                .andExpect(jsonPath("$.data[0].status").value("NEW"))
                .andExpect(jsonPath("$.data[0].canProceed").value(true));
    }

    @Test
    @Order(11)
    @DisplayName("POST /api/candidates/validate/bulk - returns DUPLICATE for already-added candidate")
    void bulkValidateCandidates_duplicate_returnsDuplicate() throws Exception {
        // Arjun was added to OPEN_CYCLE_ID in test order=2;
        // provide matching identity fields to trigger DUPLICATE
        CandidateValidationRequest req = new CandidateValidationRequest();
        req.setTempId("temp-dup");
        req.setInstituteId(INSTITUTE_ID);
        req.setCycleId(OPEN_CYCLE_ID);
        req.setFirstName("Arjun");
        req.setLastName("Kumar");
        req.setEmail("arjun.kumar@test.com");
        req.setMobile("9876543210");
        req.setCgpa(new BigDecimal("8.5"));
        req.setPassoutYear(2026);
        req.setDateOfBirth(LocalDate.of(2003, 6, 15));
        req.setAadhaarNumber("123456789012");
        req.setDegree("B.Tech");
        req.setDepartment("Computer Science");
        req.setApplicationType(ApplicationType.STANDARD);

        mockMvc.perform(post("/api/candidates/validate/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(req))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].tempId").value("temp-dup"))
                .andExpect(jsonPath("$.data[0].status").value("DUPLICATE"))
                .andExpect(jsonPath("$.data[0].canProceed").value(false));
    }

    // =========================================================================
    // 12. POST /api/candidates/bulk
    // =========================================================================

    @Test
    @Order(12)
    @DisplayName("POST /api/candidates/bulk - bulk creates candidates and returns 201")
    void bulkCreateCandidates_success_returns201() throws Exception {
        CandidateRequest req1 = buildRequest("Karthik", "Raj",    "karthik.raj@test.com",   "9111111111", "234567890123", INSTITUTE_ID, OPEN_CYCLE_ID);
        CandidateRequest req2 = buildRequest("Meena",  "Sundaram","meena.sundaram@test.com", "9222222222", "345678901234", INSTITUTE_ID, OPEN_CYCLE_ID);

        mockMvc.perform(post("/api/candidates/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(req1, req2))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.successCount").value(2))
                .andExpect(jsonPath("$.data.failureCount").value(0))
                .andExpect(jsonPath("$.data.successfulInserts", hasSize(2)));
    }

    @Test
    @Order(13)
    @DisplayName("POST /api/candidates/bulk - fails when email is duplicated within batch")
    void bulkCreateCandidates_duplicateEmailInBatch_returns400() throws Exception {
        CandidateRequest req1 = buildRequest("Ram",  "Doe", "same.email@test.com", "9333111111", "456789012345", INSTITUTE_ID, OPEN_CYCLE_ID);
        CandidateRequest req2 = buildRequest("Ravi", "Doe", "same.email@test.com", "9333222222", "567890123456", INSTITUTE_ID, OPEN_CYCLE_ID);

        mockMvc.perform(post("/api/candidates/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(req1, req2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 13. PATCH /api/candidates/{id} — update eligibility
    // =========================================================================

    @Test
    @Order(14)
    @DisplayName("PATCH /api/candidates/{id} - updates eligibility with mandatory reason")
    void updateCandidateEligibility_success_returnsOk() throws Exception {
        CandidateUpdateRequest request = new CandidateUpdateRequest(false, "Low CGPA override by manager", USER_ID);

        mockMvc.perform(patch("/api/candidates/{id}", createdCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isEligible").value(false));
    }

    @Test
    @Order(15)
    @DisplayName("PATCH /api/candidates/{id} - fails when reason is blank")
    void updateCandidateEligibility_missingReason_returns400() throws Exception {
        CandidateUpdateRequest request = new CandidateUpdateRequest(true, "", USER_ID);

        mockMvc.perform(patch("/api/candidates/{id}", createdCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 14. PATCH /api/candidates/{id}/status — update application stage
    // =========================================================================

    @Test
    @Order(16)
    @DisplayName("PATCH /api/candidates/{id}/status - updates stage for eligible candidate")
    void updateCandidateStatus_eligible_returnsOk() throws Exception {
        // First restore eligibility so status update can proceed
        CandidateUpdateRequest restore = new CandidateUpdateRequest(true, "Restoring for status test", USER_ID);
        mockMvc.perform(patch("/api/candidates/{id}", createdCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restore)))
                .andExpect(status().isOk());

        // Now update status
        CandidateStatusUpdateRequest statusRequest = new CandidateStatusUpdateRequest("SHORTLISTED", USER_ID);

        mockMvc.perform(patch("/api/candidates/{id}/status", createdCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.applicationStage").value("SHORTLISTED"));
    }

    @Test
    @Order(17)
    @DisplayName("PATCH /api/candidates/{id}/status - fails for ineligible candidate trying SHORTLISTED")
    void updateCandidateStatus_ineligible_returns400() throws Exception {
        // Mark second candidate as ineligible
        CandidateUpdateRequest markIneligible = new CandidateUpdateRequest(false, "Test ineligibility", USER_ID);
        mockMvc.perform(patch("/api/candidates/{id}", secondCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(markIneligible)))
                .andExpect(status().isOk());

        CandidateStatusUpdateRequest statusRequest = new CandidateStatusUpdateRequest("SHORTLISTED", USER_ID);

        mockMvc.perform(patch("/api/candidates/{id}/status", secondCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 15. PATCH /api/candidates/status/bulk
    // =========================================================================

    @Test
    @Order(18)
    @DisplayName("PATCH /api/candidates/status/bulk - bulk updates status for multiple eligible candidates")
    void bulkUpdateCandidateStatus_returnsOk() throws Exception {
        BulkCandidateStatusUpdateRequest request = new BulkCandidateStatusUpdateRequest(
                List.of(createdCandidateId),
                "SCHEDULED",
                "Shortlisted batch",
                USER_ID
        );

        mockMvc.perform(patch("/api/candidates/status/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.successCount").value(greaterThanOrEqualTo(1)));
    }

    @Test
    @Order(19)
    @DisplayName("PATCH /api/candidates/status/bulk - fails with invalid status string")
    void bulkUpdateCandidateStatus_invalidStatus_returns400() throws Exception {
        BulkCandidateStatusUpdateRequest request = new BulkCandidateStatusUpdateRequest(
                List.of(createdCandidateId),
                "INVALID_STATUS",
                "Test",
                USER_ID
        );

        mockMvc.perform(patch("/api/candidates/status/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 16. PATCH /api/candidates/lifecycle-status/bulk
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("PATCH /api/candidates/lifecycle-status/bulk - bulk updates lifecycle to CLOSED")
    void bulkUpdateLifecycleStatus_success_returnsOk() throws Exception {
        BulkCandidateLifecycleUpdateRequest request = new BulkCandidateLifecycleUpdateRequest(
                List.of(createdCandidateId, secondCandidateId),
                "CLOSED",
                USER_ID
        );

        mockMvc.perform(patch("/api/candidates/lifecycle-status/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.successCount").value(2))
                .andExpect(jsonPath("$.data.failureCount").value(0));
    }

    @Test
    @Order(21)
    @DisplayName("PATCH /api/candidates/lifecycle-status/bulk - fails with invalid lifecycle status")
    void bulkUpdateLifecycleStatus_invalidStatus_returns400() throws Exception {
        BulkCandidateLifecycleUpdateRequest request = new BulkCandidateLifecycleUpdateRequest(
                List.of(createdCandidateId),
                "EXPIRED",   // not a valid LifecycleStatus
                USER_ID
        );

        mockMvc.perform(patch("/api/candidates/lifecycle-status/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 17. GET /api/candidates/eligibility-rules
    // =========================================================================

    @Test
    @Order(22)
    @DisplayName("GET /api/candidates/eligibility-rules - returns current rules")
    void getEligibilityRules_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(30)
    @DisplayName("GET /api/candidates - returns 401 when no JWT token provided")
    void getAllCandidates_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/candidates"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(31)
    @DisplayName("GET /api/candidates/{id} - returns 404 for non-existent ID")
    void getCandidateById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/candidates/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(32)
    @DisplayName("GET /api/candidates/by-institute/{instituteId} - returns 404 for non-existent institute")
    void getCandidatesByInstitute_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/candidates/by-institute/{instituteId}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(33)
    @DisplayName("GET /api/candidates/cycle/{cycleId} - returns 404 for non-existent cycle")
    void getCandidatesByCycle_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/candidates/cycle/{cycleId}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(34)
    @DisplayName("POST /api/candidates - fails when creating candidate in CLOSED cycle")
    void createCandidate_closedCycle_returns400() throws Exception {
        CandidateRequest request = buildRequest(
                "Test", "User", "test.closed@test.com", "9400000001", "678901234567",
                INSTITUTE_ID, CLOSED_CYCLE_ID
        );

        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(35)
    @DisplayName("POST /api/candidates - fails when email already exists")
    void createCandidate_duplicateEmail_returns400() throws Exception {
        CandidateRequest request = buildRequest(
                "New", "Person", "arjun.kumar@test.com",  // duplicate email
                "9500000001", "789012345678",
                INSTITUTE_ID, OPEN_CYCLE_ID
        );

        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(36)
    @DisplayName("POST /api/candidates - fails when required field firstName is missing")
    void createCandidate_missingFirstName_returns400() throws Exception {
        CandidateRequest request = buildRequest(
                null, "NoName", "noname@test.com", "9600000001", null,
                INSTITUTE_ID, OPEN_CYCLE_ID
        );

        mockMvc.perform(post("/api/candidates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(37)
    @DisplayName("POST /api/candidates/validate/bulk - returns 400 when request body is empty")
    void bulkValidateCandidates_emptyBody_returns400() throws Exception {
        mockMvc.perform(post("/api/candidates/validate/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(38)
    @DisplayName("PATCH /api/candidates/{id} - fails when updatedBy user does not exist")
    void updateEligibility_userNotFound_returns404() throws Exception {
        CandidateUpdateRequest request = new CandidateUpdateRequest(true, "Override reason", 99999L);

        mockMvc.perform(patch("/api/candidates/{id}", createdCandidateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private CandidateRequest buildRequest(String firstName, String lastName, String email,
                                          String mobile, String aadhaar,
                                          Long instituteId, Long cycleId) {
        CandidateRequest r = new CandidateRequest();
        r.setInstituteId(instituteId);
        r.setCycleId(cycleId);
        r.setFirstName(firstName);
        r.setLastName(lastName);
        r.setEmail(email);
        r.setMobile(mobile);
        r.setCgpa(new BigDecimal("7.5"));
        r.setHistoryOfArrears(0);
        r.setDegree("B.Tech");
        r.setDepartment("Computer Science");
        r.setPassoutYear(2026);
        r.setDateOfBirth(LocalDate.of(2003, 1, 1));
        r.setAadhaarNumber(aadhaar);
        r.setApplicationType(ApplicationType.STANDARD);
        return r;
    }
}
