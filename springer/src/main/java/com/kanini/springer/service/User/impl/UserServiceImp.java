package com.kanini.springer.service.User.impl;

import com.kanini.springer.dto.Authentication.LoginResponse;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.User.IUserService;
import com.kanini.springer.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImp implements IUserService {
    
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    
    @Override
    @Transactional(readOnly = true)
    public LoginResponse authenticate(String email, String password) {
        // Find user by email with role eagerly fetched
        User user = userRepository.findByEmailWithRole(email)
                .orElseThrow(() -> new ValidationException("Invalid email or password"));
        
        // Check password (Note: In production, use password encoder)
        if (!user.getPassword().equals(password)) {
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
}

