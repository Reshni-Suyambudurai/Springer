package com.kanini.springer.Testing.UnitTesting;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Trainee.InternProfileRequest;
import com.kanini.springer.dto.Trainee.InternProfileResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.InternProfile;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.InternProfileRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Trainee.impl.InternProfileServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link InternProfileServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class InternProfileServiceImplTest {

    @InjectMocks
    private InternProfileServiceImpl service;

    @Mock private InternProfileRepository profileRepository;
    @Mock private UserRepository userRepository;
    @Mock private BatchAllocationRepository allocationRepository;
    @Spy  private ObjectMapper objectMapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private User buildUser(Long userId) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail("intern@kanini.com");
        user.setUsername("Ravi Kumar");
        return user;
    }

    private InternProfile buildProfile(Long profileId, Long userId) {
        InternProfile profile = new InternProfile();
        profile.setProfileId(profileId);
        profile.setUser(buildUser(userId));
        profile.setBio("Passionate Java developer");
        profile.setProfileLinks("[{\"platform\":\"LinkedIn\",\"url\":\"https://linkedin.com/in/ravi\"}]");
        return profile;
    }

    private InternProfileRequest buildRequest() {
        InternProfileRequest req = new InternProfileRequest();
        req.setBio("Passionate Java developer");
        InternProfileRequest.ProfileLink link = new InternProfileRequest.ProfileLink();
        link.setPlatform("LinkedIn");
        link.setUrl("https://linkedin.com/in/ravi");
        req.setProfileLinks(List.of(link));
        return req;
    }

    // =========================================================================
    // getProfile
    // =========================================================================

    @Nested
    @DisplayName("getProfile")
    class GetProfile {

        @Test
        @DisplayName("success - returns profile for existing user")
        void getProfile_found_returnsResponse() {
            InternProfile profile = buildProfile(1L, 10L);
            when(profileRepository.findByUser_UserId(10L)).thenReturn(Optional.of(profile));

            InternProfileResponse result = service.getProfile(10L);

            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(10L);
            assertThat(result.getBio()).isEqualTo("Passionate Java developer");
            assertThat(result.getProfileLinks()).hasSize(1);
        }

        @Test
        @DisplayName("success - returns empty profile when intern has not filled it yet")
        void getProfile_notFound_returnsEmptyProfile() {
            when(profileRepository.findByUser_UserId(10L)).thenReturn(Optional.empty());

            InternProfileResponse result = service.getProfile(10L);

            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(10L);
            assertThat(result.getBio()).isNull();
            assertThat(result.getProfileLinks()).isEmpty();
        }
    }

    // =========================================================================
    // getProfileByStudentId
    // =========================================================================

    @Nested
    @DisplayName("getProfileByStudentId")
    class GetProfileByStudentId {

        @Test
        @DisplayName("success - returns empty profile when student has no allocation")
        void getProfileByStudentId_noAllocation_returnsEmpty() {
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.empty());

            InternProfileResponse result = service.getProfileByStudentId(101L);

            assertThat(result).isNotNull();
            assertThat(result.getBio()).isNull();
            assertThat(result.getProfileLinks()).isEmpty();
        }

        @Test
        @DisplayName("success - returns empty profile when no matching profile found")
        void getProfileByStudentId_noMatchingProfile_returnsEmpty() {
            Candidate candidate = new Candidate();
            candidate.setCandidateId(10L);
            candidate.setEmail("intern@kanini.com");

            BatchAllocation alloc = new BatchAllocation();
            alloc.setStudentId(101L);
            alloc.setCandidate(candidate);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(profileRepository.findAll()).thenReturn(Collections.emptyList());

            InternProfileResponse result = service.getProfileByStudentId(101L);

            assertThat(result).isNotNull();
            assertThat(result.getBio()).isNull();
        }
    }

    // =========================================================================
    // saveOrUpdateProfile
    // =========================================================================

    @Nested
    @DisplayName("saveOrUpdateProfile")
    class SaveOrUpdateProfile {

        @Test
        @DisplayName("success - creates new profile when none exists")
        void saveOrUpdateProfile_newProfile_createsSuccessfully() {
            User user = buildUser(10L);
            InternProfileRequest request = buildRequest();
            InternProfile saved = buildProfile(1L, 10L);

            when(userRepository.findById(10L)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser_UserId(10L)).thenReturn(Optional.empty());
            when(profileRepository.save(any(InternProfile.class))).thenReturn(saved);

            InternProfileResponse result = service.saveOrUpdateProfile(10L, request);

            assertThat(result).isNotNull();
            assertThat(result.getBio()).isEqualTo("Passionate Java developer");
            verify(profileRepository).save(any(InternProfile.class));
        }

        @Test
        @DisplayName("success - updates existing profile")
        void saveOrUpdateProfile_existingProfile_updatesSuccessfully() {
            User user = buildUser(10L);
            InternProfile existing = buildProfile(1L, 10L);
            InternProfileRequest request = buildRequest();
            request.setBio("Updated bio");
            InternProfile updated = buildProfile(1L, 10L);
            updated.setBio("Updated bio");

            when(userRepository.findById(10L)).thenReturn(Optional.of(user));
            when(profileRepository.findByUser_UserId(10L)).thenReturn(Optional.of(existing));
            when(profileRepository.save(any(InternProfile.class))).thenReturn(updated);

            InternProfileResponse result = service.saveOrUpdateProfile(10L, request);

            assertThat(result.getBio()).isEqualTo("Updated bio");
            verify(profileRepository).save(any(InternProfile.class));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when user not found")
        void saveOrUpdateProfile_userNotFound_throwsNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.saveOrUpdateProfile(999L, buildRequest()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }
}
