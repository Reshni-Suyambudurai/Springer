package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.TrainingProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, Integer> {
    
    List<TrainingProgram> findByStatus(boolean status);
    
    Optional<TrainingProgram> findByProgramId(Integer programId);
    
    List<TrainingProgram> findByCycle_CycleId(Long cycleId);
    
    List<TrainingProgram> findByLocation(String location);
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p.programYear FROM TrainingProgram p ORDER BY p.programYear DESC")
    List<Integer> findDistinctYears();
}
