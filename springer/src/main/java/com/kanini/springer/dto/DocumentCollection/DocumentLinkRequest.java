package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentLinkRequest {

    @NotNull(message = "Candidate ID cannot be null")
    private Long candidateId;

    @NotNull(message = "Cycle ID cannot be null")
    private Long cycleId;

    @NotNull(message = "Required document type IDs cannot be null")
    private List<Long> requiredDocumentTypeIds;
}
