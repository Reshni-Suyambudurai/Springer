package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSubmissionStatusResponse {

    private Long candidateId;
    private String candidateName;
    private Long cycleId;
    private int completionPercentage;
    private int totalRequired;
    private List<DocumentStatusDTO> documents;
    private LocalDateTime linkExpiryDate;
}
