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
import java.time.LocalDateTime;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByDriveDriveId(Long driveId);
    List<Application> findByCandidateCandidateId(Long candidateId);
    Optional<Application> findByRegistrationCode(String registrationCode);

    @Query("SELECT a FROM Application a JOIN FETCH a.drive JOIN FETCH a.candidate WHERE a.drive.driveId = :driveId AND a.candidate.candidateId = :candidateId")
    Optional<Application> findByDriveIdAndCandidateIdWithDetails(@Param("driveId") Long driveId, @Param("candidateId") Long candidateId);

    Optional<Application> findByApplicationIdAndDriveDriveId(Long applicationId, Long driveId);

    boolean existsByDriveDriveIdAndRegistrationCode(Long driveId, String registrationCode);

    @Query("SELECT a FROM Application a JOIN FETCH a.candidate WHERE a.registrationCode IN :codes")
    List<Application> findByRegistrationCodeInWithCandidate(@Param("codes") List<String> codes);

    Long countByDriveDriveId(Long driveId);

    @Query("SELECT COUNT(DISTINCT a.batchTime) FROM Application a WHERE a.drive.driveId = :driveId")
    Long countDistinctBatchTimeByDriveId(@Param("driveId") Long driveId);

    @Query("SELECT a.batchTime, COUNT(a) FROM Application a WHERE a.drive.driveId = :driveId GROUP BY a.batchTime")
    List<Object[]> countApplicationsGroupedByBatchTime(@Param("driveId") Long driveId);

    @Query("SELECT a.applicationStatus, COUNT(a) FROM Application a WHERE a.drive.driveId = :driveId GROUP BY a.applicationStatus")
    List<Object[]> countApplicationsByDriveIdGroupedByStatus(@Param("driveId") Long driveId);

    /** Returns distinct non-null batch times for a drive, sorted ascending */
    @Query("SELECT DISTINCT a.batchTime FROM Application a WHERE a.drive.driveId = :driveId AND a.batchTime IS NOT NULL ORDER BY a.batchTime")
    List<LocalDateTime> findDistinctBatchTimesByDriveId(@Param("driveId") Long driveId);

    /** Lightweight projection: applicationId + batchTime — avoids loading full entities */
    @Query("SELECT a.applicationId, a.batchTime FROM Application a WHERE a.drive.driveId = :driveId")
    List<Object[]> findApplicationIdAndBatchTimeByDriveId(@Param("driveId") Long driveId);

    /** Single UPDATE — no entity load needed */
    @Modifying
    @Query("UPDATE Application a SET a.batchTime = :newBatchTime WHERE a.applicationId = :applicationId AND a.drive.driveId = :driveId AND a.batchTime = :oldBatchTime")
    int updateBatchTime(@Param("driveId") Long driveId,
                        @Param("applicationId") Long applicationId,
                        @Param("oldBatchTime") LocalDateTime oldBatchTime,
                        @Param("newBatchTime") LocalDateTime newBatchTime);

    @Modifying
    @Query("UPDATE Application a SET a.applicationStatus = :status WHERE a.applicationId IN :applicationIds")
    int updateStatusByApplicationIds(@Param("status") ApplicationStatus status,
                                     @Param("applicationIds") List<Long> applicationIds);

    @Modifying
    @Query("UPDATE Application a SET a.history = CONCAT(COALESCE(a.history, ''), :entry) WHERE a.applicationId IN :applicationIds")
    int appendHistoryByApplicationIds(@Param("entry") String entry,
                                      @Param("applicationIds") List<Long> applicationIds);

    @Query("SELECT a.drive.driveId, a.applicationStatus, COUNT(a) FROM Application a " +
           "WHERE a.drive.cycle.cycleId = :cycleId " +
           "GROUP BY a.drive.driveId, a.applicationStatus")
    List<Object[]> countByDriveAndStatusByCycle(@Param("cycleId") Long cycleId);

    @Query("SELECT a.drive.driveId, a.batchTime, COUNT(a) FROM Application a " +
           "WHERE a.drive.cycle.cycleId = :cycleId " +
           "GROUP BY a.drive.driveId, a.batchTime")
    List<Object[]> countByDriveAndBatchTimeByCycle(@Param("cycleId") Long cycleId);

    /**
     * Find applications by IDs that belong to a specific drive
     * Used for validation when checking existing evaluations
     */
    @Query("SELECT a FROM Application a WHERE a.applicationId IN :applicationIds AND a.drive.driveId = :driveId")
    List<Application> findByApplicationIdInAndDriveDriveId(@Param("applicationIds") List<Long> applicationIds,
                                                             @Param("driveId") Long driveId);

    /**
     * Count applications by IDs that belong to a specific drive (optimized for validation)
     * More efficient than loading full entities when only count is needed
     */
    @Query("SELECT COUNT(a) FROM Application a WHERE a.applicationId IN :applicationIds AND a.drive.driveId = :driveId")
    Long countByApplicationIdInAndDriveDriveId(@Param("applicationIds") List<Long> applicationIds,
                                                @Param("driveId") Long driveId);
}
