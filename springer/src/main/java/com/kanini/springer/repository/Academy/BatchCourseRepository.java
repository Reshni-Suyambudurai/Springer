package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.BatchCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchCourseRepository extends JpaRepository<BatchCourse, Integer> {
    
    Optional<BatchCourse> findByBatchCourseId(Integer batchCourseId);
    
    List<BatchCourse> findByProgram_ProgramIdAndBatchNo(Integer programId, Integer batchNo);
    
    List<BatchCourse> findByProgram_ProgramId(Integer programId);
    
    List<BatchCourse> findByCourse_CourseId(Integer courseId);
    
    List<BatchCourse> findByBatchNo(Integer batchNo);

    List<BatchCourse> findByConductedBy_UserId(Long userId);
}
