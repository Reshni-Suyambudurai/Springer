package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findBySkillName(String skillName);
    boolean existsBySkillName(String skillName);
}
