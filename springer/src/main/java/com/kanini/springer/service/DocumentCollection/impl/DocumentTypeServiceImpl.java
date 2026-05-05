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

    private final DocumentTypeRepository typeRepository;
    private final DocumentSubmissionRepository submissionRepository;
    private final DocumentTypeMapper mapper;
    
    @Override
    @Transactional
    public DocumentTypeResponse createType(DocumentTypeRequest request) {
        // Validate
        if (request.getDocumentType() == null || request.getDocumentType().trim().isEmpty()) {
            throw new ValidationException("Document type cannot be empty");
        }
        
        // Convert to enum and check duplicate
        Enums.DocumentType docTypeEnum;
        try {
            docTypeEnum = Enums.DocumentType.valueOf(request.getDocumentType().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid document type: " + request.getDocumentType());
        }
        
        if (typeRepository.existsByDocumentType(docTypeEnum)) {
            throw new ValidationException("Document type already exists: " + request.getDocumentType());
        }
        
        DocumentType entity = mapper.toEntity(request);
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
        
        if (request.getDocumentType() != null && !request.getDocumentType().trim().isEmpty()) {
            Enums.DocumentType newDocTypeEnum;
            try {
                newDocTypeEnum = Enums.DocumentType.valueOf(request.getDocumentType().toUpperCase(java.util.Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid document type: " + request.getDocumentType());
            }
            
            if (!type.getDocumentType().equals(newDocTypeEnum) 
                    && typeRepository.existsByDocumentType(newDocTypeEnum)) {
                throw new ValidationException("Document type already exists: " + request.getDocumentType());
            }
            type.setDocumentType(newDocTypeEnum);
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
