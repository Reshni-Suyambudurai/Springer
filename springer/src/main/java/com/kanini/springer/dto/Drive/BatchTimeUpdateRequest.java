package com.kanini.springer.dto.Drive;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BatchTimeUpdateRequest {
    private Long driveId;
    private Long applicationId;
    private LocalDateTime oldBatchTime;
    private LocalDateTime newBatchTime;
    private Long updatedBy;
}

