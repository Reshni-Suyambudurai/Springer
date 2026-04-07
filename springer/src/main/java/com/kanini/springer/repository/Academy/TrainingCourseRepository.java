package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.TrainingCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrainingCourseRepository extends JpaRepository<TrainingCourse, Integer> {

    Optional<TrainingCourse> findByCourseId(Integer courseId);

    List<TrainingCourse> findByCourseName(String courseName);
}
