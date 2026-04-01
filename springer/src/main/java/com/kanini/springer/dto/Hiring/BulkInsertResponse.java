package com.kanini.springer.dto.Hiring;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkInsertResponse<T> {
    
    private List<T> successfulInserts = new ArrayList<>();
    private List<String> errorMessages = new ArrayList<>();
    private int totalProcessed;
    private int successCount;
    private int failureCount;
}
