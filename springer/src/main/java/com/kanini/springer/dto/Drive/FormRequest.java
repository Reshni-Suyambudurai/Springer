package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new form
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormRequest {

    @NotNull(message = "Drive ID is required")
    private Long driveId;

    @NotBlank(message = "Form name is required")
    @Size(max = 255, message = "Form name cannot exceed 255 characters")
    private String formName;

    private Boolean status = true;
}
