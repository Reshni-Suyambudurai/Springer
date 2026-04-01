package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentLinkResponse {

    private String linkId;
    private Long candidateId;
    private String candidateEmail;
    private String submissionLink;
    private LocalDateTime expiryDate;
    private List<RequiredDocumentDTO> requiredDocuments;
}
