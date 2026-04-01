package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityRuleDTO {
    private String field;
    private String operator;
    private Double value;
    private Integer min;
    private Integer max;
    private String message;
    private List<String> allowedValues;
}
