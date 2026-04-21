package com.kanini.springer.service.Trainee.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Trainee.InternProfileRequest;
import com.kanini.springer.dto.Trainee.InternProfileResponse;
import com.kanini.springer.entity.Academy.InternProfile;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.InternProfileRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Trainee.IInternProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternProfileServiceImpl implements IInternProfileService {

    private final InternProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final BatchAllocationRepository allocationRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public InternProfileResponse getProfileByStudentId(Long studentId) {
        // Find candidate linked to this student allocation
        return allocationRepository.findByStudentId(studentId)
                .map(allocation -> {
                    Long candidateId = allocation.getCandidate().getCandidateId();
                    // Find user linked to this candidate
                    return profileRepository.findAll().stream()
                            .filter(p -> p.getUser() != null &&
                                    p.getUser().getEmail() != null &&
                                    allocation.getCandidate().getEmail() != null &&
                                    p.getUser().getEmail().equalsIgnoreCase(allocation.getCandidate().getEmail()))
                            .findFirst()
                            .map(this::toResponse)
                            .orElse(new InternProfileResponse(null, null, null, Collections.emptyList(), null));
                })
                .orElse(new InternProfileResponse(null, null, null, Collections.emptyList(), null));
    }

    @Override
    @Transactional(readOnly = true)
    public InternProfileResponse getProfile(Long userId) {
        InternProfile profile = profileRepository.findByUser_UserId(userId)
                .orElse(null);

        if (profile == null) {
            // Return empty profile — intern hasn't filled it yet
            return new InternProfileResponse(null, userId, null, Collections.emptyList(), null);
        }

        return toResponse(profile);
    }

    @Override
    @Transactional
    public InternProfileResponse saveOrUpdateProfile(Long userId, InternProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        InternProfile profile = profileRepository.findByUser_UserId(userId)
                .orElse(new InternProfile());

        profile.setUser(user);
        profile.setBio(request.getBio());

        // Serialize profileLinks list to JSON string for storage
        try {
            String linksJson = request.getProfileLinks() != null
                    ? objectMapper.writeValueAsString(request.getProfileLinks())
                    : "[]";
            profile.setProfileLinks(linksJson);
        } catch (Exception e) {
            log.error("Failed to serialize profile links: {}", e.getMessage());
            profile.setProfileLinks("[]");
        }

        InternProfile saved = profileRepository.save(profile);
        return toResponse(saved);
    }

    private InternProfileResponse toResponse(InternProfile profile) {
        List<InternProfileResponse.ProfileLink> links = Collections.emptyList();
        try {
            if (profile.getProfileLinks() != null && !profile.getProfileLinks().isBlank()) {
                links = objectMapper.readValue(
                        profile.getProfileLinks(),
                        objectMapper.getTypeFactory().constructCollectionType(
                                List.class, InternProfileResponse.ProfileLink.class)
                );
            }
        } catch (Exception e) {
            log.error("Failed to deserialize profile links: {}", e.getMessage());
        }

        return new InternProfileResponse(
                profile.getProfileId(),
                profile.getUser().getUserId(),
                profile.getBio(),
                links,
                profile.getUpdatedAt() != null ? profile.getUpdatedAt().toString() : null
        );
    }
}
