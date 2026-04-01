package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceStatsResponse {

    private Long studentId;
    private String studentName;
    private long presentDays;
    private long absentDays;
    private long totalDays;
    private BigDecimal attendancePercentage;
}
