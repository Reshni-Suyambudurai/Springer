package com.kanini.springer.mapper.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.OfferLetterResponse;
import com.kanini.springer.entity.DocumentProcessing.OfferLetter;
import com.kanini.springer.entity.enums.Enums;
import org.springframework.stereotype.Component;

@Component
public class OfferLetterMapper {

    public OfferLetterResponse toResponse(OfferLetter entity) {
        if (entity == null) return null;

        OfferLetterResponse response = new OfferLetterResponse();
        response.setOfferId(entity.getOfferId());

        if (entity.getCandidate() != null) {
            response.setCandidateId(entity.getCandidate().getCandidateId());
            response.setCandidateName(
                buildName(entity.getCandidate().getFirstName(), entity.getCandidate().getLastName())
            );
        }

        if (entity.getCycle() != null) {
            response.setCycleId(entity.getCycle().getCycleId());
        }

        response.setIssueDate(entity.getIssueDate());
        response.setRespondedDate(entity.getRespondedDate());
        response.setResponse(entity.getResponse() != null
                ? entity.getResponse().name()
                : Enums.OfferResponse.PENDING.name());
        response.setDeclineReason(entity.getComment());

        return response;
    }

    private String buildName(String firstName, String lastName) {
        if (firstName == null) return lastName != null ? lastName : "Unknown";
        if (lastName == null) return firstName;
        return firstName + " " + lastName;
    }
}
