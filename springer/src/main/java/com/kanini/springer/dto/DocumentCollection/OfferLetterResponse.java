package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfferLetterResponse {

    private Long offerId;
    private Long candidateId;
    private String candidateName;
    private Long cycleId;
    private LocalDate issueDate;
    private String response;       // PENDING / ACCEPTED / DECLINED
    private LocalDate respondedDate;
    private String declineReason;
    private String applicationStage; // candidate's current stage — used to decide if offer is editable
}
