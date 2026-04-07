package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.OfferLetterResponse;
import com.kanini.springer.dto.DocumentCollection.RequiredDocumentDTO;
import com.kanini.springer.entity.utils.EmailTemplate;
import com.kanini.springer.repository.EmailTemplateRepository;
import com.kanini.springer.service.DocumentCollection.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;

import java.time.LocalDate;
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
    private static final DateTimeFormatter DATE_ONLY_FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy");

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

            // Deduplicate documents by type (in case same document appears multiple times)
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
    public boolean sendOfferEmail(String candidateEmail, String candidateName,
            OfferLetterResponse offerDetails, String acceptLink, String declineLink) {
        try {
            String subject = "Job Offer \u2013 Kanini Software Solutions";
            String body = buildOfferEmailBody(candidateName, offerDetails, acceptLink, declineLink);
            return sendHtmlEmail(candidateEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send offer email: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean sendOfferAcceptanceConfirmation(String candidateEmail, String candidateName,
            LocalDate joiningDate) {
        try {
            String subject = "Welcome to Kanini Software Solutions!";
            String body = buildAcceptanceEmailBody(candidateName, joiningDate);
            return sendHtmlEmail(candidateEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send acceptance confirmation: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean sendOfferDeclineConfirmation(String candidateEmail, String candidateName) {
        try {
            String subject = "Offer Status Update \u2013 Kanini Software Solutions";
            String body = buildDeclineEmailBody(candidateName);
            return sendHtmlEmail(candidateEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send decline confirmation: {}", e.getMessage(), e);
            return false;
        }
    }

    // ─── Core send method with CID inline images ─────────────────────────────

    private boolean sendHtmlEmailWithCid(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);

            // Replace DB placeholder URLs with cid: references
            String body = htmlBody
                .replace("cid-right-logo", "cid:right-logo")
                .replace("cid-signature", "cid:signature");

            helper.setText(body, true);

            // Attach images inline with CID
            helper.addInline("right-logo", new ClassPathResource("static/images/right-logo.png"));
            helper.addInline("signature", new ClassPathResource("static/images/siganture.png"));

            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);
            return true;
        } catch (Exception e) {
            log.error("❌ EMAIL SEND FAILED to: {} | Error type: {} | Message: {}", to, e.getClass().getSimpleName(), e.getMessage());
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
            log.error("Full email error:", e);
            return false;
        }
    }

    private Throwable getRootCause(Throwable e) {
        Throwable cause = e;
        while (cause.getCause() != null) cause = cause.getCause();
        return cause;
    }

    // ─── Helper: format enum name to readable ────────────────────────────────

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

    // ─── Offer email bodies (no DB template needed — kept inline) ────────────

    private String buildOfferEmailBody(String candidateName, OfferLetterResponse offer,
            String acceptLink, String declineLink) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f4f4f4;padding:30px 0;'>" +
               "<table width='650' cellpadding='0' cellspacing='0' style='background:#fff;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>" +
               "<tr><td style='background:#0D47A1;height:6px;'></td></tr>" +
               "<tr><td style='padding:30px 40px 20px 40px;text-align:right;'>" +
               "<img src='https://www.kanini.com/wp-content/uploads/2022/03/kanini-logo.png' alt='Kanini' style='width:90px;'></td></tr>" +
               "<tr><td style='padding:10px 40px 30px 40px;'>" +
               "<p style='font-size:16px;color:#222;'>Dear <strong>" + candidateName + "</strong>,</p>" +
               "<p style='font-size:15px;color:#444;line-height:1.7;'>We are delighted to extend an offer of employment to you at <strong>Kanini Software Solutions</strong>.</p>" +
               "<table width='100%' style='margin:20px 0;background:#f0f4ff;border-left:4px solid #0D47A1;border-radius:0 6px 6px 0;'>" +
               "<tr><td style='padding:20px;'>" +
               "<p style='margin:0 0 8px;color:#0D47A1;font-weight:700;font-size:14px;text-transform:uppercase;'>Offer Details</p>" +
               "<p style='margin:0 0 6px;font-size:14px;color:#333;'><strong>Issue Date:</strong>&nbsp;" + offer.getIssueDate() + "</p>" +
               "</td></tr></table>" +
               "<table width='100%' style='margin:24px 0;'><tr>" +
               "<td align='center' style='padding-right:10px;'><a href='" + acceptLink + "' style='display:inline-block;background:#2E7D32;color:#fff;padding:13px 36px;font-size:14px;font-weight:700;border-radius:5px;text-decoration:none;'>ACCEPT OFFER</a></td>" +
               "<td align='center' style='padding-left:10px;'><a href='" + declineLink + "' style='display:inline-block;background:#C62828;color:#fff;padding:13px 36px;font-size:14px;font-weight:700;border-radius:5px;text-decoration:none;'>DECLINE OFFER</a></td>" +
               "</tr></table>" +
               "<p style='font-size:13px;color:#666;'>For assistance, contact <a href='mailto:hrops.india@kanini.com' style='color:#0D47A1;'>hrops.india@kanini.com</a></p>" +
               "</td></tr>" +
               "<tr><td style='background:#f5f5f5;padding:16px 40px;text-align:center;border-top:1px solid #eee;'>" +
               "<p style='margin:0;color:#aaa;font-size:11px;'>Automated mail from <a href='https://myhrms.kanini.com' style='color:#0D47A1;'>https://myhrms.kanini.com</a></p>" +
               "</td></tr></table></body></html>";
    }

    private String buildAcceptanceEmailBody(String candidateName, LocalDate joiningDate) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f4f4f4;padding:30px 0;'>" +
               "<table width='650' cellpadding='0' cellspacing='0' style='background:#fff;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>" +
               "<tr><td style='background:#2E7D32;height:6px;'></td></tr>" +
               "<tr><td style='padding:30px 40px 20px 40px;text-align:right;'>" +
               "<img src='https://www.kanini.com/wp-content/uploads/2022/03/kanini-logo.png' alt='Kanini' style='width:90px;'></td></tr>" +
               "<tr><td style='padding:10px 40px 30px 40px;'>" +
               "<p style='font-size:16px;color:#222;'>Dear <strong>" + candidateName + "</strong>,</p>" +
               "<p style='font-size:15px;color:#444;line-height:1.7;'>We are thrilled to welcome you to the <strong>Kanini family</strong>! Your joining date is confirmed as <strong>" + joiningDate.format(DATE_ONLY_FORMATTER) + "</strong>.</p>" +
               "<p style='font-size:14px;color:#666;'>Further onboarding details will be shared with you shortly. We look forward to having you on board!</p>" +
               "<p style='font-size:13px;color:#666;'>For assistance, contact <a href='mailto:hrops.india@kanini.com' style='color:#0D47A1;'>hrops.india@kanini.com</a></p>" +
               "</td></tr>" +
               "<tr><td style='background:#f5f5f5;padding:16px 40px;text-align:center;border-top:1px solid #eee;'>" +
               "<p style='margin:0;color:#aaa;font-size:11px;'>Automated mail from <a href='https://myhrms.kanini.com' style='color:#0D47A1;'>https://myhrms.kanini.com</a></p>" +
               "</td></tr></table></body></html>";
    }

    private String buildDeclineEmailBody(String candidateName) {
        return "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;background:#f4f4f4;padding:30px 0;'>" +
               "<table width='650' cellpadding='0' cellspacing='0' style='background:#fff;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>" +
               "<tr><td style='background:#0D47A1;height:6px;'></td></tr>" +
               "<tr><td style='padding:30px 40px 20px 40px;text-align:right;'>" +
               "<img src='https://www.kanini.com/wp-content/uploads/2022/03/kanini-logo.png' alt='Kanini' style='width:90px;'></td></tr>" +
               "<tr><td style='padding:10px 40px 30px 40px;'>" +
               "<p style='font-size:16px;color:#222;'>Dear <strong>" + candidateName + "</strong>,</p>" +
               "<p style='font-size:15px;color:#444;line-height:1.7;'>Thank you for considering a career at <strong>Kanini Software Solutions</strong>. We respect your decision and wish you all the very best in your future endeavours.</p>" +
               "<p style='font-size:13px;color:#666;'>For assistance, contact <a href='mailto:hrops.india@kanini.com' style='color:#0D47A1;'>hrops.india@kanini.com</a></p>" +
               "</td></tr>" +
               "<tr><td style='background:#f5f5f5;padding:16px 40px;text-align:center;border-top:1px solid #eee;'>" +
               "<p style='margin:0;color:#aaa;font-size:11px;'>Automated mail from <a href='https://myhrms.kanini.com' style='color:#0D47A1;'>https://myhrms.kanini.com</a></p>" +
               "</td></tr></table></body></html>";
    }
}
