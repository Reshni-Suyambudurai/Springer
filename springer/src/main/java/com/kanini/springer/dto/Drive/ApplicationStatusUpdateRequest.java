package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating application status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusUpdateRequest {
    
    private String applicationStatus; // required - new status
}
