package com.kanini.springer.mapper.Drive;

import com.kanini.springer.dto.Drive.FormRequest;
import com.kanini.springer.dto.Drive.FormResponse;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.Form;
import org.springframework.stereotype.Component;

/**
 * Mapper for Form entity and DTOs
 */
@Component
public class FormMapper {

    /**
     * Convert FormRequest to Form entity
     */
    public Form toEntity(FormRequest request, Drive drive) {
        if (request == null) {
            return null;
        }

        Form form = new Form();
        form.setDrive(drive);
        form.setFormName(request.getFormName());
        form.setStatus(request.getStatus() != null ? request.getStatus() : true);

        return form;
    }

    /**
     * Convert Form entity to FormResponse
     */
    public FormResponse toResponse(Form form) {
        if (form == null) {
            return null;
        }

        FormResponse response = new FormResponse();
        response.setFormId(form.getFormId());
        response.setFormName(form.getFormName());
        response.setStatus(form.getStatus());
        response.setCreatedAt(form.getCreatedAt());
        response.setUpdatedAt(form.getUpdatedAt());

        // Map drive details
        if (form.getDrive() != null) {
            response.setDriveId(form.getDrive().getDriveId());
            response.setDriveName(form.getDrive().getDriveName());
        }

        return response;
    }
}
