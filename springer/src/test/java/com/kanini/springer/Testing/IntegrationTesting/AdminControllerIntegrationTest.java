package com.kanini.springer.Testing.IntegrationTesting;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Authentication.CreateUserRequest;
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
 * Integration tests for {@link com.kanini.springer.controller.Hiring.AdminController}.
 *
 * Uses the H2 in-memory test database (profile = "test").
 * DataLoader seeds users with various roles on startup.
 * 
 * Tests are ordered to ensure proper test data lifecycle.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class AdminControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private Long createdUserId;

    // =========================================================================
    // SETUP — obtain JWT token (admin user)
    // =========================================================================

    @BeforeAll
    void setUp() throws Exception {
        String loginBody = """
                {
                  "email":    "admin@kanini.com",
                  "password": "admin@123"
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
    // 1. GET /api/admin/users — get all users except interns
    // =========================================================================

    @Test
    @Order(1)
    @DisplayName("GET /api/admin/users - returns 200 with all non-intern users")
    void getAllUsersExceptInternRole_returnsOk() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(6)))); // DataLoader seeds 6 non-intern users
    }

    // =========================================================================
    // 2. POST /api/admin/users — create new user
    // =========================================================================

    @Test
    @Order(2)
    @DisplayName("POST /api/admin/users - creates user successfully and returns 201")
    void createUser_success_returns201() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Test User");
        request.setEmail("testuser@kanini.com");
        request.setPassword("testpass123");
        request.setRoleName("TA_MANAGER");

        MvcResult result = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").exists())
                .andExpect(jsonPath("$.data.username").value("Test User"))
                .andExpect(jsonPath("$.data.email").value("testuser@kanini.com"))
                .andExpect(jsonPath("$.data.roleName").value("TA_MANAGER"))
                .andExpect(jsonPath("$.data.isActive").value(true)) // default
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        createdUserId = node.path("data").path("userId").asLong();
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/admin/users - validation fails for null name")
    void createUser_nullName_returns400() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername(null);
        request.setEmail("valid@kanini.com");
        request.setPassword("validpass123");
        request.setRoleName("TA_HEAD");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(4)
    @DisplayName("POST /api/admin/users - validation fails for blank email")
    void createUser_blankEmail_returns400() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Valid Name");
        request.setEmail("");
        request.setPassword("validpass123");
        request.setRoleName("TA_HEAD");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(5)
    @DisplayName("POST /api/admin/users - validation fails for invalid email format")
    void createUser_invalidEmail_returns400() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Valid Name");
        request.setEmail("invalid-email");
        request.setPassword("validpass123");
        request.setRoleName("TA_HEAD");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(6)
    @DisplayName("POST /api/admin/users - validation fails for password less than 6 characters")
    void createUser_shortPassword_returns400() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Valid Name");
        request.setEmail("valid@kanini.com");
        request.setPassword("12345"); // only 5 characters
        request.setRoleName("TA_HEAD");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/admin/users - returns 400 for invalid role name")
    void createUser_invalidRoleName_returns400() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Valid Name");
        request.setEmail("valid2@kanini.com");
        request.setPassword("validpass123");
        request.setRoleName("INVALID_ROLE");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Invalid role name")));
    }

    // =========================================================================
    // 3. PATCH /api/admin/users/{id}/toggle-status — toggle user status
    // =========================================================================

    @Test
    @Order(8)
    @DisplayName("PATCH /api/admin/users/{id}/toggle-status - toggles status successfully")
    void toggleStatusUsingId_success_returnsOk() throws Exception {
        // First toggle: from true to false
        MvcResult result = mockMvc.perform(patch("/api/admin/users/{id}/toggle-status", createdUserId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(createdUserId))
                .andExpect(jsonPath("$.data.isActive").value(false)) // toggled from true to false
                .andReturn();

        // Verify the toggle worked
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        boolean isActive = node.path("data").path("isActive").asBoolean();
        assert !isActive;
    }

    @Test
    @Order(9)
    @DisplayName("PATCH /api/admin/users/{id}/toggle-status - toggles back to active")
    void toggleStatusUsingId_togglesBackToActive_returnsOk() throws Exception {
        // Second toggle: from false back to true
        mockMvc.perform(patch("/api/admin/users/{id}/toggle-status", createdUserId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(createdUserId))
                .andExpect(jsonPath("$.data.isActive").value(true)); // toggled from false to true
    }

    @Test
    @Order(10)
    @DisplayName("PATCH /api/admin/users/{id}/toggle-status - returns 404 for non-existent user ID")
    void toggleStatusUsingId_notFound_returns404() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/toggle-status", 99999L)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not found")));
    }

    // =========================================================================
    // 4. Verify created user appears in GET all users
    // =========================================================================

    @Test
    @Order(11)
    @DisplayName("GET /api/admin/users - includes newly created user")
    void getAllUsersExceptInternRole_includesNewUser_returnsOk() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[?(@.userId == " + createdUserId + ")]").exists())
                .andExpect(jsonPath("$.data[?(@.email == 'testuser@kanini.com')]").exists());
    }

    // =========================================================================
    // 5. Auth Tests — no JWT token
    // =========================================================================

    @Test
    @Order(12)
    @DisplayName("GET /api/admin/users - returns 401 without JWT token")
    void getAllUsersExceptInternRole_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(13)
    @DisplayName("POST /api/admin/users - returns 401 without JWT token")
    void createUser_noAuth_returns401() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Test User");
        request.setEmail("test@kanini.com");
        request.setPassword("test123");
        request.setRoleName("TA_HEAD");

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(14)
    @DisplayName("PATCH /api/admin/users/{id}/toggle-status - returns 401 without JWT token")
    void toggleStatusUsingId_noAuth_returns401() throws Exception {
        mockMvc.perform(patch("/api/admin/users/{id}/toggle-status", createdUserId))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // 6. Edge Cases
    // =========================================================================

    @Test
    @Order(15)
    @DisplayName("POST /api/admin/users - creates user with minimal required fields")
    void createUser_minimalFields_success() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Minimal User");
        request.setEmail("minimal@kanini.com");
        request.setPassword("minimal123");
        request.setRoleName("MEMBERS");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("Minimal User"))
                .andExpect(jsonPath("$.data.roleName").value("MEMBERS"));
    }

    @Test
    @Order(16)
    @DisplayName("POST /api/admin/users - creates user with HIRING_MANAGER role")
    void createUser_hiringManagerRole_success() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Hiring Manager User");
        request.setEmail("hiringmgr@kanini.com");
        request.setPassword("manager123");
        request.setRoleName("HIRING_MANAGER");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roleName").value("HIRING_MANAGER"));
    }

    @Test
    @Order(17)
    @DisplayName("POST /api/admin/users - creates user with TRAINING_COORDINATOR role")
    void createUser_trainingCoordinatorRole_success() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("Training Coordinator");
        request.setEmail("trainer@kanini.com");
        request.setPassword("trainer123");
        request.setRoleName("TRAINING_COORDINATOR");

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roleName").value("TRAINING_COORDINATOR"));
    }
}
