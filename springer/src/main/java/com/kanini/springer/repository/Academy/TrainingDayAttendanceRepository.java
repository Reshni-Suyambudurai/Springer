package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.TrainingDayAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingDayAttendanceRepository extends JpaRepository<TrainingDayAttendance, Long> {

    Optional<TrainingDayAttendance> findByStudent_StudentIdAndAttendanceDate(Long studentId, LocalDate date);

    List<TrainingDayAttendance> findByStudent_StudentId(Long studentId);

    @Query("SELECT COUNT(t) FROM TrainingDayAttendance t WHERE t.student.studentId = ?1 AND t.isPresent = true")
    long countPresentDays(Long studentId);

    @Query("SELECT COUNT(t) FROM TrainingDayAttendance t WHERE t.student.studentId = ?1 AND t.isPresent = false")
    long countAbsentDays(Long studentId);

    // Returns [studentId, presentCount, absentCount] for all students in a batch — single query
    @Query("SELECT t.student.studentId, " +
           "SUM(CASE WHEN t.isPresent = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN t.isPresent = false THEN 1 ELSE 0 END) " +
           "FROM TrainingDayAttendance t " +
           "WHERE t.student.program.programId = :programId " +
           "AND t.student.batchNumber = :batchNumber " +
           "AND t.student.isActive = true " +
           "GROUP BY t.student.studentId")
    List<Object[]> findAttendanceStatsByBatch(
            @org.springframework.data.repository.query.Param("programId") Integer programId,
            @org.springframework.data.repository.query.Param("batchNumber") Integer batchNumber);

    // Check if attendance already exists for any student in a batch on a given date
    @Query("SELECT COUNT(t) FROM TrainingDayAttendance t " +
           "WHERE t.student.program.programId = :programId " +
           "AND t.student.batchNumber = :batchNumber " +
           "AND t.student.isActive = true " +
           "AND t.attendanceDate = :date")
    long countByBatchAndDate(
            @org.springframework.data.repository.query.Param("programId") Integer programId,
            @org.springframework.data.repository.query.Param("batchNumber") Integer batchNumber,
            @org.springframework.data.repository.query.Param("date") LocalDate date);
}
