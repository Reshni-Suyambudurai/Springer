package com.kanini.springer.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.kanini.springer.repository.Hiring.UserRepository;

@Configuration
@RequiredArgsConstructor
public class UserDetailsServiceConfig {
    
    private final UserRepository userRepository;
    
    /**
     * Creates a UserDetailsService bean that Spring Security needs.
     * Tells Spring how to load users from YOUR database
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return email -> {
            // Find user in database with role eagerly fetched
            var user = userRepository.findByEmailWithRole(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
            
            // Convert to Spring Security's UserDetails format
            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .roles(user.getRole().getRoleName().toString())
                    .build();
        };
    }
}
