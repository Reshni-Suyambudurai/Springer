package com.kanini.springer.mapper.Drive;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.dto.Drive.CandidateHistoryResponse;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.entity.Drive.DriveAssignment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ApplicationMapper {
    
    private final ObjectMapper objectMapper;
    
    /**
     * Convert Application entity to ApplicationResponse DTO
     */
    public ApplicationResponse toResponse(Application application) {
        if (application == null) {
            return null;
        }
        
        ApplicationResponse response = new ApplicationResponse();
        response.setApplicationId(application.getApplicationId());
        
        // Drive info
        if (application.getDrive() != null) {
            response.setDriveId(application.getDrive().getDriveId());
            response.setDriveName(application.getDrive().getDriveName());
        }
        
        // Candidate info
        if (application.getCandidate() != null) {
            response.setCandidateId(application.getCandidate().getCandidateId());
            String candidateName = application.getCandidate().getFirstName() + 
                    (application.getCandidate().getLastName() != null ? " " + application.getCandidate().getLastName() : "");
            response.setCandidateName(candidateName);
            response.setCandidateEmail(application.getCandidate().getEmail());
        }
        
        response.setBatchTime(application.getBatchTime());
        response.setRegistrationCode(application.getRegistrationCode());
        
        if (application.getApplicationStatus() != null) {
            response.setApplicationStatus(application.getApplicationStatus().toString());
        }
        
        response.setCreatedAt(application.getCreatedAt());
        
        // Created by user info
        if (application.getCreatedByUser() != null) {
            response.setCreatedBy(application.getCreatedByUser().getUserId());
            response.setCreatedByName(application.getCreatedByUser().getUsername());
        }

        // Updated by user info
        response.setUpdatedAt(application.getUpdatedAt());
        if (application.getUpdatedByUser() != null) {
            response.setUpdatedBy(application.getUpdatedByUser().getUserId());
            response.setUpdatedByName(application.getUpdatedByUser().getUsername());
        }

        // Defaults; service layer may override with actual latest values
        response.setEvaluationStatus("PENDING");
        response.setLatestRoundConfigId(0L);
        
        return response;
    }

    /**
     * Convert Application entity + related assignments & evaluations to CandidateHistoryResponse
     */
    public CandidateHistoryResponse toCandidateHistoryResponse(
            Application application,
            List<DriveAssignment> assignments,
            List<CandidateEvaluation> evaluations) {

        CandidateHistoryResponse response = new CandidateHistoryResponse();

        // Drive info
        if (application.getDrive() != null) {
            response.setDriveId(application.getDrive().getDriveId());
            response.setDriveName(application.getDrive().getDriveName());
            response.setDriveMode(application.getDrive().getDriveMode() != null
                    ? application.getDrive().getDriveMode().toString() : null);
            response.setDriveStatus(application.getDrive().getStatus() != null
                    ? application.getDrive().getStatus().toString() : null);
        }

        // Application info
        response.setApplicationId(application.getApplicationId());
        if (application.getCandidate() != null) {
            response.setCandidateId(application.getCandidate().getCandidateId());
            String name = application.getCandidate().getFirstName()
                    + (application.getCandidate().getLastName() != null
                    ? " " + application.getCandidate().getLastName() : "");
            response.setCandidateName(name);
        }
        response.setBatchTime(application.getBatchTime());
        response.setRegistrationCode(application.getRegistrationCode());
        response.setApplicationStatus(application.getApplicationStatus() != null
                ? application.getApplicationStatus().toString() : null);
        response.setHistory(application.getHistory());

        // Assignments
        response.setAssignments(assignments.stream().map(a -> {
            CandidateHistoryResponse.AssignmentEntry entry = new CandidateHistoryResponse.AssignmentEntry();
            entry.setAssignmentId(a.getAssignmentId());
            if (a.getRoundConfig() != null) {
                entry.setRoundConfigId(a.getRoundConfig().getRoundConfigId());
                entry.setRoundName(a.getRoundConfig().getRoundName());
                entry.setRoundNo(a.getRoundConfig().getRoundNo());
            }
            if (a.getUser() != null) {
                entry.setPanelMemberId(a.getUser().getUserId());
                entry.setPanelMemberName(a.getUser().getUsername());
            }
            entry.setStatus(a.getStatus() != null ? a.getStatus().toString() : null);
            entry.setIsActive(a.getIsActive());
            entry.setCreatedAt(a.getCreatedAt());
            return entry;
        }).collect(Collectors.toList()));

        // Evaluations
        response.setEvaluations(evaluations.stream().map(e -> {
            CandidateHistoryResponse.EvaluationEntry entry = new CandidateHistoryResponse.EvaluationEntry();
            entry.setScoreId(e.getScoreId());
            if (e.getRoundConfig() != null) {
                entry.setRoundConfigId(e.getRoundConfig().getRoundConfigId());
                entry.setRoundName(e.getRoundConfig().getRoundName());
                entry.setRoundNo(e.getRoundConfig().getRoundNo());
            }
            entry.setScore(e.getScore());
            // Deserialize sectionScore JSON
            if (e.getSectionScore() != null && !e.getSectionScore().isBlank()) {
                try {
                    entry.setSectionScore(objectMapper.readValue(e.getSectionScore(), Object.class));
                } catch (JsonProcessingException ex) {
                    entry.setSectionScore(e.getSectionScore());
                }
            }
            entry.setReview(e.getReview());
            entry.setEvaluationStatus(e.getStatus() != null ? e.getStatus().toString() : null);
            if (e.getReviewedBy() != null) {
                entry.setReviewedBy(e.getReviewedBy().getUserId());
                entry.setReviewedByName(e.getReviewedBy().getUsername());
            }
            entry.setReviewedAt(e.getReviewedAt());
            return entry;
        }).collect(Collectors.toList()));

        return response;
    }
}
