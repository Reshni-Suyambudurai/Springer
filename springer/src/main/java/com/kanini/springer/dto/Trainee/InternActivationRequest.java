package com.kanini.springer.dto.Trainee;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InternActivationRequest {

    @NotBlank(message = "Outlook email is required")
    @Email(message = "Please provide a valid email address")
    private String outlookEmail;
}
