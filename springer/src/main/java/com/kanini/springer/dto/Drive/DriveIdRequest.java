package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for fetching drive data by drive ID
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveIdRequest {
    private Long driveId;
}
