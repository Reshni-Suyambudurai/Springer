package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkAttendanceMarkRequest {

    @NotNull(message = "Program ID is required")
    private Integer programId;

    @NotNull(message = "Batch number is required")
    private Integer batchNumber;

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotNull(message = "isPresent is required")
    private Boolean isPresent;
}
