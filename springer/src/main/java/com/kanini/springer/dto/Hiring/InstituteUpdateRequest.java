package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Full update request for PUT /api/institutes/{id}/full
 * Replaces all basic fields, programs and TPO contacts in a single call.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteUpdateRequest {

    // ── Basic fields ───────────────────────────────────────────────────────────
    private String instituteName;
    private String instituteTier;
    private String state;
    private String city;
    private Boolean isActive;

    // ── Program IDs to assign (replaces existing mappings) ────────────────────
    private List<Long> programIds;

    // ── TPO contacts ──────────────────────────────────────────────────────────
    /** Existing TPO contacts to update (must supply tpoId). */
    private List<ExistingTPORequest> tpoContacts;

    /** New TPO contacts to create for this institute. */
    private List<NewTPORequest> newTpoContacts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExistingTPORequest {
        private Integer tpoId;
        private String tpoName;
        private String tpoEmail;
        private String tpoMobile;
        private String tpoDesignation;
        private Boolean isPrimary;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewTPORequest {
        private String tpoName;
        private String tpoEmail;
        private String tpoMobile;
        private String tpoDesignation;
        private Boolean isPrimary;
    }
}
