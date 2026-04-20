package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCourseResponse {

    private Integer batchCourseId;
    private Integer batchNo;
    private Integer courseId;
    private String  courseName;
    private Integer programId;
    private Long    cycleId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long    conductedBy;
    private String  trainerName;
    private String  status;
    private LocalDateTime createdAt;
}
