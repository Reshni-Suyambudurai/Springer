package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.BulkOfferResponseRequest;
import com.kanini.springer.dto.DocumentCollection.OfferResponseRequest;
import com.kanini.springer.dto.DocumentCollection.OfferResponseResponse;
import com.kanini.springer.entity.DocumentProcessing.OfferLetter;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.DocumentCollection.OfferLetterRepository;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.service.DocumentCollection.IOfferResponseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfferResponseServiceImpl implements IOfferResponseService {

    private final OfferLetterRepository offerRepository;
    private final CandidateRepository candidateRepository;

    @Override
    @Transactional
    public OfferResponseResponse recordResponse(Long offerId, OfferResponseRequest request) {
        OfferLetter offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with ID: " + offerId));

        if (offer.getResponse() != Enums.OfferResponse.PENDING) {
            throw new ValidationException("Offer is already " + offer.getResponse());
        }

        Enums.OfferResponse responseEnum;
        try {
            responseEnum = Enums.OfferResponse.valueOf(request.getResponse().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid response value: " + request.getResponse() + ". Must be ACCEPTED or DECLINED");
        }

        if (responseEnum == Enums.OfferResponse.DECLINED &&
                (request.getDeclineReason() == null || request.getDeclineReason().trim().isEmpty())) {
            throw new ValidationException("Decline reason is required when response is DECLINED");
        }

        offer.setResponse(responseEnum);
        offer.setComment(request.getDeclineReason());
        offer.setRespondedDate(request.getRespondedDate());
        offerRepository.save(offer);

        Candidate candidate = offer.getCandidate();
        candidate.setApplicationStage(responseEnum == Enums.OfferResponse.ACCEPTED
            ? Enums.ApplicationStage.ACCEPTED
                : Enums.ApplicationStage.DROPPED);
        candidateRepository.save(candidate);

        return buildResponse(offer);
    }

    @Override
    @Transactional
    public List<OfferResponseResponse> bulkRecordResponse(List<BulkOfferResponseRequest> requests) {
        return requests.stream().map(req -> {
            OfferLetter offer = offerRepository.findById(req.getOfferId())
                    .orElseThrow(() -> new ResourceNotFoundException("Offer not found with ID: " + req.getOfferId()));

            if (offer.getResponse() != Enums.OfferResponse.PENDING) {
                throw new ValidationException("Offer ID " + req.getOfferId() + " is already " + offer.getResponse());
            }

            Enums.OfferResponse responseEnum;
            try {
                responseEnum = Enums.OfferResponse.valueOf(req.getResponse().toUpperCase(java.util.Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid response value: " + req.getResponse() + " for offer ID: " + req.getOfferId());
            }

            if (responseEnum == Enums.OfferResponse.DECLINED &&
                    (req.getDeclineReason() == null || req.getDeclineReason().trim().isEmpty())) {
                throw new ValidationException("Decline reason is required for offer ID: " + req.getOfferId());
            }

            offer.setResponse(responseEnum);
            offer.setComment(req.getDeclineReason());
            offer.setRespondedDate(req.getRespondedDate());
            offerRepository.save(offer);

            Candidate candidate = offer.getCandidate();
            candidate.setApplicationStage(responseEnum == Enums.OfferResponse.ACCEPTED
                    ? Enums.ApplicationStage.ACCEPTED
                    : Enums.ApplicationStage.DROPPED);
            candidateRepository.save(candidate);

            return buildResponse(offer);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OfferResponseResponse getCandidateOffer(Long candidateId) {
        OfferLetter offer = offerRepository.findByCandidateId(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("No offer found for candidate ID: " + candidateId));
        return buildResponse(offer);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private OfferResponseResponse buildResponse(OfferLetter offer) {
        Candidate candidate = offer.getCandidate();
        String name = candidate != null
                ? candidate.getFirstName() + " " + candidate.getLastName() : "N/A";
        return OfferResponseResponse.builder()
                .offerId(offer.getOfferId())
                .candidateId(candidate != null ? candidate.getCandidateId() : null)
                .candidateName(name)
                .response(offer.getResponse().name())
                .respondedDate(offer.getRespondedDate())
                .declineReason(offer.getComment())
                .build();
    }
}
