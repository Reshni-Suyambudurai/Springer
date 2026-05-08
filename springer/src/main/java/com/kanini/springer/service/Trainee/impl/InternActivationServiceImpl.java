package com.kanini.springer.service.Trainee.impl;

import com.kanini.springer.dto.Trainee.InternActivationRequest;
import com.kanini.springer.dto.Trainee.InternActivationResponse;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.Role;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.RoleName;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Hiring.RoleRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Trainee.IInternActivationService;
import com.kanini.springer.service.DocumentCollection.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternActivationServiceImpl implements IInternActivationService {

    private final CandidatesRepository candidatesRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final IEmailService emailService;

    @Override
    @Transactional
    public InternActivationResponse activateIntern(Long candidateId, InternActivationRequest request) {

        Candidate candidate = candidatesRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + candidateId));

        if (candidate.getUser() != null) {
            throw new ValidationException("Intern account already activated for: " + candidate.getEmail());
        }

        if (candidate.getApplicationStage() == null ||
                candidate.getApplicationStage() != com.kanini.springer.entity.enums.Enums.ApplicationStage.JOINED) {
            throw new ValidationException("Only JOINED candidates can be activated as interns");
        }

        // Validate outlook email is not already taken
        String outlookEmail = request.getOutlookEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(outlookEmail)) {
            throw new ValidationException("This email is already registered: " + outlookEmail);
        }

        Role internRole = roleRepository.findByRoleName(RoleName.INTERN)
                .orElseThrow(() -> new ResourceNotFoundException("INTERN role not found in DB"));

        String tempPassword = "Kanini@" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String fullName = candidate.getFirstName()
                + (candidate.getLastName() != null ? " " + candidate.getLastName() : "");

        // Create user with the outlook email as login
        User user = new User();
        user.setUsername(fullName);
        user.setEmail(outlookEmail);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setDepartment(candidate.getDepartment());
        user.setLocation("Training");
        user.setIsActive(true);
        user.setRole(internRole);
        User savedUser = userRepository.save(user);

        candidate.setUser(savedUser);
        candidatesRepository.save(candidate);

        // Send welcome email synchronously — if it fails, transaction is rolled back
        boolean emailSent = emailService.sendInternWelcomeEmail(outlookEmail, fullName, tempPassword);
        if (!emailSent) {
            throw new ValidationException(
                "Failed to send login credentials to '" + outlookEmail +
                "'. Please check that the email address is valid and try again."
            );
        }

        log.info("Intern account activated for candidate: {} with outlook email: {} (userId: {})",
                candidate.getEmail(), outlookEmail, savedUser.getUserId());

        return new InternActivationResponse(
                savedUser.getUserId(),
                outlookEmail,
                "Intern account activated. Login credentials sent to " + outlookEmail
        );
    }
}
