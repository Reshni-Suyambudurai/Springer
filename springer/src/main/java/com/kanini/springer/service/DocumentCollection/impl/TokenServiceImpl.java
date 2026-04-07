package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.service.DocumentCollection.ITokenService;
import com.kanini.springer.service.DocumentCollection.TokenClaims;
import com.kanini.springer.exception.ValidationException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import javax.crypto.SecretKey;

@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements ITokenService {

    @Value("${app.jwt.secret:your-secret-key-min-256-chars-long-for-hs256-algorithm-min-32-bytes}")
    private String jwtSecret;

    @Value("${app.jwt.expiration.days:7}")
    private int defaultExpiryDays;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    @Override
    public String generateToken(Long candidateId, Long cycleId, String purpose, int expiryDays, String candidateEmail) {
        try {
            Date expiryDate = java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(expiryDays));
            return Jwts.builder()
                .subject("candidate_submission_" + candidateId)
                .claim("candidateId", candidateId)
                .claim("cycleId", cycleId)
                .claim("purpose", purpose)
                .claim("candidateEmail", candidateEmail)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
        } catch (Exception e) {
            throw new ValidationException("Failed to generate JWT token: " + e.getMessage());
        }
    }

    @Override
    public String generateToken(Long candidateId, Long cycleId, String purpose, LocalDateTime expiryDate, String candidateEmail) {
        try {
            Date tokenExpiryDate = java.sql.Timestamp.valueOf(expiryDate);
            return Jwts.builder()
                .subject("candidate_submission_" + candidateId)
                .claim("candidateId", candidateId)
                .claim("cycleId", cycleId)
                .claim("purpose", purpose)
                .claim("candidateEmail", candidateEmail)
                .issuedAt(new Date())
                .expiration(tokenExpiryDate)
                .signWith(getSigningKey())
                .compact();
        } catch (Exception e) {
            throw new ValidationException("Failed to generate JWT token: " + e.getMessage());
        }
    }

    @Override
    public String generateResubmitToken(Long candidateId, Long cycleId, Long documentTypeId, String rejectionReason) {
        try {
            Date expiryDate = java.sql.Timestamp.valueOf(LocalDateTime.now().plusDays(defaultExpiryDays));
            return Jwts.builder()
                .subject("document_resubmit_" + candidateId + "_" + documentTypeId)
                .claim("candidateId", candidateId)
                .claim("cycleId", cycleId)
                .claim("documentTypeId", documentTypeId)
                .claim("purpose", "RESUBMIT")
                .claim("rejectionReason", rejectionReason)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
        } catch (Exception e) {
            throw new ValidationException("Failed to generate resubmit token: " + e.getMessage());
        }
    }

    @Override
    public TokenClaims validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

            LocalDateTime expiryDate = claims.getExpiration().toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

            return new TokenClaims(
                ((Number) claims.get("candidateId")).longValue(),
                ((Number) claims.get("cycleId")).longValue(),
                claims.get("documentTypeId") != null ? ((Number) claims.get("documentTypeId")).longValue() : null,
                (String) claims.get("purpose"),
                expiryDate,
                (String) claims.get("rejectionReason"),
                (String) claims.get("candidateEmail")
            );
        } catch (JwtException e) {
            throw new ValidationException("Invalid or expired token: " + e.getMessage());
        } catch (Exception e) {
            throw new ValidationException("Token validation failed: " + e.getMessage());
        }
    }

    @Override
    public boolean isTokenValid(String token) {
        try {
            validateToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void revokeToken(String token) {
        // TODO: Implement token blacklist in cache
    }

    @Override
    public Long extractCandidateId(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
            Object candidateId = claims.get("candidateId");
            return candidateId != null ? ((Number) candidateId).longValue() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
