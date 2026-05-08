package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a form
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormUpdateRequest {

    @Size(max = 255, message = "Form name cannot exceed 255 characters")
    private String formName;

    private Boolean status;
}
