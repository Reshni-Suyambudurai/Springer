package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.RoundTemplateRequest;
import com.kanini.springer.dto.Drive.RoundTemplateResponse;
import com.kanini.springer.dto.Drive.RoundTemplateUpdateRequest;

import java.util.List;

/**
 * Service interface for Round Template operations
 */
public interface IRoundTemplateService {
    
    /**
     * Create a new round template
     * @param request Round template creation request
     * @return RoundTemplateResponse with created round template details
     */
    RoundTemplateResponse createRoundTemplate(RoundTemplateRequest request);
    
    /**
     * Get round template by ID
     * @param roundConfigId Round template ID
     * @return RoundTemplateResponse with round template details
     */
    RoundTemplateResponse getRoundTemplateById(Long roundConfigId);
    
    /**
     * Get all round templates
     * @return List of RoundTemplateResponse
     */
    List<RoundTemplateResponse> getAllRoundTemplates();
    
    /**
     * Update round template
     * @param roundConfigId Round template ID to update
     * @param request Update request with fields to modify
     * @return RoundTemplateResponse with updated round template details
     */
    RoundTemplateResponse updateRoundTemplate(Long roundConfigId, RoundTemplateUpdateRequest request);
    
    /**
     * Soft delete round template by toggling isActive status
     * @param roundConfigId Round template ID to soft delete
     * @return RoundTemplateResponse with updated isActive status
     */
    RoundTemplateResponse deleteRoundTemplate(Long roundConfigId);
}
