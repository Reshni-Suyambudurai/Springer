package com.kanini.springer.mapper.Authentication;

import com.kanini.springer.dto.Authentication.CreateUserRequest;
import com.kanini.springer.entity.HiringReq.Role;
import com.kanini.springer.entity.HiringReq.User;
import org.springframework.stereotype.Component;

@Component
public class AdminUserMapper {

    /**
     * Map CreateUserRequest DTO to User entity.
     * Role lookup and password encoding are handled by the service layer
     * and passed in as parameters.
     */
    public User toEntity(CreateUserRequest request, Role role, String encodedPassword) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(encodedPassword);
        user.setRole(role);
        user.setDepartment(request.getDepartment());
        user.setLocation(request.getLocation());
        user.setIsActive(true);
        return user;
    }
}
