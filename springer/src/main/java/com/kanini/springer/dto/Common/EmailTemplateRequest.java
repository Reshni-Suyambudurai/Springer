package com.kanini.springer.dto.Common;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new email template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateRequest {

    @NotBlank(message = "Template name is required")
    @Size(max = 255, message = "Template name cannot exceed 255 characters")
    private String templateName;

    @NotBlank(message = "Subject is required")
    @Size(max = 500, message = "Subject cannot exceed 500 characters")
    private String subject;

    @NotBlank(message = "Body is required")
    private String body;
}
