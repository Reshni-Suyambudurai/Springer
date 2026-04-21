package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingScoreResponse {
    
    private Integer scoreId;
    private Integer courseId;
    private Long studentId;
    private Integer score;
    /** For technical courses: always 100. For communication: sum of all sub-field maxScores from the template. */
    private Integer maxScore;
    private String review;
    private String status;
    private Long reviewedBy;
    private String communicationBreakdown;
    private LocalDateTime createdAt;
}
