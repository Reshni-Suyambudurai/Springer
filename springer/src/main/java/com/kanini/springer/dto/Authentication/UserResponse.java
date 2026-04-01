package com.kanini.springer.dto.Authentication;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long userId;
    private String username;
    private String email;
    private String department;
    private String location;
    private Long roleId;
    private String roleName;
}
