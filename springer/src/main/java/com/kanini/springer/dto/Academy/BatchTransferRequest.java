package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for transferring a student from one batch to another.
 * The old allocation is deactivated; a new allocation is created in the target batch.
 * Scores are merged using best-score-per-course logic across all allocations for the candidate.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchTransferRequest {

    /** Target program ID (can be same program, different batch). */
    private Integer targetProgramId;

    /** Target batch number within the target program. */
    private Integer targetBatchNumber;

    /** Optional reason for the transfer — stored for audit. */
    private String transferReason;
}
