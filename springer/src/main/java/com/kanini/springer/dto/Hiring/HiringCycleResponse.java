package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HiringCycleResponse {
    
    private Long cycleId;
    private Integer cycleYear;
    private String cycleName;
    private Integer compensationBand;
    private Integer budget;
    private boolean hasJd; // Indicates if JD file is uploaded
    private String status;
    private LocalDateTime createdAt;
}
