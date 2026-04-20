package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CycleWithDrivesResponse {
    
    private Long cycleId;
    private String cycleName;
    private Integer cycleYear;
    private String status;
    private List<DriveInfo> drives;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriveInfo {
        private Long driveId;
        private String driveName;
        private String mode;
        private String instituteName; // populated for ON_CAMPUS drives
    }
}
