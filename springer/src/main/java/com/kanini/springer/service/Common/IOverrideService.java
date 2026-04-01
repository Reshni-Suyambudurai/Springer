package com.kanini.springer.service.Common;

import com.kanini.springer.dto.Common.ManualOverrideRequest;
import com.kanini.springer.dto.Common.ManualOverrideResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for manual override audit operations
 */
public interface IOverrideService {
    
    /**
     * Log a manual override
     * This method stores the override record in the database within a transaction
     */
    ManualOverrideResponse logOverride(ManualOverrideRequest request);
    
    /**
     * Get all manual overrides
     */
    List<ManualOverrideResponse> getAllOverrides();
    
    /**
     * Get all overrides from a specific date onwards
     */
    List<ManualOverrideResponse> getOverridesByDate(LocalDate fromDate);
    
    /**
     * Get all overrides by entity type
     */
    List<ManualOverrideResponse> getOverridesByEntityType(String entityType);
    
    /**
     * Get all overrides by entity type and entity ID
     */
    List<ManualOverrideResponse> getOverridesByEntityTypeAndEntityId(String entityType, Long entityId);
    
    /**
     * Get all overrides by user ID (who created the override)
     */
    List<ManualOverrideResponse> getOverridesByUserId(Long userId);
    
    /**
     * Generic method to detect changes between old and new entity states
     * This can be called by other services to detect field-level changes
     */
    <T> List<com.kanini.springer.dto.Common.FieldChangeDTO> detectChanges(T oldEntity, T newEntity);
}

