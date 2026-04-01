package com.kanini.springer.dto.DocumentCollection;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeRequest {
    
    @NotBlank(message = "Document type cannot be blank")
    private String documentType;
}
