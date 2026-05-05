package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for fetching drives by cycle ID
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CycleIdRequest {
    @NotNull(message = "Cycle ID is required")
    private Long cycleId;
}
