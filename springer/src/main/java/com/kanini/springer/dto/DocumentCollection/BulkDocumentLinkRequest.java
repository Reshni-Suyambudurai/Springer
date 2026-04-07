package com.kanini.springer.dto.DocumentCollection;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDocumentLinkRequest {

    @NotEmpty(message = "Candidate IDs cannot be empty")
    private List<Long> candidateIds;

    @NotNull(message = "Cycle ID is required")
    private Long cycleId;

    @NotEmpty(message = "Document type IDs cannot be empty")
    private List<Long> documentTypeIds;

    // Optional exact deadline configured by user. If omitted, system defaults to 7 days.
    private LocalDateTime submissionDeadline;
}
