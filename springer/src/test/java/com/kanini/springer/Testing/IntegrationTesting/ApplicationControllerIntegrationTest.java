package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.ApplicationRequest;
import com.kanini.springer.dto.Drive.ApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateRequest;
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
 * Integration tests for {@link com.kanini.springer.controller.Drive.ApplicationController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds candidates, drives, and users before tests run.
 * Tests are ordered so created resources are available for subsequent tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class ApplicationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Long createdApplicationId;

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
    // 1. GET /api/applications — returns all applications
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/applications - returns all applications with success")
    void getAllApplications_returnsOk() throws Exception {
        mockMvc.perform(get("/api/applications")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // =========================================================================
    // 2. POST /api/applications — create applications (requires valid drive + candidates)
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("POST /api/applications - returns 400 when driveId is null")
    void createApplications_nullDriveId_returns400() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setDriveId(null);
        request.setCandidateIds(List.of(1L));
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/applications - returns 400 when createdBy is null")
    void createApplications_nullCreatedBy_returns400() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setDriveId(1L);
        request.setCandidateIds(List.of(1L));
        request.setCreatedBy(null);

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    @DisplayName("POST /api/applications - returns 400 when candidateIds is empty and no filter")
    void createApplications_emptyCandidateIds_returns400() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setDriveId(1L);
        request.setCandidateIds(List.of());
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/applications - returns 404 when driveId does not exist")
    void createApplications_nonExistentDrive_returns404() throws Exception {
        ApplicationRequest request = new ApplicationRequest();
        request.setDriveId(99999L);
        request.setCandidateIds(List.of(1L));
        request.setCreatedBy(1L);

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 3. GET /api/applications/drive/{driveId} — get by drive
    // =========================================================================

    @Test
    @Order(10)
    @DisplayName("GET /api/applications/drive/{driveId} - returns applications for valid drive")
    void getApplicationsByDriveId_validDrive_returnsOk() throws Exception {
        mockMvc.perform(get("/api/applications/drive/{driveId}", 1L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @Order(11)
    @DisplayName("GET /api/applications/drive/{driveId} - returns empty array for non-existent drive")
    void getApplicationsByDriveId_nonExistentDrive_returnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/applications/drive/{driveId}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    // =========================================================================
    // 4. PATCH /api/applications/{id}/status — update single application status
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("PATCH /api/applications/{id}/status - returns 404 for non-existent application")
    void updateApplicationStatus_nonExistent_returns404() throws Exception {
        ApplicationStatusUpdateRequest request = new ApplicationStatusUpdateRequest("SELECTED", 1L);

        mockMvc.perform(patch("/api/applications/{applicationId}/status", 99999L)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // 5. PATCH /api/applications/bulk/status — bulk update application status
    // =========================================================================

    @Test
    @Order(25)
    @DisplayName("PATCH /api/applications/bulk/status - returns 400 when applications list is empty")
    void bulkUpdateApplicationStatus_emptyList_returns400() throws Exception {
        BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
        request.setApplicationIds(List.of());
        request.setApplicationStatus("IN_DRIVE");

        mockMvc.perform(patch("/api/applications/bulk/status")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(26)
    @DisplayName("PATCH /api/applications/bulk/status - handles non-existent application IDs gracefully")
    void bulkUpdateApplicationStatus_nonExistentIds_returnsWithErrors() throws Exception {
        BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
        request.setApplicationIds(List.of(99999L));
        request.setApplicationStatus("IN_DRIVE");

        mockMvc.perform(patch("/api/applications/bulk/status")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.failureCount").value(1))
                .andExpect(jsonPath("$.data.errorMessages", hasSize(1)));
    }

    // =========================================================================
    // 6. GET /api/applications/drive/{driveId}/batches — get batch candidates
    // =========================================================================

    @Test
    @Order(30)
    @DisplayName("GET /api/applications/drive/{driveId}/batches - returns batch map")
    void getBatchCandidatesByDriveId_returnsOk() throws Exception {
        mockMvc.perform(get("/api/applications/drive/{driveId}/batches", 1L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(40)
    @DisplayName("GET /api/applications - returns 401 without JWT")
    void getAllApplications_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/applications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(41)
    @DisplayName("POST /api/applications - returns 401 without JWT")
    void createApplications_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(42)
    @DisplayName("PATCH /api/applications/bulk/status - returns 401 without JWT")
    void bulkUpdateApplicationStatus_noAuth_returns401() throws Exception {
        mockMvc.perform(patch("/api/applications/bulk/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
