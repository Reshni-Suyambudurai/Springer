package com.kanini.springer.dto.Trainee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternActivationResponse {
    private Long userId;
    private String email;
    private String message;
}
