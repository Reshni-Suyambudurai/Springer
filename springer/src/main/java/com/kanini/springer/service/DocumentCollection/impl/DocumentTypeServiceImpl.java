package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.DocumentTypeRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.DocumentCollection.DocumentTypeMapper;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.service.DocumentCollection.IDocumentTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentTypeServiceImpl implements IDocumentTypeService {

    private static final String DOC_TYPE_NOT_FOUND = "Document type not found with ID: ";
    private static final int MAX_DOC_TYPE_LENGTH = 50;

    private final DocumentTypeRepository typeRepository;
    private final DocumentSubmissionRepository submissionRepository;
    private final DocumentTypeMapper mapper;
    
    private void validateDocumentType(String docType) {
        if (docType == null || docType.trim().isEmpty()) {
            throw new ValidationException("Document type name cannot be empty");
        }
        if (docType.length() > MAX_DOC_TYPE_LENGTH) {
            throw new ValidationException("Document type name must be 50 characters or less");
        }
        if (!docType.matches("^[a-zA-Z0-9\\s\\-_]+$")) {
            throw new ValidationException("Document type name can only contain letters, numbers, spaces, hyphens, and underscores");
        }
    }
    
    @Override
    @Transactional
    public DocumentTypeResponse createType(DocumentTypeRequest request) {
        String docType = request.getDocumentType();
        validateDocumentType(docType);
        
        // Normalize: convert to uppercase and replace spaces with underscores
        String normalized = docType.trim().toUpperCase(java.util.Locale.ROOT).replaceAll("\\s+", "_");
        
        // Check duplicate
        if (typeRepository.existsByDocumentType(normalized)) {
            throw new ValidationException("Document type already exists: " + normalized);
        }
        
        DocumentType entity = new DocumentType();
        entity.setDocumentType(normalized);
        DocumentType saved = typeRepository.save(entity);
        return mapper.toResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public DocumentTypeResponse getTypeById(Long documentTypeId) {
        DocumentType type = typeRepository.findById(documentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException(DOC_TYPE_NOT_FOUND + documentTypeId));
        return mapper.toResponse(type);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DocumentTypeResponse> getAllTypes() {
        return typeRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional
    public DocumentTypeResponse updateType(Long documentTypeId, DocumentTypeRequest request) {
        DocumentType type = typeRepository.findById(documentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException(DOC_TYPE_NOT_FOUND + documentTypeId));
        
        String docType = request.getDocumentType();
        if (docType != null && !docType.trim().isEmpty()) {
            validateDocumentType(docType);
            String normalized = docType.trim().toUpperCase(java.util.Locale.ROOT).replaceAll("\\s+", "_");
            
            if (!type.getDocumentType().equals(normalized) 
                    && typeRepository.existsByDocumentType(normalized)) {
                throw new ValidationException("Document type already exists: " + normalized);
            }
            type.setDocumentType(normalized);
        }
        
        DocumentType updated = typeRepository.save(type);
        return mapper.toResponse(updated);
    }
    
    @Override
    @Transactional
    public void deleteType(Long documentTypeId) {
        DocumentType type = typeRepository.findById(documentTypeId)
                .orElseThrow(() -> new ResourceNotFoundException(DOC_TYPE_NOT_FOUND + documentTypeId));

        // Guard: cannot delete if submissions exist for this type
        long submissionCount = submissionRepository.countByDocumentTypeId(documentTypeId);
        if (submissionCount > 0) {
            throw new ValidationException("Cannot delete this document type — "
                    + submissionCount + " candidate submission(s) already exist for it. "
                    + "Remove all submissions first or archive this type instead.");
        }

        typeRepository.delete(type);
    }
}
