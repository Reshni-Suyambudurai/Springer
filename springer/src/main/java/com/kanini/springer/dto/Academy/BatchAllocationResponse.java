package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchAllocationResponse {
    
    private Long studentId;
    private Integer programId;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String department;
    private Integer batchNumber;
    private Boolean isActive;
    private String performance;
    private BigDecimal attendancePercentage;
    private LocalDateTime createdAt;
}
