package com.kanini.springer.dto.Academy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LeaveRequestRequest {
    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotBlank(message = "From date is required")
    private String fromDate;   // YYYY-MM-DD

    @NotBlank(message = "To date is required")
    private String toDate;     // YYYY-MM-DD

    @NotBlank(message = "Leave type is required")
    private String leaveType;  // SICK | PERSONAL | EMERGENCY | OTHER

    @NotBlank(message = "Reason is required")
    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;
}
