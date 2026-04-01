package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Hiring.SkillRequest;
import com.kanini.springer.dto.Hiring.SkillResponse;
import com.kanini.springer.entity.Drive.CandidateSkill;
import com.kanini.springer.entity.Drive.RequisitionSkill;
import com.kanini.springer.entity.HiringReq.Skill;
import com.kanini.springer.entity.enums.Enums.SkillCategory;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.SkillsMapper;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.service.Hiring.impl.SkillServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SkillServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 * Each service method has a dedicated {@link Nested} class
 * with positive (happy-path) and negative (error-path) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class SkillsServiceImplTest {

    @InjectMocks
    private SkillServiceImpl service;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private SkillsMapper mapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private Skill buildSkill(Long id, String name, SkillCategory category) {
        Skill skill = new Skill();
        skill.setSkillId(id);
        skill.setSkillName(name);
        skill.setCategory(category);
        return skill;
    }

    private SkillResponse buildResponse(Long id, String name, String category) {
        SkillResponse r = new SkillResponse();
        r.setSkillId(id);
        r.setSkillName(name);
        r.setCategory(category);
        return r;
    }

    // =========================================================================
    // createSkill
    // =========================================================================

    @Nested
    @DisplayName("createSkill")
    class CreateSkill {

        @Test
        @DisplayName("success - creates skill when name is unique and category is valid")
        void createSkill_success() {
            SkillRequest request = new SkillRequest("GraphQL", "TECHNICAL");
            Skill saved = buildSkill(1L, "GraphQL", SkillCategory.TECHNICAL);
            SkillResponse response = buildResponse(1L, "GraphQL", "TECHNICAL");

            when(skillRepository.existsBySkillName("GraphQL")).thenReturn(false);
            when(skillRepository.save(any(Skill.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            SkillResponse result = service.createSkill(request);

            assertThat(result).isNotNull();
            assertThat(result.getSkillId()).isEqualTo(1L);
            assertThat(result.getSkillName()).isEqualTo("GraphQL");
            assertThat(result.getCategory()).isEqualTo("TECHNICAL");
            verify(skillRepository).save(any(Skill.class));
        }

        @Test
        @DisplayName("success - creates SOFT_SKILL category correctly")
        void createSkill_softSkill_success() {
            SkillRequest request = new SkillRequest("Negotiation", "SOFT_SKILL");
            Skill saved = buildSkill(2L, "Negotiation", SkillCategory.SOFT_SKILL);
            SkillResponse response = buildResponse(2L, "Negotiation", "SOFT_SKILL");

            when(skillRepository.existsBySkillName("Negotiation")).thenReturn(false);
            when(skillRepository.save(any(Skill.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            SkillResponse result = service.createSkill(request);

            assertThat(result.getCategory()).isEqualTo("SOFT_SKILL");
            verify(skillRepository).save(argThat(s -> s.getCategory() == SkillCategory.SOFT_SKILL));
        }

        @Test
        @DisplayName("failure - throws ValidationException when skill name already exists")
        void createSkill_duplicateName_throwsValidationException() {
            SkillRequest request = new SkillRequest("Java", "TECHNICAL");

            when(skillRepository.existsBySkillName("Java")).thenReturn(true);

            assertThatThrownBy(() -> service.createSkill(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");

            verify(skillRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid category string")
        void createSkill_invalidCategory_throwsValidationException() {
            SkillRequest request = new SkillRequest("NewSkill", "INVALID_CAT");

            when(skillRepository.existsBySkillName("NewSkill")).thenReturn(false);

            assertThatThrownBy(() -> service.createSkill(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid skill category");

            verify(skillRepository, never()).save(any());
        }
    }

    // =========================================================================
    // getSkillById
    // =========================================================================

    @Nested
    @DisplayName("getSkillById")
    class GetSkillById {

        @Test
        @DisplayName("success - returns skill response for valid ID")
        void getSkillById_found_returnsResponse() {
            Skill skill = buildSkill(1L, "Java", SkillCategory.TECHNICAL);
            SkillResponse response = buildResponse(1L, "Java", "TECHNICAL");

            when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
            when(mapper.toResponse(skill)).thenReturn(response);

            SkillResponse result = service.getSkillById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getSkillId()).isEqualTo(1L);
            assertThat(result.getSkillName()).isEqualTo("Java");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when ID does not exist")
        void getSkillById_notFound_throwsResourceNotFoundException() {
            when(skillRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getSkillById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getAllSkills
    // =========================================================================

    @Nested
    @DisplayName("getAllSkills")
    class GetAllSkills {

        @Test
        @DisplayName("success - returns list of all skills")
        void getAllSkills_multipleSkills_returnsList() {
            Skill s1 = buildSkill(1L, "Java", SkillCategory.TECHNICAL);
            Skill s2 = buildSkill(2L, "Communication", SkillCategory.SOFT_SKILL);
            SkillResponse r1 = buildResponse(1L, "Java", "TECHNICAL");
            SkillResponse r2 = buildResponse(2L, "Communication", "SOFT_SKILL");

            when(skillRepository.findAll()).thenReturn(List.of(s1, s2));
            when(mapper.toResponse(s1)).thenReturn(r1);
            when(mapper.toResponse(s2)).thenReturn(r2);

            List<SkillResponse> result = service.getAllSkills();

            assertThat(result).hasSize(2);
            assertThat(result).extracting(SkillResponse::getSkillName)
                    .containsExactlyInAnyOrder("Java", "Communication");
        }

        @Test
        @DisplayName("success - returns empty list when no skills exist")
        void getAllSkills_noSkills_returnsEmptyList() {
            when(skillRepository.findAll()).thenReturn(Collections.emptyList());

            List<SkillResponse> result = service.getAllSkills();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // getSkillByName
    // =========================================================================

    @Nested
    @DisplayName("getSkillByName")
    class GetSkillByName {

        @Test
        @DisplayName("success - returns skill for existing name")
        void getSkillByName_found_returnsResponse() {
            Skill skill = buildSkill(1L, "Python", SkillCategory.TECHNICAL);
            SkillResponse response = buildResponse(1L, "Python", "TECHNICAL");

            when(skillRepository.findBySkillName("Python")).thenReturn(Optional.of(skill));
            when(mapper.toResponse(skill)).thenReturn(response);

            SkillResponse result = service.getSkillByName("Python");

            assertThat(result).isNotNull();
            assertThat(result.getSkillName()).isEqualTo("Python");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent name")
        void getSkillByName_notFound_throwsResourceNotFoundException() {
            when(skillRepository.findBySkillName("UnknownXYZ")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getSkillByName("UnknownXYZ"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // updateSkill
    // =========================================================================

    @Nested
    @DisplayName("updateSkill")
    class UpdateSkill {

        @Test
        @DisplayName("success - updates skill name and category")
        void updateSkill_validRequest_success() {
            Skill existing = buildSkill(1L, "GraphQL", SkillCategory.TECHNICAL);
            Skill updated = buildSkill(1L, "GraphQL Advanced", SkillCategory.SOFT_SKILL);
            SkillResponse response = buildResponse(1L, "GraphQL Advanced", "SOFT_SKILL");

            SkillRequest request = new SkillRequest("GraphQL Advanced", "SOFT_SKILL");

            when(skillRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(skillRepository.existsBySkillName("GraphQL Advanced")).thenReturn(false);
            when(skillRepository.save(any(Skill.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            SkillResponse result = service.updateSkill(1L, request);

            assertThat(result.getSkillName()).isEqualTo("GraphQL Advanced");
            assertThat(result.getCategory()).isEqualTo("SOFT_SKILL");
            verify(skillRepository).save(any(Skill.class));
        }

        @Test
        @DisplayName("success - updating with same name as current skill does not throw dup error")
        void updateSkill_sameOwnName_noFalsePositive() {
            Skill existing = buildSkill(1L, "Java", SkillCategory.TECHNICAL);
            Skill updated = buildSkill(1L, "Java", SkillCategory.SOFT_SKILL);
            SkillResponse response = buildResponse(1L, "Java", "SOFT_SKILL");

            SkillRequest request = new SkillRequest("Java", "SOFT_SKILL");

            when(skillRepository.findById(1L)).thenReturn(Optional.of(existing));
            // existsBySkillName returns true but skill.getSkillName().equals(request.getSkillName()) is also true
            when(skillRepository.existsBySkillName("Java")).thenReturn(true);
            when(skillRepository.save(any(Skill.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            SkillResponse result = service.updateSkill(1L, request);

            assertThat(result).isNotNull();
            verify(skillRepository).save(any(Skill.class));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when skill ID does not exist")
        void updateSkill_notFound_throwsResourceNotFoundException() {
            when(skillRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateSkill(99L, new SkillRequest("Any", "TECHNICAL")))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(skillRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when new name is taken by another skill")
        void updateSkill_duplicateName_throwsValidationException() {
            Skill existing = buildSkill(1L, "GraphQL", SkillCategory.TECHNICAL);
            SkillRequest request = new SkillRequest("Python", "TECHNICAL"); // taken by different skill(s)

            when(skillRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(skillRepository.existsBySkillName("Python")).thenReturn(true);
            // "GraphQL".equals("Python") is false → dup detected

            assertThatThrownBy(() -> service.updateSkill(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");

            verify(skillRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid category string on update")
        void updateSkill_invalidCategory_throwsValidationException() {
            Skill existing = buildSkill(1L, "GraphQL", SkillCategory.TECHNICAL);
            SkillRequest request = new SkillRequest("GraphQL", "BAD_ENUM");

            when(skillRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(skillRepository.existsBySkillName("GraphQL")).thenReturn(true);
            // name is same as own → no dup error, proceeds to category parse which fails

            assertThatThrownBy(() -> service.updateSkill(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid skill category");

            verify(skillRepository, never()).save(any());
        }
    }

    // =========================================================================
    // deleteSkill
    // =========================================================================

    @Nested
    @DisplayName("deleteSkill")
    class DeleteSkill {

        @Test
        @DisplayName("success - deletes skill that has no references")
        void deleteSkill_noReferences_deletesSuccessfully() {
            Skill skill = buildSkill(1L, "GraphQL", SkillCategory.TECHNICAL);
            skill.setRequisitionSkills(Collections.emptyList());
            skill.setCandidateSkills(Collections.emptyList());

            when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));

            service.deleteSkill(1L);

            verify(skillRepository).delete(skill);
        }

        @Test
        @DisplayName("success - deletes skill when reference lists are null")
        void deleteSkill_nullReferenceLists_deletesSuccessfully() {
            Skill skill = buildSkill(1L, "Kotlin", SkillCategory.TECHNICAL);
            skill.setRequisitionSkills(null);
            skill.setCandidateSkills(null);

            when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));

            service.deleteSkill(1L);

            verify(skillRepository).delete(skill);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when skill ID does not exist")
        void deleteSkill_notFound_throwsResourceNotFoundException() {
            when(skillRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteSkill(99L))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(skillRepository, never()).delete(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when skill is referenced in hiring demands")
        void deleteSkill_referencedInRequisition_throwsValidationException() {
            Skill skill = buildSkill(1L, "Java", SkillCategory.TECHNICAL);
            skill.setRequisitionSkills(List.of(new RequisitionSkill()));
            skill.setCandidateSkills(Collections.emptyList());

            when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));

            assertThatThrownBy(() -> service.deleteSkill(1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("hiring demands");

            verify(skillRepository, never()).delete(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when skill is referenced in candidate profiles")
        void deleteSkill_referencedInCandidateSkills_throwsValidationException() {
            Skill skill = buildSkill(1L, "Python", SkillCategory.TECHNICAL);
            skill.setRequisitionSkills(Collections.emptyList());
            skill.setCandidateSkills(List.of(new CandidateSkill()));

            when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));

            assertThatThrownBy(() -> service.deleteSkill(1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("candidate profiles");

            verify(skillRepository, never()).delete(any());
        }
    }
}
