package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Authentication.CreateUserRequest;
import com.kanini.springer.dto.Authentication.UserResponse;
import com.kanini.springer.service.User.IAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Management", description = "APIs for admin user management")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AdminController {

    private final IAdminService adminService;

    /**
     * Create a new user
     * POST /api/admin/users
     */
    @PostMapping("/users")
    @Operation(summary = "Create a new user", description = "Creates a new user and persists it to the users table")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = adminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", response));
    }

    /**
     * Get all users except those with INTERN role
     * GET /api/admin/users
     */
    @GetMapping("/users")
    @Operation(summary = "Get all users except interns", description = "Retrieves all users excluding those assigned the INTERN role")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllEntryExceptInternRole() {
        List<UserResponse> users = adminService.getAllUsersExceptInternRole();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    /**
     * Toggle user active/inactive status by ID
     * PATCH /api/admin/users/{id}/toggle-status
     */
    @PatchMapping("/users/{id}/toggle-status")
    @Operation(summary = "Toggle user status", description = "Toggles the active/inactive status of a user by their ID")
    public ResponseEntity<ApiResponse<UserResponse>> toggleStatusUsingId(@PathVariable Long id) {
        UserResponse response = adminService.toggleStatusUsingId(id);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", response));
    }
}

