package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for fetching evaluations by round number and application IDs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundEvaluationRequest {
    
    private Integer roundNo; // required - maps to RoundTemplate.roundNo (e.g., 1=Aptitude, 2=Communication, 3=Technical)
    private List<Long> applicationIds; // required - list of application IDs from the selected batch
}
