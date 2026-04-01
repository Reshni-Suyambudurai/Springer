package com.kanini.springer.service.Hiring;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteContactRequest;
import com.kanini.springer.dto.Hiring.InstituteContactResponse;

import java.util.List;

public interface IInstituteTPOService {
    
    /**
     * Create a single TPO/Contact
     */
    InstituteContactResponse createContact(InstituteContactRequest request);
    
    /**
     * Bulk insert TPOs for a specific institute
     */
    BulkInsertResponse<InstituteContactResponse> bulkCreateContacts(Long instituteId, List<InstituteContactRequest> requests);
    
    /**
     * Bulk insert TPOs across multiple institutes
     * Each request must contain instituteId
     */
    BulkInsertResponse<InstituteContactResponse> bulkCreateAllContacts(List<InstituteContactRequest> requests);
    
    /**
     * Get all TPOs/Contacts by institute ID
     */
    List<InstituteContactResponse> getContactsByInstituteId(Long instituteId);
    
    /**
     * Get TPO/Contact by ID
     */
    InstituteContactResponse getContactById(Integer tpoId);
    
    /**
     * Update TPO/Contact (PATCH - partial update)
     */
    InstituteContactResponse updateContact(Integer tpoId, InstituteContactRequest request);
    
    /**
     * Soft delete TPO/Contact (set tpoStatus to INACTIVE)
     */
    void deleteContact(Integer tpoId);
}
