package com.kanini.springer.controller.DocumentCollection;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeResponse;
import com.kanini.springer.service.DocumentCollection.IDocumentTypeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents/types")
@RequiredArgsConstructor
@Validated
public class DocumentTypeController {
    
    private final IDocumentTypeService typeService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<DocumentTypeResponse>> createType(
            @Valid @RequestBody DocumentTypeRequest request) {
        DocumentTypeResponse response = typeService.createType(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document type created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentTypeResponse>>> getAllTypes() {
        List<DocumentTypeResponse> response = typeService.getAllTypes();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document types retrieved successfully", response));
    }
    
    @GetMapping("/{documentTypeId}")
    public ResponseEntity<ApiResponse<DocumentTypeResponse>> getTypeById(
            @PathVariable Long documentTypeId) {
        DocumentTypeResponse response = typeService.getTypeById(documentTypeId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document type retrieved successfully", response));
    }
    
    @PatchMapping("/{documentTypeId}")
    public ResponseEntity<ApiResponse<DocumentTypeResponse>> updateType(
            @PathVariable Long documentTypeId,
            @Valid @RequestBody DocumentTypeRequest request) {
        DocumentTypeResponse response = typeService.updateType(documentTypeId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document type updated successfully", response));
    }
    
    @DeleteMapping("/{documentTypeId}")
    public ResponseEntity<ApiResponse<Void>> deleteType(
            @PathVariable Long documentTypeId) {
        typeService.deleteType(documentTypeId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Document type deleted successfully"));
    }
}
