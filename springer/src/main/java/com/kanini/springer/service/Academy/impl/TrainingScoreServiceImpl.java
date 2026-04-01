package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.enums.Enums.ScoreStatus;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingScoreMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.ITrainingScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainingScoreServiceImpl implements ITrainingScoreService {
    
    private final TrainingScoreRepository scoreRepository;
    private final TrainingCourseRepository courseRepository;
    private final BatchAllocationRepository allocationRepository;
    private final UserRepository userRepository;
    private final TrainingScoreMapper mapper;
    
    @Override
    @Transactional
    public TrainingScoreResponse createScore(TrainingScoreRequest request) {
        TrainingCourse course = courseRepository.findByCourseId(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + request.getCourseId()));
        
        BatchAllocation student = allocationRepository.findByStudentId(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation (Student) not found with ID: " + request.getStudentId()));
        
        TrainingScore score = mapper.toEntity(request);
        score.setCourse(course);
        score.setStudent(student);
        User reviewer = userRepository.findById(request.getReviewedBy())
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + request.getReviewedBy()));
        score.setReviewedBy(reviewer);
        
        // Validate score is within range
        if (request.getScore() < 0 || request.getScore() > 100) {
            throw new IllegalArgumentException("Score must be between 0 and 100");
        }
        
        // Set status based on score
        // EXCELLENT: >= 90, GOOD: >= minScore, AVERAGE: >= minScore-10, BELOW_AVERAGE: below that
        score.setStatus(calculateScoreStatus(request.getScore(), course.getMinScore()));
        
        TrainingScore savedScore = scoreRepository.save(score);
        return mapper.toResponse(savedScore);
    }
    
    @Override
    @Transactional(readOnly = true)
    public TrainingScoreResponse getScoreById(Integer scoreId) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Score not found with ID: " + scoreId));
        return mapper.toResponse(score);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getAllScores() {
        return scoreRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByStudent(Long studentId) {
        // Validate student (batch allocation) exists first
        allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Allocation (Student) not found with ID: " + studentId));
        
        return scoreRepository.findByStudent_StudentId(studentId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByCourse(Integer courseId) {
        // Validate course exists first
        courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        
        return scoreRepository.findByCourse_CourseId(courseId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByStatus(String status) {
        try {
            ScoreStatus scoreStatus = ScoreStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
            return scoreRepository.findByStatus(scoreStatus).stream()
                    .map(mapper::toResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid score status: " + status);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TrainingScoreResponse> getScoresByReviewer(Long reviewerId) {
        // Validate reviewer (user) exists first
        userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User (Reviewer) not found with ID: " + reviewerId));
        
        return scoreRepository.findByReviewedBy_UserId(reviewerId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public TrainingScoreResponse updateScore(Integer scoreId, TrainingScoreRequest request) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Score not found with ID: " + scoreId));
        
        // Only update fields that are provided (not null) - PATCH behavior
        if (request.getScore() != null) {
            // Validate score is within range
            if (request.getScore() < 0 || request.getScore() > 100) {
                throw new IllegalArgumentException("Score must be between 0 and 100");
            }
            score.setScore(request.getScore());
            
            // Recalculate status based on updated score
            if (score.getCourse() != null) {
                score.setStatus(calculateScoreStatus(request.getScore(), score.getCourse().getMinScore()));
            }
        }
        if (request.getReview() != null) {
            score.setReview(request.getReview());
        }
        if (request.getCourseId() != null) {
            TrainingCourse course = courseRepository.findByCourseId(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + request.getCourseId()));
            score.setCourse(course);
        }
        if (request.getReviewedBy() != null) {
            User reviewer = userRepository.findById(request.getReviewedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + request.getReviewedBy()));
            score.setReviewedBy(reviewer);
        }
        
        TrainingScore updatedScore = scoreRepository.save(score);
        return mapper.toResponse(updatedScore);
    }
    
    @Override
    @Transactional
    public void deleteScore(Integer scoreId) {
        TrainingScore score = scoreRepository.findByScoreId(scoreId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Score not found with ID: " + scoreId));
        scoreRepository.delete(score);
    }

    /**
     * Calculate score status based on score and course minScore
     * EXCELLENT : score >= 90
     * GOOD      : score >= minScore
     * AVERAGE   : score >= minScore - 10
     * BELOW_AVERAGE: score < minScore - 10
     */
    private ScoreStatus calculateScoreStatus(int score, int minScore) {
        if (score >= 90) return ScoreStatus.EXCELLENT;
        if (score >= minScore) return ScoreStatus.GOOD;
        if (score >= minScore - 10) return ScoreStatus.AVERAGE;
        return ScoreStatus.BELOW_AVERAGE;
    }
}
