package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a round template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundTemplateUpdateRequest {
    
    private Integer roundNo;
    private String roundName;
    private Integer outoffScore;
    private Integer minScore;
    private Integer weightage;
    private Object sections; // JSON object/array
    private Boolean isActive;
}
