package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary response for hiring cycles - contains only basic identification fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HiringCycleSummaryResponse {
    
    private Long cycleId;
    private Integer cycleYear;
    private String cycleName;
    private String status;
}
