package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
