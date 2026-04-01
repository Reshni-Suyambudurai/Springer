package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.Application;
import org.springframework.data.jpa.repository.JpaRepository;
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
}

