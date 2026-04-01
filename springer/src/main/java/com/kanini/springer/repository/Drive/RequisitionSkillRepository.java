package com.kanini.springer.repository.Drive;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.kanini.springer.entity.Drive.RequisitionSkill;

import java.util.List;

@Repository
public interface RequisitionSkillRepository extends JpaRepository<RequisitionSkill, Integer> {
    
    /**
     * Find all requisition skills for a specific hiring demand
     */
    List<RequisitionSkill> findByDemandDemandId(Long demandId);
    
    /**
     * Delete all requisition skills for a specific hiring demand
     */
    void deleteByDemandDemandId(Long demandId);
    
    /**
     * Check if a skill is already mapped to a demand
     */
    boolean existsByDemandDemandIdAndSkillSkillId(Long demandId, Long skillId);
    
    /**
     * Get skill names for a specific hiring demand
     */
    @Query("SELECT rs.skill.skillName FROM RequisitionSkill rs WHERE rs.demand.demandId = :demandId")
    List<String> findSkillNamesByDemandId(@Param("demandId") Long demandId);
}
