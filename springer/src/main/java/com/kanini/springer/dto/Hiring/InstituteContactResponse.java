package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteContactResponse {
    
    private Integer tpoId;
    private Long instituteId;
    private String instituteName;
    private String tpoName;
    private String tpoEmail;
    private String tpoMobile;
    private String tpoDesignation; // qualification of the tpo
    private String tpoStatus;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
}
