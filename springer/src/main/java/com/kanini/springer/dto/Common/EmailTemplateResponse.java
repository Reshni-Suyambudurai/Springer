package com.kanini.springer.dto.Common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for email template entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplateResponse {

    private Integer templateId;
    private String templateName;
    private String subject;
    private String body;
}
