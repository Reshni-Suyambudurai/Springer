package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.CandidateEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateEvaluationRepository extends JpaRepository<CandidateEvaluation, Long> {
    List<CandidateEvaluation> findByApplicationApplicationId(Long applicationId);
    List<CandidateEvaluation> findByRoundConfigRoundConfigId(Long roundConfigId);
    Optional<CandidateEvaluation> findByApplicationApplicationIdAndRoundConfigRoundConfigId(Long applicationId, Long roundConfigId);

    /**
     * Fetch evaluations with application, candidate, roundConfig, and reviewedBy eagerly loaded
     * in a single query to avoid N+1 for large result sets.
     */
    @Query("SELECT e FROM CandidateEvaluation e " +
           "JOIN FETCH e.application a " +
           "JOIN FETCH a.candidate c " +
           "JOIN FETCH e.roundConfig r " +
           "LEFT JOIN FETCH e.reviewedBy " +
           "WHERE a.applicationId IN :applicationIds AND r.roundConfigId = :roundConfigId")
    List<CandidateEvaluation> findByApplicationIdsAndRoundConfigIdFetched(
            @Param("applicationIds") List<Long> applicationIds,
            @Param("roundConfigId") Long roundConfigId);
}
