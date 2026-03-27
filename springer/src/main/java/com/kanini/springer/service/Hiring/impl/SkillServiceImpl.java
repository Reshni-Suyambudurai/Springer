package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.SkillRequest;
import com.kanini.springer.dto.Hiring.SkillResponse;
import com.kanini.springer.entity.HiringReq.Skill;
import com.kanini.springer.entity.enums.Enums.SkillCategory;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.SkillsMapper;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.service.Hiring.ISkills;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements ISkills {
    
    private final SkillRepository skillRepository;
    private final SkillsMapper mapper;
    
    @Override
    @Transactional
    public SkillResponse createSkill(SkillRequest request) {
        // Validation: Check if skill already exists
        if (skillRepository.existsBySkillName(request.getSkillName())) {
            throw new ValidationException("Skill already exists with name: " + request.getSkillName());
        }
        
        // Validate and parse category
        SkillCategory category;
        try {
            category = SkillCategory.valueOf(request.getCategory());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid skill category: " + request.getCategory() + ". Must be TECHNICAL or SOFT_SKILL");
        }
        
        Skill skill = new Skill();
        skill.setSkillName(request.getSkillName());
        skill.setCategory(category);
        
        Skill savedSkill = skillRepository.save(skill);
        return mapper.toResponse(savedSkill);
    }
    
    @Override
    public SkillResponse getSkillById(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "ID", skillId));
        return mapper.toResponse(skill);
    }
    
    @Override
    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public SkillResponse updateSkill(Long skillId, SkillRequest request) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "ID", skillId));
        
        // Validation: Check if new name already exists (excluding current skill)
        if (skillRepository.existsBySkillName(request.getSkillName()) 
                && !skill.getSkillName().equals(request.getSkillName())) {
            throw new ValidationException("Skill already exists with name: " + request.getSkillName());
        }
        
        // Validate and parse category
        SkillCategory category;
        try {
            category = SkillCategory.valueOf(request.getCategory());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid skill category: " + request.getCategory() + ". Must be TECHNICAL or SOFT_SKILL");
        }
        
        skill.setSkillName(request.getSkillName());
        skill.setCategory(category);
        Skill updatedSkill = skillRepository.save(skill);
        return mapper.toResponse(updatedSkill);
    }
    
    @Override
    @Transactional
    public void deleteSkill(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "ID", skillId));
        
        // Validation: Check if skill is being used in any requisitions or candidates
        if (skill.getRequisitionSkills() != null && !skill.getRequisitionSkills().isEmpty()) {
            throw new ValidationException("Cannot delete skill that is referenced in hiring demands");
        }
        
        if (skill.getCandidateSkills() != null && !skill.getCandidateSkills().isEmpty()) {
            throw new ValidationException("Cannot delete skill that is referenced in candidate profiles");
        }
        
        skillRepository.delete(skill);
    }
    
    @Override
    public SkillResponse getSkillByName(String skillName) {
        Skill skill = skillRepository.findBySkillName(skillName)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "name", skillName));
        return mapper.toResponse(skill);
    }
}
