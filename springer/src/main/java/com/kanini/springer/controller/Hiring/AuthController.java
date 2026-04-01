package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Authentication.LoginRequest;
import com.kanini.springer.dto.Authentication.LoginResponse;
import com.kanini.springer.dto.Authentication.RoleResponse;
import com.kanini.springer.dto.Authentication.UserResponse;
import com.kanini.springer.service.User.IUserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final IUserService userService;
    
    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse loginResponse = userService.authenticate(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(ApiResponse.success("Login successful", loginResponse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get users by one or more role IDs
     * GET /api/auth/users/by-roles?roleIds=1,2,3
     * @param roleIds List of role IDs (comma-separated)
     * @return List of users with username, email, department, location
     */
    @GetMapping("/users/by-roles")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByRoles(
            @RequestParam("roleIds") List<Long> roleIds) {
        try {
            List<UserResponse> users = userService.getUsersByRoleIds(roleIds);
            return ResponseEntity.ok(ApiResponse.success(
                "Users retrieved successfully", 
                users
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Get all roles
     * GET /api/auth/roles
     * @return List of all roles with roleId and roleName
     */
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        try {
            List<RoleResponse> roles = userService.getAllRoles();
            return ResponseEntity.ok(ApiResponse.success(
                "Roles retrieved successfully", 
                roles
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
