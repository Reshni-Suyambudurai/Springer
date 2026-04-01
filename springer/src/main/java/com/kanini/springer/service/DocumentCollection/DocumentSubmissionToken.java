package com.kanini.springer.service.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSubmissionToken {

    private Long candidateId;
    private String candidateName;
    private Long cycleId;
    private List<Long> requiredDocumentTypeIds;
    private LocalDateTime tokenExpiryDate;
    private String purpose;
    private Long rejectedDocumentTypeId;
    private String candidateEmail;
}
