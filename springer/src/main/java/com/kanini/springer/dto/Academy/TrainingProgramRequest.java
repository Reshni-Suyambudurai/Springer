package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.kanini.springer.entity.enums.Enums.TrainingLocation;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingProgramRequest {

    @NotBlank(message = "Program name is required")
    private String programName;

    @NotNull(message = "Program year is required")
    @Min(value = 2020, message = "Program year must be 2020 or later")
    private Integer programYear;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Number of batches is required")
    @Min(value = 1, message = "Must have at least 1 batch")
    @Max(value = 20, message = "Cannot have more than 20 batches")
    private Integer numberOfBatches;

    @NotNull(message = "Location is required")
    private TrainingLocation location;

    @NotNull(message = "Hiring cycle is required")
    private Long cycleId;
}
