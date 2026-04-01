package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityRuleUpdateRequest {
    private List<EligibilityRuleDTO> rules;
    private String logic; // AND or OR
}
