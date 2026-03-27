package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteWithTPOsResponse {
    
    private Long instituteId;
    private String instituteName;
    private String instituteTier;
    private String location;
    private String state;
    private String city;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<TPODetails> tpoDetails;
    private List<ProgramDetails> programs; // Programs offered by this institute
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TPODetails {
        private Integer tpoId;
        private String tpoName;
        private String tpoEmail;
        private String tpoMobile;
        private String tpoDesignation;
        private String tpoStatus;
        private Boolean isPrimary;
        private LocalDateTime createdAt;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgramDetails {
        private Long instituteProgramId; // Mapping ID for deletion
        private Long programId;
        private String programName;
    }
}
