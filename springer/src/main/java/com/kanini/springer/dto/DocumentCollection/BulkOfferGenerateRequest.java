package com.kanini.springer.dto.DocumentCollection;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkOfferGenerateRequest {

    @NotEmpty(message = "At least one candidate ID is required")
    private List<Long> candidateIds;

    @NotNull(message = "Cycle ID is required")
    private Long cycleId;
}
