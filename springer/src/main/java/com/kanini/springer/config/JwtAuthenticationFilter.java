package com.kanini.springer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Skip JWT validation for authentication endpoints
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        final String authorizationHeader = request.getHeader("Authorization");
        
        String email = null;
        String jwt = null;
        
        // Extract JWT token from Authorization header
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                email = jwtUtil.extractUsername(jwt);
            } catch (ExpiredJwtException e) {
                // Token has expired
                logger.error("JWT Token has expired: " + e.getMessage());
                sendUnauthorizedResponse(response, "Token expired");
                return;
            } catch (SignatureException e) {
                // Invalid token signature
                logger.error("Invalid JWT signature: " + e.getMessage());
                sendUnauthorizedResponse(response, "Invalid token signature");
                return;
            } catch (MalformedJwtException e) {
                // Token is malformed
                logger.error("Malformed JWT token: " + e.getMessage());
                sendUnauthorizedResponse(response, "Malformed token");
                return;
            } catch (Exception e) {
                // Other JWT-related errors
                logger.error("JWT Token extraction failed: " + e.getMessage());
                sendUnauthorizedResponse(response, "Invalid token");
                return;
            }
        }
        
        // Validate token and set authentication
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
            
            try {
                if (jwtUtil.validateToken(jwt, email)) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (ExpiredJwtException e) {
                // Token expired during validation
                logger.error("JWT Token has expired during validation: " + e.getMessage());
                sendUnauthorizedResponse(response, "Token expired");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Send unauthorized response with structured JSON format
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        ApiResponse<Object> apiResponse = new ApiResponse<>(false, message, null);
        
        ObjectMapper objectMapper = new ObjectMapper();
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        response.getWriter().flush();
    }
}
