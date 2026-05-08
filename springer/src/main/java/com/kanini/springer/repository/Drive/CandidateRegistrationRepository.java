package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.CandidateRegistration;
import com.kanini.springer.entity.enums.Enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRegistrationRepository extends JpaRepository<CandidateRegistration, Long> {

    /**
     * Find all registrations by drive ID with eager loading of drive and institute
     * Prevents N+1 problem when mapping to response DTOs
     */
    @Query("SELECT r FROM CandidateRegistration r " +
           "LEFT JOIN FETCH r.drive " +
           "LEFT JOIN FETCH r.form " +
           "LEFT JOIN FETCH r.institute " +
           "WHERE r.drive.driveId = :driveId")
    List<CandidateRegistration> findByDriveDriveId(@Param("driveId") Long driveId);

    /**
     * Find all registrations by drive ID and status
     */
    List<CandidateRegistration> findByDriveDriveIdAndStatus(Long driveId, RegistrationStatus status);

    /**
     * Check if email already registered for a drive
     */
    boolean existsByEmailAndDriveDriveId(String email, Long driveId);

    /**
     * Find registration by email and drive ID
     */
    Optional<CandidateRegistration> findByEmailAndDriveDriveId(String email, Long driveId);

    /**
     * Count registrations by drive ID
     */
    Long countByDriveDriveId(Long driveId);

    /**
     * Count registrations by drive ID and status
     */
    Long countByDriveDriveIdAndStatus(Long driveId, RegistrationStatus status);

    /**
     * Get unique college names for a drive
     */
    @Query("SELECT DISTINCT r.collegeName FROM CandidateRegistration r WHERE r.drive.driveId = :driveId AND r.status = :status")
    List<String> findDistinctCollegeNamesByDriveIdAndStatus(@Param("driveId") Long driveId, @Param("status") RegistrationStatus status);

    /**
     * Find registrations by IDs with eager loading
     */
    @Query("SELECT r FROM CandidateRegistration r " +
           "LEFT JOIN FETCH r.drive " +
           "LEFT JOIN FETCH r.form " +
           "LEFT JOIN FETCH r.institute " +
           "WHERE r.registrationId IN :registrationIds")
    List<CandidateRegistration> findByRegistrationIdIn(@Param("registrationIds") List<Long> registrationIds);

    /**
     * Find registration by ID with eager loading
     */
    @Query("SELECT r FROM CandidateRegistration r " +
           "LEFT JOIN FETCH r.drive " +
           "LEFT JOIN FETCH r.form " +
           "LEFT JOIN FETCH r.institute " +
           "WHERE r.registrationId = :registrationId")
    Optional<CandidateRegistration> findByIdWithDetails(@Param("registrationId") Long registrationId);

    /**
     * Find registrations by form ID
     */
    List<CandidateRegistration> findByFormFormId(Long formId);

    /**
     * Count registrations by form ID
     */
    Long countByFormFormId(Long formId);
}
