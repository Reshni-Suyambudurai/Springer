package com.kanini.springer.controller.Common;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Common.BulkEmailRequest;
import com.kanini.springer.dto.Common.BulkEmailResult;
import com.kanini.springer.dto.Common.EmailTemplateRequest;
import com.kanini.springer.dto.Common.EmailTemplateResponse;
import com.kanini.springer.dto.Common.EmailTemplateUpdateRequest;
import com.kanini.springer.dto.Common.SharedEmailContext;
import com.kanini.springer.service.Common.IEmailTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Controller for managing email templates
 */
@RestController
@RequestMapping("/api/email-templates")
@RequiredArgsConstructor
@Tag(name = "Email Template Management", description = "APIs for managing email templates")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','TA_HEAD','TA_MANAGER')")
public class EmailTemplateController {

    private final IEmailTemplateService emailTemplateService;

    @PostMapping
    @Operation(summary = "Create a new email template", 
               description = "Creates a new email template for candidate communication")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> createEmailTemplate(
            @Valid @RequestBody EmailTemplateRequest request) {
        
        EmailTemplateResponse response = emailTemplateService.createEmailTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Email template created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all email templates", 
               description = "Retrieves all email templates")
    public ResponseEntity<ApiResponse<List<EmailTemplateResponse>>> getAllEmailTemplates() {
        
        List<EmailTemplateResponse> responses = emailTemplateService.getAllEmailTemplates();
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Email templates retrieved successfully", responses));
    }

    @PostMapping("/by-ids")
    @Operation(summary = "Get email templates by IDs", 
               description = "Retrieves email templates by a list of IDs")
    public ResponseEntity<ApiResponse<List<EmailTemplateResponse>>> getEmailTemplatesByIds(
            @RequestBody List<Integer> templateIds) {
        
        List<EmailTemplateResponse> responses = emailTemplateService.getEmailTemplatesByIds(templateIds);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Email templates retrieved successfully", responses));
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "Get email template by ID", 
               description = "Retrieves a specific email template by ID")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> getEmailTemplateById(
            @PathVariable Integer templateId) {
        
        EmailTemplateResponse response = emailTemplateService.getEmailTemplateById(templateId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Email template retrieved successfully", response));
    }

    @PatchMapping("/{templateId}")
    @Operation(summary = "Update email template", 
               description = "Updates an existing email template")
    public ResponseEntity<ApiResponse<EmailTemplateResponse>> updateEmailTemplate(
            @PathVariable Integer templateId,
            @Valid @RequestBody EmailTemplateUpdateRequest request) {
        
        EmailTemplateResponse response = emailTemplateService.updateEmailTemplate(templateId, request);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Email template updated successfully", response));
    }

    @DeleteMapping("/{templateId}")
    @Operation(summary = "Delete email template", 
               description = "Deletes an email template by ID")
    public ResponseEntity<ApiResponse<Void>> deleteEmailTemplate(
            @PathVariable Integer templateId) {
        
        emailTemplateService.deleteEmailTemplate(templateId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Email template deleted successfully", null));
    }

   
    @PostMapping("/send-bulk")
    @Operation(
        summary = "Send email template to multiple recipients",
        description = "Sends a stored email template to a list of email addresses. "
                    + "Optional file attachments are included in every email. "
                    + "Invalid or unreachable addresses are skipped and logged; the rest still receive the email."
    )
    public ResponseEntity<ApiResponse<BulkEmailResult>> sendBulkEmail(
            @RequestBody @Valid BulkEmailRequest request) {

     

        BulkEmailResult result = emailTemplateService.sendBulkEmail(request, null);
        String message = String.format("Bulk email complete — %d sent, %d skipped",
                result.getSuccessCount(), result.getSkippedCount());
        return ResponseEntity.ok(new ApiResponse<>(true, message, result));
    }

    @PostMapping("/send-personalized")
    @Operation(
        summary = "Send personalized emails using a template",
        description = "Loads the template by templateId, substitutes only non-null shared tokens "
                    + "once for all recipients (DRIVE_NAME, START_DATE, LOCATION, ROUND_NO, ROUND_NAME), "
                    + "then per-recipient tokens (CANDIDATE_NAME, REGISTRATION_CODE, BATCH_TIME, "
                    + "ROUND_NO, ROUND_NAME). Fire-and-forget via async thread pool."
    )
    public ResponseEntity<ApiResponse<Void>> sendPersonalizedEmail(
            @RequestBody SharedEmailContext context) {
        emailTemplateService.sendPersonalizedEmail(context);
        return ResponseEntity.ok(new ApiResponse<>(true,
                "Personalized emails queued for " + (context.getRecipients() != null ? context.getRecipients().size() : 0) + " recipient(s)", null));
    }
}

