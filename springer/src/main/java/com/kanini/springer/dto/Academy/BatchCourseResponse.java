package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCourseResponse {
    
    private Integer batchCourseId;
    private Integer batchNo;
    private Integer courseId;
    private Integer programId;
    private Long cycleId;       // hiring cycle this course belongs to
    private LocalDateTime createdAt;
}
