package com.kanini.springer.dto.Common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO summarising the result of a bulk email send operation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkEmailResult {

    private int totalRequested;
    private int successCount;
    private int skippedCount;
    private List<String> sentTo;
    private List<String> skipped;
}
