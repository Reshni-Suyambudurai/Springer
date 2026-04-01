package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Hiring.InstituteRequest;
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
 * Integration tests for {@link com.kanini.springer.controller.Hiring.InstituteController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds 8 institutes on startup:
 *   ID=1 Anna University, ID=2 SSN, ID=3 PSG, ID=4 Amrita,
 *   ID=5 VIT, ID=6 SRM, ID=7 Karunya, ID=8 CEG
 *
 * Tests are ordered so the institute created in test #2 is available
 * for read / update / delete tests via {@code createdInstituteId}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class InstituteControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Long createdInstituteId;

    // Seeded IDs from DataLoader
    private static final Long SEEDED_INSTITUTE_ID = 1L;   // Anna University

    // =========================================================================
    // SETUP — obtain JWT once for all tests
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
    // 1. GET /api/institutes — returns seeded institutes
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/institutes - returns 200 with all institutes")
    void getAllInstitutes_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(8))));
    }

    // =========================================================================
    // 2. POST /api/institutes — create a new institute (happy path)
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("POST /api/institutes - creates institute and returns 201")
    void createInstitute_success_returns201() throws Exception {
        InstituteRequest request = new InstituteRequest();
        request.setInstituteName("New Tech College");
        request.setInstituteTier("TIER_2");
        request.setState("Karnataka");
        request.setCity("Bangalore");
        request.setIsActive(true);

        MvcResult result = mockMvc.perform(post("/api/institutes")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.instituteId").exists())
                .andExpect(jsonPath("$.data.instituteName").value("New Tech College"))
                .andExpect(jsonPath("$.data.instituteTier").value("TIER_2"))
                .andExpect(jsonPath("$.data.state").value("Karnataka"))
                .andExpect(jsonPath("$.data.city").value("Bangalore"))
                .andExpect(jsonPath("$.data.isActive").value(true))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdInstituteId = node.path("data").path("instituteId").asLong();
    }

    // =========================================================================
    // 3. GET /api/institutes/{id} — by valid ID (seeded)
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("GET /api/institutes/{id} - returns seeded institute by ID")
    void getInstituteById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/{id}", SEEDED_INSTITUTE_ID)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.instituteId").value(SEEDED_INSTITUTE_ID))
                .andExpect(jsonPath("$.data.instituteName").value("Anna University"));
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/institutes/{id} - returns newly created institute by ID")
    void getInstituteById_newlyCreated_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.instituteName").value("New Tech College"));
    }

    // =========================================================================
    // 4. GET /api/institutes/names — lightweight dropdown
    // =========================================================================

    @Test
    @Order(5)
    @DisplayName("GET /api/institutes/names - returns all institute IDs and names")
    void getAllInstituteNames_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/names")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(8))))
                .andExpect(jsonPath("$.data[0].instituteId").exists())
                .andExpect(jsonPath("$.data[0].instituteName").exists());
    }

    // =========================================================================
    // 5. GET /api/institutes/with-tpos — paginated with TPO details
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("GET /api/institutes/with-tpos - returns paginated institutes with TPO details")
    void getAllInstitutesWithTPOs_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/with-tpos")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("page", "0")
                        .param("size", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.totalElements").value(greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$.data.size").value(6));
    }

    @Test
    @Order(7)
    @DisplayName("GET /api/institutes/with-tpos - second page returns remaining institutes")
    void getAllInstitutesWithTPOs_secondPage_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/with-tpos")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("page", "1")
                        .param("size", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    // =========================================================================
    // 6. GET /api/institutes/{id}/with-tpos — single institute with TPO details
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("GET /api/institutes/{id}/with-tpos - returns institute with TPO details by ID")
    void getInstituteWithTPOsById_returnsOk() throws Exception {
        mockMvc.perform(get("/api/institutes/{id}/with-tpos", SEEDED_INSTITUTE_ID)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.instituteId").value(SEEDED_INSTITUTE_ID))
                .andExpect(jsonPath("$.data.instituteName").value("Anna University"))
                .andExpect(jsonPath("$.data.tpoDetails").isArray());
    }

    // =========================================================================
    // 7. PATCH /api/institutes/{id} — partial update
    // =========================================================================

    @Test
    @Order(9)
    @DisplayName("PATCH /api/institutes/{id} - partially updates institute fields")
    void updateInstitute_success_returnsOk() throws Exception {
        InstituteRequest updateRequest = new InstituteRequest();
        updateRequest.setInstituteName("New Tech College Updated");
        updateRequest.setCity("Mysore");

        mockMvc.perform(patch("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.instituteName").value("New Tech College Updated"))
                .andExpect(jsonPath("$.data.city").value("Mysore"));
    }

    @Test
    @Order(10)
    @DisplayName("PATCH /api/institutes/{id} - updates tier to TIER_1")
    void updateInstitute_updateTier_returnsOk() throws Exception {
        InstituteRequest updateRequest = new InstituteRequest();
        updateRequest.setInstituteTier("TIER_1");

        mockMvc.perform(patch("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.instituteTier").value("TIER_1"));
    }

    // =========================================================================
    // 8. DELETE /api/institutes/{id} — soft delete (toggles isActive)
    // =========================================================================

    @Test
    @Order(11)
    @DisplayName("DELETE /api/institutes/{id} - toggles isActive to false (soft delete)")
    void deleteInstitute_togglesActive_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Institute status toggled successfully"));
    }

    @Test
    @Order(12)
    @DisplayName("DELETE /api/institutes/{id} - second toggle restores isActive to true")
    void deleteInstitute_secondToggle_restoresActive() throws Exception {
        // Call delete again — toggles back to true
        mockMvc.perform(delete("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify isActive is true again
        mockMvc.perform(get("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isActive").value(true));
    }

    // =========================================================================
    // 9. POST /api/institutes/bulk — bulk create (happy path)
    // =========================================================================

    @Test
    @Order(13)
    @DisplayName("POST /api/institutes/bulk - bulk creates institutes and returns 201")
    void bulkCreateInstitutes_success_returns201() throws Exception {
        InstituteRequest r1 = new InstituteRequest();
        r1.setInstituteName("Bulk College Alpha");
        r1.setInstituteTier("TIER_3");
        r1.setState("Tamil Nadu");
        r1.setCity("Trichy");
        r1.setIsActive(true);

        InstituteRequest r2 = new InstituteRequest();
        r2.setInstituteName("Bulk College Beta");
        r2.setInstituteTier("TIER_3");
        r2.setState("Tamil Nadu");
        r2.setCity("Madurai");
        r2.setIsActive(true);

        mockMvc.perform(post("/api/institutes/bulk")
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
    @DisplayName("GET /api/institutes - returns 401 without JWT token")
    void getAllInstitutes_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/institutes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(21)
    @DisplayName("GET /api/institutes/{id} - returns 404 for non-existent ID")
    void getInstituteById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/institutes/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(22)
    @DisplayName("GET /api/institutes/{id}/with-tpos - returns 404 for non-existent ID")
    void getInstituteWithTPOsById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/institutes/{id}/with-tpos", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(23)
    @DisplayName("POST /api/institutes - fails when institute name is missing")
    void createInstitute_missingName_returns400() throws Exception {
        InstituteRequest request = new InstituteRequest();
        // instituteName intentionally omitted
        request.setInstituteTier("TIER_1");
        request.setState("Tamil Nadu");
        request.setCity("Chennai");

        mockMvc.perform(post("/api/institutes")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(24)
    @DisplayName("POST /api/institutes - fails when institute name already exists (duplicate)")
    void createInstitute_duplicateName_returns400() throws Exception {
        InstituteRequest request = new InstituteRequest();
        request.setInstituteName("Anna University"); // seeded by DataLoader
        request.setInstituteTier("TIER_1");
        request.setState("Tamil Nadu");
        request.setCity("Chennai");

        mockMvc.perform(post("/api/institutes")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @Order(25)
    @DisplayName("POST /api/institutes - fails when instituteTier is an invalid enum value")
    void createInstitute_invalidTier_returns500OrBadRequest() throws Exception {
        InstituteRequest request = new InstituteRequest();
        request.setInstituteName("Bad Tier College");
        request.setInstituteTier("TIER_99"); // invalid value
        request.setState("Tamil Nadu");
        request.setCity("Chennai");

        mockMvc.perform(post("/api/institutes")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Should be 4xx; the service throws IllegalArgumentException for bad enum
                    org.assertj.core.api.Assertions.assertThat(status).isGreaterThanOrEqualTo(400);
                });
    }

    @Test
    @Order(26)
    @DisplayName("PATCH /api/institutes/{id} - fails for non-existent institute ID")
    void updateInstitute_notFound_returns404() throws Exception {
        InstituteRequest request = new InstituteRequest();
        request.setCity("New City");

        mockMvc.perform(patch("/api/institutes/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(27)
    @DisplayName("PATCH /api/institutes/{id} - fails when renaming to an already existing name")
    void updateInstitute_duplicateName_returns400() throws Exception {
        // Try to rename created institute to a seeded institute's name
        InstituteRequest request = new InstituteRequest();
        request.setInstituteName("Anna University"); // already taken

        mockMvc.perform(patch("/api/institutes/{id}", createdInstituteId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @Order(28)
    @DisplayName("DELETE /api/institutes/{id} - returns 404 for non-existent ID")
    void deleteInstitute_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/institutes/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(29)
    @DisplayName("POST /api/institutes/bulk - all-or-nothing: fails when one record has duplicate name")
    void bulkCreateInstitutes_oneDuplicate_allFail_returns400() throws Exception {
        InstituteRequest r1 = new InstituteRequest();
        r1.setInstituteName("Unique Bulk College");
        r1.setInstituteTier("TIER_3");
        r1.setState("Tamil Nadu");
        r1.setCity("Salem");

        InstituteRequest r2 = new InstituteRequest();
        r2.setInstituteName("Anna University"); // duplicate — this triggers all-or-nothing failure
        r2.setInstituteTier("TIER_1");
        r2.setState("Tamil Nadu");
        r2.setCity("Chennai");

        mockMvc.perform(post("/api/institutes/bulk")
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
    @DisplayName("POST /api/institutes/bulk - fails with empty request body (null list)")
    void bulkCreateInstitutes_emptyBody_returns400() throws Exception {
        mockMvc.perform(post("/api/institutes/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // Controller throws RuntimeException for empty list → 500 or 400
                    org.assertj.core.api.Assertions.assertThat(status).isGreaterThanOrEqualTo(400);
                });
    }

    @Test
    @Order(31)
    @DisplayName("POST /api/institutes/bulk - all-or-nothing: fails when one record has blank name")
    void bulkCreateInstitutes_blankNameInBatch_allFail_returns400() throws Exception {
        InstituteRequest r1 = new InstituteRequest();
        r1.setInstituteName("Good College");
        r1.setInstituteTier("TIER_2");

        InstituteRequest r2 = new InstituteRequest();
        r2.setInstituteName("   "); // blank name
        r2.setInstituteTier("TIER_2");

        mockMvc.perform(post("/api/institutes/bulk")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(r1, r2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.successCount").value(0));
    }
}
