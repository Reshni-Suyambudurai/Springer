package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InternWarningRequest {

    @NotNull(message = "studentId is required")
    private Long studentId;

    @NotNull(message = "issuedBy (userId) is required")
    private Long issuedBy;

    @NotBlank(message = "warningType is required")
    private String warningType;   // ATTENDANCE | PERFORMANCE | BEHAVIOUR | PUNCTUALITY | OTHER

    @NotBlank(message = "severity is required")
    private String severity;      // MINOR | MODERATE | SEVERE

    @NotBlank(message = "message is required")
    private String message;

    // Optional — only for PERFORMANCE type
    private Integer courseId;
}
