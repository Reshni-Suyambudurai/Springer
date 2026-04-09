package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for fetching candidates by cycle and application stages.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoiningTrackerRequest {
    private Long cycleId;
    private List<String> applicationStages;
}
