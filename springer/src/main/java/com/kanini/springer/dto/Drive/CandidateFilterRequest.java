package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for filtering and sorting candidates with pagination
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateFilterRequest {
    
    private Long cycleId;
    private String lifecycleStatus;
    
    // Search filters
    private String candidateName;
    private String instituteName;
    private String state;
    private List<String> cities;
    private List<String> degrees;
    private List<String> departments;
    private List<String> eligibility;
    private List<String> applicationTypes;
    private List<String> applicationStages;
    private List<String> skills;
    
    // Sorting
    private String sortBy;
    private String sortDirection;
    
    // Pagination
    private Integer page;
    private Integer size;
}
