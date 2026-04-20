package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk round skip/hold/absent.
 * Used when a round is not conducted for a batch of candidates.
 * Status: SKIP, HOLD, or ABSENT (applied uniformly to all applicationIds).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkRoundSkipRequest {
    private List<Long> applicationIds;  // required — applications to update
    private Long roundConfigId;         // required — the round being skipped/held/absent
    private Long reviewedBy;            // required — user performing the action
    private String status;              // required — SKIP, HOLD, or ABSENT
    private String reason;              // required when status = SKIP — stored as review in evaluation
}
