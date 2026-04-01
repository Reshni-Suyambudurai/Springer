package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for round template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundTemplateResponse {
    
    private Long roundConfigId;
    private Integer roundNo;
    private String roundName;
    private Integer outoffScore;
    private Integer minScore;
    private Integer weightage;
    private Object sections; // JSON object/array
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Long createdBy;
    private String createdByName;
}
