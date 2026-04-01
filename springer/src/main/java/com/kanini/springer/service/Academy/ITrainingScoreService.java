package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;

import java.util.List;

public interface ITrainingScoreService {
    
    TrainingScoreResponse createScore(TrainingScoreRequest request);
    
    TrainingScoreResponse getScoreById(Integer scoreId);
    
    List<TrainingScoreResponse> getAllScores();
    
    List<TrainingScoreResponse> getScoresByStudent(Long studentId);
    
    List<TrainingScoreResponse> getScoresByCourse(Integer courseId);
    
    List<TrainingScoreResponse> getScoresByStatus(String status);
    
    List<TrainingScoreResponse> getScoresByReviewer(Long reviewerId);
    
    TrainingScoreResponse updateScore(Integer scoreId, TrainingScoreRequest request);
    
    void deleteScore(Integer scoreId);
}
