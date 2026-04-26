package com.kanini.springer.dto.Trainee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternCertificateResponse {
    private Long certificateId;
    private Long studentId;
    private String certificateName;
    private String issuer;
    private String issueDate;
    private String uploadedAt;
}
