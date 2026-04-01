package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.TrainingProgramRequest;
import com.kanini.springer.dto.Academy.TrainingProgramResponse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import org.springframework.stereotype.Component;

@Component
public class TrainingProgramMapper {
    
    public TrainingProgramResponse toResponse(TrainingProgram entity) {
        if (entity == null) {
            return null;
        }
        
        TrainingProgramResponse response = new TrainingProgramResponse();
        response.setProgramId(entity.getProgramId());
        response.setProgramName(entity.getProgramName());
        response.setProgramYear(entity.getProgramYear());
        response.setCapacity(entity.getCapacity());
        response.setNumberOfBatches(entity.getNumberOfBatches());
        response.setLocation(entity.getLocation());
        response.setStatus(entity.isStatus());
        response.setCreatedAt(entity.getCreatedAt());
        if (entity.getCycle() != null) {
            response.setCycleId(entity.getCycle().getCycleId());
        }
        
        return response;
    }
    
    public TrainingProgram toEntity(TrainingProgramRequest request) {
        if (request == null) {
            return null;
        }
        
        TrainingProgram entity = new TrainingProgram();
        entity.setProgramName(request.getProgramName());
        entity.setProgramYear(request.getProgramYear());
        entity.setCapacity(request.getCapacity());
        entity.setNumberOfBatches(request.getNumberOfBatches());
        entity.setLocation(request.getLocation());
        entity.setStatus(true); // Default to active
        
        return entity;
    }
}
