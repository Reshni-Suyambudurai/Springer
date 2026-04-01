package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineStatusResponse {
    
    private Long cycleId;
    
    private LocalDateTime reportGeneratedAt;
    
    private FunnelMetrics funnel;
    
    private ConversionMetrics conversionMetrics;
    
    private TimelineMetrics timeline;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FunnelMetrics {
        private Integer candidatesSelected;
        private Integer documentsPending;
        private Integer offersIssued;
        private Integer offersAccepted;
        private Integer readyForAcademy;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversionMetrics {
        private String selectionToDocumentCollection;
        private String documentToOffer;
        private String offerToAcceptance;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimelineMetrics {
        private Double avgDaysInDocumentCollection;
        private Double avgDaysInOfferPhase;
        private String bottleneck;
    }
}
