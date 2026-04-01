package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long studentId;
    private String studentName;
    private LocalDate attendanceDate;
    private Boolean isPresent;
    private long presentDays;
    private long absentDays;
    private BigDecimal attendancePercentage;
}
