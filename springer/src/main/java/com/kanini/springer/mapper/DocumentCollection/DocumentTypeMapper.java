package com.kanini.springer.mapper.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentTypeRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import org.springframework.stereotype.Component;

@Component
public class DocumentTypeMapper {
    
    public DocumentTypeResponse toResponse(DocumentType entity) {
        if (entity == null) {
            return null;
        }
        
        DocumentTypeResponse response = new DocumentTypeResponse();
        response.setDocumentTypeId(entity.getDocumentTypeId());
        response.setDocumentType(entity.getDocumentType());
        response.setCreatedAt(entity.getCreatedAt());
        
        return response;
    }
    
    public DocumentType toEntity(DocumentTypeRequest request) {
        if (request == null) {
            return null;
        }
        
        DocumentType entity = new DocumentType();
        entity.setDocumentType(request.getDocumentType());
        
        return entity;
    }
}
