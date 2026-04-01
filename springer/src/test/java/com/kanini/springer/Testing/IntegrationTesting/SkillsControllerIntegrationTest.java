package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Hiring.SkillRequest;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link com.kanini.springer.controller.Hiring.SkillsController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds 37 technical skills (Java, Python, …) + 8 soft skills (Communication, …)
 * for a total of 45 skills before any test runs.
 *
 * Tests are ordered so the skill created in test #3 is available via
 * {@code createdSkillId} for subsequent tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class SkillsControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Long createdSkillId;     // captured after POST in test #3
    private Long secondSkillId;      // captured after second POST — used for dup-name update test

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
    // 1. GET /api/skills — returns all seeded skills
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/skills - returns all seeded skills (≥45)")
    void getAllSkills_seededData_returnsOk() throws Exception {
        mockMvc.perform(get("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(45))));
    }

    // =========================================================================
    // 2. GET /api/skills/name/{name} — with seeded skill
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("GET /api/skills/name/Java - returns seeded TECHNICAL skill")
    void getSkillByName_seededJava_returnsOk() throws Exception {
        mockMvc.perform(get("/api/skills/name/{skillName}", "Java")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillName").value("Java"))
                .andExpect(jsonPath("$.data.category").value("TECHNICAL"))
                .andExpect(jsonPath("$.data.skillId").isNumber());
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/skills/name/Communication - returns seeded SOFT_SKILL")
    void getSkillByName_seededCommunication_returnsOk() throws Exception {
        mockMvc.perform(get("/api/skills/name/{skillName}", "Communication")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillName").value("Communication"))
                .andExpect(jsonPath("$.data.category").value("SOFT_SKILL"));
    }

    // =========================================================================
    // 3. POST /api/skills — create new skill, capture ID
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("POST /api/skills - creates new TECHNICAL skill and returns 201")
    void createSkill_technical_returns201() throws Exception {
        SkillRequest request = new SkillRequest("GraphQL", "TECHNICAL");

        MvcResult result = mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillId").isNumber())
                .andExpect(jsonPath("$.data.skillName").value("GraphQL"))
                .andExpect(jsonPath("$.data.category").value("TECHNICAL"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdSkillId = node.path("data").path("skillId").asLong();
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/skills - creates new SOFT_SKILL skill and returns 201")
    void createSkill_softSkill_returns201() throws Exception {
        SkillRequest request = new SkillRequest("Negotiation", "SOFT_SKILL");

        MvcResult result = mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillName").value("Negotiation"))
                .andExpect(jsonPath("$.data.category").value("SOFT_SKILL"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        secondSkillId = node.path("data").path("skillId").asLong();
    }

    // =========================================================================
    // 4. GET /api/skills/{id}
    // =========================================================================

    @Test
    @Order(6)
    @DisplayName("GET /api/skills/{id} - returns created skill by ID")
    void getSkillById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/skills/{id}", createdSkillId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillId").value(createdSkillId))
                .andExpect(jsonPath("$.data.skillName").value("GraphQL"))
                .andExpect(jsonPath("$.data.category").value("TECHNICAL"));
    }

    // =========================================================================
    // 5. GET /api/skills/name/{name} — after creation
    // =========================================================================

    @Test
    @Order(7)
    @DisplayName("GET /api/skills/name/GraphQL - returns newly created skill by name")
    void getSkillByName_created_returnsOk() throws Exception {
        mockMvc.perform(get("/api/skills/name/{skillName}", "GraphQL")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillId").value(createdSkillId))
                .andExpect(jsonPath("$.data.skillName").value("GraphQL"));
    }

    // =========================================================================
    // 6. PUT /api/skills/{id} — update
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("PUT /api/skills/{id} - updates skill name and category")
    void updateSkill_validRequest_returnsOk() throws Exception {
        SkillRequest request = new SkillRequest("GraphQL Advanced", "TECHNICAL");

        mockMvc.perform(put("/api/skills/{id}", createdSkillId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.skillId").value(createdSkillId))
                .andExpect(jsonPath("$.data.skillName").value("GraphQL Advanced"))
                .andExpect(jsonPath("$.data.category").value("TECHNICAL"));
    }

    @Test
    @Order(9)
    @DisplayName("PUT /api/skills/{id} - updates skill category to SOFT_SKILL")
    void updateSkill_changeCategory_returnsOk() throws Exception {
        SkillRequest request = new SkillRequest("GraphQL Advanced", "SOFT_SKILL");

        mockMvc.perform(put("/api/skills/{id}", createdSkillId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.category").value("SOFT_SKILL"));
    }

    // =========================================================================
    // 7. DELETE /api/skills/{id}
    // =========================================================================

    @Test
    @Order(10)
    @DisplayName("DELETE /api/skills/{id} - deletes unreferenced skill and returns 200")
    void deleteSkill_unreferenced_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/skills/{id}", createdSkillId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skill deleted successfully"));
    }

    @Test
    @Order(11)
    @DisplayName("DELETE /api/skills/{id} - also deletes second unreferenced skill")
    void deleteSkill_secondSkill_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/skills/{id}", secondSkillId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(12)
    @DisplayName("GET /api/skills/{id} - returns 404 after deletion")
    void getSkillById_afterDelete_returns404() throws Exception {
        mockMvc.perform(get("/api/skills/{id}", createdSkillId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("GET /api/skills - returns 401 without JWT")
    void getAllSkills_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/skills"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(21)
    @DisplayName("GET /api/skills/{id} - returns 404 for non-existent skill ID")
    void getSkillById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/skills/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(22)
    @DisplayName("GET /api/skills/name/{name} - returns 404 for non-existent skill name")
    void getSkillByName_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/skills/name/{skillName}", "NonExistentSkillXYZ")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(23)
    @DisplayName("POST /api/skills - returns 400 for duplicate skill name")
    void createSkill_duplicateName_returns400() throws Exception {
        SkillRequest request = new SkillRequest("Java", "TECHNICAL");  // already seeded

        mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @Order(24)
    @DisplayName("POST /api/skills - returns 400 for invalid category value")
    void createSkill_invalidCategory_returns400() throws Exception {
        SkillRequest request = new SkillRequest("SomeSkill", "INVALID_CATEGORY");

        mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(25)
    @DisplayName("POST /api/skills - returns 400 when skillName is blank")
    void createSkill_blankSkillName_returns400() throws Exception {
        SkillRequest request = new SkillRequest("  ", "TECHNICAL");

        mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(26)
    @DisplayName("POST /api/skills - returns 400 when category is null")
    void createSkill_nullCategory_returns400() throws Exception {
        SkillRequest request = new SkillRequest("ValidName", null);

        mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(27)
    @DisplayName("PUT /api/skills/{id} - returns 404 for non-existent skill ID")
    void updateSkill_notFound_returns404() throws Exception {
        SkillRequest request = new SkillRequest("GhostSkill", "TECHNICAL");

        mockMvc.perform(put("/api/skills/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(28)
    @DisplayName("PUT /api/skills/{id} - returns 400 when updating to a name already taken by another skill")
    void updateSkill_duplicateName_returns400() throws Exception {
        // First create a fresh skill to update
        SkillRequest createReq = new SkillRequest("TypeScript", "TECHNICAL");
        MvcResult createResult = mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long tempId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("skillId").asLong();

        // Try to rename it to a seeded name
        SkillRequest updateReq = new SkillRequest("Python", "TECHNICAL");  // seeded

        mockMvc.perform(put("/api/skills/{id}", tempId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));

        // Cleanup — delete the temp skill
        mockMvc.perform(delete("/api/skills/{id}", tempId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(29)
    @DisplayName("PUT /api/skills/{id} - returns 400 for invalid category on update")
    void updateSkill_invalidCategory_returns400() throws Exception {
        // Create a fresh temp skill
        SkillRequest createReq = new SkillRequest("Kotlin", "TECHNICAL");
        MvcResult createResult = mockMvc.perform(post("/api/skills")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Long tempId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("skillId").asLong();

        SkillRequest updateReq = new SkillRequest("Kotlin", "WRONG_ENUM");

        mockMvc.perform(put("/api/skills/{id}", tempId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Cleanup
        mockMvc.perform(delete("/api/skills/{id}", tempId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(30)
    @DisplayName("DELETE /api/skills/{id} - returns 404 for non-existent skill ID")
    void deleteSkill_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/skills/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
