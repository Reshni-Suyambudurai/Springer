package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.InternWarning;
import com.kanini.springer.entity.enums.Enums.WarningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InternWarningRepository extends JpaRepository<InternWarning, Long> {

    // All warnings — only ACTIVE/ACKNOWLEDGED (skips old RESOLVED rows in DB)
    @Query("SELECT w FROM InternWarning w WHERE w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) ORDER BY w.issuedAt DESC")
    List<InternWarning> findAllByOrderByIssuedAtDesc();

    // Warnings for a specific intern — only known statuses
    @Query("SELECT w FROM InternWarning w WHERE w.student.studentId = :studentId AND w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) ORDER BY w.issuedAt DESC")
    List<InternWarning> findByStudent_StudentIdOrderByIssuedAtDesc(@Param("studentId") Long studentId);

    // Warnings for a program + batch — only known statuses
    @Query("SELECT w FROM InternWarning w WHERE w.student.program.programId = :programId AND w.student.batchNumber = :batchNumber AND w.status IN (com.kanini.springer.entity.enums.Enums.WarningStatus.ACTIVE, com.kanini.springer.entity.enums.Enums.WarningStatus.ACKNOWLEDGED) ORDER BY w.issuedAt DESC")
    List<InternWarning> findByStudent_Program_ProgramIdAndStudent_BatchNumberOrderByIssuedAtDesc(
            @Param("programId") Integer programId, @Param("batchNumber") Integer batchNumber);

    // All warnings by status
    List<InternWarning> findByStatusOrderByIssuedAtDesc(WarningStatus status);

    // Active warning count for an intern (used in dashboard badge)
    long countByStudent_StudentIdAndStatus(Long studentId, WarningStatus status);
}
