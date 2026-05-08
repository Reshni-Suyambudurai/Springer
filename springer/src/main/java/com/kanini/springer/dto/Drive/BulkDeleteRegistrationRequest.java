package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk deleting candidate registrations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteRegistrationRequest {

    @NotNull(message = "Registration IDs are required")
    @NotEmpty(message = "Registration IDs list cannot be empty")
    private List<Long> registrationIds;
}
