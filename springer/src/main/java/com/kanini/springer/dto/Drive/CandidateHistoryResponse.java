package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.dto.Common.ManualOverrideResponse;

/**
 * Response DTO for complete candidate history within a drive.
 * Includes drive info, application details, panel assignments, and evaluations.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateHistoryResponse {

    // --- Drive Info ---
    private Long driveId;
    private String driveName;
    private String driveMode;         // ON_CAMPUS / OFF_CAMPUS
    private String driveStatus;

    // --- Application Info ---
    private Long applicationId;
    private Long candidateId;
    private String candidateName;
    private LocalDateTime batchTime;
    private String registrationCode;
    private String applicationStatus;  // ALLOTED, IN_DRIVE, DROPPED, FAILED, SELECTED
    private String history;

    // --- Panel Assignments ---
    private List<AssignmentEntry> assignments;

    // --- Evaluations ---
    private List<EvaluationEntry> evaluations;

    // --- Manual Overrides ---
    private List<ManualOverrideResponse> overrides;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentEntry {
        private Integer assignmentId;
        private Long roundConfigId;
        private String roundName;
        private Integer roundNo;
        private Long panelMemberId;
        private String panelMemberName;
        private String status;         // PLANNED, DRAFT, SELECTED, REJECTED, CANCELLED, HOLD
        private Boolean isActive;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationEntry {
        private Long scoreId;
        private Long roundConfigId;
        private String roundName;
        private Integer roundNo;
        private Integer score;
        private Integer outoffScore;   // Maximum possible score from round_template
        private Object sectionScore;   // JSON object
        private String review;
        private String evaluationStatus; // PASS, FAIL, ABSENT, HOLD, SKIP
        private Long reviewedBy;
        private String reviewedByName;
        private LocalDateTime reviewedAt;
    }
}
