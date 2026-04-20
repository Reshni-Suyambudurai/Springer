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
            // Fallback: pick first match by email (used only by Spring Security internals, not JWT filter)
            var users = userRepository.findAllByEmailWithRole(email);
            if (users.isEmpty()) {
                throw new UsernameNotFoundException("User not found with email: " + email);
            }
            var user = users.get(0);
            
            // Convert to Spring Security's UserDetails format
            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPassword())
                    .roles(user.getRole().getRoleName().toString())
                    .build();
        };
    }
}
