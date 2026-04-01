package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityValidationResult {
    private boolean eligible;
    private List<String> failedReasons = new ArrayList<>();
    
    public void addReason(String reason) {
        if (failedReasons == null) {
            failedReasons = new ArrayList<>();
        }
        failedReasons.add(reason);
    }
}
