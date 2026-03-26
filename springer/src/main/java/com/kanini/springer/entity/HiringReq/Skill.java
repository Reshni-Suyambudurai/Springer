package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.kanini.springer.entity.Drive.CandidateSkill;
import com.kanini.springer.entity.Drive.RequisitionSkill;
import com.kanini.springer.entity.enums.Enums.SkillCategory;

/**
 * Master table containing all available skills in the system
 * Referenced by both HiringDemand (via RequisitionSkill) and Candidate (via CandidateSkill)
 */
@Entity
@Table(name = "skills",
    indexes = {
        @Index(name = "idx_skill_name", columnList = "skillName", unique = true)
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Skill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long skillId;
    
    private String skillName; // e.g., Java, Testing, Python
    
    @Enumerated(EnumType.STRING)
    private SkillCategory category; // TECHNICAL, SOFT_SKILL
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL)
    private List<RequisitionSkill> requisitionSkills;
    
    @OneToMany(mappedBy = "skill", cascade = CascadeType.ALL)
    private List<CandidateSkill> candidateSkills;
}
