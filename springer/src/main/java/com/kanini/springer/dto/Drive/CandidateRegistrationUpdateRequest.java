package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * DTO for partially updating a candidate registration.
 * registrationId is mandatory; all other fields are optional.
 */
@Data
public class CandidateRegistrationUpdateRequest {

    @NotNull(message = "Registration ID is required")
    private Long registrationId;

    private String collegeName;

    @Email(message = "Email should be valid")
    private String email;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be a valid 10-digit number starting with 6-9")
    private String mobile;
}
