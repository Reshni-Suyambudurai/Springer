package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.BulkOfferResponseRequest;
import com.kanini.springer.dto.DocumentCollection.OfferResponseRequest;
import com.kanini.springer.dto.DocumentCollection.OfferResponseResponse;

import java.util.List;

public interface IOfferResponseService {

    OfferResponseResponse recordResponse(Long offerId, OfferResponseRequest request);

    List<OfferResponseResponse> bulkRecordResponse(List<BulkOfferResponseRequest> requests);

    OfferResponseResponse getCandidateOffer(Long candidateId);

    // Allowed only when candidate is still ACCEPTED (not yet JOINED/NOT_JOINED in academy)
    OfferResponseResponse updateResponse(Long offerId, OfferResponseRequest request);
}
