package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponse {
    
    private Long skillId;
    private String skillName;
    private String category; // TECHNICAL or SOFT_SKILL
}
