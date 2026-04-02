package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for evaluations fetched by round number and application IDs.
 * Contains the full round template details and the list of candidate evaluation records.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundEvaluationResponse {

    private RoundTemplateResponse roundTemplate;
    private List<CandidateEvaluationResponse> evaluations;
}
