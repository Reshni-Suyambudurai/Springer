package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentTypeRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeResponse;

import java.util.List;

public interface IDocumentTypeService {
    
    DocumentTypeResponse createType(DocumentTypeRequest request);
    
    DocumentTypeResponse getTypeById(Long documentTypeId);
    
    List<DocumentTypeResponse> getAllTypes();
    
    DocumentTypeResponse updateType(Long documentTypeId, DocumentTypeRequest request);
    
    void deleteType(Long documentTypeId);
}
