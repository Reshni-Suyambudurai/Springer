package com.kanini.springer.dto.Trainee;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkInternActivationRequest {

    @NotEmpty(message = "At least one intern entry is required")
    @Valid
    private List<BulkInternEntry> interns;

    @Data
    public static class BulkInternEntry {
        private Long candidateId;
        private String candidateName;
        private String outlookEmail;
    }
}
