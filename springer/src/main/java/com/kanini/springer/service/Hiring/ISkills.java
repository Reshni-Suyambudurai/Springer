package com.kanini.springer.service.Hiring;

import com.kanini.springer.dto.Hiring.SkillRequest;
import com.kanini.springer.dto.Hiring.SkillResponse;

import java.util.List;

public interface ISkills {
    
    /**
     * Create a new skill
     */
    SkillResponse createSkill(SkillRequest request);
    
    /**
     * Get skill by ID
     */
    SkillResponse getSkillById(Long skillId);
    
    /**
     * Get all skills
     */
    List<SkillResponse> getAllSkills();
    
    /**
     * Update existing skill
     */
    SkillResponse updateSkill(Long skillId, SkillRequest request);
    
    /**
     * Delete skill
     */
    void deleteSkill(Long skillId);
    
    /**
     * Search skills by name
     */
    SkillResponse getSkillByName(String skillName);
} 