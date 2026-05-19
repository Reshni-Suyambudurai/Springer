package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.DocumentCompletionResponse;
import com.kanini.springer.dto.DocumentCollection.PipelineStatusResponse;
import com.kanini.springer.dto.DocumentCollection.PipelineStatusResponse.*;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.DocumentCollection.OfferLetterRepository;
import com.kanini.springer.service.DocumentCollection.IReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements IReportService {
    
    private final DocumentSubmissionRepository submissionRepository;
    private final OfferLetterRepository offerRepository;
    
    @Override
    public Map<String, Object> getDocumentCompletionReport(Long cycleId) {
        // Fix: Use count queries instead of loading all records into memory for performance
        long approvedCount = submissionRepository.countByCycleIdAndVerificationStatus(
                cycleId, Enums.VerificationStatus.APPROVED);
        long collectedCount = submissionRepository.countByCycleIdAndVerificationStatus(
                cycleId, Enums.VerificationStatus.COLLECTED);
        long rejectedCount = submissionRepository.countByCycleIdAndVerificationStatus(
                cycleId, Enums.VerificationStatus.REJECTED);
        
        long totalSubmissions = approvedCount + collectedCount + rejectedCount;
        
        Map<String, Object> report = new HashMap<>();
        report.put("cycleId", cycleId);
        report.put("totalCandidates", totalSubmissions);
        report.put("approvedCount", approvedCount);
        report.put("collectedCount", collectedCount);
        report.put("rejectedCount", rejectedCount);
        report.put("approvedPercentage", totalSubmissions > 0 ? (approvedCount * 100) / totalSubmissions : 0);
        
        return report;
    }
    
    @Override
    public Map<String, Object> getOfferStatusReport(Long cycleId) {
        // Fix: Use count queries instead of loading all records into memory for performance
        long acceptedCount = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.OFFER_ACCEPTED);
        long declinedCount = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.OFFER_DECLINED);
        long pendingCount = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.PENDING);
        
        long totalOffersIssued = acceptedCount + declinedCount + pendingCount;
        
        Map<String, Object> report = new HashMap<>();
        report.put("cycleId", cycleId);
        report.put("totalOffersIssued", totalOffersIssued);
        report.put("acceptedCount", acceptedCount);
        report.put("declinedCount", declinedCount);
        report.put("pendingCount", pendingCount);
        
        double ratio = totalOffersIssued > 0 ? (acceptedCount * 100.0) / totalOffersIssued : 0;
        report.put("acceptanceRatio", String.format("%.2f%%", ratio));
        
        return report;
    }
    
    @Override
    public PipelineStatusResponse getPipelineStatusReport(Long cycleId) {
        // Fix: Use count queries for all metrics - no longer loading any records into memory
        long approvedCount = submissionRepository.countByCycleIdAndVerificationStatus(
                cycleId, Enums.VerificationStatus.APPROVED);
        long collectedCount = submissionRepository.countByCycleIdAndVerificationStatus(
                cycleId, Enums.VerificationStatus.COLLECTED);
        long acceptedCount = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.OFFER_ACCEPTED);
        
        // Fix: Use COUNT(DISTINCT) query instead of loading all records into memory
        Long candidateCountLong = submissionRepository.countDistinctCandidateIdByCycleId(cycleId);
        int candidatesSelected = candidateCountLong != null ? candidateCountLong.intValue() : 0;
        long offersAccepted = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.OFFER_ACCEPTED);
        long offersDeclined = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.OFFER_DECLINED);
        long offersPending = offerRepository.countByCycleIdAndResponse(cycleId, Enums.OfferResponse.PENDING);
        int totalOffersIssued = (int) (offersAccepted + offersDeclined + offersPending);
        
        FunnelMetrics funnel = FunnelMetrics.builder()
                .candidatesSelected(candidatesSelected)
                .documentsPending((int) collectedCount)
                .offersIssued(totalOffersIssued)
                .offersAccepted((int) acceptedCount)
                .readyForAcademy((int) acceptedCount)
                .build();
        
        ConversionMetrics conversion = ConversionMetrics.builder()
                .selectionToDocumentCollection(funnel.getCandidatesSelected() > 0 
                    ? String.format("%.1f%% pending", (100.0 * funnel.getDocumentsPending()) / funnel.getCandidatesSelected())
                    : "N/A")
                .documentToOffer(String.format("%d/%d ready", (int) approvedCount, funnel.getCandidatesSelected()))
                .offerToAcceptance(funnel.getOffersIssued() > 0 
                    ? String.format("%.1f%%", (100.0 * acceptedCount) / funnel.getOffersIssued())
                    : "N/A")
                .build();
        
        TimelineMetrics timeline = TimelineMetrics.builder()
                .avgDaysInDocumentCollection(2.5)
                .avgDaysInOfferPhase(1.8)
                .bottleneck(funnel.getDocumentsPending() > 0 ? "Document verification pending" : "Complete")
                .build();
        
        return PipelineStatusResponse.builder()
                .cycleId(cycleId)
                .reportGeneratedAt(LocalDateTime.now())
                .funnel(funnel)
                .conversionMetrics(conversion)
                .timeline(timeline)
                .build();
    }
}
