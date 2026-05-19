package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Drive.FormRequest;
import com.kanini.springer.dto.Drive.FormResponse;
import com.kanini.springer.dto.Drive.FormUpdateRequest;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.Form;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Drive.FormMapper;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Drive.FormRepository;
import com.kanini.springer.service.Drive.IFormService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for form operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FormServiceImpl implements IFormService {

    private final FormRepository formRepository;
    private final DriveRepository driveRepository;
    private final FormMapper mapper;

    @Override
    @Transactional
    public FormResponse createForm(FormRequest request) {
        log.info("Creating form for drive ID: {}, name: {}", request.getDriveId(), request.getFormName());

        // Validate drive exists
        Drive drive = driveRepository.findById(request.getDriveId())
                .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", request.getDriveId()));

        // Convert to entity and save
        Form form = mapper.toEntity(request, drive);
        Form savedForm = formRepository.save(form);

        log.info("Form created successfully. Form ID: {}", savedForm.getFormId());
        return mapper.toResponse(savedForm);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormResponse> getAllForms() {
        log.info("Fetching all forms");
        
        List<Form> forms = formRepository.findAll();
        return forms.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormResponse> getFormsByDriveId(Long driveId) {
        log.info("Fetching all forms for drive ID: {}", driveId);

        // Validate drive exists
        if (!driveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Drive", "ID", driveId);
        }

        List<Form> forms = formRepository.findByDriveDriveId(driveId);
        return forms.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FormResponse> getActiveFormsByDriveId(Long driveId) {
        log.info("Fetching active forms for drive ID: {}", driveId);

        // Validate drive exists
        if (!driveRepository.existsById(driveId)) {
            throw new ResourceNotFoundException("Drive", "ID", driveId);
        }

        List<Form> forms = formRepository.findByDriveDriveIdAndStatusTrue(driveId);
        return forms.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FormResponse getFormById(Long formId) {
        log.info("Fetching form by ID: {}", formId);

        Form form = formRepository.findByIdWithDetails(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form", "ID", formId));

        return mapper.toResponse(form);
    }

    @Override
    @Transactional
    public FormResponse updateForm(Long formId, FormUpdateRequest request) {
        log.info("Updating form ID: {}", formId);

        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form", "ID", formId));

        // Update fields
        if (request.getFormName() != null) {
            form.setFormName(request.getFormName());
        }
        if (request.getStatus() != null) {
            form.setStatus(request.getStatus());
        }

        Form updatedForm = formRepository.save(form);
        log.info("Form updated successfully");
        return mapper.toResponse(updatedForm);
    }

    @Override
    @Transactional
    public void deleteForm(Long formId) {
        log.info("Deleting form ID: {}", formId);

        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form", "ID", formId));

        formRepository.delete(form);
        log.info("Form deleted successfully");
    }
}
