package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for form entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormResponse {

    private Long formId;
    private Long driveId;
    private String driveName;
    private String formName;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
