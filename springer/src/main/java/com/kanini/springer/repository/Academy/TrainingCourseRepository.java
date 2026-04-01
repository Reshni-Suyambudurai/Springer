package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.enums.Enums.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingCourseRepository extends JpaRepository<TrainingCourse, Integer> {
    
    List<TrainingCourse> findByStatus(CourseStatus status);
    
    Optional<TrainingCourse> findByCourseId(Integer courseId);
    
    List<TrainingCourse> findByCourseName(String courseName);
    
    List<TrainingCourse> findByConductedBy_UserId(Long userId);
}
