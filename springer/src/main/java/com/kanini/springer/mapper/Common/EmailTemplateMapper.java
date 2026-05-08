package com.kanini.springer.mapper.Common;

import com.kanini.springer.dto.Common.EmailTemplateRequest;
import com.kanini.springer.dto.Common.EmailTemplateResponse;
import com.kanini.springer.entity.utils.EmailTemplate;
import org.springframework.stereotype.Component;

/**
 * Mapper for EmailTemplate entity and DTOs
 */
@Component
public class EmailTemplateMapper {

    /**
     * Convert EmailTemplateRequest to EmailTemplate entity
     */
    public EmailTemplate toEntity(EmailTemplateRequest request) {
        if (request == null) {
            return null;
        }

        EmailTemplate template = new EmailTemplate();
        template.setTemplateName(request.getTemplateName());
        template.setSubject(request.getSubject());
        template.setBody(request.getBody());

        return template;
    }

    /**
     * Convert EmailTemplate entity to EmailTemplateResponse
     */
    public EmailTemplateResponse toResponse(EmailTemplate template) {
        if (template == null) {
            return null;
        }

        EmailTemplateResponse response = new EmailTemplateResponse();
        response.setTemplateId(template.getTemplateId());
        response.setTemplateName(template.getTemplateName());
        response.setSubject(template.getSubject());
        response.setBody(template.getBody());

        return response;
    }
}
