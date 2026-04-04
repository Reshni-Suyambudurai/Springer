package com.kanini.springer.Testing.UnitTesting;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.RoundTemplateRequest;
import com.kanini.springer.dto.Drive.RoundTemplateResponse;
import com.kanini.springer.dto.Drive.RoundTemplateUpdateRequest;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.RoundTemplateMapper;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.impl.RoundTemplateServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link RoundTemplateServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 * Each service method has a dedicated {@link Nested} class
 * with positive (happy-path) and negative (error-path) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class RoundTemplateServiceImplTest {

    @InjectMocks
    private RoundTemplateServiceImpl service;

    @Mock
    private RoundTemplateRepository roundTemplateRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoundTemplateMapper mapper;

    @Mock
    private ObjectMapper objectMapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private User buildUser(Long id) {
        User user = new User();
        user.setUserId(id);
        user.setUsername("testuser");
        return user;
    }

    private RoundTemplate buildRoundTemplate(Long id, Integer roundNo, String name, Boolean isActive) {
        RoundTemplate rt = new RoundTemplate();
        rt.setRoundConfigId(id);
        rt.setRoundNo(roundNo);
        rt.setRoundName(name);
        rt.setOutoffScore(100);
        rt.setMinScore(60);
        rt.setWeightage(40);
        rt.setIsActive(isActive);
        rt.setCreatedAt(LocalDateTime.now());
        rt.setCreatedBy(buildUser(1L));
        return rt;
    }

    private RoundTemplateResponse buildResponse(Long id, Integer roundNo, String name, Boolean isActive) {
        RoundTemplateResponse r = new RoundTemplateResponse();
        r.setRoundConfigId(id);
        r.setRoundNo(roundNo);
        r.setRoundName(name);
        r.setOutoffScore(100);
        r.setMinScore(60);
        r.setWeightage(40);
        r.setIsActive(isActive);
        r.setCreatedBy(1L);
        r.setCreatedByName("testuser");
        return r;
    }

    private RoundTemplateRequest buildValidRequest() {
        RoundTemplateRequest req = new RoundTemplateRequest();
        req.setRoundNo(1);
        req.setRoundName("Technical Round");
        req.setOutoffScore(100);
        req.setMinScore(60);
        req.setWeightage(40);
        req.setCreatedBy(1L);
        return req;
    }

    // =========================================================================
    // createRoundTemplate
    // =========================================================================

    @Nested
    @DisplayName("createRoundTemplate")
    class CreateRoundTemplate {

        @Test
        @DisplayName("success - creates round template with valid inputs")
        void createRoundTemplate_valid_success() {
            RoundTemplateRequest request = buildValidRequest();
            RoundTemplate entity = buildRoundTemplate(1L, 1, "Technical Round", true);
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical Round", true);

            when(mapper.toEntity(request)).thenReturn(entity);
            when(roundTemplateRepository.save(entity)).thenReturn(entity);
            when(mapper.toResponse(entity)).thenReturn(response);

            RoundTemplateResponse result = service.createRoundTemplate(request);

            assertThat(result).isNotNull();
            assertThat(result.getRoundConfigId()).isEqualTo(1L);
            assertThat(result.getRoundName()).isEqualTo("Technical Round");
            assertThat(result.getIsActive()).isTrue();
            verify(roundTemplateRepository).save(entity);
        }

        @Test
        @DisplayName("failure - throws ValidationException when roundNo is null")
        void createRoundTemplate_nullRoundNo_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setRoundNo(null);

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round number is required");

            verify(roundTemplateRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when roundName is null")
        void createRoundTemplate_nullRoundName_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setRoundName(null);

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round name is required");

            verify(roundTemplateRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when roundName is blank")
        void createRoundTemplate_blankRoundName_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setRoundName("   ");

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round name is required");

            verify(roundTemplateRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when outoffScore is null")
        void createRoundTemplate_nullOutoffScore_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setOutoffScore(null);

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Out of score is required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when minScore is null")
        void createRoundTemplate_nullMinScore_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setMinScore(null);

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Minimum score is required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when weightage is null")
        void createRoundTemplate_nullWeightage_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setWeightage(null);

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Weightage is required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when createdBy is null")
        void createRoundTemplate_nullCreatedBy_throwsValidation() {
            RoundTemplateRequest request = buildValidRequest();
            request.setCreatedBy(null);

            assertThatThrownBy(() -> service.createRoundTemplate(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Created by user ID is required");
        }
    }

    // =========================================================================
    // getRoundTemplateById
    // =========================================================================

    @Nested
    @DisplayName("getRoundTemplateById")
    class GetRoundTemplateById {

        @Test
        @DisplayName("success - returns round template for valid ID")
        void getRoundTemplateById_found_returnsResponse() {
            RoundTemplate entity = buildRoundTemplate(1L, 1, "Technical Round", true);
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical Round", true);

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(entity));
            when(mapper.toResponse(entity)).thenReturn(response);

            RoundTemplateResponse result = service.getRoundTemplateById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getRoundConfigId()).isEqualTo(1L);
            assertThat(result.getRoundName()).isEqualTo("Technical Round");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent ID")
        void getRoundTemplateById_notFound_throwsNotFound() {
            when(roundTemplateRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getRoundTemplateById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when ID is null")
        void getRoundTemplateById_nullId_throwsValidation() {
            assertThatThrownBy(() -> service.getRoundTemplateById(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round template ID is required");
        }
    }

    // =========================================================================
    // getAllRoundTemplates
    // =========================================================================

    @Nested
    @DisplayName("getAllRoundTemplates")
    class GetAllRoundTemplates {

        @Test
        @DisplayName("success - returns list of all round templates")
        void getAllRoundTemplates_returnsList() {
            RoundTemplate rt1 = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplate rt2 = buildRoundTemplate(2L, 2, "Communication", true);
            RoundTemplateResponse r1 = buildResponse(1L, 1, "Technical", true);
            RoundTemplateResponse r2 = buildResponse(2L, 2, "Communication", true);

            when(roundTemplateRepository.findAll()).thenReturn(List.of(rt1, rt2));
            when(mapper.toResponse(rt1)).thenReturn(r1);
            when(mapper.toResponse(rt2)).thenReturn(r2);

            List<RoundTemplateResponse> result = service.getAllRoundTemplates();

            assertThat(result).hasSize(2);
            assertThat(result).extracting(RoundTemplateResponse::getRoundName)
                    .containsExactlyInAnyOrder("Technical", "Communication");
        }

        @Test
        @DisplayName("success - returns empty list when no round templates exist")
        void getAllRoundTemplates_empty_returnsEmptyList() {
            when(roundTemplateRepository.findAll()).thenReturn(Collections.emptyList());

            List<RoundTemplateResponse> result = service.getAllRoundTemplates();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // updateRoundTemplate
    // =========================================================================

    @Nested
    @DisplayName("updateRoundTemplate")
    class UpdateRoundTemplate {

        @Test
        @DisplayName("success - updates round name only")
        void updateRoundTemplate_updateName_success() {
            RoundTemplate existing = buildRoundTemplate(1L, 1, "Old Name", true);
            RoundTemplate saved = buildRoundTemplate(1L, 1, "New Name", true);
            RoundTemplateResponse response = buildResponse(1L, 1, "New Name", true);

            RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
            request.setRoundName("New Name");

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(roundTemplateRepository.save(any(RoundTemplate.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            RoundTemplateResponse result = service.updateRoundTemplate(1L, request);

            assertThat(result.getRoundName()).isEqualTo("New Name");
            verify(roundTemplateRepository).save(any(RoundTemplate.class));
        }

        @Test
        @DisplayName("success - updates multiple fields")
        void updateRoundTemplate_updateMultipleFields_success() {
            RoundTemplate existing = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplate saved = buildRoundTemplate(1L, 2, "Communication", true);
            saved.setMinScore(80);
            saved.setOutoffScore(200);
            RoundTemplateResponse response = buildResponse(1L, 2, "Communication", true);
            response.setMinScore(80);
            response.setOutoffScore(200);

            RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
            request.setRoundNo(2);
            request.setRoundName("Communication");
            request.setMinScore(80);
            request.setOutoffScore(200);

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(roundTemplateRepository.save(any(RoundTemplate.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            RoundTemplateResponse result = service.updateRoundTemplate(1L, request);

            assertThat(result.getRoundName()).isEqualTo("Communication");
            assertThat(result.getRoundNo()).isEqualTo(2);
            assertThat(result.getMinScore()).isEqualTo(80);
        }

        @Test
        @DisplayName("success - updates isActive flag")
        void updateRoundTemplate_updateIsActive_success() {
            RoundTemplate existing = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplate saved = buildRoundTemplate(1L, 1, "Technical", false);
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical", false);

            RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
            request.setIsActive(false);

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(roundTemplateRepository.save(any(RoundTemplate.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            RoundTemplateResponse result = service.updateRoundTemplate(1L, request);

            assertThat(result.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("success - updates sections with valid JSON")
        void updateRoundTemplate_updateSections_success() throws Exception {
            RoundTemplate existing = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplate saved = buildRoundTemplate(1L, 1, "Technical", true);
            saved.setSections("[{\"sectionName\":\"Aptitude\"}]");
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical", true);

            RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
            request.setSections(List.of(java.util.Map.of("sectionName", "Aptitude")));

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(objectMapper.writeValueAsString(request.getSections()))
                    .thenReturn("[{\"sectionName\":\"Aptitude\"}]");
            when(roundTemplateRepository.save(any(RoundTemplate.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            RoundTemplateResponse result = service.updateRoundTemplate(1L, request);

            assertThat(result).isNotNull();
            verify(objectMapper).writeValueAsString(request.getSections());
        }

        @Test
        @DisplayName("failure - throws ValidationException when sections JSON serialization fails")
        void updateRoundTemplate_invalidSectionsJson_throwsValidation() throws Exception {
            RoundTemplate existing = buildRoundTemplate(1L, 1, "Technical", true);

            RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
            request.setSections("not-serializable-properly");

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(objectMapper.writeValueAsString(request.getSections()))
                    .thenThrow(new JsonProcessingException("test error") {});

            assertThatThrownBy(() -> service.updateRoundTemplate(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Failed to serialize sections");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent ID")
        void updateRoundTemplate_notFound_throwsNotFound() {
            when(roundTemplateRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateRoundTemplate(99L, new RoundTemplateUpdateRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(roundTemplateRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when ID is null")
        void updateRoundTemplate_nullId_throwsValidation() {
            assertThatThrownBy(() -> service.updateRoundTemplate(null, new RoundTemplateUpdateRequest()))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round template ID is required");
        }

        @Test
        @DisplayName("success - blank roundName is ignored (not updated)")
        void updateRoundTemplate_blankName_ignored() {
            RoundTemplate existing = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical", true);

            RoundTemplateUpdateRequest request = new RoundTemplateUpdateRequest();
            request.setRoundName("   ");

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(roundTemplateRepository.save(existing)).thenReturn(existing);
            when(mapper.toResponse(existing)).thenReturn(response);

            RoundTemplateResponse result = service.updateRoundTemplate(1L, request);

            assertThat(result.getRoundName()).isEqualTo("Technical"); // unchanged
        }
    }

    // =========================================================================
    // deleteRoundTemplate
    // =========================================================================

    @Nested
    @DisplayName("deleteRoundTemplate")
    class DeleteRoundTemplate {

        @Test
        @DisplayName("success - toggles isActive from true to false")
        void deleteRoundTemplate_activeToInactive_success() {
            RoundTemplate entity = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplate toggled = buildRoundTemplate(1L, 1, "Technical", false);
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical", false);

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(entity));
            when(roundTemplateRepository.save(any(RoundTemplate.class))).thenReturn(toggled);
            when(mapper.toResponse(toggled)).thenReturn(response);

            RoundTemplateResponse result = service.deleteRoundTemplate(1L);

            assertThat(result.getIsActive()).isFalse();
            verify(roundTemplateRepository).save(any(RoundTemplate.class));
        }

        @Test
        @DisplayName("success - toggles isActive from false to true")
        void deleteRoundTemplate_inactiveToActive_success() {
            RoundTemplate entity = buildRoundTemplate(1L, 1, "Technical", false);
            RoundTemplate toggled = buildRoundTemplate(1L, 1, "Technical", true);
            RoundTemplateResponse response = buildResponse(1L, 1, "Technical", true);

            when(roundTemplateRepository.findById(1L)).thenReturn(Optional.of(entity));
            when(roundTemplateRepository.save(any(RoundTemplate.class))).thenReturn(toggled);
            when(mapper.toResponse(toggled)).thenReturn(response);

            RoundTemplateResponse result = service.deleteRoundTemplate(1L);

            assertThat(result.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent ID")
        void deleteRoundTemplate_notFound_throwsNotFound() {
            when(roundTemplateRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteRoundTemplate(99L))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(roundTemplateRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when ID is null")
        void deleteRoundTemplate_nullId_throwsValidation() {
            assertThatThrownBy(() -> service.deleteRoundTemplate(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Round template ID is required");
        }
    }
}
