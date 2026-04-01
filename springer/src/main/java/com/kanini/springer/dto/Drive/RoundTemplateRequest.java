package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new round template
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundTemplateRequest {
    
    private Integer roundNo; // required - 1/2/3...
    private String roundName; // required - technical round, communication round
    private Integer outoffScore; // required - e.g., 100
    private Integer minScore; // required - e.g., 80
    private Integer weightage; // required - e.g., 0.4
    private Object sections; // optional - JSON object/array: [{sectionName: "Technical", outOf: 29}]
    private Boolean isActive; // default true if not sent
    private Long createdBy; // required - userId
}
