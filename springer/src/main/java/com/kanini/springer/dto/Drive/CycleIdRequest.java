package com.kanini.springer.dto.Drive;

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
    private Long cycleId;
}
