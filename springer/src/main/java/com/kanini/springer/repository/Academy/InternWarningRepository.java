package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.InternWarning;
import com.kanini.springer.entity.enums.Enums.WarningStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternWarningRepository extends JpaRepository<InternWarning, Long> {

    @Query("SELECT w FROM InternWarning w WHERE w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) ORDER BY w.issuedAt DESC")
    List<InternWarning> findAllByOrderByIssuedAtDesc();

    @Query("SELECT w FROM InternWarning w WHERE w.student.studentId = :studentId AND w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) ORDER BY w.issuedAt DESC")
    List<InternWarning> findByStudent_StudentIdOrderByIssuedAtDesc(@Param("studentId") Long studentId);

    @Query("SELECT w FROM InternWarning w WHERE w.student.program.programId = :programId AND w.student.batchNumber = :batchNumber AND w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) ORDER BY w.issuedAt DESC")
    List<InternWarning> findByStudent_Program_ProgramIdAndStudent_BatchNumberOrderByIssuedAtDesc(
            @Param("programId") Integer programId, @Param("batchNumber") Integer batchNumber);

    List<InternWarning> findByStatusOrderByIssuedAtDesc(WarningStatus status);

    long countByStudent_StudentIdAndStatus(Long studentId, WarningStatus status);

    // Check if same type+severity active warning already exists for a student
    @Query("SELECT COUNT(w) > 0 FROM InternWarning w " +
           "WHERE w.student.studentId = :studentId " +
           "AND w.warningType = :warningType " +
           "AND w.severity = :severity " +
           "AND w.status = com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE")
    boolean existsActiveWarning(
            @Param("studentId") Long studentId,
            @Param("warningType") com.kanini.springer.entity.enums.Enums.WarningType warningType,
            @Param("severity") com.kanini.springer.entity.enums.Enums.WarningSeverity severity);

    // Paginated + filtered — for TC/TA panel with large datasets
    @Query("SELECT w FROM InternWarning w " +
           "WHERE w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) " +
           "AND (:programId IS NULL OR w.student.program.programId = :programId) " +
           "AND (:batchNumber IS NULL OR w.student.batchNumber = :batchNumber) " +
           "AND (:status IS NULL OR w.status = :status) " +
           "AND (:warningType IS NULL OR w.warningType = :warningType) " +
           "AND (:search IS NULL OR LOWER(w.student.candidate.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "     OR LOWER(w.student.candidate.lastName) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "ORDER BY w.issuedAt DESC")
    Page<InternWarning> findFiltered(
            @Param("programId") Integer programId,
            @Param("batchNumber") Integer batchNumber,
            @Param("status") WarningStatus status,
            @Param("warningType") com.kanini.springer.entity.enums.Enums.WarningType warningType,
            @Param("search") String search,
            Pageable pageable);
}
