package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEvaluationStatusUpdateRequest {

    private String status; // PASS, FAIL, ABSENT, HOLD, SKIP
    private List<Long> applicationIds;
    private Long roundConfigId; // round to update evaluations for
    private Long updatedBy; // user ID for history tracking
    private String reason; // optional — required for SKIP
}
