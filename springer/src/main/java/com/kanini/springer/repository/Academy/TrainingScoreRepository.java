package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.enums.Enums.ScoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingScoreRepository extends JpaRepository<TrainingScore, Integer> {
    
    Optional<TrainingScore> findByScoreId(Integer scoreId);
    
    List<TrainingScore> findByStudent_StudentId(Long studentId);
    
    List<TrainingScore> findByCourse_CourseId(Integer courseId);
    
    List<TrainingScore> findByStatus(ScoreStatus status);
    
    List<TrainingScore> findByStudent_StudentIdAndCourse_CourseId(Long studentId, Integer courseId);
    
    List<TrainingScore> findByReviewedBy_UserId(Long userId);
}
