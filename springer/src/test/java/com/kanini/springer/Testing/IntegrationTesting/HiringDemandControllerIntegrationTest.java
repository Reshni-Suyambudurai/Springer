package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Hiring.HiringDemandRequest;
import com.kanini.springer.entity.enums.Enums.ApprovalStatus;
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
 * Integration tests for {@link com.kanini.springer.controller.Hiring.HiringDemandController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds hiring cycles, users, and skills before tests run.
 * Tests are ordered so resources created in earlier tests are available later.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class HiringDemandControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Long createdDemandId;
    private Long testCycleId; // Create our own test cycle instead of using DataLoader

    // =========================================================================
    // SETUP — obtain JWT and create test cycle
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
                .andReturn();

        org.junit.jupiter.api.Assumptions.assumeTrue(
                result.getResponse().getStatus() == 200,
                "Skipping: login returned HTTP " + result.getResponse().getStatus() + " — seed users unavailable");

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        jwtToken = node.path("data").path("token").asText();

        // Create a test cycle for demands (don't rely on DataLoader)
        MvcResult cycleResult = mockMvc.perform(multipart("/api/hiring/cycles")
                        .param("cycleYear", "2027")
                        .param("cycleName", "Test Cycle for Demands")
                        .param("compensationBand", "50000")
                        .param("budget", "1000000")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode cycleNode = objectMapper.readTree(cycleResult.getResponse().getContentAsString());
        testCycleId = cycleNode.path("data").path("cycleId").asLong();
    }

    // =========================================================================
    // 1. POST /api/hiring/demands — create demand
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("POST /api/hiring/demands - creates demand successfully")
    void createDemand_validRequest_returns201() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setCycleId(testCycleId); // Use our test cycle
        request.setBusinessUnit("DATA_ANALYTICS_AND_AI");
        request.setDemandCount(5);
        request.setCompensationBand("Band A");
        request.setApprovalStatus(ApprovalStatus.DRAFT);
        request.setSkillIds(List.of(1L, 2L));

        MvcResult result = mockMvc.perform(post("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.demandId").isNumber())
                .andExpect(jsonPath("$.data.businessUnit").value("DATA_ANALYTICS_AND_AI"))
                .andExpect(jsonPath("$.data.demandCount").value(5))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdDemandId = node.path("data").path("demandId").asLong();
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/hiring/demands - returns 400 when cycleId is null")
    void createDemand_nullCycleId_returns400() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setCycleId(null);
        request.setBusinessUnit("DATA_ANALYTICS_AND_AI");
        request.setDemandCount(5);
        request.setCompensationBand("Band A");
        request.setApprovalStatus(ApprovalStatus.DRAFT);
        request.setSkillIds(List.of(1L));

        mockMvc.perform(post("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Cycle ID is required")));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/hiring/demands - returns 400 when businessUnit is blank")
    void createDemand_blankBusinessUnit_returns400() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setCycleId(1L);
        request.setBusinessUnit("");
        request.setDemandCount(5);
        request.setCompensationBand("Band A");
        request.setApprovalStatus(ApprovalStatus.DRAFT);
        request.setSkillIds(List.of(1L));

        mockMvc.perform(post("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(4)
    @DisplayName("POST /api/hiring/demands - returns 400 when demandCount is null")
    void createDemand_nullDemandCount_returns400() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setCycleId(1L);
        request.setBusinessUnit("DATA_ANALYTICS_AND_AI");
        request.setDemandCount(null);
        request.setCompensationBand("Band A");
        request.setApprovalStatus(ApprovalStatus.DRAFT);
        request.setSkillIds(List.of(1L));

        mockMvc.perform(post("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/hiring/demands - returns 400 when skillIds is empty")
    void createDemand_emptySkillIds_returns400() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setCycleId(1L);
        request.setBusinessUnit("DATA_ANALYTICS_AND_AI");
        request.setDemandCount(5);
        request.setCompensationBand("Band A");
        request.setApprovalStatus(ApprovalStatus.DRAFT);
        request.setSkillIds(List.of());

        mockMvc.perform(post("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("userId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 2. GET /api/hiring/demands/{demandId} — get by ID
    // =========================================================================

    @Test
    @Order(10)
    @DisplayName("GET /api/hiring/demands/{id} - returns created demand")
    void getDemandById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/hiring/demands/{id}", createdDemandId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.demandId").value(createdDemandId))
                .andExpect(jsonPath("$.data.businessUnit").value("DATA_ANALYTICS_AND_AI"));
    }

    @Test
    @Order(11)
    @DisplayName("GET /api/hiring/demands/{id} - returns 404 for non-existent ID")
    void getDemandById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/hiring/demands/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 3. GET /api/hiring/demands — get all or by filter
    // =========================================================================

    @Test
    @Order(15)
    @DisplayName("GET /api/hiring/demands - returns all demands")
    void getAllDemands_returnsOk() throws Exception {
        mockMvc.perform(get("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(16)
    @DisplayName("GET /api/hiring/demands?cycleId=1 - returns demands for cycle")
    void getDemandsByCycle_returnsOk() throws Exception {
        mockMvc.perform(get("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("cycleId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(17)
    @DisplayName("GET /api/hiring/demands?status=DRAFT - returns demands by status")
    void getDemandsByStatus_returnsOk() throws Exception {
        mockMvc.perform(get("/api/hiring/demands")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("status", "DRAFT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // =========================================================================
    // 4. PATCH /api/hiring/demands/{demandId} — update demand
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("PATCH /api/hiring/demands/{id} - updates demand count")
    void updateDemand_validRequest_returnsOk() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setDemandCount(10);

        mockMvc.perform(patch("/api/hiring/demands/{id}", createdDemandId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.demandCount").value(10));
    }

    @Test
    @Order(21)
    @DisplayName("PATCH /api/hiring/demands/{id} - returns 404 for non-existent ID")
    void updateDemand_notFound_returns404() throws Exception {
        HiringDemandRequest request = new HiringDemandRequest();
        request.setDemandCount(10);

        mockMvc.perform(patch("/api/hiring/demands/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 5. DELETE /api/hiring/demands/{demandId} — delete demand
    // =========================================================================

    @Test
    @Order(30)
    @DisplayName("DELETE /api/hiring/demands/{id} - deletes DRAFT demand")
    void deleteDemand_draft_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/hiring/demands/{id}", createdDemandId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(31)
    @DisplayName("DELETE /api/hiring/demands/{id} - returns 404 after deletion")
    void getDemandById_afterDelete_returns404() throws Exception {
        mockMvc.perform(get("/api/hiring/demands/{id}", createdDemandId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(32)
    @DisplayName("DELETE /api/hiring/demands/{id} - returns 404 for non-existent ID")
    void deleteDemand_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/hiring/demands/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(40)
    @DisplayName("GET /api/hiring/demands - returns 401 without JWT")
    void getAllDemands_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/hiring/demands"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(41)
    @DisplayName("POST /api/hiring/demands - returns 401 without JWT")
    void createDemand_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/hiring/demands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
