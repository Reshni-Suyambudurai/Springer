package com.kanini.springer.service.Common.impl;

import com.kanini.springer.dto.Common.BulkEmailRequest;
import com.kanini.springer.dto.Common.BulkEmailResult;
import com.kanini.springer.dto.Common.EmailTemplateRequest;
import com.kanini.springer.dto.Common.EmailTemplateResponse;
import com.kanini.springer.dto.Common.EmailTemplateUpdateRequest;
import com.kanini.springer.dto.Common.PersonalizedRecipient;
import com.kanini.springer.dto.Common.SharedEmailContext;
import com.kanini.springer.entity.utils.EmailTemplate;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Common.EmailTemplateMapper;
import com.kanini.springer.repository.Common.EmailTemplateRepository;
import com.kanini.springer.service.Common.IEmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.Executor;

/**
 * Service implementation for email template operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateServiceImpl implements IEmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final EmailTemplateMapper mapper;
    private final JavaMailSender mailSender;

    @Autowired
    @Qualifier("mailExecutor")
    private Executor mailExecutor;

    /** Base64 data URIs — loaded once at startup, embedded directly into HTML body. */
    private String rightLogoDataUri = "";
    private String signatureDataUri  = "";

    @PostConstruct
    private void loadImageDataUris() {
        rightLogoDataUri = toDataUri("static/images/right-logo.png");
        signatureDataUri  = toDataUri("static/images/siganture.png");
        log.info("Email images loaded — logo={}, signature={}",
                 rightLogoDataUri.isEmpty() ? "MISSING" : "OK",
                 signatureDataUri.isEmpty()  ? "MISSING" : "OK");
    }

    private String toDataUri(String classpathPath) {
        try {
            byte[] bytes = new ClassPathResource(classpathPath).getInputStream().readAllBytes();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("Could not load image '{}': {}", classpathPath, e.getMessage());
            return "";
        }
    }

    /**
     * Replaces {@code cid:right-logo} and {@code cid:signature} src references
     * with inline base64 data URIs so no MIME inline/attachment parts are created.
     */
    private String embedImagesAsBase64(String body) {
        String result = body;
        if (!rightLogoDataUri.isEmpty()) {
            result = result.replace("src=\"cid:right-logo\"", "src=\"" + rightLogoDataUri + "\"")
                           .replace("src='cid:right-logo'",   "src='"  + rightLogoDataUri + "'");
        }
        if (!signatureDataUri.isEmpty()) {
            result = result.replace("src=\"cid:signature\"", "src=\"" + signatureDataUri + "\"")
                           .replace("src='cid:signature'",   "src='"  + signatureDataUri + "'");
        }
        return result;
    }

    /** Full office addresses keyed by lowercase city name. */
    private static final Map<String, String> OFFICE_ADDRESSES = Map.of(
            "bangalore",
            "KANINI Software Solutions, Umiya Business Bay, Tower 2, 9th Floor, 2, Cessna Business Park, "
            + "Outer Ring Road (Marathahalli, Sarjapur Sector), Internal Road, Kaverappa Layout, "
            + "Kadubeesanahalli, Bengaluru, Karnataka",

            "coimbatore",
            "SEZ, Tidel Park,  First Floor, IT/ITES, Villankurichi Rd, "
            + "Coimbatore, Tamil Nadu 641014",

            "chennai",
            "Rattha Tek Meadows, Tower A, 1st Floor, No. 51, Rajiv Gandhi Salai (OMR), "
            + "Sholinganallur, Chennai - 600119, Tamil Nadu",

            "pune",
            "Panchshil Futura, 1st Floor, Magarpatta Road, Kirtane Baugh, "
            + "Magarpatta Hadapsar, Pune, Maharashtra 411028"
    );

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    @Transactional
    public EmailTemplateResponse createEmailTemplate(EmailTemplateRequest request) {
        log.info("Creating email template with name: {}", request.getTemplateName());

        // Convert to entity and save
        EmailTemplate template = mapper.toEntity(request);
        EmailTemplate savedTemplate = emailTemplateRepository.save(template);

        log.info("Email template created successfully. Template ID: {}", savedTemplate.getTemplateId());
        return mapper.toResponse(savedTemplate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> getAllEmailTemplates() {
        log.info("Fetching all email templates");
        
        List<EmailTemplate> templates = emailTemplateRepository.findAll();
        return templates.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> getEmailTemplatesByIds(List<Integer> templateIds) {
        log.info("Fetching email templates by IDs: {}", templateIds);

        if (templateIds == null || templateIds.isEmpty()) {
            log.warn("Template IDs list is empty or null");
            return List.of();
        }

        List<EmailTemplate> templates = emailTemplateRepository.findByTemplateIdIn(templateIds);
        
        // Check if all IDs were found
        if (templates.size() != templateIds.size()) {
            List<Integer> foundIds = templates.stream()
                    .map(EmailTemplate::getTemplateId)
                    .toList();
            List<Integer> notFoundIds = templateIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            log.warn("Some template IDs not found: {}", notFoundIds);
        }

        return templates.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EmailTemplateResponse getEmailTemplateById(Integer templateId) {
        log.info("Fetching email template by ID: {}", templateId);

        EmailTemplate template = emailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Email Template", "ID", templateId));

        return mapper.toResponse(template);
    }

    @Override
    @Transactional
    public EmailTemplateResponse updateEmailTemplate(Integer templateId, EmailTemplateUpdateRequest request) {
        log.info("Updating email template ID: {}", templateId);

        // Fetch existing template
        EmailTemplate template = emailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Email Template", "ID", templateId));

        // Update fields if provided
        if (request.getTemplateName() != null) {
            template.setTemplateName(request.getTemplateName());
        }
        if (request.getSubject() != null) {
            template.setSubject(request.getSubject());
        }
        if (request.getBody() != null) {
            template.setBody(request.getBody());
        }

        // Save and return
        EmailTemplate updatedTemplate = emailTemplateRepository.save(template);
        log.info("Email template updated successfully. Template ID: {}", updatedTemplate.getTemplateId());

        return mapper.toResponse(updatedTemplate);
    }

    @Override
    @Transactional
    public void deleteEmailTemplate(Integer templateId) {
        log.info("Deleting email template ID: {}", templateId);

        // Verify template exists
        EmailTemplate template = emailTemplateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Email Template", "ID", templateId));

        emailTemplateRepository.delete(template);
        log.info("Email template deleted successfully. Template ID: {}", templateId);
    }

    @Override
    public BulkEmailResult sendBulkEmail(BulkEmailRequest request, List<MultipartFile> attachments) {
        log.info("Bulk email send requested — templateId={}, templateName='{}', recipients={}, attachments={}",
                 request.getTemplateId(), request.getTemplateName(), request.getEmailIds().size(),
                 attachments != null ? attachments.size() : 0);

        String subject = request.getSubject();
        // Normalise CID src variants, then embed images as base64 data URIs.
        // No MIME inline parts are created — nothing can appear as a download.
        String body = embedImagesAsBase64(normaliseImageCids(request.getBody()));

        // Filter out blank/null emails up-front
        List<String> emailList = request.getEmailIds().stream()
                .filter(e -> e != null && !e.isBlank())
                .toList();
        int blankCount = request.getEmailIds().size() - emailList.size();

        // Thread-safe result buckets
        Queue<String> sentQueue    = new ConcurrentLinkedQueue<>();
        Queue<String> skippedQueue = new ConcurrentLinkedQueue<>();

        // Send all emails in parallel using the shared mail thread pool
        List<CompletableFuture<Void>> futures = emailList.stream()
                .map(email -> CompletableFuture.runAsync(() -> {
                    try {
                        MimeMessage message = mailSender.createMimeMessage();
                        // multipart/mixed — only for user file attachments.
                        // Images are already embedded as base64 data URIs in the body.
                        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                        helper.setFrom(fromEmail);
                        helper.setTo(email.trim());
                        helper.setSubject(subject);
                        helper.setText(body, true);

                        // User-supplied file attachments
                        if (attachments != null) {
                            for (MultipartFile file : attachments) {
                                if (!file.isEmpty()) {
                                    helper.addAttachment(
                                            file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment",
                                            file);
                                }
                            }
                        }

                        mailSender.send(message);
                        log.info("✅ Email sent to: {}", email.trim());
                        sentQueue.add(email.trim());

                    } catch (Exception e) {
                        Throwable root = e;
                        while (root.getCause() != null) root = root.getCause();
                        log.warn("⚠️ Skipping {}: {} — {}", email.trim(),
                                 root.getClass().getSimpleName(), root.getMessage());
                        skippedQueue.add(email.trim());
                    }
                }, mailExecutor))
                .toList();

        // Block until every email attempt has finished
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        List<String> sentTo  = new ArrayList<>(sentQueue);
        List<String> skipped = new ArrayList<>(skippedQueue);
        for (int i = 0; i < blankCount; i++) skipped.add("<blank>");

        log.info("Bulk email complete — sent={}, skipped={}", sentTo.size(), skipped.size());
        return new BulkEmailResult(request.getEmailIds().size(), sentTo.size(), skipped.size(), sentTo, skipped);
    }

    /**
     * Normalises all image src variants in an email body to proper {@code cid:xxx} references.
     * Handles three formats that may appear depending on how the template was stored/edited:
     * <ul>
     *   <li>Web-path format  ({@code /right-logo.png}) — produced by the frontend resolveImagePaths helper</li>
     *   <li>Dash-CID format  ({@code cid-right-logo})  — legacy DB storage format</li>
     *   <li>Colon-CID format ({@code cid:kanini-logo}) — DB templates stored with raw CID syntax</li>
     * </ul>
     */
    private static String normaliseImageCids(String body) {
        return body
                // ── Colon-CID format (already cid: but wrong name) ──────────────────
                .replace("src=\"cid:kanini-logo\"", "src=\"cid:right-logo\"")
                .replace("src='cid:kanini-logo'",   "src='cid:right-logo'")
                .replace("src=\"cid:kanini\"",       "src=\"cid:right-logo\"")
                .replace("src='cid:kanini'",         "src='cid:right-logo'")
                // ── Web-path format (frontend resolveImagePaths output) ──────────────
                .replace("src=\"/right-logo.png\"",  "src=\"cid:right-logo\"")
                .replace("src='/right-logo.png'",    "src='cid:right-logo'")
                .replace("src=\"/siganture.png\"",   "src=\"cid:signature\"")
                .replace("src='/siganture.png'",     "src='cid:signature'")
                .replace("src=\"/kanini.png\"",      "src=\"cid:right-logo\"")
                .replace("src='/kanini.png'",        "src='cid:right-logo'")
                // ── Dash-CID format (legacy DB storage) ─────────────────────────────
                .replace("cid-right-logo",  "cid:right-logo")
                .replace("cid-signature",   "cid:signature")
                .replace("cid-kanini-logo", "cid:right-logo")
                .replace("cid-kanini",      "cid:right-logo");
    }

    /**
     * Sends a personalized drive-invitation email to each recipient.
     * Per-recipient placeholders are substituted before sending.
     * Shared drive fields are substituted the same way for all recipients.
     * All sends are dispatched in parallel via the shared mailExecutor.
     * Any individual failure is logged and skipped — it never throws.
     */
    @Override
    public void sendPersonalizedBulkEmail(String templateBody,
                                          String subject,
                                          String driveName,
                                          String startDate,
                                          String location,
                                          List<PersonalizedRecipient> recipients) {

        if (recipients == null || recipients.isEmpty()) {
            log.warn("sendPersonalizedBulkEmail called with no recipients — skipping");
            return;
        }

        log.info("Personalized bulk email — subject='{}', drive='{}', recipients={}",
                 subject, driveName, recipients.size());

        // Substitute shared drive-level placeholders once (same for every recipient)
        // Resolve full office address for known cities; leave unknown locations as-is.
        String resolvedLocation = "";
        if (location != null && !location.isBlank()) {
            String address = OFFICE_ADDRESSES.get(location.trim().toLowerCase());
            resolvedLocation = address != null ? location + "\n" + address : location;
        }

        String sharedBody = embedImagesAsBase64(
                normaliseImageCids(templateBody)
                        .replace("{{DRIVE_NAME}}",  driveName  != null ? driveName  : "")
                        .replace("{{START_DATE}}",  startDate  != null ? startDate  : "")
                        .replace("{{LOCATION}}",    resolvedLocation));

        List<CompletableFuture<Void>> futures = recipients.stream()
                .filter(r -> r.getEmail() != null && !r.getEmail().isBlank())
                .map(recipient -> CompletableFuture.runAsync(() -> {
                    try {
                        // Substitute per-recipient placeholders
                        String personalBody = sharedBody
                                .replace("{{CANDIDATE_NAME}}",    recipient.getCandidateName()    != null ? recipient.getCandidateName()    : "")
                                .replace("{{NAME}}",               recipient.getCandidateName()    != null ? recipient.getCandidateName()    : "")
                                .replace("{{REGISTRATION_CODE}}", recipient.getRegistrationCode() != null ? recipient.getRegistrationCode() : "")
                                .replace("{{BATCH_TIME}}",         recipient.getBatchTime()        != null ? recipient.getBatchTime()        : "");

                        MimeMessage message = mailSender.createMimeMessage();
                        // Images are base64 data URIs — no inline MIME parts needed.
                        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                        helper.setFrom(fromEmail);
                        helper.setTo(recipient.getEmail().trim());
                        helper.setSubject(subject);
                        helper.setText(personalBody, true);

                        mailSender.send(message);
                        log.info(" Invitation sent to: {}", recipient.getEmail().trim());

                    } catch (Exception e) {
                        Throwable root = e;
                        while (root.getCause() != null) root = root.getCause();
                        log.warn("⚠️ Invitation failed for {}: {} — {}",
                                 recipient.getEmail(), root.getClass().getSimpleName(), root.getMessage());
                    }
                }, mailExecutor))
                .toList();

        // Fire-and-forget: do NOT block the scheduling transaction.
        // Failures are already logged inside each future.
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .exceptionally(ex -> { log.error("Personalized bulk email had unexpected error", ex); return null; });
    }

    /**
     * Generic personalized send using {@link SharedEmailContext}.
     * Loads the template from DB by templateId, then substitutes only non-null
     * shared tokens (same for all recipients) and per-recipient tokens per email.
     * All sends are fire-and-forget via mailExecutor — never throws.
     */
    @Override
    public void sendPersonalizedEmail(SharedEmailContext ctx) {
        if (ctx == null || ctx.getRecipients() == null || ctx.getRecipients().isEmpty()) {
            log.warn("sendPersonalizedEmail called with null context or empty recipients — skipping");
            return;
        }
        if (ctx.getTemplateId() == null) {
            log.warn("sendPersonalizedEmail called without templateId — skipping");
            return;
        }

        emailTemplateRepository.findById(ctx.getTemplateId()).ifPresentOrElse(template -> {
            String subject  = ctx.getSubject() != null ? ctx.getSubject() : template.getSubject();
            String baseBody = normaliseImageCids(template.getBody());

            // ── Shared substitutions (non-null values only) ────────────────────────────
            if (ctx.getDriveName()  != null) baseBody = baseBody.replace("{{DRIVE_NAME}}",  ctx.getDriveName());
            if (ctx.getStartDate()  != null) baseBody = baseBody.replace("{{START_DATE}}",  ctx.getStartDate());
            if (ctx.getRoundName()  != null) baseBody = baseBody.replace("{{ROUND_NAME}}",  ctx.getRoundName());
            // NOTE: {{ROUND_NO}} is per-recipient — substituted inside the per-recipient loop

            // Location: resolve to full address if city is known
            if (ctx.getLocation() != null) {
                String address = OFFICE_ADDRESSES.get(ctx.getLocation().trim().toLowerCase());
                String resolved = address != null ? ctx.getLocation() + "\n" + address : ctx.getLocation();
                baseBody = baseBody.replace("{{LOCATION}}", resolved);
            }

            // Embed images as base64 data URIs (no CID attachment parts)
            final String sharedBody = embedImagesAsBase64(baseBody);
            final String finalSubject = subject;

            List<CompletableFuture<Void>> futures = ctx.getRecipients().stream()
                    .filter(r -> r.getEmail() != null && !r.getEmail().isBlank())
                    .map(recipient -> CompletableFuture.runAsync(() -> {
                        try {
                            String body = sharedBody;
                            // ── Per-recipient substitutions (non-null values only) ──────────
                            if (recipient.getCandidateName()    != null) {
                                body = body.replace("{{CANDIDATE_NAME}}", recipient.getCandidateName())
                                           .replace("{{NAME}}",           recipient.getCandidateName());
                            }
                            if (recipient.getRegistrationCode() != null) body = body.replace("{{REGISTRATION_CODE}}", recipient.getRegistrationCode());
                            if (recipient.getBatchTime()        != null) body = body.replace("{{BATCH_TIME}}",        recipient.getBatchTime());
                            if (recipient.getRoundNo()          != null) body = body.replace("{{ROUND_NO}}",          recipient.getRoundNo());

                            MimeMessage message = mailSender.createMimeMessage();
                            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                            helper.setFrom(fromEmail);
                            helper.setTo(recipient.getEmail().trim());
                            helper.setSubject(finalSubject);
                            helper.setText(body, true);
                            mailSender.send(message);
                            log.info("✅ Personalized email sent to: {}", recipient.getEmail().trim());
                        } catch (Exception e) {
                            Throwable root = e;
                            while (root.getCause() != null) root = root.getCause();
                            log.warn("⚠️ Personalized email failed for {}: {} — {}",
                                    recipient.getEmail(), root.getClass().getSimpleName(), root.getMessage());
                        }
                    }, mailExecutor))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                    .exceptionally(ex -> { log.error("sendPersonalizedEmail unexpected error", ex); return null; });

            log.info("📧 sendPersonalizedEmail queued — templateId={}, recipients={}",
                    ctx.getTemplateId(), ctx.getRecipients().size());

        }, () -> log.warn("⚠️ Template ID={} not found — personalized email skipped", ctx.getTemplateId()));
    }
}
