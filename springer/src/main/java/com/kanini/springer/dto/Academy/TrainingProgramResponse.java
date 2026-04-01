package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingProgramResponse {
    
    private Integer programId;
    private String programName;
    private Integer programYear;
    private Integer capacity;
    private Integer numberOfBatches;
    private String location;
    private boolean status;
    private LocalDateTime createdAt;
    private Long cycleId;
}
