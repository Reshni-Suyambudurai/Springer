package com.kanini.springer.mapper.Common;

import com.kanini.springer.dto.Common.FieldChangeDTO;
import com.kanini.springer.dto.Common.ManualOverrideResponse;
import com.kanini.springer.entity.utils.ManualOverride;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ManualOverrideMapper {
    
    /**
     * Convert ManualOverride entity to ManualOverrideResponse DTO
     */
    public ManualOverrideResponse toResponse(ManualOverride override) {
        if (override == null) {
            return null;
        }
        
        ManualOverrideResponse response = new ManualOverrideResponse();
        response.setOverrideId(override.getOverrideId());
        response.setEntityType(override.getEntityType() != null ? override.getEntityType().toString() : null);
        response.setEntityId(override.getEntityId());
        response.setOverrideReason(override.getOverrideReason());
        response.setCreatedAt(override.getCreatedAt());
        
        // Map User details
        if (override.getCreatedBy() != null) {
            response.setCreatedById(override.getCreatedBy().getUserId());
            response.setCreatedByName(override.getCreatedBy().getUsername());
        }
        
        // Map FieldChange to FieldChangeDTO
        if (override.getChanges() != null) {
            List<FieldChangeDTO> changeDTOs = override.getChanges().stream()
                    .map(change -> new FieldChangeDTO(
                            change.getField(),
                            change.getOld(),
                            change.getNewValue()
                    ))
                    .collect(Collectors.toList());
            response.setChanges(changeDTOs);
        } else {
            response.setChanges(new ArrayList<>());
        }
        
        return response;
    }
    
    /**
     * Convert list of ManualOverride entities to list of response DTOs
     */
    public List<ManualOverrideResponse> toResponseList(List<ManualOverride> overrides) {
        if (overrides == null) {
            return new ArrayList<>();
        }
        
        return overrides.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
