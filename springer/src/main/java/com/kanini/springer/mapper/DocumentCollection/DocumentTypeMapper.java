package com.kanini.springer.mapper.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentTypeRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.enums.Enums;
import org.springframework.stereotype.Component;

@Component
public class DocumentTypeMapper {
    
    public DocumentTypeResponse toResponse(DocumentType entity) {
        if (entity == null) {
            return null;
        }
        
        DocumentTypeResponse response = new DocumentTypeResponse();
        response.setDocumentTypeId(entity.getDocumentTypeId());
        if (entity.getDocumentType() != null) {
            response.setDocumentType(entity.getDocumentType().name());
        }
        response.setCreatedAt(entity.getCreatedAt());
        
        return response;
    }
    
    public DocumentType toEntity(DocumentTypeRequest request) {
        if (request == null) {
            return null;
        }
        
        DocumentType entity = new DocumentType();
        try {
            entity.setDocumentType(Enums.DocumentType.valueOf(request.getDocumentType().toUpperCase(java.util.Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid document type: " + request.getDocumentType());
        }
        
        return entity;
    }
}
