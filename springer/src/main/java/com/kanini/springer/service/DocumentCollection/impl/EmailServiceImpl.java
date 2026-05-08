package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.RequiredDocumentDTO;
import com.kanini.springer.entity.utils.EmailTemplate;
import com.kanini.springer.repository.Common.EmailTemplateRepository;
import com.kanini.springer.service.DocumentCollection.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements IEmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateRepository emailTemplateRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Override
    public boolean sendDocumentSubmissionLink(String candidateEmail, String candidateName,
            String submissionLink, List<RequiredDocumentDTO> requiredDocuments,
            LocalDateTime expiryDate) {
        try {
            log.info("📧 Attempting to send submission link email to: {}", candidateEmail);
            EmailTemplate template = emailTemplateRepository
                    .findByTemplateName("DOCUMENT_SUBMISSION_LINK")
                    .orElseThrow(() -> new RuntimeException("Email template DOCUMENT_SUBMISSION_LINK not found in DB"));
            log.info("✅ Template found: {}", template.getTemplateName());

            java.util.Set<String> seenDocTypes = new java.util.HashSet<>();
            StringBuilder docListHtml = new StringBuilder();
            for (RequiredDocumentDTO doc : requiredDocuments) {
                String docTypeName = formatDocumentName(doc.getDocumentType());
                if (!seenDocTypes.contains(docTypeName)) {
                    docListHtml.append("<li>").append(docTypeName).append("</li>");
                    seenDocTypes.add(docTypeName);
                }
            }

            String body = template.getBody()
                    .replace("{{CANDIDATE_NAME}}", candidateName)
                    .replace("{{DOCUMENT_LIST}}", docListHtml.toString())
                    .replace("{{SUBMISSION_LINK}}", submissionLink)
                    .replace("{{DEADLINE_DATE}}", expiryDate.format(DATE_FORMATTER));

            return sendHtmlEmailWithCid(candidateEmail, template.getSubject(), body);
        } catch (Exception e) {
            log.error("Failed to send document submission link email: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean sendRejectionEmail(String candidateEmail, String candidateName,
            String documentType, String rejectionReason, String resubmitLink) {
        try {
            EmailTemplate template = emailTemplateRepository
                    .findByTemplateName("DOCUMENT_REJECTION")
                    .orElseThrow(() -> new RuntimeException("Email template DOCUMENT_REJECTION not found"));

            String body = template.getBody()
                    .replace("{{CANDIDATE_NAME}}", candidateName)
                    .replace("{{DOCUMENT_TYPE}}", formatDocumentName(documentType))
                    .replace("{{REJECTION_REASON}}", rejectionReason)
                    .replace("{{RESUBMIT_LINK}}", resubmitLink);

            return sendHtmlEmailWithCid(candidateEmail, template.getSubject(), body);
        } catch (Exception e) {
            log.error("Failed to send rejection email: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean sendInternWelcomeEmail(String internEmail, String internName, String tempPassword) {
        try {
            String subject = "Welcome to Kanini Academy \u2014 Your Login Credentials";
            String body = "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f0f2f5;padding:40px 20px;'>" +
                "<table width='600' cellpadding='0' cellspacing='0' style='background:#fff;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);'>" +
                "<tr><td style='background:#0F4C81;padding:28px 40px;'>" +
                "<table width='100%'><tr>" +
                "<td style='color:#fff;font-size:20px;font-weight:700;'>Kanini Academy</td>" +
                "<td align='right' style='color:rgba(255,255,255,0.7);font-size:12px;'>Intern Portal</td>" +
                "</tr></table></td></tr>" +
                "<tr><td style='padding:40px;'>" +
                "<h2 style='margin:0 0 16px;color:#111827;'>Welcome, " + internName + "! \uD83C\uDF89</h2>" +
                "<p style='color:#374151;font-size:15px;line-height:1.7;'>Your intern account has been activated. You can now log in to the Kanini Academy portal to view your scores, attendance, and progress.</p>" +
                "<table width='100%' style='background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;margin:24px 0;'>" +
                "<tr><td style='padding:16px 20px;'>" +
                "<p style='margin:0 0 8px;font-size:13px;font-weight:700;color:#6B7280;text-transform:uppercase;'>Your Login Credentials</p>" +
                "<p style='margin:0 0 6px;font-size:14px;color:#374151;'><strong>Email:</strong> " + internEmail + "</p>" +
                "<p style='margin:0;font-size:14px;color:#374151;'><strong>Temporary Password:</strong> " + tempPassword + "</p>" +
                "</td></tr></table>" +
                "<table style='background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;margin:0 0 24px;'><tr><td style='padding:12px 16px;'>" +
                "<p style='margin:0;font-size:13px;color:#92400E;'><strong>\u26A0 Important:</strong> Please change your password after your first login for security.</p>" +
                "</td></tr></table>" +
                "<p style='color:#374151;font-size:14px;'>Warm regards,<br><strong>Kanini Talent Acquisition Team</strong></p>" +
                "</td></tr>" +
                "<tr><td style='background:#F9FAFB;border-top:1px solid #E5E7EB;padding:16px 40px;text-align:center;'>" +
                "<p style='margin:0;font-size:11px;color:#9CA3AF;'>\u00A9 2026 Kanini Software Solutions</p>" +
                "</td></tr></table></body></html>";
            return sendHtmlEmail(internEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send intern welcome email: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean sendWarningEmail(String internEmail, String internName,
            String warningType, String severity, String message, String issuedBy) {
        try {
            String subject = "Warning Issued \u2014 Kanini Academy";
            String severityColor = severity.equals("SEVERE") ? "#C62828"
                    : severity.equals("MODERATE") ? "#E65100" : "#F9A825";
            String body = "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f4f4f4;padding:30px 0;'>" +
                "<table width='600' cellpadding='0' cellspacing='0' style='background:#fff;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>" +
                "<tr><td style='background:#0F4C81;padding:24px 40px;'>" +
                "<p style='margin:0;color:#fff;font-size:18px;font-weight:700;'>Kanini Academy</p></td></tr>" +
                "<tr><td style='padding:32px 40px;'>" +
                "<p style='font-size:15px;color:#222;'>Dear <strong>" + internName + "</strong>,</p>" +
                "<p style='font-size:14px;color:#444;line-height:1.7;'>A warning has been issued to you by <strong>" + issuedBy + "</strong>. Please log in to the portal to acknowledge it.</p>" +
                "<table width='100%' style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:20px 0;'>" +
                "<tr><td style='padding:16px 20px;'>" +
                "<p style='margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;'>Warning Details</p>" +
                "<p style='margin:0 0 6px;font-size:14px;color:#374151;'><strong>Type:</strong> " + warningType.replace("_", " ") + "</p>" +
                "<p style='margin:0 0 6px;font-size:14px;'><strong>Severity:</strong> <span style='color:" + severityColor + ";font-weight:700;'>" + severity + "</span></p>" +
                "<p style='margin:0;font-size:14px;color:#374151;'><strong>Message:</strong> " + message + "</p>" +
                "</td></tr></table>" +
                "<p style='font-size:13px;color:#666;'>Please log in to the Kanini Academy portal to acknowledge this warning.</p>" +
                "<p style='font-size:13px;color:#666;margin-top:24px;'>Regards,<br><strong>Kanini Talent Acquisition Team</strong></p>" +
                "</td></tr>" +
                "<tr><td style='background:#f5f5f5;padding:14px 40px;text-align:center;border-top:1px solid #eee;'>" +
                "<p style='margin:0;color:#aaa;font-size:11px;'>\u00A9 2026 Kanini Software Solutions</p>" +
                "</td></tr></table></body></html>";
            return sendHtmlEmail(internEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send warning email to {}: {}", internEmail, e.getMessage());
            return false;
        }
    }

    // ─── Core send methods ────────────────────────────────────────────────────

    private boolean sendHtmlEmailWithCid(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);

            String body = htmlBody
                .replace("cid-right-logo", "cid:right-logo")
                .replace("cid-signature", "cid:signature");

            helper.setText(body, true);
            helper.addInline("right-logo", new ClassPathResource("static/images/right-logo.png"));
            helper.addInline("signature", new ClassPathResource("static/images/siganture.png"));

            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);
            return true;
        } catch (Exception e) {
            log.error("❌ EMAIL SEND FAILED to: {} | Error: {}", to, e.getMessage());
            Throwable root = getRootCause(e);
            log.error("❌ Root cause: {} — {}", root.getClass().getSimpleName(), root.getMessage());
            return false;
        }
    }

    private boolean sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
            return true;
        } catch (Exception e) {
            log.error("EMAIL SEND FAILED to {} — root cause: {}", to, getRootCause(e).getMessage());
            return false;
        }
    }

    private Throwable getRootCause(Throwable e) {
        Throwable cause = e;
        while (cause.getCause() != null) cause = cause.getCause();
        return cause;
    }

    private String formatDocumentName(String enumName) {
        if (enumName == null) return "";
        String[] words = enumName.replace("_", " ").toLowerCase().split(" ");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1))
                      .append(" ");
            }
        }
        return result.toString().trim();
    }
}
