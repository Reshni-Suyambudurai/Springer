package com.kanini.springer.dto.Authentication;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    
    private Long userId;
    private Long roleId;
    private String roleName;
    private String username;
    private String email;
    private String token;
}
