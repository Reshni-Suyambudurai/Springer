package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCourseRequest {

    @NotBlank(message = "Course name is required")
    private String courseName;

    private String description;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Min score is required")
    @Min(value = 0, message = "Min score must be at least 0")
    @Max(value = 100, message = "Min score must be at most 100")
    private Integer minScore;

    @NotNull(message = "Weightage is required")
    @Min(value = 1, message = "Weightage must be at least 1")
    @Max(value = 100, message = "Weightage must be at most 100")
    private Integer weightage;

    @NotNull(message = "Trainer is required")
    private Long conductedBy;

    private String status;
}
