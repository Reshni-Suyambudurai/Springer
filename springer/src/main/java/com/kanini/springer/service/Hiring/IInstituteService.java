package com.kanini.springer.service.Hiring;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteNameResponse;
import com.kanini.springer.dto.Hiring.InstituteRequest;
import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.dto.Hiring.InstituteWithTPOsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IInstituteService {
    
    /**
     * Create a single institute
     */
    InstituteResponse createInstitute(InstituteRequest request);
    
    /**
     * Bulk insert institutes
     */
    BulkInsertResponse<InstituteResponse> bulkCreateInstitutes(List<InstituteRequest> requests);
    
    /**
     * Get all institutes
     */
    List<InstituteResponse> getAllInstitutes();
    
    /**
     * Get institute by ID
     */
    InstituteResponse getInstituteById(Long instituteId);
    
    /**
     * Update institute (PATCH - partial update)
     */
    InstituteResponse updateInstitute(Long instituteId, InstituteRequest request);
    
    /**
     * Soft delete institute (set isActive to false)
     */
    void deleteInstitute(Long instituteId);
    
    /**
     * Get institutes with their TPO details (paginated)
     */
    Page<InstituteWithTPOsResponse> getAllInstitutesWithTPOs(Pageable pageable);
    
    /**
     * Get a single institute with its TPOs by institute ID
     */
    InstituteWithTPOsResponse getInstituteWithTPOsById(Long instituteId);
    
    /**
     * Get all institute names and IDs only
     */
    List<InstituteNameResponse> getAllInstituteNames();
}
