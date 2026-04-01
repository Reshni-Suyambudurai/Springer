package com.kanini.springer.entity.Drive;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.kanini.springer.entity.HiringReq.Skill;

/**
 * Skills mentioned by the candidates are stored here
 * Junction table between Candidate and Skill (master table)
 */
@Entity
@Table(name = "candidate_skills",
   
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_candidate_skill", columnNames = {"candidate_id", "skill_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateSkill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer candidateSkillId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id")
    private Skill skill; // References master skills table directly
}
