package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.entity.enums.Enums.EvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateEvaluationRepository extends JpaRepository<CandidateEvaluation, Long> {
    List<CandidateEvaluation> findByApplicationApplicationId(Long applicationId);
    List<CandidateEvaluation> findByRoundConfigRoundConfigId(Long roundConfigId);

    /**
     * Fetch evaluations by applicationId with roundConfig and reviewedBy eagerly loaded.
     */
    @Query("SELECT e FROM CandidateEvaluation e LEFT JOIN FETCH e.roundConfig LEFT JOIN FETCH e.reviewedBy WHERE e.application.applicationId = :applicationId")
    List<CandidateEvaluation> findByApplicationIdWithDetails(@Param("applicationId") Long applicationId);
    List<CandidateEvaluation> findByApplicationApplicationIdAndRoundConfigRoundConfigId(Long applicationId, Long roundConfigId);
    Optional<CandidateEvaluation> findByApplicationApplicationIdAndRoundConfigRoundConfigIdAndReviewedByUserId(Long applicationId, Long roundConfigId, Long userId);

    /**
     * Entity-level fetch for bulk-create duplicate detection (needs entity navigation).
     */
    @Query("SELECT e FROM CandidateEvaluation e " +
           "JOIN FETCH e.application a " +
           "WHERE a.applicationId IN :applicationIds AND e.roundConfig.roundConfigId = :roundConfigId")
    List<CandidateEvaluation> findByApplicationIdsAndRoundConfigIdFetched(
            @Param("applicationIds") List<Long> applicationIds,
            @Param("roundConfigId") Long roundConfigId);

    @Modifying
    @Query("UPDATE CandidateEvaluation e SET e.status = :status WHERE e.application.applicationId IN :applicationIds")
    int updateStatusByApplicationIds(@Param("status") EvaluationStatus status,
                                     @Param("applicationIds") List<Long> applicationIds);

    /**
     * Bulk update evaluation status for specific application IDs in a specific round.
     */
    @Modifying
    @Query("UPDATE CandidateEvaluation e SET e.status = :status " +
           "WHERE e.application.applicationId IN :applicationIds AND e.roundConfig.roundConfigId = :roundConfigId")
    int updateStatusByApplicationIdsAndRoundConfigId(@Param("status") EvaluationStatus status,
                                                     @Param("applicationIds") List<Long> applicationIds,
                                                     @Param("roundConfigId") Long roundConfigId);

    /**
     * Bulk update evaluation status and review for specific application IDs in a specific round.
     */
    @Modifying
    @Query("UPDATE CandidateEvaluation e SET e.status = :status, e.review = :review " +
           "WHERE e.application.applicationId IN :applicationIds AND e.roundConfig.roundConfigId = :roundConfigId")
    int updateStatusAndReviewByApplicationIdsAndRoundConfigId(@Param("status") EvaluationStatus status,
                                                              @Param("review") String review,
                                                              @Param("applicationIds") List<Long> applicationIds,
                                                              @Param("roundConfigId") Long roundConfigId);

    /**
     * Count evaluations that exist for given applicationIds + roundConfigId.
     */
    @Query("SELECT COUNT(e) FROM CandidateEvaluation e " +
           "WHERE e.application.applicationId IN :applicationIds AND e.roundConfig.roundConfigId = :roundConfigId")
    long countByApplicationIdsAndRoundConfigId(@Param("applicationIds") List<Long> applicationIds,
                                               @Param("roundConfigId") Long roundConfigId);

    /**
     * For each application ID, get the latest evaluation status and roundConfigId (highest scoreId).
     * Returns rows of [applicationId, evaluationStatus, roundConfigId] ordered by scoreId DESC.
     * Caller should keep only the first row per applicationId.
     */
    @Query("SELECT e.application.applicationId, e.status, e.roundConfig.roundConfigId FROM CandidateEvaluation e " +
           "WHERE e.application.applicationId IN :applicationIds ORDER BY e.scoreId DESC")
    List<Object[]> findLatestStatusByApplicationIds(@Param("applicationIds") List<Long> applicationIds);

    /**
     * Count total evaluations for a specific drive and round.
     * Returns total number of candidates who attended the round.
     */
    @Query("SELECT COUNT(e) FROM CandidateEvaluation e " +
           "WHERE e.application.drive.driveId = :driveId AND e.roundConfig.roundConfigId = :roundConfigId")
    Long countByDriveIdAndRoundConfigId(@Param("driveId") Long driveId,
                                         @Param("roundConfigId") Long roundConfigId);

    /**
     * Get evaluation status counts grouped by status for a specific drive and round.
     * Returns rows of [evaluationStatus, count]
     */
    @Query("SELECT e.status, COUNT(e) FROM CandidateEvaluation e " +
           "WHERE e.application.drive.driveId = :driveId AND e.roundConfig.roundConfigId = :roundConfigId " +
           "GROUP BY e.status")
    List<Object[]> countByDriveIdAndRoundConfigIdGroupedByStatus(@Param("driveId") Long driveId,
                                                                   @Param("roundConfigId") Long roundConfigId);
}
