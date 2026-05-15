package com.kanini.springer.dto.Common;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Update request DTO for email template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateUpdateRequest {

    @Size(max = 255, message = "Template name cannot exceed 255 characters")
    private String templateName;

    @Size(max = 500, message = "Subject cannot exceed 500 characters")
    private String subject;

    private String body;
}
