package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.TrainingProgramRequest;
import com.kanini.springer.dto.Academy.TrainingProgramResponse;

import java.util.List;

public interface ITrainingProgramService {
    
    TrainingProgramResponse createProgram(TrainingProgramRequest request);
    
    TrainingProgramResponse getProgramById(Integer programId);
    
    List<TrainingProgramResponse> getAllPrograms();
    
    List<TrainingProgramResponse> getProgramsByStatus(boolean status);
    
    List<TrainingProgramResponse> getProgramsByCycle(Long cycleId);
    
    List<TrainingProgramResponse> getProgramsByLocation(String location);
    
    TrainingProgramResponse updateProgram(Integer programId, TrainingProgramRequest request);
    
    void deleteProgram(Integer programId);
    
    List<Integer> getAllDistinctYears();
}
