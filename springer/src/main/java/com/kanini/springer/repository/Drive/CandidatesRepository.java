package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.LifecycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatesRepository extends JpaRepository<Candidate, Long>, JpaSpecificationExecutor<Candidate> {
    
    /**
     * Override findAll with Specification and Pageable to use EntityGraph
     * This prevents N+1 queries when using dynamic filters with pagination
     * Batch fetches institute, cycle, and skills in a single query
     */
    @Override
    @EntityGraph(attributePaths = {"institute", "cycle", "candidateSkills", "candidateSkills.skill"})
    Page<Candidate> findAll(Specification<Candidate> spec, Pageable pageable);
    
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
    
    /**
     * Find matching candidates by comprehensive criteria for validation
     * Matches on: firstName, lastName, institute, degree, department, dateOfBirth, passoutYear
     * If aadhaar is provided and not null, it's checked as 100% match
     */
    @Query("SELECT c FROM Candidate c " +
       "LEFT JOIN FETCH c.institute i " +
       "LEFT JOIN FETCH c.cycle cy " +
       "WHERE LOWER(TRIM(c.firstName)) = LOWER(TRIM(:firstName)) " +
       "AND LOWER(TRIM(c.lastName)) = LOWER(TRIM(:lastName)) " +
       "AND i.instituteName = :instituteName " +
       "AND c.degree = :degree " +
       "AND c.department = :department " +
       "AND c.dateOfBirth = :dateOfBirth " +
       "AND c.passoutYear = :passoutYear " +
       "AND (:aadhaarNumber IS NULL OR c.aadhaarNumber = :aadhaarNumber)")
List<Candidate> findMatchingCandidates(
        @Param("firstName") String firstName,
        @Param("lastName") String lastName,
        @Param("instituteName") String instituteName,
        @Param("degree") String degree,
        @Param("department") String department,
        @Param("dateOfBirth") java.time.LocalDate dateOfBirth,
        @Param("passoutYear") Integer passoutYear,
        @Param("aadhaarNumber") String aadhaarNumber
);

    /**
     * Batch query: Find all candidates by email list (for bulk validation)
     * Returns map-like result set for efficient lookup
     */
    @Query("SELECT c FROM Candidate c WHERE LOWER(c.email) IN :emails")
    List<Candidate> findByEmailIn(@Param("emails") List<String> emails);

    /**
     * Batch query: Find all candidates by aadhaar number list (for bulk validation)
     * Returns map-like result set for efficient lookup
     */
    @Query("SELECT c FROM Candidate c WHERE c.aadhaarNumber IN :aadhaarNumbers")
    List<Candidate> findByAadhaarNumberIn(@Param("aadhaarNumbers") List<String> aadhaarNumbers);

    /**
     * Find all active candidates with pagination filtered by cycle
     * Fetches candidates with lifecycleStatus = ACTIVE and specific cycleId
     * Uses @EntityGraph to batch-fetch related entities without in-memory pagination
     * 
     * NOTE: Removed collection fetch (candidateSkills) from query to avoid HHH90003004 warning
     * and InvalidDataAccessApiUsageException. Skills are fetched via @EntityGraph batch fetching.
     * 
     * @param cycleId Cycle ID to filter candidates
     * @param lifecycleStatus Lifecycle status filter (ACTIVE)
     * @param pageable Pagination and sorting information
     * @return Page of candidates with institute and cycle data
     */
    @EntityGraph(attributePaths = {"institute", "cycle", "candidateSkills", "candidateSkills.skill"})
    @Query("SELECT c FROM Candidate c " +
           "WHERE c.cycle.cycleId = :cycleId " +
           "AND c.lifecycleStatus = :lifecycleStatus")
    Page<Candidate> findByCycleIdAndLifecycleStatusWithDetails(
            @Param("cycleId") Long cycleId,
            @Param("lifecycleStatus") LifecycleStatus lifecycleStatus,
            Pageable pageable
    );

    /**
     * Get distinct institute names for a specific cycle and lifecycle status
     * Used for populating filter dropdowns
     */
    @Query("SELECT DISTINCT i.instituteName FROM Candidate c " +
           "JOIN c.institute i " +
           "WHERE c.cycle.cycleId = :cycleId " +
           "AND c.lifecycleStatus = :lifecycleStatus " +
           "ORDER BY i.instituteName")
    List<String> findDistinctInstituteNamesByCycleAndStatus(
            @Param("cycleId") Long cycleId,
            @Param("lifecycleStatus") LifecycleStatus lifecycleStatus
    );

    /**
     * Get distinct degree-department pairs for a specific cycle and lifecycle status
     * Returns array of [degree, department] for extracting both unique degrees and departments
     * Optimized: fetches both in a single query instead of 2 separate queries
     */
    @Query("SELECT DISTINCT c.degree, c.department FROM Candidate c " +
           "WHERE c.cycle.cycleId = :cycleId " +
           "AND c.lifecycleStatus = :lifecycleStatus " +
           "AND c.degree IS NOT NULL " +
           "AND c.department IS NOT NULL " +
           "ORDER BY c.degree, c.department")
    List<Object[]> findDistinctDegreeDepartmentPairsByCycleAndStatus(
            @Param("cycleId") Long cycleId,
            @Param("lifecycleStatus") LifecycleStatus lifecycleStatus
    );

    /**
     * Get distinct skills for a specific cycle and lifecycle status
     */
    @Query("SELECT DISTINCT s.skillName FROM Candidate c " +
           "JOIN c.candidateSkills cs " +
           "JOIN cs.skill s " +
           "WHERE c.cycle.cycleId = :cycleId " +
           "AND c.lifecycleStatus = :lifecycleStatus " +
           "ORDER BY s.skillName")
    List<String> findDistinctSkillsByCycleAndStatus(
            @Param("cycleId") Long cycleId,
            @Param("lifecycleStatus") LifecycleStatus lifecycleStatus
    );

    /**
     * Get distinct state-city pairs for a specific cycle and lifecycle status
     * Returns array of [state, city] for building state-to-cities mapping
     * Used to populate cascading state-city filter dropdowns
     */
    @Query("SELECT DISTINCT i.state, i.city FROM Candidate c " +
           "JOIN c.institute i " +
           "WHERE c.cycle.cycleId = :cycleId " +
           "AND c.lifecycleStatus = :lifecycleStatus " +
           "AND i.state IS NOT NULL " +
           "AND i.city IS NOT NULL " +
           "ORDER BY i.state, i.city")
    List<Object[]> findDistinctStateCityPairsByCycleAndStatus(
            @Param("cycleId") Long cycleId,
            @Param("lifecycleStatus") LifecycleStatus lifecycleStatus
    );

}

