package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.LeaveRequest;
import com.kanini.springer.entity.enums.Enums.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByStudent_StudentIdOrderByAppliedAtDesc(Long studentId);

    List<LeaveRequest> findAllByOrderByAppliedAtDesc();

    List<LeaveRequest> findByStatusOrderByAppliedAtDesc(LeaveStatus status);

    List<LeaveRequest> findByStudent_Program_ProgramIdAndStudent_BatchNumberOrderByAppliedAtDesc(
            Integer programId, Integer batchNumber);

    @Query("SELECT COALESCE(SUM(DATEDIFF(l.toDate, l.fromDate) + 1), 0) FROM LeaveRequest l " +
           "WHERE l.student.studentId = :studentId AND l.status = 'APPROVED'")
    Integer sumApprovedLeaveDays(@Param("studentId") Long studentId);

    // Check for overlapping leave (PENDING or APPROVED) for the same student
    @Query("SELECT COUNT(l) > 0 FROM LeaveRequest l " +
           "WHERE l.student.studentId = :studentId " +
           "AND l.status IN (com.kanini.springer.entity.enums.Enums.LeaveStatus.PENDING, com.kanini.springer.entity.enums.Enums.LeaveStatus.APPROVED) " +
           "AND l.fromDate <= :toDate AND l.toDate >= :fromDate")
    boolean existsOverlappingLeave(
            @Param("studentId") Long studentId,
            @Param("fromDate") java.time.LocalDate fromDate,
            @Param("toDate") java.time.LocalDate toDate);

    // Paginated + filtered — for TC/TA panel with large datasets
    @Query("SELECT l FROM LeaveRequest l " +
           "WHERE (:programId IS NULL OR l.student.program.programId = :programId) " +
           "AND (:batchNumber IS NULL OR l.student.batchNumber = :batchNumber) " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:search IS NULL OR LOWER(l.student.candidate.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "     OR LOWER(l.student.candidate.lastName) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "ORDER BY l.appliedAt DESC")
    Page<LeaveRequest> findFiltered(
            @Param("programId") Integer programId,
            @Param("batchNumber") Integer batchNumber,
            @Param("status") LeaveStatus status,
            @Param("search") String search,
            Pageable pageable);
}
