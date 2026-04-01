package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteResponse {
    
    private Long instituteId;
    private String instituteName;
    private String instituteTier;

    private String state;
    private String city;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<ProgramDetails> programs;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgramDetails {
        private Long programId;
        private String programName;
    }
}
