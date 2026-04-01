package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RequiredDocumentDTO {

    private Long documentTypeId;
    private String documentType;
    private boolean isRequired;
    private String status;
}
