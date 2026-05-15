package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.entity.utils.EmailTemplate;
import com.kanini.springer.repository.Common.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * Sends async evaluation-status notification emails to candidates.
 * <p>
 * Called from {@link CandidateEvaluationServiceImpl} after evaluation status
 * changes (PASS, FAIL, HOLD, ABSENT). Each status maps to a configurable
 * email template ID loaded from application.properties.
 */
@Service
@Slf4j
public class EvaluationEmailService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final JavaMailSender mailSender;
    private final Executor mailExecutor;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${email.template.round-selected-id}")
    private Integer roundSelectedTemplateId;

    @Value("${email.template.round-hold-id}")
    private Integer roundHoldTemplateId;

    @Value("${email.template.round-rejected-id}")
    private Integer roundRejectedTemplateId;

    @Value("${email.template.round-dropped-id}")
    private Integer roundDroppedTemplateId;

    public EvaluationEmailService(
            EmailTemplateRepository emailTemplateRepository,
            JavaMailSender mailSender,
            @Qualifier("mailExecutor") Executor mailExecutor) {
        this.emailTemplateRepository = emailTemplateRepository;
        this.mailSender = mailSender;
        this.mailExecutor = mailExecutor;
    }

    /**
     * Data holder for a single evaluation email recipient.
     */
    public record EvaluationEmailRecipient(
            String email,
            String name,
            String roundNo,
            String status
    ) {}

    /**
     * Send evaluation notification emails asynchronously.
     *
     * @param evaluationStatus the evaluation status (PASS, FAIL, HOLD, ABSENT)
     * @param recipients       list of recipients with email, name, roundNo, and optional status text
     */
    public void sendEvaluationEmails(String evaluationStatus, List<EvaluationEmailRecipient> recipients) {
        if (recipients == null || recipients.isEmpty()) return;

        Integer templateId = resolveTemplateId(evaluationStatus);
        if (templateId == null) {
            log.warn("No email template configured for evaluation status: {}", evaluationStatus);
            return;
        }

        emailTemplateRepository.findById(templateId).ifPresentOrElse(template -> {
            String subject = template.getSubject();
            String baseBody = template.getBody();

            for (EvaluationEmailRecipient recipient : recipients) {
                if (recipient.email() == null || recipient.email().isBlank()) continue;

                CompletableFuture.runAsync(() -> {
                    try {
                        String body = baseBody;
                        if (recipient.name() != null) {
                            body = body.replace("{{NAME}}", recipient.name());
                        }
                        if (recipient.roundNo() != null) {
                            body = body.replace("{{ROUND_NO}}", recipient.roundNo());
                        }
                        if (recipient.status() != null) {
                            body = body.replace("{{STATUS}}", recipient.status());
                        }

                        MimeMessage message = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                        helper.setFrom(fromEmail);
                        helper.setTo(recipient.email().trim());
                        helper.setSubject(subject);
                        helper.setText(body, true);
                        mailSender.send(message);
                        log.info(" Evaluation email sent to: {} [status={}]", recipient.email(), evaluationStatus);
                    } catch (Exception e) {
                        Throwable root = e;
                        while (root.getCause() != null) root = root.getCause();
                        log.warn(" Evaluation email failed for {}: {} — {}",
                                recipient.email(), root.getClass().getSimpleName(), root.getMessage());
                    }
                }, mailExecutor);
            }

            log.info(" Evaluation emails queued — status={}, templateId={}, recipients={}",
                    evaluationStatus, templateId, recipients.size());

        }, () -> log.warn(" Email template ID={} not found — evaluation emails skipped", templateId));
    }

    /**
     * Convenience overload for a single recipient.
     */
    public void sendEvaluationEmail(String evaluationStatus, String email, String name, String roundNo) {
        sendEvaluationEmails(evaluationStatus, List.of(
                new EvaluationEmailRecipient(email, name, roundNo, evaluationStatus)
        ));
    }

    private Integer resolveTemplateId(String evaluationStatus) {
        if (evaluationStatus == null) return null;
        return switch (evaluationStatus.toUpperCase()) {
            case "PASS"   -> roundSelectedTemplateId;
            case "FAIL"   -> roundRejectedTemplateId;
            case "HOLD"   -> roundHoldTemplateId;
            case "ABSENT" -> roundDroppedTemplateId;
            default       -> null;
        };
    }
}
