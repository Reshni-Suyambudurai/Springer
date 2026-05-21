package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.DocumentCollection.OfferLetterRequest;
import com.kanini.springer.dto.DocumentCollection.OfferLetterResponse;
import com.kanini.springer.dto.DocumentCollection.DocumentCompletionResponse;
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
import com.kanini.springer.service.DocumentCollection.IVerificationService;
import com.kanini.springer.service.DocumentCollection.impl.OfferLetterServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OfferLetterServiceImplTest {

    @InjectMocks private OfferLetterServiceImpl service;
    @Mock private OfferLetterRepository offerRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private HiringCycleRepository cycleRepository;
    @Mock private OfferLetterMapper mapper;
    @Mock private IVerificationService verificationService;

    private DocumentCompletionResponse buildCompletion(boolean offerReady, int approved, int required) {
        DocumentCompletionResponse r = new DocumentCompletionResponse();
        r.setIsOfferReady(offerReady);
        r.setTotalApproved(approved);
        r.setTotalRequired(required);
        r.setTotalPending(required - approved);
        r.setTotalRejected(0);
        return r;
    }

    private OfferLetterRequest buildRequest(Long candidateId, Long cycleId) {
        OfferLetterRequest req = new OfferLetterRequest();
        req.setCandidateId(candidateId);
        req.setCycleId(cycleId);
        return req;
    }

    @Nested @DisplayName("generateOfferLetter")
    class GenerateOffer {

        @Test @DisplayName("success - generates offer when all documents approved")
        void generate_allDocsApproved_success() {
            Candidate candidate = new Candidate();
            candidate.setCandidateId(1L);
            candidate.setFirstName("Ravi");
            candidate.setLastName("Kumar");
            HiringCycle cycle = new HiringCycle(); cycle.setCycleId(1L);
            OfferLetter saved = new OfferLetter();
            OfferLetterResponse response = OfferLetterResponse.builder().candidateId(1L).build();

            when(offerRepository.findByCandidateId(1L)).thenReturn(Optional.empty());
            when(verificationService.getDocumentCompletionStatus(1L, 1L)).thenReturn(buildCompletion(true, 3, 3));
            when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(offerRepository.save(any())).thenReturn(saved);
            when(candidateRepository.save(any())).thenReturn(candidate);
            when(mapper.toResponse(saved)).thenReturn(response);

            OfferLetterResponse result = service.generateOfferLetter(buildRequest(1L, 1L));
            assertThat(result).isNotNull();
            verify(offerRepository).save(any());
        }

        @Test @DisplayName("failure - throws ValidationException when offer already exists")
        void generate_offerAlreadyExists_throwsValidation() {
            OfferLetter existing = new OfferLetter();
            when(offerRepository.findByCandidateId(1L)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> service.generateOfferLetter(buildRequest(1L, 1L)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Offer already exists");
        }

        @Test @DisplayName("failure - throws ValidationException when documents not fully approved")
        void generate_docsNotApproved_throwsValidation() {
            when(offerRepository.findByCandidateId(1L)).thenReturn(Optional.empty());
            when(verificationService.getDocumentCompletionStatus(1L, 1L)).thenReturn(buildCompletion(false, 2, 3));

            assertThatThrownBy(() -> service.generateOfferLetter(buildRequest(1L, 1L)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("all documents must be approved");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when candidate not found")
        void generate_candidateNotFound_throwsNotFound() {
            when(offerRepository.findByCandidateId(999L)).thenReturn(Optional.empty());
            when(verificationService.getDocumentCompletionStatus(999L, 1L)).thenReturn(buildCompletion(true, 3, 3));
            when(candidateRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.generateOfferLetter(buildRequest(999L, 1L)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getOfferById")
    class GetById {

        @Test @DisplayName("success - returns offer for valid ID")
        void getById_found_returnsResponse() {
            OfferLetter offer = new OfferLetter();
            OfferLetterResponse response = OfferLetterResponse.builder().candidateId(1L).build();

            when(offerRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(offer));
            when(mapper.toResponse(offer)).thenReturn(response);

            assertThat(service.getOfferById(1L)).isNotNull();
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void getById_notFound_throwsNotFound() {
            when(offerRepository.findByIdWithDetails(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getOfferById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
