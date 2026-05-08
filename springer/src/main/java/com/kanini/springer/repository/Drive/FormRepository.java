package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FormRepository extends JpaRepository<Form, Long> {

    /**
     * Find all forms by drive ID
     */
    List<Form> findByDriveDriveId(Long driveId);

    /**
     * Find active forms by drive ID
     */
    List<Form> findByDriveDriveIdAndStatusTrue(Long driveId);

    /**
     * Find form by ID with eager loading
     */
    @Query("SELECT f FROM Form f LEFT JOIN FETCH f.drive WHERE f.formId = :formId")
    Optional<Form> findByIdWithDetails(@Param("formId") Long formId);

    /**
     * Check if form exists and is active
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Form f WHERE f.formId = :formId AND f.status = true")
    boolean existsByFormIdAndStatusTrue(@Param("formId") Long formId);

    /**
     * Count forms by drive ID
     */
    Long countByDriveDriveId(Long driveId);
}
