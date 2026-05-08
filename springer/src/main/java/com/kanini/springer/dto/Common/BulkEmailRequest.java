package com.kanini.springer.dto.Common;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for sending a bulk email.
 * <p>
 * The caller supplies the full template content (subject + body) so that
 * last-minute edits made in the UI are honoured without touching the DB.
 * {@code templateId} and {@code templateName} are optional audit / logging fields.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailRequest {

    /** Reference only — used for audit logging, NOT for fetching template from DB. */
    private Integer templateId;

    /** Template name — used for audit logging. */
    private String templateName;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Body is required")
    private String body;

    @NotEmpty(message = "At least one recipient email address is required")
    private List<String> emailIds;
}
