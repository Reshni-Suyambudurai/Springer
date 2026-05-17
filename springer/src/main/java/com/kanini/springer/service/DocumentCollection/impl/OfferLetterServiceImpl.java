package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateRequest;
import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateResponse;
import com.kanini.springer.dto.DocumentCollection.BulkOfferGenerateResponse.CandidateOfferResult;
import com.kanini.springer.dto.DocumentCollection.OfferLetterRequest;
import com.kanini.springer.dto.DocumentCollection.OfferLetterResponse;
import com.kanini.springer.entity.DocumentProcessing.OfferLetter;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.DocumentCollection.OfferLetterMapper;
import com.kanini.springer.repository.DocumentCollection.OfferLetterRepository;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.DocumentCollection.IOfferLetterService;
import com.kanini.springer.service.DocumentCollection.IVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
@Service
@RequiredArgsConstructor
public class OfferLetterServiceImpl implements IOfferLetterService {

    private static final String OFFER_FAILED = "FAILED";

    private final OfferLetterRepository offerRepository;
    private final CandidateRepository candidateRepository;
    private final HiringCycleRepository cycleRepository;
    private final OfferLetterMapper mapper;
    private final IVerificationService verificationService;

    @Override
    @Transactional
    public OfferLetterResponse generateOfferLetter(OfferLetterRequest request) {
        // Check duplicate
        if (offerRepository.findByCandidateId(request.getCandidateId()).isPresent()) {
            throw new ValidationException("Offer already exists for candidate ID: " + request.getCandidateId());
        }

        // Validate all documents are approved
        var completion = verificationService.getDocumentCompletionStatus(
                request.getCandidateId(), request.getCycleId());
        if (!completion.getIsOfferReady()) {
            throw new ValidationException(
                "Cannot generate offer: all documents must be approved. " +
                completion.getTotalApproved() + "/" + completion.getTotalRequired() + " approved, " +
                completion.getTotalPending() + " pending, " +
                completion.getTotalRejected() + " rejected"
            );
        }

        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + request.getCandidateId()));
        HiringCycle cycle = cycleRepository.findById(request.getCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle not found with ID: " + request.getCycleId()));

        OfferLetter offer = new OfferLetter();
        offer.setCandidate(candidate);
        offer.setCycle(cycle);
        offer.setIssueDate(java.time.LocalDate.now());
        offer.setResponse(Enums.OfferResponse.PENDING);

        OfferLetter saved = offerRepository.save(offer);

        candidate.setApplicationStage(Enums.ApplicationStage.OFFERED);
        candidateRepository.save(candidate);

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BulkOfferGenerateResponse bulkGenerateOfferLetters(BulkOfferGenerateRequest request) {
        List<CandidateOfferResult> results = new ArrayList<>();

        HiringCycle cycle = cycleRepository.findById(request.getCycleId()).orElse(null);
        if (cycle == null) {
            return BulkOfferGenerateResponse.builder()
                    .totalRequested(request.getCandidateIds().size())
                    .totalSuccess(0).totalSkipped(0)
                    .totalFailed(request.getCandidateIds().size())
                    .results(request.getCandidateIds().stream()
                            .map(id -> CandidateOfferResult.builder()
                                    .candidateId(id).status(OFFER_FAILED)
                                    .reason("Hiring cycle not found with ID: " + request.getCycleId())
                                    .build())
                            .toList())
                    .build();
        }

        for (Long candidateId : request.getCandidateIds()) {
            if (offerRepository.findByCandidateId(candidateId).isPresent()) {
                results.add(CandidateOfferResult.builder()
                        .candidateId(candidateId)
                        .status("SKIPPED")
                        .reason("Offer already exists for this candidate")
                        .build());
                continue;
            }

            Candidate candidate = candidateRepository.findById(candidateId).orElse(null);
            if (candidate == null) {
                results.add(CandidateOfferResult.builder()
                        .candidateId(candidateId)
                        .status(OFFER_FAILED)
                        .reason("Candidate not found")
                        .build());
                continue;
            }

            var completion = verificationService.getDocumentCompletionStatus(candidateId, request.getCycleId());
            if (!completion.getIsOfferReady()) {
                results.add(CandidateOfferResult.builder()
                        .candidateId(candidateId)
                        .candidateName(candidate.getFirstName() + " " + candidate.getLastName())
                        .status(OFFER_FAILED)
                        .reason("Documents not fully approved: " +
                                completion.getTotalApproved() + "/" + completion.getTotalRequired() + " approved")
                        .build());
                continue;
            }

            OfferLetter offer = new OfferLetter();
            offer.setCandidate(candidate);
            offer.setCycle(cycle);
            offer.setIssueDate(java.time.LocalDate.now());
            offer.setResponse(Enums.OfferResponse.PENDING);
            offerRepository.save(offer);

            candidate.setApplicationStage(Enums.ApplicationStage.OFFERED);
            candidateRepository.save(candidate);

            results.add(CandidateOfferResult.builder()
                    .candidateId(candidateId)
                    .candidateName(candidate.getFirstName() + " " + candidate.getLastName())
                    .status("SUCCESS")
                    .build());
        }

        long successCount = results.stream().filter(r -> "SUCCESS".equals(r.getStatus())).count();
        long skippedCount = results.stream().filter(r -> "SKIPPED".equals(r.getStatus())).count();
        long failedCount  = results.stream().filter(r -> OFFER_FAILED.equals(r.getStatus())).count();

        return BulkOfferGenerateResponse.builder()
                .totalRequested(request.getCandidateIds().size())
                .totalSuccess((int) successCount)
                .totalSkipped((int) skippedCount)
                .totalFailed((int) failedCount)
                .results(results)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OfferLetterResponse getOfferById(Long offerId) {
        OfferLetter offer = offerRepository.findByIdWithDetails(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with ID: " + offerId));
        return mapper.toResponse(offer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfferLetterResponse> getAllOffers(String offerResponse, Long cycleId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OfferLetter> offers;

        if (cycleId != null) {
            offers = offerRepository.findByCycleId(cycleId, pageable);
        } else if (offerResponse != null) {
            try {
                Enums.OfferResponse responseEnum = Enums.OfferResponse.valueOf(offerResponse.toUpperCase(java.util.Locale.ROOT));
                offers = offerRepository.findByResponse(responseEnum, pageable);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid offer response value: " + offerResponse, e);
            }
        } else {
            offers = offerRepository.findAllWithDetails(pageable);
        }

        return offers.stream().map(mapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OfferLetterResponse> getOfferReadyCandidates(Long cycleId) {
        // Only check SELECTED candidates — offer-ready candidates haven't been offered yet
        Set<Long> alreadyIssuedCandidateIds = new java.util.HashSet<>(offerRepository.findCandidateIdsByCycleId(cycleId));

        return candidateRepository.findByApplicationStage(Enums.ApplicationStage.SELECTED).stream()
                .filter(c -> !alreadyIssuedCandidateIds.contains(c.getCandidateId()))
                .filter(c -> {
                    var completion = verificationService.getOfferReadyStatus(
                            c.getCandidateId(), cycleId);
                    return completion;
                })
                .map(c -> OfferLetterResponse.builder()
                        .candidateId(c.getCandidateId())
                        .candidateName(c.getFirstName() + " " + c.getLastName())
                        .cycleId(cycleId)
                        .response(Enums.OfferResponse.PENDING.name())
                        .build())
                .toList();
    }
}
