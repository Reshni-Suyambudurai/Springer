package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.EligibilityRuleDTO;
import com.kanini.springer.dto.Drive.EligibilityRuleUpdateRequest;
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
 * Integration tests for the eligibility rule endpoints in
 * {@link com.kanini.springer.controller.Drive.CandidatesController}.
 *
 * Endpoints:
 *   GET  /api/candidates/eligibility-rules
 *   PATCH /api/candidates/eligibility-rules
 *
 * EligibilityRule.json is loaded from the project root.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class EligibilityRuleIntegrationTest {

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
    // 1. GET /api/candidates/eligibility-rules — retrieve current rules
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/candidates/eligibility-rules - returns current rules")
    void getEligibilityRules_returnsOk() throws Exception {
        mockMvc.perform(get("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rules").isArray())
                .andExpect(jsonPath("$.data.logic").isString());
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/candidates/eligibility-rules - rules contain expected fields")
    void getEligibilityRules_hasExpectedFields() throws Exception {
        mockMvc.perform(get("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rules[0].field").isString())
                .andExpect(jsonPath("$.data.rules[0].operator").isString());
    }

    // =========================================================================
    // 2. PATCH /api/candidates/eligibility-rules — update rules
    // =========================================================================

    @Test
    @Order(3)
    @DisplayName("PATCH /api/candidates/eligibility-rules - updates rules successfully")
    void updateEligibilityRules_validRequest_returnsOk() throws Exception {
        EligibilityRuleDTO rule = new EligibilityRuleDTO();
        rule.setField("CGPA");
        rule.setOperator(">=");
        rule.setValue(7.0);
        rule.setMessage("CGPA must be >= {value}");

        EligibilityRuleUpdateRequest request = new EligibilityRuleUpdateRequest();
        request.setRules(List.of(rule));
        request.setLogic("AND");

        mockMvc.perform(patch("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rules", hasSize(1)))
                .andExpect(jsonPath("$.data.rules[0].field").value("CGPA"))
                .andExpect(jsonPath("$.data.logic").value("AND"));
    }

    @Test
    @Order(4)
    @DisplayName("PATCH /api/candidates/eligibility-rules - returns 400 when rules list is empty")
    void updateEligibilityRules_emptyRules_returns400() throws Exception {
        EligibilityRuleUpdateRequest request = new EligibilityRuleUpdateRequest();
        request.setRules(List.of());
        request.setLogic("AND");

        mockMvc.perform(patch("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(5)
    @DisplayName("PATCH /api/candidates/eligibility-rules - defaults logic to AND when null")
    void updateEligibilityRules_nullLogic_defaultsToAnd() throws Exception {
        EligibilityRuleDTO rule = new EligibilityRuleDTO();
        rule.setField("CGPA");
        rule.setOperator(">=");
        rule.setValue(6.5);
        rule.setMessage("CGPA must be >= {value}");

        EligibilityRuleUpdateRequest request = new EligibilityRuleUpdateRequest();
        request.setRules(List.of(rule));
        request.setLogic(null);

        mockMvc.perform(patch("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.logic").value("AND"));
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/candidates/eligibility-rules - reflects previously updated rules")
    void getEligibilityRules_afterUpdate_reflectsChanges() throws Exception {
        mockMvc.perform(get("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rules[0].field").value("CGPA"))
                .andExpect(jsonPath("$.data.logic").value("AND"));
    }

    // =========================================================================
    // 3. Restore original rules to avoid side effects
    // =========================================================================

    @Test
    @Order(7)
    @DisplayName("PATCH /api/candidates/eligibility-rules - restores original rules")
    void updateEligibilityRules_restoreOriginal() throws Exception {
        EligibilityRuleDTO cgpaRule = new EligibilityRuleDTO("CGPA", ">=", 7.0, null, null, "CGPA must be >= {value}", null);
        EligibilityRuleDTO yearRule = new EligibilityRuleDTO("PassoutYear", "BETWEEN", null, 2022, 2026, "Passout year must be between {min} and {max}", null);
        EligibilityRuleDTO arrearsRule = new EligibilityRuleDTO("HistoryOfArrears", "<=", 1.0, null, null, "History of arrears must be <= {value}", null);
        EligibilityRuleDTO degreeRule = new EligibilityRuleDTO("Degree", "IN", null, null, null, "Degree must be one of: {allowedValues}", List.of());
        EligibilityRuleDTO deptRule = new EligibilityRuleDTO("Department", "IN", null, null, null, "Department must be one of: {allowedValues}", List.of());

        EligibilityRuleUpdateRequest request = new EligibilityRuleUpdateRequest();
        request.setRules(List.of(cgpaRule, yearRule, arrearsRule, degreeRule, deptRule));
        request.setLogic("AND");

        mockMvc.perform(patch("/api/candidates/eligibility-rules")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rules", hasSize(5)));
    }

    // =========================================================================
    // NEGATIVE CASES
    // =========================================================================

    @Test
    @Order(20)
    @DisplayName("GET /api/candidates/eligibility-rules - returns 401 without JWT")
    void getEligibilityRules_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/candidates/eligibility-rules"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(21)
    @DisplayName("PATCH /api/candidates/eligibility-rules - returns 401 without JWT")
    void updateEligibilityRules_noAuth_returns401() throws Exception {
        mockMvc.perform(patch("/api/candidates/eligibility-rules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
