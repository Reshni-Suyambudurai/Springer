package com.kanini.springer.mapper.Hiring;

import com.kanini.springer.dto.Hiring.SkillResponse;
import com.kanini.springer.entity.HiringReq.Skill;
import org.springframework.stereotype.Component;

@Component
public class SkillsMapper {
    
    /**
     * Map Skill entity to SkillResponse DTO
     */
    public SkillResponse toResponse(Skill skill) {
        SkillResponse response = new SkillResponse();
        response.setSkillId(skill.getSkillId());
        response.setSkillName(skill.getSkillName());
        response.setCategory(skill.getCategory() != null ? skill.getCategory().toString() : null);
        return response;
    }
}
