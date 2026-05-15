package com.kanini.springer.repository.Drive;

import com.kanini.springer.dto.Drive.DriveAssignmentResponse;
import com.kanini.springer.entity.Drive.DriveAssignment;
import com.kanini.springer.entity.enums.Enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveAssignmentRepository extends JpaRepository<DriveAssignment, Integer> {
    List<DriveAssignment> findByDriveDriveId(Long driveId);
    List<DriveAssignment> findByApplicationApplicationId(Long applicationId);
    List<DriveAssignment> findByUserUserId(Long userId);

    /**
     * Fetch assignments by applicationId with user and roundConfig eagerly loaded.
     */
    @Query("SELECT a FROM DriveAssignment a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.roundConfig WHERE a.application.applicationId = :applicationId")
    List<DriveAssignment> findByApplicationIdWithDetails(@Param("applicationId") Long applicationId);

    /**
     * Fetch active assignments by userId — DTO projection, no entity loading.
     * Selects only the columns needed for DriveAssignmentResponse.
     */
    @Query("SELECT new com.kanini.springer.dto.Drive.DriveAssignmentResponse(" +
           "a.assignmentId, d.driveId, d.driveName, " +
           "u.userId, u.username, " +
           "app.applicationId, c.candidateId, " +
           "CONCAT(c.firstName, CASE WHEN c.lastName IS NOT NULL THEN CONCAT(' ', c.lastName) ELSE '' END), " +
           "rc.roundConfigId, rc.roundName, " +
           "CAST(a.status AS string), a.isActive, a.createdAt, " +
           "cb.userId, cb.username) " +
           "FROM DriveAssignment a " +
           "JOIN a.user u " +
           "JOIN a.drive d " +
           "JOIN a.application app " +
           "LEFT JOIN app.candidate c " +
           "LEFT JOIN a.roundConfig rc " +
           "LEFT JOIN a.createdByUser cb " +
           "WHERE u.userId = :userId AND d.driveId = :driveId")
    List<DriveAssignmentResponse> findActiveByUserIdAndDriveIdProjected(
            @Param("userId") Long userId, @Param("driveId") Long driveId);

    /**
     * Fetch active assignments by userId and list of statuses — DTO projection.
     */
    @Query("SELECT new com.kanini.springer.dto.Drive.DriveAssignmentResponse(" +
           "a.assignmentId, d.driveId, d.driveName, " +
           "u.userId, u.username, " +
           "app.applicationId, c.candidateId, " +
           "CONCAT(c.firstName, CASE WHEN c.lastName IS NOT NULL THEN CONCAT(' ', c.lastName) ELSE '' END), " +
           "rc.roundConfigId, rc.roundName, " +
           "CAST(a.status AS string), a.isActive, a.createdAt, " +
           "cb.userId, cb.username) " +
           "FROM DriveAssignment a " +
           "JOIN a.user u " +
           "JOIN a.drive d " +
           "JOIN a.application app " +
           "LEFT JOIN app.candidate c " +
           "LEFT JOIN a.roundConfig rc " +
           "LEFT JOIN a.createdByUser cb " +
           "WHERE u.userId = :userId AND a.status IN :statuses AND a.isActive = true")
    List<DriveAssignmentResponse> findActiveByUserIdAndStatusesProjected(
            @Param("userId") Long userId, @Param("statuses") List<AssignmentStatus> statuses);

    /**
     * Fetch active assignments for given drive + round + applicationIds (batch).
     * JOIN FETCH user to avoid N+1 when reading assignedUserName.
     */
    @Query("SELECT a FROM DriveAssignment a JOIN FETCH a.user " +
           "WHERE a.drive.driveId = :driveId " +
           "AND a.roundConfig.roundConfigId = :roundConfigId " +
           "AND a.application.applicationId IN :applicationIds " +
           "AND a.isActive = true")
    List<DriveAssignment> findActiveByDriveRoundAndApplicationIds(
            @Param("driveId") Long driveId,
            @Param("roundConfigId") Long roundConfigId,
            @Param("applicationIds") List<Long> applicationIds);

    /**
     * Find active assignment by userId and applicationId.
     */
    @Query("SELECT a FROM DriveAssignment a WHERE a.user.userId = :userId " +
           "AND a.application.applicationId = :applicationId AND a.isActive = true")
    java.util.Optional<DriveAssignment> findActiveByUserIdAndApplicationId(
            @Param("userId") Long userId, @Param("applicationId") Long applicationId);

    /**
     * Find active assignment by userId, applicationId, and roundConfigId.
     */
    @Query("SELECT a FROM DriveAssignment a WHERE a.user.userId = :userId " +
           "AND a.application.applicationId = :applicationId " +
           "AND a.roundConfig.roundConfigId = :roundConfigId AND a.isActive = true")
    java.util.Optional<DriveAssignment> findActiveByUserIdAndApplicationIdAndRoundConfigId(
            @Param("userId") Long userId, 
            @Param("applicationId") Long applicationId,
            @Param("roundConfigId") Long roundConfigId);

    /**
     * Find active assignments by applicationId and roundConfigId.
     */
    @Query("SELECT a FROM DriveAssignment a WHERE a.application.applicationId = :applicationId " +
           "AND a.roundConfig.roundConfigId = :roundConfigId AND a.isActive = true")
    List<DriveAssignment> findActiveByApplicationIdAndRoundConfigId(
            @Param("applicationId") Long applicationId, @Param("roundConfigId") Long roundConfigId);

    /**
     * Count active assignments for given applicationIds and roundConfigId.
     */
    @Query("SELECT COUNT(a) FROM DriveAssignment a " +
           "WHERE a.application.applicationId IN :applicationIds " +
           "AND a.roundConfig.roundConfigId = :roundConfigId " +
           "AND a.isActive = true")
    long countActiveByApplicationIdsAndRoundConfigId(
            @Param("applicationIds") List<Long> applicationIds,
            @Param("roundConfigId") Long roundConfigId);
}
