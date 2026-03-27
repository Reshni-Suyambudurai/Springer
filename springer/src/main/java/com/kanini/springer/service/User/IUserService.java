package com.kanini.springer.service.User;

import com.kanini.springer.dto.Authentication.LoginResponse;
import com.kanini.springer.dto.Authentication.RoleResponse;
import com.kanini.springer.dto.Authentication.UserResponse;

import java.util.List;

public interface IUserService {
    
    /**
     * Authenticate user with email and password
     * @param email User's email
     * @param password User's password
     * @return LoginResponse with user details and JWT token
     * @throws RuntimeException if authentication fails
     */
    LoginResponse authenticate(String email, String password);
    
    /**
     * Get users by one or more role IDs
     * @param roleIds List of role IDs
     * @return List of UserResponse containing username, email, department, location
     */
    List<UserResponse> getUsersByRoleIds(List<Long> roleIds);
    
    /**
     * Get all roles
     * @return List of RoleResponse containing roleId and roleName
     */
    List<RoleResponse> getAllRoles();
}
