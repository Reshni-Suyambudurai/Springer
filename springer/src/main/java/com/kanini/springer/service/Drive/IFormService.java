package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.FormRequest;
import com.kanini.springer.dto.Drive.FormResponse;
import com.kanini.springer.dto.Drive.FormUpdateRequest;

import java.util.List;

/**
 * Service interface for form operations
 */
public interface IFormService {

    /**
     * Create a new form
     */
    FormResponse createForm(FormRequest request);

    /**
     * Get all forms
     */
    List<FormResponse> getAllForms();

    /**
     * Get all forms by drive ID
     */
    List<FormResponse> getFormsByDriveId(Long driveId);

    /**
     * Get active forms by drive ID
     */
    List<FormResponse> getActiveFormsByDriveId(Long driveId);

    /**
     * Get form by ID
     */
    FormResponse getFormById(Long formId);

    /**
     * Update form
     */
    FormResponse updateForm(Long formId, FormUpdateRequest request);

    /**
     * Delete form by ID
     */
    void deleteForm(Long formId);
}
