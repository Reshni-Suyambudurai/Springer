package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatesRepository extends JpaRepository<Candidate, Long> {
    
    /**
     * Find candidate by email
     */
    Optional<Candidate> findByEmail(String email);
    
    /**
     * Find candidate by aadhaar number
     */
    Optional<Candidate> findByAadhaarNumber(String aadhaarNumber);
    
    /**
     * Find all candidates by institute ID
     */
    List<Candidate> findByInstituteInstituteId(Long instituteId);
    
    /**
     * Find candidates by stage
     */
    List<Candidate> findByApplicationStage(ApplicationStage stage);
    
    /**
     * Find candidates by cycle ID
     */
    List<Candidate> findByCycleCycleId(Long cycleId);
    
    /**
     * Find candidates by cycle ID with institute and skills eagerly loaded
     */
    @Query("SELECT DISTINCT c FROM Candidate c LEFT JOIN FETCH c.institute LEFT JOIN FETCH c.cycle LEFT JOIN FETCH c.candidateSkills cs LEFT JOIN FETCH cs.skill WHERE c.cycle.cycleId = :cycleId")
    List<Candidate> findByCycleIdWithDetails(@Param("cycleId") Long cycleId);
    
    /**
     * Find all candidates with institute details (JOIN FETCH to avoid lazy loading)
     */
    /**
     * Find all candidates with institute and skills eagerly loaded
     */
    @Query("SELECT DISTINCT c FROM Candidate c LEFT JOIN FETCH c.institute LEFT JOIN FETCH c.candidateSkills cs LEFT JOIN FETCH cs.skill")
    List<Candidate> findAllWithInstitute();
    
    /**
     * Find candidates by institute ID with institute details
     */
    /**
     * Find candidates by institute ID with institute and skills eagerly loaded
     */
    @Query("SELECT DISTINCT c FROM Candidate c LEFT JOIN FETCH c.institute LEFT JOIN FETCH c.candidateSkills cs LEFT JOIN FETCH cs.skill WHERE c.institute.instituteId = :instituteId")
    List<Candidate> findByInstituteIdWithInstitute(@Param("instituteId") Long instituteId);
    
    /**
     * Find candidate by ID with institute details
     */
    /**
     * Find a candidate by ID with institute and skills eagerly loaded
     */
    @Query("SELECT c FROM Candidate c LEFT JOIN FETCH c.institute LEFT JOIN FETCH c.candidateSkills cs LEFT JOIN FETCH cs.skill WHERE c.candidateId = :candidateId")
    Optional<Candidate> findByIdWithInstitute(@Param("candidateId") Long candidateId);
}

