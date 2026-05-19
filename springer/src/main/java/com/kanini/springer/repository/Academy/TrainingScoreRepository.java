package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.enums.Enums.ScoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingScoreRepository extends JpaRepository<TrainingScore, Integer> {

    Optional<TrainingScore> findByScoreId(Integer scoreId);

    List<TrainingScore> findByStudent_StudentId(Long studentId);

    // Fetch all scores for multiple students in one query — avoids N+1
    List<TrainingScore> findByStudent_StudentIdIn(List<Long> studentIds);

    List<TrainingScore> findByCourse_CourseId(Integer courseId);

    List<TrainingScore> findByStatus(ScoreStatus status);

    List<TrainingScore> findByStudent_StudentIdAndCourse_CourseId(Long studentId, Integer courseId);

    List<TrainingScore> findByReviewedBy_UserId(Long userId);

    /**
     * Fetch all scores for a candidate across ALL their batch allocations.
     * Used for best-score-per-course calculation after a batch transfer.
     */
    @Query("SELECT ts FROM TrainingScore ts WHERE ts.student.candidate.candidateId = :candidateId")
    List<TrainingScore> findAllByCandidateId(@Param("candidateId") Long candidateId);

    // All scores for a specific course across all students in a batch — single query
    @Query("SELECT ts FROM TrainingScore ts " +
           "WHERE ts.student.program.programId = :programId " +
           "AND ts.student.batchNumber = :batchNumber " +
           "AND ts.course.courseId = :courseId")
    List<TrainingScore> findByBatchAndCourse(
            @Param("programId") Integer programId,
            @Param("batchNumber") Integer batchNumber,
            @Param("courseId") Integer courseId);

    // Check if any scores exist for a course in a given program/batch
    @Query("SELECT COUNT(ts) > 0 FROM TrainingScore ts " +
           "WHERE ts.student.program.programId = :programId " +
           "AND ts.student.batchNumber = :batchNumber " +
           "AND ts.course.courseId = :courseId")
    boolean existsByBatchAndCourse(
            @Param("programId") Integer programId,
            @Param("batchNumber") Integer batchNumber,
            @Param("courseId") Integer courseId);
}
