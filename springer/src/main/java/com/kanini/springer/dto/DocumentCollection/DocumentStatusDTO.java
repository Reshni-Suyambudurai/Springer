package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentStatusDTO {

    private Long documentTypeId;
    private String documentType;
    private boolean isRequired;
    private String status;
    private LocalDateTime uploadedAt;
    private String rejectionReason;
}
