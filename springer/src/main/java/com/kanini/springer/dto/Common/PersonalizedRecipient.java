package com.kanini.springer.dto.Common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents one recipient in a personalized bulk email send.
 * Each recipient has their own unique fields that are substituted
 * into the template body as {{PLACEHOLDER}} tokens.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PersonalizedRecipient {

    /** Candidate email address */
    private String email;

    /** Candidate full name — substituted for {{CANDIDATE_NAME}} */
    private String candidateName;

    /** Unique registration code for this drive — substituted for {{REGISTRATION_CODE}} */
    private String registrationCode;

    /** Batch time string (e.g. "09:00 AM") — substituted for {{BATCH_TIME}} */
    private String batchTime;

    /** Round number (e.g. "1") — substituted for {{ROUND_NO}}, overrides shared if set */
    private String roundNo;
}
