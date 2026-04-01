package com.kanini.springer.dto.DocumentCollection;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfferResponseRequest {

    @NotNull(message = "Response is required")
    private String response; // ACCEPTED or DECLINED

    @NotNull(message = "Responded date is required")
    private LocalDate respondedDate;

    private String declineReason; // required only when DECLINED
}
