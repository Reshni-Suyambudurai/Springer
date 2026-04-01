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
public class OfferResponseResponse {

    private Long offerId;
    private Long candidateId;
    private String candidateName;
    private String response;
    private LocalDate respondedDate;
    private String declineReason;
}
