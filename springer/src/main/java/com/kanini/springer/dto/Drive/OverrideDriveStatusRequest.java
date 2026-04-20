package com.kanini.springer.dto.Drive;

import lombok.Data;

@Data
public class OverrideDriveStatusRequest {
    private Long applicationId;
    private String status;
    private String reason;
    private Long userId;
}
