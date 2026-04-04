package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.RoundTemplateRequest;
import com.kanini.springer.dto.Drive.RoundTemplateUpdateRequest;
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
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link com.kanini.springer.controller.Drive.RoundTemplateController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * Tests are ordered so the round template created in test #1 is available for subsequent tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class RoundTemplateControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Long createdRoundConfigId;
    private Long secondRoundConfigId;

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
    // 1. POST /api/round-templates — create round template
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("POST /api/round-templates - creates round template without sections")
    void createRoundTemplate_noSections_returns201() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(101);
        request.setRoundName("Integration Test Round");
        request.setOutoffScore(100);
        request.setMinScore(60);
        request.setWeightage(40);
        request.setCreatedBy(1L);

        MvcResult result = mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roundConfigId").isNumber())
                .andExpect(jsonPath("$.data.roundNo").value(101))
                .andExpect(jsonPath("$.data.roundName").value("Integration Test Round"))
                .andExpect(jsonPath("$.data.outoffScore").value(100))
                .andExpect(jsonPath("$.data.minScore").value(60))
                .andExpect(jsonPath("$.data.weightage").value(40))
                .andExpect(jsonPath("$.data.isActive").value(true))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdRoundConfigId = node.path("data").path("roundConfigId").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/round-templates - creates round template with sections")
    void createRoundTemplate_withSections_returns201() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(102);
        request.setRoundName("Technical Round");
        request.setOutoffScore(100);
        request.setMinScore(70);
        request.setWeightage(30);
        request.setSections(List.of(
                Map.of("sectionName", "Aptitude", "outOf", 30),
                Map.of("sectionName", "Logical", "outOf", 70)
        ));
        request.setCreatedBy(1L);

        MvcResult result = mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roundNo").value(102))
                .andExpect(jsonPath("$.data.sections").isArray())
                .andExpect(jsonPath("$.data.sections", hasSize(2)))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        secondRoundConfigId = node.path("data").path("roundConfigId").asLong();
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/round-templates - creates round template with isActive=false")
    void createRoundTemplate_inactiveExplicitly_returns201() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(103);
        request.setRoundName("Inactive Round");
        request.setOutoffScore(50);
        request.setMinScore(25);
        request.setWeightage(10);
        request.setIsActive(false);
        request.setCreatedBy(1L);

        MvcResult result = mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isActive").value(false))
                .andReturn();

        // Cleanup: delete the inactive round
        Long tempId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("roundConfigId").asLong();
        mockMvc.perform(delete("/api/round-templates/{id}", tempId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // 2. POST — negative cases
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("POST /api/round-templates - returns 400 when roundNo is null")
    void createRoundTemplate_nullRoundNo_returns400() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(null);
        request.setRoundName("Test");
        request.setOutoffScore(100);
        request.setMinScore(60);
        request.setWeightage(40);
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Round number is required")));
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/round-templates - returns 400 when roundName is blank")
    void createRoundTemplate_blankRoundName_returns400() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(1);
        request.setRoundName("  ");
        request.setOutoffScore(100);
        request.setMinScore(60);
        request.setWeightage(40);
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Round name is required")));
    }

    @Test
    @Order(6)
    @DisplayName("POST /api/round-templates - returns 400 when outoffScore is null")
    void createRoundTemplate_nullOutoffScore_returns400() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(1);
        request.setRoundName("Test");
        request.setOutoffScore(null);
        request.setMinScore(60);
        request.setWeightage(40);
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Out of score is required")));
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/round-templates - returns 400 when minScore is null")
    void createRoundTemplate_nullMinScore_returns400() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(1);
        request.setRoundName("Test");
        request.setOutoffScore(100);
        request.setMinScore(null);
        request.setWeightage(40);
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Minimum score is required")));
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/round-templates - returns 400 when weightage is null")
    void createRoundTemplate_nullWeightage_returns400() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(1);
        request.setRoundName("Test");
        request.setOutoffScore(100);
        request.setMinScore(60);
        request.setWeightage(null);
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Weightage is required")));
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/round-templates - returns 400 when createdBy is null")
    void createRoundTemplate_nullCreatedBy_returns400() throws Exception {
        RoundTemplateRequest request = new RoundTemplateRequest();
        request.setRoundNo(1);
        request.setRoundName("Test");
        request.setOutoffScore(100);
        request.setMinScore(60);
        request.setWeightage(40);
        request.setCreatedBy(null);

        mockMvc.perform(post("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Created by user ID is required")));
    }

    // =========================================================================
    // 3. GET /api/round-templates/{roundConfigId} — get by ID
    // =========================================================================

    @Test
    @Order(10)
    @DisplayName("GET /api/round-templates/{id} - returns created round template")
    void getRoundTemplateById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/round-templates/{id}", createdRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roundConfigId").value(createdRoundConfigId))
                .andExpect(jsonPath("$.data.roundNo").value(101))
                .andExpect(jsonPath("$.data.roundName").value("Integration Test Round"));
    }

    @Test
    @Order(11)
    @DisplayName("GET /api/round-templates/{id} - returns 404 for non-existent ID")
    void getRoundTemplateById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/round-templates/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 4. GET /api/round-templates — get all
    // =========================================================================

    @Test
    @Order(15)
    @DisplayName("GET /api/round-templates - returns all round templates")
    void getAllRoundTemplates_returnsOk() throws Exception {
        mockMvc.perform(get("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @Order(16)
    @DisplayName("GET /api/round-templates - each entry has required fields")
    void getAllRoundTemplates_responseShape() throws Exception {
        mockMvc.perform(get("/api/round-templates")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].roundConfigId").isNumber())
                .andExpect(jsonPath("$.data[0].roundNo").isNumber())
                .andExpect(jsonPath("$.data[0].roundName").isString());
    }

    // =========================================================================
    // 5. PATCH /api/round-templates/{roundConfigId} — update
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("PATCH /api/round-templates/{id} - updates round name")
    void updateRoundTemplate_updateName_returnsOk() throws Exception {
        RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
        request.setRoundName("Updated Round Name");

        mockMvc.perform(patch("/api/round-templates/{id}", createdRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roundName").value("Updated Round Name"))
                .andExpect(jsonPath("$.data.roundNo").value(101)); // unchanged
    }

    @Test
    @Order(21)
    @DisplayName("PATCH /api/round-templates/{id} - updates minScore and outoffScore")
    void updateRoundTemplate_updateScores_returnsOk() throws Exception {
        RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
        request.setMinScore(75);
        request.setOutoffScore(150);

        mockMvc.perform(patch("/api/round-templates/{id}", createdRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.minScore").value(75))
                .andExpect(jsonPath("$.data.outoffScore").value(150));
    }

    @Test
    @Order(22)
    @DisplayName("PATCH /api/round-templates/{id} - updates sections")
    void updateRoundTemplate_updateSections_returnsOk() throws Exception {
        RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
        request.setSections(List.of(Map.of("sectionName", "Verbal", "outOf", 50)));

        mockMvc.perform(patch("/api/round-templates/{id}", createdRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sections").isArray())
                .andExpect(jsonPath("$.data.sections", hasSize(1)));
    }

    @Test
    @Order(23)
    @DisplayName("PATCH /api/round-templates/{id} - returns 404 for non-existent ID")
    void updateRoundTemplate_notFound_returns404() throws Exception {
        RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
        request.setRoundName("Ghost");

        mockMvc.perform(patch("/api/round-templates/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 6. DELETE /api/round-templates/{roundConfigId} — soft delete (toggle)
    // =========================================================================

    @Test
    @Order(30)
    @DisplayName("DELETE /api/round-templates/{id} - toggles isActive from true to false")
    void deleteRoundTemplate_activeToInactive_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/round-templates/{id}", secondRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isActive").value(false));
    }

    @Test
    @Order(31)
    @DisplayName("DELETE /api/round-templates/{id} - toggles isActive from false back to true")
    void deleteRoundTemplate_inactiveToActive_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/round-templates/{id}", secondRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isActive").value(true));
    }

    @Test
    @Order(32)
    @DisplayName("DELETE /api/round-templates/{id} - returns 404 for non-existent ID")
    void deleteRoundTemplate_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/round-templates/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 7. Verify state after updates
    // =========================================================================

    @Test
    @Order(35)
    @DisplayName("GET /api/round-templates/{id} - reflects all updates applied earlier")
    void getRoundTemplateById_afterUpdates_reflectsChanges() throws Exception {
        mockMvc.perform(get("/api/round-templates/{id}", createdRoundConfigId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roundName").value("Updated Round Name"))
                .andExpect(jsonPath("$.data.minScore").value(75))
                .andExpect(jsonPath("$.data.outoffScore").value(150));
    }

    // =========================================================================
    // NEGATIVE CASES — Authentication
    // =========================================================================

    @Test
    @Order(40)
    @DisplayName("GET /api/round-templates - returns 401 without JWT")
    void getAllRoundTemplates_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/round-templates"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(41)
    @DisplayName("POST /api/round-templates - returns 401 without JWT")
    void createRoundTemplate_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/round-templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(42)
    @DisplayName("PATCH /api/round-templates/{id} - returns 401 without JWT")
    void updateRoundTemplate_noAuth_returns401() throws Exception {
        mockMvc.perform(patch("/api/round-templates/{id}", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(43)
    @DisplayName("DELETE /api/round-templates/{id} - returns 401 without JWT")
    void deleteRoundTemplate_noAuth_returns401() throws Exception {
        mockMvc.perform(delete("/api/round-templates/{id}", 1L))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(44)
    @DisplayName("GET /api/round-templates/{id} - returns 401 without JWT")
    void getRoundTemplateById_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/round-templates/{id}", 1L))
                .andExpect(status().isUnauthorized());
    }
}
