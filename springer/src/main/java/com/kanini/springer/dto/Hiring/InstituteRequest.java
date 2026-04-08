package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteRequest {
    
    private String instituteName;
    private String instituteTier; // TIER_1, TIER_2, TIER_3
   
    private String state;
    private String city;
    private Boolean isActive;
    private List<Long> programIds; // List of program IDs to map to this institute
    private TPOContactRequest tpoContact; // Optional TPO contact to create alongside the institute

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TPOContactRequest {
        private String tpoName;
        private String tpoEmail;
        private String tpoMobile;
        private String tpoDesignation;
    }
}
