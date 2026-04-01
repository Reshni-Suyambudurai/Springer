package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.enums.Enums.CourseStatus;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingCourseMapper;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
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
    private final UserRepository userRepository;
    private final BatchCourseRepository batchCourseRepository;
    private final TrainingCourseMapper mapper;
    
    @Override
    @Transactional
    public TrainingCourseResponse createCourse(TrainingCourseRequest request) {
        // Validate endDate >= startDate
        if (request.getStartDate() != null && request.getEndDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
        TrainingCourse course = mapper.toEntity(request);
        User trainer = userRepository.findById(request.getConductedBy())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with ID: " + request.getConductedBy()));
        course.setConductedBy(trainer);
        course.setStatus(CourseStatus.PLANNED); // Default status
        
        TrainingCourse savedCourse = courseRepository.save(course);
        return mapper.toResponse(savedCourse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public TrainingCourseResponse getCourseById(Integer courseId) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        return mapper.toResponse(course);
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
        try {
            CourseStatus courseStatus = CourseStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
            return courseRepository.findByStatus(courseStatus).stream()
                    .map(mapper::toResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid course status: " + status);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingCourseResponse> getCoursesByTrainer(Long trainerId) {
        return courseRepository.findByConductedBy_UserId(trainerId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public TrainingCourseResponse updateCourse(Integer courseId, TrainingCourseRequest request) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        
        // Only update fields that are provided (not null) - PATCH behavior
        if (request.getCourseName() != null) {
            course.setCourseName(request.getCourseName());
        }
        if (request.getDescription() != null) {
            course.setDescription(request.getDescription());
        }
        if (request.getStartDate() != null) {
            course.setStartDate(request.getStartDate().atStartOfDay());
        }
        if (request.getEndDate() != null) {
            course.setEndDate(request.getEndDate().atStartOfDay());
        }
        if (request.getMinScore() != null) {
            course.setMinScore(request.getMinScore());
        }
        if (request.getWeightage() != null) {
            course.setWeightage(request.getWeightage());
        }
        if (request.getConductedBy() != null) {
            User trainer = userRepository.findById(request.getConductedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with ID: " + request.getConductedBy()));
            course.setConductedBy(trainer);
        }
        
        TrainingCourse updatedCourse = courseRepository.save(course);
        return mapper.toResponse(updatedCourse);
    }
    
    @Override
    @Transactional
    public void deleteCourse(Integer courseId) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        
        course.setStatus(CourseStatus.CANCELLED); // Mark as deleted
        courseRepository.save(course);
    }
    
    @Override
    @Transactional
    public TrainingCourseResponse updateCourseStatus(Integer courseId, String status) {
        TrainingCourse course = courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));

        CourseStatus courseStatus;
        try {
            courseStatus = CourseStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid course status: " + status);
        }

        // Block PLANNED → ACTIVE if course not linked to any batch
        if (courseStatus == CourseStatus.ACTIVE && course.getStatus() == CourseStatus.PLANNED) {
            boolean linkedToBatch = !batchCourseRepository.findByCourse_CourseId(courseId).isEmpty();
            if (!linkedToBatch) {
                throw new IllegalArgumentException(
                    "Cannot activate course '" + course.getCourseName() +
                    "' — it must be linked to at least one batch first. Go to Batch Courses tab to link it."
                );
            }
        }

        course.setStatus(courseStatus);
        return mapper.toResponse(courseRepository.save(course));
    }
}
