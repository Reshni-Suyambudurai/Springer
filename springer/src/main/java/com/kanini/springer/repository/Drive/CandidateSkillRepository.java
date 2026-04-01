package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.CandidateSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateSkillRepository extends JpaRepository<CandidateSkill, Integer> {
    
    /**
     * Delete all skills for a specific candidate
     * @param candidateId Candidate ID
     */
    void deleteByCandidateCandidateId(Long candidateId);
    
    /**
     * Find all skills for a specific candidate
     * @param candidateId Candidate ID
     * @return List of candidate skills
     */
    List<CandidateSkill> findByCandidateCandidateId(Long candidateId);
}
