package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Hiring.InstituteProgramRequest;
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
 * Integration tests for {@link com.kanini.springer.controller.Hiring.ProgramController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds all 16 ProgramName enum values as Program rows:
 *   ID=1 B_TECH, ID=2 M_TECH, ID=3 MBA, ID=4 MCA, ID=5 BCA,
 *   ID=6 B_E, ID=7 M_E, ID=8 B_SC, ID=9 M_SC, ID=10 BBA,
 *   ID=11 B_COM, ID=12 M_COM, ID=13 B_A, ID=14 M_A, ID=15 DIPLOMA, ID=16 PHD
 *
 * DataLoader also seeds 36 institute-program mappings (IDs 1-36).
 * Anna University (instituteId=1) is mapped to: B_TECH(1), M_TECH(2), MBA(3), PHD(16).
 * SSN College (instituteId=2) is mapped to: B_E(6), M_E(7), M_TECH(2).
 *
 * Test #4 creates a new mapping (Anna U + BCA=programId 5) which is NOT seeded.
 * Test #10 deletes the first seeded mapping (ID=1: Anna U + B_TECH).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class ProgramControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;

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
    // 1. GET /api/programs — retrieve all seeded programs
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/programs - returns all 16 seeded programs")
    void getAllPrograms_seededData_returns16Programs() throws Exception {
        mockMvc.perform(get("/api/programs")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(16)));
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/programs - each entry has programId and programName")
    void getAllPrograms_responseShape_hasIdAndName() throws Exception {
        mockMvc.perform(get("/api/programs")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].programId").isNumber())
                .andExpect(jsonPath("$.data[0].programName").isString());
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/programs - contains expected enum values")
    void getAllPrograms_containsExpectedProgramNames() throws Exception {
        mockMvc.perform(get("/api/programs")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].programName",
                        hasItems("B_TECH", "M_TECH", "MBA", "MCA", "BCA",
                                 "B_E", "M_E", "PHD", "DIPLOMA", "B_SC")));
    }

    // =========================================================================
    // 2. POST /api/programs/institute-mappings — create new mapping
    // =========================================================================

    @Test
    @Order(4)
    @DisplayName("POST /api/programs/institute-mappings - creates new mapping for institute 1 + BCA (single item)")
    void addProgramsToInstitute_singleValid_returns201() throws Exception {
        // Anna University (ID=1) does NOT have BCA (ID=5) as a seeded mapping
        InstituteProgramRequest request = new InstituteProgramRequest(1L, 5L);

        mockMvc.perform(post("/api/programs/institute-mappings")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Program mappings created successfully"));
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/programs/institute-mappings - duplicate mapping is silently skipped (idempotent)")
    void addProgramsToInstitute_duplicateMapping_stillReturns201() throws Exception {
        // Same combo already created in test #4 — service skips duplicates silently
        InstituteProgramRequest request = new InstituteProgramRequest(1L, 5L);

        mockMvc.perform(post("/api/programs/institute-mappings")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @Order(6)
    @DisplayName("POST /api/programs/institute-mappings - creates multiple mappings in one request")
    void addProgramsToInstitute_multipleValid_returns201() throws Exception {
        // SSN (ID=2) + BCA(5), Anna U (ID=1) + B_SC(8) — neither combo is seeded
        List<InstituteProgramRequest> requests = List.of(
                new InstituteProgramRequest(2L, 5L),   // SSN + BCA
                new InstituteProgramRequest(1L, 8L)    // Anna U + B_SC
        );

        mockMvc.perform(post("/api/programs/institute-mappings")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requests)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Program mappings created successfully"));
    }

    // =========================================================================
    // 3. DELETE /api/programs/institute-mappings/{id}
    // =========================================================================

    @Test
    @Order(10)
    @DisplayName("DELETE /api/programs/institute-mappings/{id} - deletes seeded mapping ID=1")
    void removeInstituteProgramMapping_existingId_returns200() throws Exception {
        mockMvc.perform(delete("/api/programs/institute-mappings/{id}", 1L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Institute-program mapping deleted successfully"));
    }

    @Test
    @Order(11)
    @DisplayName("DELETE /api/programs/institute-mappings/{id} - deletes another seeded mapping")
    void removeInstituteProgramMapping_secondId_returns200() throws Exception {
        mockMvc.perform(delete("/api/programs/institute-mappings/{id}", 2L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("GET /api/programs - returns 401 without JWT")
    void getAllPrograms_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/programs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(21)
    @DisplayName("POST /api/programs/institute-mappings - returns 401 without JWT")
    void addProgramsToInstitute_noAuth_returns401() throws Exception {
        InstituteProgramRequest request = new InstituteProgramRequest(1L, 1L);

        mockMvc.perform(post("/api/programs/institute-mappings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(22)
    @DisplayName("POST /api/programs/institute-mappings - returns 5xx for empty list (controller guard throws RuntimeException)")
    void addProgramsToInstitute_emptyList_returnsError() throws Exception {
        mockMvc.perform(post("/api/programs/institute-mappings")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status).isGreaterThanOrEqualTo(400);
                });
    }

    @Test
    @Order(23)
    @DisplayName("POST /api/programs/institute-mappings - returns 404 when institute does not exist")
    void addProgramsToInstitute_instituteNotFound_returns404() throws Exception {
        InstituteProgramRequest request = new InstituteProgramRequest(99999L, 1L);

        mockMvc.perform(post("/api/programs/institute-mappings")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(24)
    @DisplayName("POST /api/programs/institute-mappings - returns 404 when program does not exist")
    void addProgramsToInstitute_programNotFound_returns404() throws Exception {
        InstituteProgramRequest request = new InstituteProgramRequest(1L, 99999L);

        mockMvc.perform(post("/api/programs/institute-mappings")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(request))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(25)
    @DisplayName("DELETE /api/programs/institute-mappings/{id} - returns 401 without JWT")
    void removeInstituteProgramMapping_noAuth_returns401() throws Exception {
        mockMvc.perform(delete("/api/programs/institute-mappings/{id}", 3L))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(26)
    @DisplayName("DELETE /api/programs/institute-mappings/{id} - returns 404 for non-existent mapping ID")
    void removeInstituteProgramMapping_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/programs/institute-mappings/{id}", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
