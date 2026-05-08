package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Trainee.InternActivationRequest;
import com.kanini.springer.dto.Trainee.InternActivationResponse;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.Role;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.RoleName;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Hiring.RoleRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.DocumentCollection.IEmailService;
import com.kanini.springer.service.Trainee.impl.InternActivationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link InternActivationServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class InternActivationServiceImplTest {

    @InjectMocks
    private InternActivationServiceImpl service;

    @Mock private CandidatesRepository candidatesRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private IEmailService emailService;

    // =========================================================================
    // Helpers
    // =========================================================================

    private Candidate buildJoinedCandidate(Long id) {
        Candidate c = new Candidate();
        c.setCandidateId(id);
        c.setFirstName("Ravi");
        c.setLastName("Kumar");
        c.setEmail("ravi.kumar@gmail.com");
        c.setDepartment("CSE");
        c.setApplicationStage(ApplicationStage.JOINED);
        c.setUser(null);
        return c;
    }

    private InternActivationRequest buildRequest(String outlookEmail) {
        InternActivationRequest req = new InternActivationRequest();
        req.setOutlookEmail(outlookEmail);
        return req;
    }

    private Role buildInternRole() {
        Role role = new Role();
        role.setRoleId(3L);
        role.setRoleName(RoleName.INTERN);
        return role;
    }

    private User buildSavedUser(Long userId, String email) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail(email);
        user.setUsername("Ravi Kumar");
        user.setIsActive(true);
        return user;
    }

    // =========================================================================
    // activateIntern
    // =========================================================================

    @Nested
    @DisplayName("activateIntern")
    class ActivateIntern {

        @Test
        @DisplayName("success - activates JOINED candidate and returns response")
        void activateIntern_joinedCandidate_success() {
            Candidate candidate = buildJoinedCandidate(1L);
            InternActivationRequest request = buildRequest("ravi.kumar@kanini.com");
            Role internRole = buildInternRole();
            User savedUser = buildSavedUser(10L, "ravi.kumar@kanini.com");

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(userRepository.existsByEmail("ravi.kumar@kanini.com")).thenReturn(false);
            when(roleRepository.findByRoleName(RoleName.INTERN)).thenReturn(Optional.of(internRole));
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(candidate);
            when(emailService.sendInternWelcomeEmail(anyString(), anyString(), anyString())).thenReturn(true);

            InternActivationResponse result = service.activateIntern(1L, request);

            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(10L);
            assertThat(result.getEmail()).isEqualTo("ravi.kumar@kanini.com");
            assertThat(result.getMessage()).contains("activated");
            verify(userRepository).save(any(User.class));
            verify(emailService).sendInternWelcomeEmail(eq("ravi.kumar@kanini.com"), anyString(), anyString());
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when candidate not found")
        void activateIntern_candidateNotFound_throwsNotFound() {
            when(candidatesRepository.findById(999L)).thenReturn(Optional.empty());
            InternActivationRequest req = buildRequest("test@kanini.com");
            assertThatThrownBy(() -> service.activateIntern(999L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("failure - throws ValidationException when intern already activated")
        void activateIntern_alreadyActivated_throwsValidation() {
            Candidate candidate = buildJoinedCandidate(1L);
            candidate.setUser(buildSavedUser(5L, "existing@kanini.com"));
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(candidate));
            InternActivationRequest req = buildRequest("new@kanini.com");
            assertThatThrownBy(() -> service.activateIntern(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already activated");
        }

        @Test
        @DisplayName("failure - throws ValidationException when candidate is not JOINED")
        void activateIntern_notJoined_throwsValidation() {
            Candidate candidate = buildJoinedCandidate(1L);
            candidate.setApplicationStage(ApplicationStage.SHORTLISTED);
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(candidate));
            InternActivationRequest req = buildRequest("test@kanini.com");
            assertThatThrownBy(() -> service.activateIntern(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("JOINED");
        }

        @Test
        @DisplayName("failure - throws ValidationException when outlook email already registered")
        void activateIntern_emailAlreadyTaken_throwsValidation() {
            Candidate candidate = buildJoinedCandidate(1L);
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(userRepository.existsByEmail("taken@kanini.com")).thenReturn(true);
            InternActivationRequest req = buildRequest("taken@kanini.com");
            assertThatThrownBy(() -> service.activateIntern(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already registered");
        }

        @Test
        @DisplayName("failure - throws ValidationException when INTERN role not found in DB")
        void activateIntern_internRoleNotFound_throwsNotFound() {
            Candidate candidate = buildJoinedCandidate(1L);
            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(userRepository.existsByEmail("ravi@kanini.com")).thenReturn(false);
            when(roleRepository.findByRoleName(RoleName.INTERN)).thenReturn(Optional.empty());
            InternActivationRequest req = buildRequest("ravi@kanini.com");
            assertThatThrownBy(() -> service.activateIntern(1L, req))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("INTERN role");
        }

        @Test
        @DisplayName("failure - throws ValidationException when email sending fails")
        void activateIntern_emailFails_throwsValidation() {
            Candidate candidate = buildJoinedCandidate(1L);
            Role internRole = buildInternRole();
            User savedUser = buildSavedUser(10L, "ravi@kanini.com");

            when(candidatesRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(userRepository.existsByEmail("ravi@kanini.com")).thenReturn(false);
            when(roleRepository.findByRoleName(RoleName.INTERN)).thenReturn(Optional.of(internRole));
            when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(savedUser);
            when(candidatesRepository.save(any(Candidate.class))).thenReturn(candidate);
            when(emailService.sendInternWelcomeEmail(anyString(), anyString(), anyString())).thenReturn(false);

            InternActivationRequest req = buildRequest("ravi@kanini.com");
            assertThatThrownBy(() -> service.activateIntern(1L, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Failed to send");
        }
    }
}
