package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCourseRequest {

    @NotNull(message = "Batch number is required")
    @Min(value = 1, message = "Batch number must be at least 1")
    private Integer batchNo;

    @NotNull(message = "Course ID is required")
    private Integer courseId;

    @NotNull(message = "Program ID is required")
    private Integer programId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Trainer is required")
    private Long conductedBy;

    private String status; // defaults to PLANNED if null
}
