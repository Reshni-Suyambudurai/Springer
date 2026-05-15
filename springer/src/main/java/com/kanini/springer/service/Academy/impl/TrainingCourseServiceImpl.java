package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Academy.TrainingCourseMapper;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.service.Academy.ITrainingCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingCourseServiceImpl implements ITrainingCourseService {

    private static final String COURSE_NOT_FOUND = "Training Course not found with ID: ";

    private final TrainingCourseRepository courseRepository;
    private final BatchCourseRepository batchCourseRepository;
    private final TrainingCourseMapper mapper;

    @Override
    @Transactional
    public TrainingCourseResponse createCourse(TrainingCourseRequest request) {
        // Validate course name
        if (request.getCourseName() == null || request.getCourseName().trim().isEmpty()) {
            throw new ValidationException("Course name is required.");
        }

        // Check for duplicate course name
        List<TrainingCourse> existing = courseRepository.findByCourseName(request.getCourseName().trim());
        if (!existing.isEmpty()) {
            throw new ValidationException("A course with the name '" + request.getCourseName().trim() + "' already exists.");
        }

        // Validate weightage for technical course (1–100 per course; total auto-normalised in score calc)
        if (!Boolean.TRUE.equals(request.getIsCommunication())) {
            if (request.getWeightage() == null || request.getWeightage() < 1 || request.getWeightage() > 100) {
                throw new ValidationException("Weightage must be between 1 and 100 for technical courses.");
            }
        }

        TrainingCourse course = mapper.toEntity(request);
        return mapper.toResponse(courseRepository.save(course));
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingCourseResponse getCourseById(Integer courseId) {
        return mapper.toResponse(courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(COURSE_NOT_FOUND + courseId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public TrainingCourseResponse updateCourse(Integer courseId, TrainingCourseRequest request) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(COURSE_NOT_FOUND + courseId));

        if (request.getCourseName() != null)    course.setCourseName(request.getCourseName());
        if (request.getDescription() != null)   course.setDescription(request.getDescription());
        if (request.getMinScore() != null)      course.setMinScore(request.getMinScore());

        // Validate weightage on update (1–100 per course; total auto-normalised in score calc)
        if (!Boolean.TRUE.equals(request.getIsCommunication()) && request.getWeightage() != null) {
            if (request.getWeightage() < 1 || request.getWeightage() > 100) {
                throw new ValidationException("Weightage must be between 1 and 100.");
            }
        }

        applyCommunicationFields(course, request);

        return mapper.toResponse(courseRepository.save(course));
    }

    private void applyCommunicationFields(TrainingCourse course, TrainingCourseRequest request) {
        if (request.getIsCommunication() != null) {
            course.setIsCommunication(request.getIsCommunication());
            if (Boolean.TRUE.equals(request.getIsCommunication())) {
                applyCommTemplate(course, request);
            } else {
                course.setCommunicationTemplate(null);
                if (request.getWeightage() != null) course.setWeightage(request.getWeightage());
            }
        } else {
            if (!Boolean.TRUE.equals(course.getIsCommunication()) && request.getWeightage() != null)
                course.setWeightage(request.getWeightage());
            if (request.getCommunicationTemplate() != null && !request.getCommunicationTemplate().isBlank())
                course.setCommunicationTemplate(request.getCommunicationTemplate());
        }
    }

    private void applyCommTemplate(TrainingCourse course, TrainingCourseRequest request) {
        course.setWeightage(null);
        if (request.getCommunicationTemplate() != null && !request.getCommunicationTemplate().isBlank()) {
            course.setCommunicationTemplate(request.getCommunicationTemplate());
        } else if (course.getCommunicationTemplate() == null) {
            course.setCommunicationTemplate(
                "[{\"name\":\"Grammar\",\"maxScore\":20},{\"name\":\"Proactiveness\",\"maxScore\":20},{\"name\":\"Fluency\",\"maxScore\":10}]");
        }
    }

    @Override
    @Transactional
    public void deleteCourse(Integer courseId) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(COURSE_NOT_FOUND + courseId));

        // Check if course is linked to any batches
        List<com.kanini.springer.entity.Academy.BatchCourse> linkedBatches = batchCourseRepository.findByCourse_CourseId(courseId);
        if (!linkedBatches.isEmpty()) {
            throw new ValidationException(
                "Cannot delete course '" + course.getCourseName() + "'. It is linked to " + linkedBatches.size() +
                " batch(es). Unlink from all batches before deleting."
            );
        }

        // If not linked, hard delete
        courseRepository.deleteById(courseId);
    }

    @Override
    @Transactional
    public TrainingCourseResponse updateCourseStatus(Integer courseId, String status) {
        // Status is now on BatchCourse — no-op, return current course
        return mapper.toResponse(courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(COURSE_NOT_FOUND + courseId)));
    }
}
