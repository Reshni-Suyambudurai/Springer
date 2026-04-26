package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCourseRequest {

    @NotBlank(message = "Course name is required")
    private String courseName;

    private String description;

    @NotNull(message = "Min score is required")
    @Min(value = 0, message = "Min score must be at least 0")
    @Max(value = 100, message = "Min score must be at most 100")
    private Integer minScore;

    // Optional for communication courses — they are excluded from weighted average
    @Min(value = 1, message = "Weightage must be at least 1")
    @Max(value = 100, message = "Weightage must be at most 100")
    private Integer weightage;

    private Boolean isCommunication;

    // JSON template for sub-fields. Only used when isCommunication = true.
    // Format: [{"name":"Grammar","maxScore":20}, ...]
    // If null/blank, backend applies default: Grammar(20), Proactiveness(20), Fluency(10)
    private String communicationTemplate;
}
