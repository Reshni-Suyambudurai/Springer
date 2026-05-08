package com.kanini.springer.dto.Academy;

import lombok.Data;

@Data
public class LeaveRequestRequest {
    private Long studentId;
    private String fromDate;   // YYYY-MM-DD
    private String toDate;     // YYYY-MM-DD
    private String leaveType;  // SICK | PERSONAL | EMERGENCY | OTHER
    private String reason;
}
