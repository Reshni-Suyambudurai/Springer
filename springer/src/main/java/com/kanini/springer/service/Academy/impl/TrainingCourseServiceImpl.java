package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingCourseMapper;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.service.Academy.ITrainingCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingCourseServiceImpl implements ITrainingCourseService {

    private final TrainingCourseRepository courseRepository;
    private final TrainingCourseMapper mapper;

    @Override
    @Transactional
    public TrainingCourseResponse createCourse(TrainingCourseRequest request) {
        TrainingCourse course = mapper.toEntity(request);
        return mapper.toResponse(courseRepository.save(course));
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingCourseResponse getCourseById(Integer courseId) {
        return mapper.toResponse(courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getCoursesByStatus(String status) {
        // Status is now on BatchCourse — this method returns all courses
        return getAllCourses();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getCoursesByTrainer(Long trainerId) {
        // Trainer is now on BatchCourse — return all courses
        return getAllCourses();
    }

    @Override
    @Transactional
    public TrainingCourseResponse updateCourse(Integer courseId, TrainingCourseRequest request) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));

        if (request.getCourseName() != null) course.setCourseName(request.getCourseName());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getMinScore() != null) course.setMinScore(request.getMinScore());
        if (request.getWeightage() != null) course.setWeightage(request.getWeightage());

        return mapper.toResponse(courseRepository.save(course));
    }

    @Override
    @Transactional
    public void deleteCourse(Integer courseId) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        if (!course.getCourseName().startsWith("[ARCHIVED] ")) {
            course.setCourseName("[ARCHIVED] " + course.getCourseName());
        }
        courseRepository.save(course);
    }

    @Override
    @Transactional
    public TrainingCourseResponse updateCourseStatus(Integer courseId, String status) {
        // Status is now on BatchCourse — no-op, return current course
        return getCourseById(courseId);
    }
}
