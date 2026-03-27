package com.kanini.springer.mapper.Authentication;

import com.kanini.springer.dto.Authentication.UserResponse;
import com.kanini.springer.entity.HiringReq.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    
    /**
     * Map User entity to UserResponse DTO
     */
    public UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setUserId(user.getUserId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setDepartment(user.getDepartment());
        response.setLocation(user.getLocation());
        
        if (user.getRole() != null) {
            response.setRoleId(user.getRole().getRoleId());
            response.setRoleName(user.getRole().getRoleName().toString());
        }
        
        return response;
    }
}
