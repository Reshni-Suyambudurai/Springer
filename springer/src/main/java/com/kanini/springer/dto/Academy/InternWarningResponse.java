package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternWarningResponse {

    private Long warningId;
    private Long studentId;
    private String studentName;
    private String programName;
    private Integer batchNumber;
    private String issuedByName;
    private String warningType;
    private String severity;
    private String message;
    private Integer courseId;
    private String status;           // ACTIVE | ACKNOWLEDGED
    private String issuedAt;
    private String acknowledgedAt;
    private String acknowledgementComment;
}
