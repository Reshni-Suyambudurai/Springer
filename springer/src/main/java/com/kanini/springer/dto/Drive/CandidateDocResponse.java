package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight response DTO for document processing views.
 * Contains only the fields needed by SendDocumentsTab table.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateDocResponse {
    private Long candidateId;
    private String firstName;
    private String lastName;
    private String email;
    private String department;
    private String applicationStage;
}
