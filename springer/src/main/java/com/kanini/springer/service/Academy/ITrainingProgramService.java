package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.BatchCandidateResponse;
import com.kanini.springer.dto.Academy.TrainingProgramRequest;
import com.kanini.springer.dto.Academy.TrainingProgramResponse;
import com.kanini.springer.dto.Academy.JoiningTrackerRequest;
import com.kanini.springer.dto.Academy.JoiningTrackerResponse;

import java.util.List;

public interface ITrainingProgramService {
    
    TrainingProgramResponse createProgram(TrainingProgramRequest request);
    
    TrainingProgramResponse getProgramById(Integer programId);
    
    List<TrainingProgramResponse> getAllPrograms();
    
    List<TrainingProgramResponse> getProgramsByStatus(boolean status);
    
    TrainingProgramResponse updateProgram(Integer programId, TrainingProgramRequest request);
    
    void deleteProgram(Integer programId);
    
    List<Integer> getAllDistinctYears();
    
    List<JoiningTrackerResponse> getCandidatesByCycleAndStages(JoiningTrackerRequest request);
    
    List<BatchCandidateResponse> getBatchCandidatesByCycleAndStages(JoiningTrackerRequest request);
}
