package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByDriveDriveId(Long driveId);
    List<Application> findByCandidateCandidateId(Long candidateId);
    Optional<Application> findByRegistrationCode(String registrationCode);

    /**
     * Fetch application by driveId and candidateId with drive and candidate eagerly loaded.
     */
    @Query("SELECT a FROM Application a JOIN FETCH a.drive JOIN FETCH a.candidate WHERE a.drive.driveId = :driveId AND a.candidate.candidateId = :candidateId")
    Optional<Application> findByDriveIdAndCandidateIdWithDetails(@Param("driveId") Long driveId, @Param("candidateId") Long candidateId);

    boolean existsByDriveDriveIdAndRegistrationCode(Long driveId, String registrationCode);

    /**
     * Batch fetch applications by registration codes within a drive, eagerly loading candidate.
     * Single query avoids N+1 for email verification.
     */
    @Query("SELECT a FROM Application a JOIN FETCH a.candidate WHERE a.registrationCode IN :codes")
    List<Application> findByRegistrationCodeInWithCandidate(@Param("codes") List<String> codes);

    /** Total number of applications for a drive */
    Long countByDriveDriveId(Long driveId);

    /** Number of distinct batch times across all applications for a drive */
    @Query("SELECT COUNT(DISTINCT a.batchTime) FROM Application a WHERE a.drive.driveId = :driveId")
    Long countDistinctBatchTimeByDriveId(@Param("driveId") Long driveId);

    /**
     * Applications grouped by batch time for a drive.
     * Returns List of Object[] where [0] = batchTime (LocalDateTime), [1] = count (Long)
     */
    @Query("SELECT a.batchTime, COUNT(a) FROM Application a WHERE a.drive.driveId = :driveId GROUP BY a.batchTime")
    List<Object[]> countApplicationsGroupedByBatchTime(@Param("driveId") Long driveId);

    /**
     * Bulk update application status by application IDs — single UPDATE query.
     */
    @Modifying
    @Query("UPDATE Application a SET a.applicationStatus = :status WHERE a.applicationId IN :applicationIds")
    int updateStatusByApplicationIds(@Param("status") ApplicationStatus status,
                                     @Param("applicationIds") List<Long> applicationIds);

    /**
     * Bulk append a history entry to applications.
     * Uses CONCAT to append to existing history (handles NULL with COALESCE).
     */
    @Modifying
    @Query("UPDATE Application a SET a.history = CONCAT(COALESCE(a.history, ''), :entry) " +
           "WHERE a.applicationId IN :applicationIds")
    int appendHistoryByApplicationIds(@Param("entry") String entry,
                                      @Param("applicationIds") List<Long> applicationIds);
}

