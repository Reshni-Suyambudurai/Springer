package com.kanini.springer.service.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenClaims {

    private Long candidateId;
    private Long cycleId;
    private Long documentTypeId;
    private String purpose;
    private LocalDateTime expiryDate;
    private String rejectionReason;
    private String candidateEmail;
}
