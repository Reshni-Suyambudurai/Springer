package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateRequest;
import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateResponse;
import com.kanini.springer.dto.DocumentCollection.OfferLetterRequest;
import com.kanini.springer.dto.DocumentCollection.OfferLetterResponse;

import java.util.List;

public interface IOfferLetterService {

    OfferLetterResponse generateOfferLetter(OfferLetterRequest request);

    BulkOfferGenerateResponse bulkGenerateOfferLetters(BulkOfferGenerateRequest request);

    OfferLetterResponse getOfferById(Long offerId);

    List<OfferLetterResponse> getAllOffers(String offerResponse, Long cycleId, int page, int size);

    List<OfferLetterResponse> getOfferReadyCandidates(Long cycleId);
}
