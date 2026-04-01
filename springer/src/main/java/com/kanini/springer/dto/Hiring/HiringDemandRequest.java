package com.kanini.springer.dto.Hiring;

import com.kanini.springer.entity.enums.Enums.ApprovalStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HiringDemandRequest {
    
    private Long cycleId; // Required for POST, optional for PATCH
    
    private String businessUnit; // Required for POST, optional for PATCH
    
    private Integer demandCount; // Required for POST, optional for PATCH
    
    private String compensationBand; // Required for POST, optional for PATCH
    
    private String jobDescription; // Job description or requirements as text
    
    private ApprovalStatus approvalStatus; // Required for POST, optional for PATCH
    
    private List<Long> skillIds; // List of skill IDs to map to this demand
}
