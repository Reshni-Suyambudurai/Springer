package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Per-candidate allocation status for Panel Allocation page.
 * Tells the frontend: who is assigned + whether re-assignment is locked.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PanelAllocationStatusResponse {
    private Long applicationId;
    
    private List<AdditionalPanel> additionalPanels = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdditionalPanel {
          private boolean evaluated; 
        private Long userId;
        private String panelName;
         private String evaluationStatus;
        private Integer score;
    }
}
