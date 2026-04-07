package com.kanini.springer.service.DocumentCollection;

import java.time.LocalDateTime;

public interface ITokenService {

    /**
     * Generate JWT token for document submission
     * @param candidateId candidate ID
     * @param cycleId hiring cycle ID
     * @param purpose TOKEN_PURPOSE
     * @param expiryDays days until expiration
     * @return JWT token string
     */
    String generateToken(Long candidateId, Long cycleId, String purpose, int expiryDays, String candidateEmail);

    /**
     * Generate JWT token for document submission with an exact expiry timestamp.
     * @param candidateId candidate ID
     * @param cycleId hiring cycle ID
     * @param purpose token purpose
     * @param expiryDate exact expiry timestamp
     * @param candidateEmail candidate email embedded for validation
     * @return JWT token string
     */
    String generateToken(Long candidateId, Long cycleId, String purpose, LocalDateTime expiryDate, String candidateEmail);

    /**
     * Generate scoped token for re-submitting specific rejected document
     * @param candidateId candidate ID
     * @param cycleId hiring cycle ID
     * @param documentTypeId rejected document type
     * @param rejectionReason reason for rejection
     * @return JWT token string
     */
    String generateResubmitToken(Long candidateId, Long cycleId, Long documentTypeId, String rejectionReason);

    /**
     * Validate JWT token and extract claims
     * @param token JWT token string
     * @return TokenClaims object
     * @throws com.kanini.springer.exception.ValidationException if token invalid or expired
     */
    TokenClaims validateToken(String token);

    /**
     * Check if token is valid without throwing exception
     * @param token JWT token string
     * @return true if valid, false otherwise
     */
    boolean isTokenValid(String token);

    /**
     * Revoke/blacklist a token
     * @param token JWT token to revoke
     */
    void revokeToken(String token);

    /**
     * Extract candidate ID from token without full validation
     * @param token JWT token string
     * @return candidateId or null if token malformed
     */
    Long extractCandidateId(String token);
}
