package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Common.EmailTemplateRequest;
import com.kanini.springer.dto.Common.EmailTemplateUpdateRequest;
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

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for {@link com.kanini.springer.controller.Common.EmailTemplateController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds 5 email templates on startup.
 * 
 * Tests are ordered to ensure proper test data lifecycle.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class EmailTemplateControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Integer createdTemplateId;

    // =========================================================================
    // SETUP — obtain JWT token
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
    // 1. GET /api/email-templates — get all templates
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/email-templates - returns 200 with all templates")
    void getAllEmailTemplates_returnsOk() throws Exception {
        mockMvc.perform(get("/api/email-templates")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(5)))); // DataLoader seeds 5 templates
    }

    // =========================================================================
    // 2. POST /api/email-templates — create new template
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("POST /api/email-templates - creates template and returns 201")
    void createEmailTemplate_success_returns201() throws Exception {
        EmailTemplateRequest request = new EmailTemplateRequest();
        request.setTemplateName("Test Template");
        request.setSubject("Test Subject");
        request.setBody("<html><body><h1>Test Body</h1></body></html>");

        MvcResult result = mockMvc.perform(post("/api/email-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.templateId").exists())
                .andExpect(jsonPath("$.data.templateName").value("Test Template"))
                .andExpect(jsonPath("$.data.subject").value("Test Subject"))
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdTemplateId = node.path("data").path("templateId").asInt();
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/email-templates - validation fails for null templateName")
    void createEmailTemplate_nullTemplateName_returns400() throws Exception {
        EmailTemplateRequest request = new EmailTemplateRequest();
        request.setTemplateName(null);
        request.setSubject("Test Subject");
        request.setBody("<html><body>Body</body></html>");

        mockMvc.perform(post("/api/email-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    @DisplayName("POST /api/email-templates - validation fails for blank subject")
    void createEmailTemplate_blankSubject_returns400() throws Exception {
        EmailTemplateRequest request = new EmailTemplateRequest();
        request.setTemplateName("Valid Name");
        request.setSubject("");
        request.setBody("<html><body>Body</body></html>");

        mockMvc.perform(post("/api/email-templates")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 3. GET /api/email-templates/{id} — get template by ID
    // =========================================================================

    @Test
    @Order(5)
    @DisplayName("GET /api/email-templates/{id} - returns created template by ID")
    void getEmailTemplateById_found_returnsOk() throws Exception {
        mockMvc.perform(get("/api/email-templates/{templateId}", createdTemplateId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.templateId").value(createdTemplateId))
                .andExpect(jsonPath("$.data.templateName").value("Test Template"));
    }

    @Test
    @Order(6)
    @DisplayName("GET /api/email-templates/{id} - returns 404 for non-existent ID")
    void getEmailTemplateById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/email-templates/{templateId}", 99999)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    // =========================================================================
    // 4. POST /api/email-templates/by-ids — get templates by IDs
    // =========================================================================

    @Test
    @Order(7)
    @DisplayName("POST /api/email-templates/by-ids - returns templates for valid IDs")
    void getEmailTemplatesByIds_validIds_returnsOk() throws Exception {
        List<Integer> templateIds = Collections.singletonList(createdTemplateId);

        mockMvc.perform(post("/api/email-templates/by-ids")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(templateIds)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].templateId").value(createdTemplateId));
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/email-templates/by-ids - returns empty array for non-existent IDs")
    void getEmailTemplatesByIds_nonExistentIds_returnsEmpty() throws Exception {
        List<Integer> templateIds = Arrays.asList(99999, 88888);

        mockMvc.perform(post("/api/email-templates/by-ids")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(templateIds)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    // =========================================================================
    // 5. PATCH /api/email-templates/{id} — update template
    // =========================================================================

    @Test
    @Order(9)
    @DisplayName("PATCH /api/email-templates/{id} - updates template successfully")
    void updateEmailTemplate_success_returnsOk() throws Exception {
        EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
        request.setTemplateName("Updated Template Name");
        request.setSubject("Updated Subject");
        request.setBody("<html><body><h1>Updated Body</h1></body></html>");

        mockMvc.perform(patch("/api/email-templates/{templateId}", createdTemplateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.templateId").value(createdTemplateId))
                .andExpect(jsonPath("$.data.templateName").value("Updated Template Name"))
                .andExpect(jsonPath("$.data.subject").value("Updated Subject"));
    }

    @Test
    @Order(10)
    @DisplayName("PATCH /api/email-templates/{id} - partial update (only subject)")
    void updateEmailTemplate_partialUpdate_returnsOk() throws Exception {
        EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
        request.setSubject("Partially Updated Subject");

        mockMvc.perform(patch("/api/email-templates/{templateId}", createdTemplateId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subject").value("Partially Updated Subject"))
                .andExpect(jsonPath("$.data.templateName").value("Updated Template Name")); // unchanged from previous test
    }

    @Test
    @Order(11)
    @DisplayName("PATCH /api/email-templates/{id} - returns 404 for non-existent ID")
    void updateEmailTemplate_notFound_returns404() throws Exception {
        EmailTemplateUpdateRequest request = new EmailTemplateUpdateRequest();
        request.setSubject("Test");

        mockMvc.perform(patch("/api/email-templates/{templateId}", 99999)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 6. POST /api/email-templates/send-personalized — personalized email
    //    (must run BEFORE delete tests so the template still exists)
    // =========================================================================

    @Test
    @Order(12)
    @DisplayName("POST /api/email-templates/send-personalized - accepts valid request")
    void sendPersonalizedEmail_validRequest_returnsOk() throws Exception {
        // Use createdTemplateId so it exists in H2
        // SharedEmailContext fields are flat: templateId, driveName, startDate, location, roundName, recipients
        String requestBody = String.format("""
                {
                  "templateId": %d,
                  "driveName": "Kanini Campus Drive 2026",
                  "startDate": "May 15, 2026",
                  "location": "Bangalore",
                  "recipients": [
                    {
                      "email": "candidate1@example.com",
                      "candidateName": "John Doe",
                      "registrationCode": "KA2026001",
                      "batchTime": "10:00 AM"
                    }
                  ]
                }
                """, createdTemplateId);

        mockMvc.perform(post("/api/email-templates/send-personalized")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(containsString("queued")));
    }

    // =========================================================================
    // 7. POST /api/email-templates/send-bulk — validation test
    // =========================================================================

    @Test
    @Order(13)
    @DisplayName("POST /api/email-templates/send-bulk - returns 400 for missing required fields")
    void sendBulkEmail_missingFields_returnsBadRequest() throws Exception {
        // Send empty JSON body as 'request' part — missing required subject, body, emailIds
        String emptyRequest = "{}";
        var requestPart = new org.springframework.mock.web.MockMultipartFile(
                "request", "", MediaType.APPLICATION_JSON_VALUE, emptyRequest.getBytes());

        mockMvc.perform(multipart("/api/email-templates/send-bulk")
                        .file(requestPart)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // 8. DELETE /api/email-templates/{id} — delete template
    // =========================================================================

    @Test
    @Order(14)
    @DisplayName("DELETE /api/email-templates/{id} - deletes template successfully")
    void deleteEmailTemplate_success_returnsOk() throws Exception {
        mockMvc.perform(delete("/api/email-templates/{templateId}", createdTemplateId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Email template deleted successfully"));
    }

    @Test
    @Order(15)
    @DisplayName("DELETE /api/email-templates/{id} - returns 404 after deletion")
    void deleteEmailTemplate_alreadyDeleted_returns404() throws Exception {
        mockMvc.perform(delete("/api/email-templates/{templateId}", createdTemplateId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(16)
    @DisplayName("GET /api/email-templates/{id} - returns 404 for deleted template")
    void getEmailTemplateById_deleted_returns404() throws Exception {
        mockMvc.perform(get("/api/email-templates/{templateId}", createdTemplateId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    // =========================================================================
    // 9. Auth Tests — no JWT token
    // =========================================================================

    @Test
    @Order(17)
    @DisplayName("GET /api/email-templates - returns 401 without JWT token")
    void getAllEmailTemplates_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/email-templates"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(18)
    @DisplayName("POST /api/email-templates - returns 401 without JWT token")
    void createEmailTemplate_noAuth_returns401() throws Exception {
        EmailTemplateRequest request = new EmailTemplateRequest();
        request.setTemplateName("Test");
        request.setSubject("Test");
        request.setBody("Test");

        mockMvc.perform(post("/api/email-templates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(19)
    @DisplayName("DELETE /api/email-templates/{id} - returns 401 without JWT token")
    void deleteEmailTemplate_noAuth_returns401() throws Exception {
        mockMvc.perform(delete("/api/email-templates/{templateId}", 8))
                .andExpect(status().isUnauthorized());
    }
}
