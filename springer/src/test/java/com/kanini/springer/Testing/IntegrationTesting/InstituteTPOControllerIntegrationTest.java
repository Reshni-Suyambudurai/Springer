package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Hiring.InstituteContactRequest;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link com.kanini.springer.controller.Hiring.InstituteTPOController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds 8 institutes; no TPO contacts are seeded.
 *
 *   Seeded institute ID=1 → Anna University
 *   Seeded institute ID=2 → SSN College of Engineering
 *
 * Tests are ordered so the contact created in test #2 is available
 * by its captured {@code createdTpoId} for subsequent tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class InstituteTPOControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Integer createdTpoId;        // from single-create test
    private Integer secondTpoId;         // second contact for update/delete tests

    private static final Long INSTITUTE_ID_1 = 1L;   // Anna University
    private static final Long INSTITUTE_ID_2 = 2L;   // SSN College

    // =========================================================================
    // SETUP — obtain JWT once
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

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        jwtToken = node.path("data").path("token").asText();
    }

    // =========================================================================
    // 1. POST /api/institutes/contacts — create single contact (happy path)
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("POST /api/institutes/contacts - creates TPO contact and returns 201")
    void createContact_success_returns201() throws Exception {
        InstituteContactRequest request = buildRequest(
                INSTITUTE_ID_1, "Ravi Kumar", "ravi.kumar@annauniv.edu",
                "9876543210", "Placement Officer", "ACTIVE", true
        );

        MvcResult result = mockMvc.perform(post("/api/institutes/contacts")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tpoId").exists())
                .andExpect(jsonPath("$.data.tpoName").value("Ravi Kumar"))
                .andExpect(jsonPath("$.data.tpoEmail").value("ravi.kumar@annauniv.edu"))
                .andExpect(jsonPath("$.data.tpoMobile").value("9876543210"))
                .andExpect(jsonPath("$.data.tpoStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.isPrimary").value(true))
                .andExpect(jsonPath("$.data.instituteId").value(INSTITUTE_ID_1))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdTpoId = node.path("data").path("tpoId").asInt();
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/institutes/contacts - creates second contact with defaults")
    void createSecondContact_defaultsApplied() throws Exception {
        InstituteContactRequest request = buildRequest(
                INSTITUTE_ID_1, "Meena Devi", "meena.devi@annauniv.edu",
                "9000000001", "TPO", null, null   // status and isPrimary omitted
        );

        MvcResult result = mockMvc.perform(post("/api/institutes/contacts")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tpoStatus").value("ACTIVE"))    // default
                .andExpect(jsonPath("$.data.isPrimary").value(false))        // default
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        secondTpoId = node.path("data").path("tpoId").asInt();
    }

    // =========================================================================
    // 2. GET /api/institutes/contacts/{tpoId}
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("GET /api/institutes/contacts/{tpoId} - returns contact by ID")
    void getContactById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/contacts/{tpoId}", createdTpoId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tpoId").value(createdTpoId))
                .andExpect(jsonPath("$.data.tpoName").value("Ravi Kumar"))
                .andExpect(jsonPath("$.data.instituteId").value(INSTITUTE_ID_1));
    }

    // =========================================================================
    // 3. GET /api/institutes/contacts/institute/{instituteId}
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("GET /api/institutes/contacts/institute/{id} - returns contacts for institute")
    void getContactsByInstituteId_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/contacts/institute/{instituteId}", INSTITUTE_ID_1)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/institutes/contacts/institute/{id} - returns empty list for institute with no contacts")
    void getContactsByInstituteId_noContacts_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/institutes/contacts/institute/{instituteId}", INSTITUTE_ID_2)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    // =========================================================================
    // 4. PATCH /api/institutes/contacts/{tpoId}
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("PATCH /api/institutes/contacts/{tpoId} - partially updates contact")
    void updateContact_success_returnsOk() throws Exception {
        InstituteContactRequest updateRequest = new InstituteContactRequest();
        updateRequest.setTpoName("Ravi Kumar Updated");
        updateRequest.setTpoDesignation("Senior Placement Officer");

        mockMvc.perform(patch("/api/institutes/contacts/{tpoId}", createdTpoId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tpoName").value("Ravi Kumar Updated"))
                .andExpect(jsonPath("$.data.tpoDesignation").value("Senior Placement Officer"));
    }

    @Test
    @Order(7)
    @DisplayName("PATCH /api/institutes/contacts/{tpoId} - updates status to INACTIVE")
    void updateContact_statusToInactive_returnsOk() throws Exception {
        InstituteContactRequest updateRequest = new InstituteContactRequest();
        updateRequest.setTpoStatus("INACTIVE");

        mockMvc.perform(patch("/api/institutes/contacts/{tpoId}", createdTpoId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tpoStatus").value("INACTIVE"));
    }

    @Test
    @Order(8)
    @DisplayName("PATCH /api/institutes/contacts/{tpoId} - updates isPrimary flag")
    void updateContact_isPrimary_returnsOk() throws Exception {
        InstituteContactRequest updateRequest = new InstituteContactRequest();
        updateRequest.setIsPrimary(false);

        mockMvc.perform(patch("/api/institutes/contacts/{tpoId}", createdTpoId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isPrimary").value(false));
    }

    // =========================================================================
    // 5. DELETE /api/institutes/contacts/{tpoId} — toggle status
    // =========================================================================

    @Test
    @Order(9)
    @DisplayName("DELETE /api/institutes/contacts/{tpoId} - toggles status INACTIVE -> ACTIVE")
    void deleteContact_toggleStatus_returnsOk() throws Exception {
        // createdTpoId is currently INACTIVE (from test order=7)
        mockMvc.perform(delete("/api/institutes/contacts/{tpoId}", createdTpoId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Contact status toggled successfully"));
    }

    @Test
    @Order(10)
    @DisplayName("DELETE /api/institutes/contacts/{tpoId} - second toggle sets status to INACTIVE again")
    void deleteContact_secondToggle_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/institutes/contacts/{tpoId}", createdTpoId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // 6. POST /api/institutes/contacts/institute/{instituteId}/bulk — bulk for specific institute
    // =========================================================================

    @Test
    @Order(11)
    @DisplayName("POST /api/institutes/contacts/institute/{id}/bulk - bulk creates contacts for institute")
    void bulkCreateContactsForInstitute_success_returns201() throws Exception {
        InstituteContactRequest r1 = buildRequest(
                null, "Sundar Ram", "sundar.ram@ssn.edu",
                "9111111111", "TPO Head", "ACTIVE", true
        );
        InstituteContactRequest r2 = buildRequest(
                null, "Lakshmi Priya", "lakshmi.priya@ssn.edu",
                "9222222222", "Coordinator", "ACTIVE", false
        );

        mockMvc.perform(post("/api/institutes/contacts/institute/{instituteId}/bulk", INSTITUTE_ID_2)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(r1, r2))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.successCount").value(2))
                .andExpect(jsonPath("$.data.failureCount").value(0))
                .andExpect(jsonPath("$.data.successfulInserts", hasSize(2)));
    }

    // =========================================================================
    // 7. POST /api/institutes/contacts/bulk — bulk across multiple institutes
    // =========================================================================

    @Test
    @Order(12)
    @DisplayName("POST /api/institutes/contacts/bulk - bulk creates contacts across institutes")
    void bulkCreateAllContacts_success_returns201() throws Exception {
        InstituteContactRequest r1 = buildRequest(
                1L, "Arjun TPO", "arjun.tpo@annauniv.edu",
                "9333333333", "Placement Head", "ACTIVE", false
        );
        InstituteContactRequest r2 = buildRequest(
                2L, "Divya TPO", "divya.tpo@ssn.edu",
                "9444444444", "Coordinator", "ACTIVE", false
        );

        mockMvc.perform(post("/api/institutes/contacts/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(r1, r2))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.successCount").value(2))
                .andExpect(jsonPath("$.data.failureCount").value(0))
                .andExpect(jsonPath("$.data.successfulInserts", hasSize(2)));
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("GET /api/institutes/contacts/{tpoId} - returns 401 without JWT")
    void getContactById_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/institutes/contacts/{tpoId}", createdTpoId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(21)
    @DisplayName("GET /api/institutes/contacts/{tpoId} - returns 404 for non-existent ID")
    void getContactById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/institutes/contacts/{tpoId}", 99999)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(22)
    @DisplayName("POST /api/institutes/contacts - fails when instituteId is null (controller validation)")
    void createContact_nullInstituteId_returns400() throws Exception {
        InstituteContactRequest request = buildRequest(
                null, "No Institute", "no.institute@test.com", "9500000001", null, null, null
        );

        mockMvc.perform(post("/api/institutes/contacts")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status).isGreaterThanOrEqualTo(400);
                });
    }

    @Test
    @Order(23)
    @DisplayName("POST /api/institutes/contacts - fails when tpoName is blank (controller validation)")
    void createContact_blankTpoName_returns400() throws Exception {
        InstituteContactRequest request = buildRequest(
                INSTITUTE_ID_1, "  ", "blank.name@test.com", "9600000001", null, null, null
        );

        mockMvc.perform(post("/api/institutes/contacts")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status).isGreaterThanOrEqualTo(400);
                });
    }

    @Test
    @Order(24)
    @DisplayName("POST /api/institutes/contacts - fails when email already exists (duplicate)")
    void createContact_duplicateEmail_returns400() throws Exception {
        InstituteContactRequest request = buildRequest(
                INSTITUTE_ID_1, "Duplicate Guy", "ravi.kumar@annauniv.edu", // already used in test #1
                "9700000001", null, null, null
        );

        mockMvc.perform(post("/api/institutes/contacts")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @Order(25)
    @DisplayName("POST /api/institutes/contacts - fails when institute does not exist")
    void createContact_instituteNotFound_returns404() throws Exception {
        InstituteContactRequest request = buildRequest(
                99999L, "Ghost TPO", "ghost.tpo@test.com", "9800000001", null, null, null
        );

        mockMvc.perform(post("/api/institutes/contacts")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(26)
    @DisplayName("PATCH /api/institutes/contacts/{tpoId} - returns 404 for non-existent ID")
    void updateContact_notFound_returns404() throws Exception {
        InstituteContactRequest request = new InstituteContactRequest();
        request.setTpoName("Phantom");

        mockMvc.perform(patch("/api/institutes/contacts/{tpoId}", 99999)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(27)
    @DisplayName("PATCH /api/institutes/contacts/{tpoId} - fails when renaming email to already taken email")
    void updateContact_duplicateEmail_returns400() throws Exception {
        // secondTpoId tries to take createdTpoId's email
        InstituteContactRequest request = new InstituteContactRequest();
        request.setTpoEmail("ravi.kumar@annauniv.edu"); // taken by createdTpoId

        mockMvc.perform(patch("/api/institutes/contacts/{tpoId}", secondTpoId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @Order(28)
    @DisplayName("DELETE /api/institutes/contacts/{tpoId} - returns 404 for non-existent ID")
    void deleteContact_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/institutes/contacts/{tpoId}", 99999)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(29)
    @DisplayName("POST /api/institutes/contacts/institute/{id}/bulk - all-or-nothing when one email is duplicate")
    void bulkCreateForInstitute_oneDuplicate_allFail_returns400() throws Exception {
        InstituteContactRequest r1 = buildRequest(
                null, "New Person", "new.person@ssn.edu",
                "9100000001", "TPO", "ACTIVE", false
        );
        InstituteContactRequest r2 = buildRequest(
                null, "Sundar Ram", "sundar.ram@ssn.edu",  // already created in test #11
                "9100000002", "TPO Head", "ACTIVE", true
        );

        mockMvc.perform(post("/api/institutes/contacts/institute/{instituteId}/bulk", INSTITUTE_ID_2)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(r1, r2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.successCount").value(0))
                .andExpect(jsonPath("$.data.errorMessages").isArray())
                .andExpect(jsonPath("$.data.errorMessages", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(30)
    @DisplayName("POST /api/institutes/contacts/bulk - fails when one record has missing instituteId")
    void bulkCreateAll_missingInstituteId_allFail_returns400() throws Exception {
        InstituteContactRequest r1 = buildRequest(
                1L, "Valid TPO", "valid.tpo@test.com",
                "9200000001", "TPO", "ACTIVE", false
        );
        InstituteContactRequest r2 = buildRequest(
                null, "No Institute TPO", "no.inst.tpo@test.com",  // missing instituteId
                "9200000002", "TPO", "ACTIVE", false
        );

        mockMvc.perform(post("/api/institutes/contacts/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(r1, r2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.successCount").value(0));
    }

    @Test
    @Order(31)
    @DisplayName("POST /api/institutes/contacts/institute/{id}/bulk - fails for non-existent institute")
    void bulkCreateForInstitute_instituteNotFound_returns400Or404() throws Exception {
        InstituteContactRequest r1 = buildRequest(
                null, "Ghost Person", "ghost.person@test.com",
                "9300000001", "TPO", "ACTIVE", false
        );

        mockMvc.perform(post("/api/institutes/contacts/institute/{instituteId}/bulk", 99999L)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(r1))))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status).isGreaterThanOrEqualTo(400);
                });
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private InstituteContactRequest buildRequest(Long instituteId, String name, String email,
                                                  String mobile, String designation,
                                                  String status, Boolean isPrimary) {
        InstituteContactRequest r = new InstituteContactRequest();
        r.setInstituteId(instituteId);
        r.setTpoName(name);
        r.setTpoEmail(email);
        r.setTpoMobile(mobile);
        r.setTpoDesignation(designation);
        r.setTpoStatus(status);
        r.setIsPrimary(isPrimary);
        return r;
    }
}
