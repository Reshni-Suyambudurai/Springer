package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCourseResponse {
    
    private Integer courseId;
    private String courseName;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer minScore;
    private Integer weightage;
    private Long conductedBy;
    private String status;
    private LocalDateTime createdAt;
}
