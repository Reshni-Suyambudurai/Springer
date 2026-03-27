package com.kanini.springer.mapper.Authentication;

import com.kanini.springer.dto.Authentication.RoleResponse;
import com.kanini.springer.entity.HiringReq.Role;
import org.springframework.stereotype.Component;

@Component
public class RoleMapper {
    
    /**
     * Map Role entity to RoleResponse DTO
     */
    public RoleResponse toResponse(Role role) {
        RoleResponse response = new RoleResponse();
        response.setRoleId(role.getRoleId());
        response.setRoleName(role.getRoleName().toString());
        return response;
    }
}
