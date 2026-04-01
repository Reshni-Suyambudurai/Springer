package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchAllocationRequest {

    private Integer programId;

    private Long candidateId;

    @Min(value = 1, message = "Batch number must be at least 1")
    private Integer batchNumber;

    private byte[] image;

    private Boolean isActive;

    private String performance;
}
