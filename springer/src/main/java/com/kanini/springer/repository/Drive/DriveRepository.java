package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.enums.Enums.DriveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DriveRepository extends JpaRepository<Drive, Long> {
    List<Drive> findByStatus(DriveStatus status);
    List<Drive> findByCycleCycleId(Long cycleId);
    List<Drive> findByStatusOrderByStartDateDesc(DriveStatus status);
    
    /**
     * Find upcoming drives (start date >= current date) for a specific cycle
     * @param cycleId Hiring cycle ID
     * @param currentDate Current date to compare against
     * @return List of drives with start date on or after current date
     */
    @Query("SELECT d FROM Drive d WHERE d.cycle.cycleId = :cycleId AND d.startDate >= :currentDate ORDER BY d.startDate ASC")
    List<Drive> findUpcomingDrivesByCycleId(@Param("cycleId") Long cycleId, @Param("currentDate") LocalDate currentDate);
}
