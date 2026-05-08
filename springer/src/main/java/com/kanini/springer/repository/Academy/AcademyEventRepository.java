package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.AcademyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademyEventRepository extends JpaRepository<AcademyEvent, Long> {

    // Get all events for a program+batch (includes events with null programId = all programs)
    @Query("SELECT e FROM AcademyEvent e WHERE " +
           "(e.programId IS NULL OR e.programId = :programId) AND " +
           "(e.batchNumber IS NULL OR e.batchNumber = :batchNumber) " +
           "ORDER BY e.eventDate ASC, e.eventTime ASC")
    List<AcademyEvent> findByProgramAndBatch(
            @Param("programId") Integer programId,
            @Param("batchNumber") Integer batchNumber);

    // Get all events (for HR calendar view)
    List<AcademyEvent> findAllByOrderByEventDateAscEventTimeAsc();
}
