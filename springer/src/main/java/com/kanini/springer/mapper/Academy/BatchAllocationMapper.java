package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import org.springframework.stereotype.Component;

@Component
public class BatchAllocationMapper {
    
    public BatchAllocationResponse toResponse(BatchAllocation entity) {
        if (entity == null) {
            return null;
        }
        
        BatchAllocationResponse response = new BatchAllocationResponse();
        response.setStudentId(entity.getStudentId());
        response.setBatchNumber(entity.getBatchNumber());
        response.setIsActive(entity.getIsActive());
        response.setPerformance(entity.getPerformance() != null ? entity.getPerformance().toString() : null);
        response.setAttendancePercentage(entity.getAttendancePercentage());
        response.setOverallWeightedScore(entity.getOverallWeightedScore());
        response.setTransferredFromStudentId(entity.getTransferredFromStudentId());
        // Note: presentDays, totalTrainingDays, absentDays are calculated from TrainingDayAttendance table
        // They are NOT stored in BatchAllocation entity
        response.setCreatedAt(entity.getCreatedAt());
        
        if (entity.getProgram() != null) {
            response.setProgramId(entity.getProgram().getProgramId());
        }
        
        if (entity.getCandidate() != null) {
            response.setCandidateId(entity.getCandidate().getCandidateId());
            String firstName = entity.getCandidate().getFirstName() != null ? entity.getCandidate().getFirstName() : "";
            String lastName  = entity.getCandidate().getLastName()  != null ? entity.getCandidate().getLastName()  : "";
            response.setCandidateName((firstName + " " + lastName).trim());
            response.setCandidateEmail(entity.getCandidate().getEmail());
            response.setDepartment(entity.getCandidate().getDepartment());
        }
        
        return response;
    }
    
    public BatchAllocation toEntity(BatchAllocationRequest request) {
        if (request == null) {
            return null;
        }
        
        BatchAllocation entity = new BatchAllocation();
        entity.setBatchNumber(request.getBatchNumber());
        entity.setImage(request.getImage());
        entity.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        return entity;
    }
}
