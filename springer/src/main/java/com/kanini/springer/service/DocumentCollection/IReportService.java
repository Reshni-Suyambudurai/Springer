package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentCompletionResponse;
import com.kanini.springer.dto.DocumentCollection.PipelineStatusResponse;

import java.util.Map;

public interface IReportService {
    
    Map<String, Object> getDocumentCompletionReport(Long cycleId);
    
    Map<String, Object> getOfferStatusReport(Long cycleId);
    
    PipelineStatusResponse getPipelineStatusReport(Long cycleId);
}
