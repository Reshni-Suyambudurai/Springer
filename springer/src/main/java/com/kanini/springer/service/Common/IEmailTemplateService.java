package com.kanini.springer.service.Common;

import com.kanini.springer.dto.Common.BulkEmailRequest;
import com.kanini.springer.dto.Common.BulkEmailResult;
import com.kanini.springer.dto.Common.EmailTemplateRequest;
import com.kanini.springer.dto.Common.EmailTemplateResponse;
import com.kanini.springer.dto.Common.EmailTemplateUpdateRequest;
import com.kanini.springer.dto.Common.PersonalizedRecipient;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service interface for email template operations
 */
public interface IEmailTemplateService {

    /**
     * Create a new email template
     */
    EmailTemplateResponse createEmailTemplate(EmailTemplateRequest request);

    /**
     * Get all email templates
     */
    List<EmailTemplateResponse> getAllEmailTemplates();

    /**
     * Get email templates by list of IDs
     */
    List<EmailTemplateResponse> getEmailTemplatesByIds(List<Integer> templateIds);

    /**
     * Get email template by ID
     */
    EmailTemplateResponse getEmailTemplateById(Integer templateId);

    /**
     * Update email template
     */
    EmailTemplateResponse updateEmailTemplate(Integer templateId, EmailTemplateUpdateRequest request);

    /**
     * Delete email template by ID
     */
    void deleteEmailTemplate(Integer templateId);

    /**
     * Send an email template to a list of recipients.
     * Invalid / unreachable addresses are skipped and logged; they do not fail the whole request.
     * @param attachments optional file attachments; may be null or empty
     */
    BulkEmailResult sendBulkEmail(BulkEmailRequest request, List<MultipartFile> attachments);

    /**
     * Send a personalized email to each recipient by substituting per-candidate
     * placeholders ({{CANDIDATE_NAME}}, {{REGISTRATION_CODE}}, {{BATCH_TIME}},
     * {{DRIVE_NAME}}, {{START_DATE}}, {{LOCATION}}) into the shared body template.
     * All emails are sent in parallel. Email failures are logged but do not throw.
     *
     * @param templateBody  HTML body template containing {{PLACEHOLDER}} tokens
     * @param subject       Email subject line
     * @param driveName     Drive name injected into every email
     * @param startDate     Formatted drive start date injected into every email
     * @param location      Drive location injected into every email
     * @param recipients    Per-recipient data (email, name, registrationCode, batchTime)
     */
    void sendPersonalizedBulkEmail(String templateBody,
                                   String subject,
                                   String driveName,
                                   String startDate,
                                   String location,
                                   List<PersonalizedRecipient> recipients);

    /**
     * Generic personalized send using {@link com.kanini.springer.dto.Common.SharedEmailContext}.
     * Loads template body from DB, substitutes only non-null shared tokens once,
     * then per-recipient tokens for each email.
     */
    void sendPersonalizedEmail(com.kanini.springer.dto.Common.SharedEmailContext context);
}
