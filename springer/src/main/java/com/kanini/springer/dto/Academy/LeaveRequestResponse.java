package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestResponse {
    private Long leaveId;
    private Long studentId;
    private String studentName;
    private String programName;
    private Integer batchNumber;
    private String fromDate;
    private String toDate;
    private Integer totalDays;
    private String leaveType;
    private String reason;
    private String status;        // PENDING | APPROVED | REJECTED
    private String remarks;       // TA Recruiter remarks
    private String reviewedBy;    // TA Recruiter name
    private String reviewedAt;
    private String appliedAt;
}
