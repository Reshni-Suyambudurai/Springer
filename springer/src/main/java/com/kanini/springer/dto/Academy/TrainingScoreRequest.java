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

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be at least 0")
    @Max(value = 100, message = "Score must be at most 100")
    private Integer score;

    private String review;

    private String status;

    @NotNull(message = "Reviewer ID is required")
    private Long reviewedBy;
}
