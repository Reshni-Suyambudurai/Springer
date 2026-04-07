package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExcelUploadResponse {
    private int savedCount;
    private int failedCount;
    private int totalRows;
    private List<String> errors; // row-level error messages e.g. "Row 3: Student not found"
}
