package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Lightweight response DTO for the Joining Tracker table.
 * Contains only the fields displayed in the JoiningTracker UI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoiningTrackerResponse {
    private Long candidateId;
    private String firstName;
    private String lastName;
    private String email;
    private String instituteName;
    private String mobile;
    private String department;
    private String degree;
    private Long cycleId;
    private String applicationStage;
    private LocalDateTime updatedAt;
}
