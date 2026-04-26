package com.kanini.springer.service.User.impl;

import com.kanini.springer.dto.Authentication.LoginResponse;
import com.kanini.springer.dto.Authentication.RoleResponse;
import com.kanini.springer.dto.Authentication.UserResponse;
import com.kanini.springer.entity.HiringReq.Role;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Authentication.RoleMapper;
import com.kanini.springer.mapper.Authentication.UserMapper;
import com.kanini.springer.repository.Hiring.RoleRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.User.IUserService;
import com.kanini.springer.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class UserServiceImp implements IUserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional(readOnly = true)
    public LoginResponse authenticate(String email, String password) {
        // Find all users with this email (same email can have different roles/passwords)
        List<User> users = userRepository.findAllByEmailWithRole(email);
        
        if (users.isEmpty()) {
            throw new ValidationException("Invalid email or password");
        }
        
        // Match by password to pick the correct account
        User user = null;
        for (User u : users) {
            // Check BCrypt encoded password
            if (passwordEncoder.matches(password, u.getPassword())) {
                user = u;
                break;
            }
        }
        
        if (user == null) {
            throw new ValidationException("Invalid email or password");
        }
        
        // Check if user is active
        if (!user.getIsActive()) {
            throw new ValidationException("User account is inactive");
        }
        
        // Generate JWT token
        String token = jwtUtil.generateToken(
            user.getEmail(),
            user.getUserId(),
            user.getRole().getRoleName().toString()
        );
        
        // Build and return login response
        LoginResponse response = new LoginResponse();
        response.setUserId(user.getUserId());
        response.setRoleId(user.getRole().getRoleId());
        response.setRoleName(user.getRole().getRoleName().toString());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setToken(token);
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRoleIds(List<Long> roleIds) {
        // Validate input
        if (roleIds == null || roleIds.isEmpty()) {
            throw new ValidationException("Role IDs cannot be null or empty");
        }
        
        // Fetch users by role IDs
        List<User> users = userRepository.findByRoleIdIn(roleIds);
        
        // Map to response DTOs
        return users.stream()
                .map(userMapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        // Fetch all roles
        List<Role> roles = roleRepository.findAll();
        
        // Map to response DTOs
        return roles.stream()
                .map(roleMapper::toResponse)
                .toList();
    }
}

