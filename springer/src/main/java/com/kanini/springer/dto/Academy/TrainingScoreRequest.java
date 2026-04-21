package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingScoreRequest {

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotNull(message = "Student ID is required")
    private Long studentId;

    // For technical courses: 0–100. For communication courses: null (score is derived from communicationBreakdown sub-scores).
    @Min(value = 0, message = "Score must be at least 0")
    private Integer score;

    private String review;

    private String status;

    @NotNull(message = "Reviewer ID is required")
    private Long reviewedBy;

    /**
     * JSON breakdown for Communication course scores.
     * Only sent when the course has isCommunication = true.
     * Format: [{"name":"Grammar","score":16,"maxScore":20}, ...]
     * The score field must equal the sum of all sub-scores.
     */
    private String communicationBreakdown;
}
