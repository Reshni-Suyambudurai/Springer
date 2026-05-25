package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteCreateRequest {

    private String instituteName;
    private String instituteTier; // TIER_1 | TIER_2 | TIER_3
    private String state;
    private String city;
    private Boolean isActive;

    /** Optional — list of program IDs to map. Null/empty = no programs. */
    private List<Long> programIds;

    /** Optional — one or more TPO contacts. Null/empty = no contacts. */
    private List<TPOContactRequest> tpoContacts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TPOContactRequest {
        private String tpoName;
        private String tpoEmail;
        private String tpoMobile;
        private String tpoDesignation;
        private Boolean isPrimary;
    }
}
