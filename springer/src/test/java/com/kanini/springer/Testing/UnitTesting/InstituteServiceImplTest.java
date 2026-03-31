package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteNameResponse;
import com.kanini.springer.dto.Hiring.InstituteRequest;
import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.dto.Hiring.InstituteWithTPOsResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteContact;
import com.kanini.springer.entity.HiringReq.InstituteProgram;
import com.kanini.springer.entity.enums.Enums.InstituteTier;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.InstituteMapper;
import com.kanini.springer.mapper.Hiring.InstituteWithTPOsMapper;
import com.kanini.springer.repository.Hiring.InstituteContactRepository;
import com.kanini.springer.repository.Hiring.InstituteProgramRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.ProgramRepository;
import com.kanini.springer.service.Hiring.impl.InstituteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link InstituteServiceImpl}.
 *
 * All dependencies are mocked — no Spring context is loaded.
 * Covers every public service method with positive (happy path)
 * and negative (edge case / exception) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class InstituteServiceImplTest {

    // ---------------------------------------------------------------
    // Mocks
    // ---------------------------------------------------------------
    @Mock private InstituteRepository         instituteRepository;
    @Mock private InstituteContactRepository  contactRepository;
    @Mock private InstituteProgramRepository  instituteProgramRepository;
    @Mock private ProgramRepository           programRepository;
    @Mock private InstituteMapper             mapper;
    @Mock private InstituteWithTPOsMapper     withTPOsMapper;

    @InjectMocks
    private InstituteServiceImpl instituteService;

    // ---------------------------------------------------------------
    // Fixtures
    // ---------------------------------------------------------------
    private Institute        stubInstitute;
    private InstituteResponse stubResponse;

    @BeforeEach
    void initFixtures() {
        stubInstitute = new Institute();
        stubInstitute.setInstituteId(1L);
        stubInstitute.setInstituteName("Anna University");
        stubInstitute.setInstituteTier(InstituteTier.TIER_1);
        stubInstitute.setState("Tamil Nadu");
        stubInstitute.setCity("Chennai");
        stubInstitute.setIsActive(true);
        stubInstitute.setCreatedAt(LocalDateTime.now());
        stubInstitute.setInstitutePrograms(new ArrayList<>());
        stubInstitute.setInstituteContacts(new ArrayList<>());

        stubResponse = new InstituteResponse();
        stubResponse.setInstituteId(1L);
        stubResponse.setInstituteName("Anna University");
        stubResponse.setInstituteTier("TIER_1");
        stubResponse.setState("Tamil Nadu");
        stubResponse.setCity("Chennai");
        stubResponse.setIsActive(true);
    }

    // =======================================================================
    // createInstitute()
    // =======================================================================

    @Nested
    @DisplayName("createInstitute()")
    class CreateInstitute {

        @Test
        @DisplayName("Positive: creates and returns new institute successfully")
        void createInstitute_newName_success() {
            InstituteRequest request = buildRequest("New College", "TIER_2", "Karnataka", "Bangalore", true);

            when(instituteRepository.findByInstituteName("New College")).thenReturn(Optional.empty());
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            InstituteResponse result = instituteService.createInstitute(request);

            assertThat(result).isNotNull();
            assertThat(result.getInstituteId()).isEqualTo(1L);
            verify(instituteRepository).save(any(Institute.class));
        }

        @Test
        @DisplayName("Positive: isActive defaults to true when not provided in request")
        void createInstitute_nullIsActive_defaultsToTrue() {
            InstituteRequest request = buildRequest("Default Active College", "TIER_2", "TN", "Chennai", null);

            when(instituteRepository.findByInstituteName(anyString())).thenReturn(Optional.empty());
            when(instituteRepository.save(any(Institute.class))).thenAnswer(inv -> {
                Institute saved = inv.getArgument(0);
                assertThat(saved.getIsActive()).isTrue(); // assert default applied
                return stubInstitute;
            });
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            InstituteResponse result = instituteService.createInstitute(request);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Positive: instituteTier is null when tier field is blank in request")
        void createInstitute_blankTier_tierNotSet() {
            InstituteRequest request = buildRequest("No Tier College", "", "TN", "Chennai", true);

            when(instituteRepository.findByInstituteName(anyString())).thenReturn(Optional.empty());
            when(instituteRepository.save(any(Institute.class))).thenAnswer(inv -> {
                Institute saved = inv.getArgument(0);
                assertThat(saved.getInstituteTier()).isNull();
                return stubInstitute;
            });
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            instituteService.createInstitute(request);
            verify(instituteRepository).save(any(Institute.class));
        }

        @Test
        @DisplayName("Negative: throws ValidationException when institute name already exists")
        void createInstitute_duplicateName_throwsValidation() {
            InstituteRequest request = buildRequest("Anna University", "TIER_1", "TN", "Chennai", true);

            when(instituteRepository.findByInstituteName("Anna University"))
                    .thenReturn(Optional.of(stubInstitute));

            assertThatThrownBy(() -> instituteService.createInstitute(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("Negative: throws IllegalArgumentException for invalid instituteTier value")
        void createInstitute_invalidTier_throwsIllegalArgument() {
            InstituteRequest request = buildRequest("Tier Bad College", "TIER_99", "TN", "Chennai", true);

            when(instituteRepository.findByInstituteName(anyString())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> instituteService.createInstitute(request))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // =======================================================================
    // bulkCreateInstitutes()
    // =======================================================================

    @Nested
    @DisplayName("bulkCreateInstitutes()")
    class BulkCreateInstitutes {

        @Test
        @DisplayName("Positive: inserts all records when all requests are valid")
        void bulkCreate_allValid_success() {
            InstituteRequest r1 = buildRequest("College A", "TIER_2", "TN", "Trichy", true);
            InstituteRequest r2 = buildRequest("College B", "TIER_3", "TN", "Madurai", true);

            when(instituteRepository.findByInstituteName("College A")).thenReturn(Optional.empty());
            when(instituteRepository.findByInstituteName("College B")).thenReturn(Optional.empty());

            Institute saved1 = institute(10L, "College A");
            Institute saved2 = institute(11L, "College B");
            when(instituteRepository.saveAll(any())).thenReturn(List.of(saved1, saved2));

            InstituteResponse resp1 = response(10L, "College A");
            InstituteResponse resp2 = response(11L, "College B");
            when(mapper.toResponse(saved1)).thenReturn(resp1);
            when(mapper.toResponse(saved2)).thenReturn(resp2);

            BulkInsertResponse<InstituteResponse> result =
                    instituteService.bulkCreateInstitutes(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(2);
            assertThat(result.getFailureCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isEmpty();
            assertThat(result.getSuccessfulInserts()).hasSize(2);
        }

        @Test
        @DisplayName("Negative: all-or-nothing fails when one entry has a duplicate name")
        void bulkCreate_oneDuplicate_allFail() {
            InstituteRequest r1 = buildRequest("Unique College", "TIER_2", "TN", "Salem", true);
            InstituteRequest r2 = buildRequest("Anna University", "TIER_1", "TN", "Chennai", true); // dup

            when(instituteRepository.findByInstituteName("Unique College")).thenReturn(Optional.empty());
            when(instituteRepository.findByInstituteName("Anna University"))
                    .thenReturn(Optional.of(stubInstitute));

            BulkInsertResponse<InstituteResponse> result =
                    instituteService.bulkCreateInstitutes(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getFailureCount()).isGreaterThan(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(instituteRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("Negative: all-or-nothing fails when one entry has a blank name")
        void bulkCreate_blankNameInBatch_allFail() {
            InstituteRequest r1 = buildRequest("Valid College", "TIER_2", "TN", "Vellore", true);
            InstituteRequest r2 = buildRequest("   ", "TIER_2", "TN", "Vellore", true); // blank

            when(instituteRepository.findByInstituteName("Valid College")).thenReturn(Optional.empty());

            BulkInsertResponse<InstituteResponse> result =
                    instituteService.bulkCreateInstitutes(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(instituteRepository, never()).saveAll(any());
        }

        @Test
        @DisplayName("Negative: all-or-nothing fails when one entry has invalid tier enum")
        void bulkCreate_invalidTierInBatch_allFail() {
            InstituteRequest r1 = buildRequest("Good College", "TIER_2", "TN", "Salem", true);
            InstituteRequest r2 = buildRequest("Bad Tier College", "TIER_99", "TN", "Salem", true);

            when(instituteRepository.findByInstituteName("Good College")).thenReturn(Optional.empty());
            when(instituteRepository.findByInstituteName("Bad Tier College")).thenReturn(Optional.empty());

            BulkInsertResponse<InstituteResponse> result =
                    instituteService.bulkCreateInstitutes(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(instituteRepository, never()).saveAll(any());
        }
    }

    // =======================================================================
    // getAllInstitutes()
    // =======================================================================

    @Nested
    @DisplayName("getAllInstitutes()")
    class GetAllInstitutes {

        @Test
        @DisplayName("Positive: returns mapped list of all institutes")
        void getAllInstitutes_returnsList() {
            when(instituteRepository.findAll()).thenReturn(List.of(stubInstitute));
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            List<InstituteResponse> result = instituteService.getAllInstitutes();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getInstituteName()).isEqualTo("Anna University");
        }

        @Test
        @DisplayName("Positive: returns empty list when no institutes exist")
        void getAllInstitutes_empty_returnsEmptyList() {
            when(instituteRepository.findAll()).thenReturn(Collections.emptyList());

            List<InstituteResponse> result = instituteService.getAllInstitutes();

            assertThat(result).isEmpty();
        }
    }

    // =======================================================================
    // getInstituteById()
    // =======================================================================

    @Nested
    @DisplayName("getInstituteById()")
    class GetInstituteById {

        @Test
        @DisplayName("Positive: returns institute when found by ID")
        void getInstituteById_found_returnsResponse() {
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            InstituteResponse result = instituteService.getInstituteById(1L);

            assertThat(result.getInstituteId()).isEqualTo(1L);
            assertThat(result.getInstituteName()).isEqualTo("Anna University");
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when ID does not exist")
        void getInstituteById_notFound_throwsResourceNotFound() {
            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> instituteService.getInstituteById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Institute");
        }
    }

    // =======================================================================
    // updateInstitute()
    // =======================================================================

    @Nested
    @DisplayName("updateInstitute()")
    class UpdateInstitute {

        @Test
        @DisplayName("Positive: updates name and city when provided")
        void updateInstitute_nameAndCity_success() {
            InstituteRequest request = new InstituteRequest();
            request.setInstituteName("Anna University Updated");
            request.setCity("Coimbatore");

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.findByInstituteName("Anna University Updated"))
                    .thenReturn(Optional.empty());
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            InstituteResponse result = instituteService.updateInstitute(1L, request);

            assertThat(result).isNotNull();
            assertThat(stubInstitute.getInstituteName()).isEqualTo("Anna University Updated");
            assertThat(stubInstitute.getCity()).isEqualTo("Coimbatore");
            verify(instituteRepository).save(stubInstitute);
        }

        @Test
        @DisplayName("Positive: skips name update when name is blank in request")
        void updateInstitute_blankName_nameUnchanged() {
            InstituteRequest request = new InstituteRequest();
            request.setInstituteName("  "); // blank — should be ignored
            request.setState("Kerala");

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            instituteService.updateInstitute(1L, request);

            assertThat(stubInstitute.getInstituteName()).isEqualTo("Anna University"); // unchanged
            assertThat(stubInstitute.getState()).isEqualTo("Kerala");
        }

        @Test
        @DisplayName("Positive: partial update — only tier is updated")
        void updateInstitute_onlyTier_success() {
            InstituteRequest request = new InstituteRequest();
            request.setInstituteTier("TIER_3");

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            instituteService.updateInstitute(1L, request);

            assertThat(stubInstitute.getInstituteTier()).isEqualTo(InstituteTier.TIER_3);
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when institute does not exist")
        void updateInstitute_notFound_throwsResourceNotFound() {
            InstituteRequest request = new InstituteRequest();
            request.setCity("New City");

            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> instituteService.updateInstitute(99L, request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Institute");
        }

        @Test
        @DisplayName("Negative: throws ValidationException when renaming to an already taken name")
        void updateInstitute_duplicateName_throwsValidation() {
            Institute anotherInstitute = institute(2L, "VIT University");

            InstituteRequest request = new InstituteRequest();
            request.setInstituteName("VIT University"); // already taken by ID=2

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.findByInstituteName("VIT University"))
                    .thenReturn(Optional.of(anotherInstitute)); // different ID

            assertThatThrownBy(() -> instituteService.updateInstitute(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("Positive: allows same institute to keep its own name (no false duplicate)")
        void updateInstitute_sameNameSameId_noError() {
            InstituteRequest request = new InstituteRequest();
            request.setInstituteName("Anna University"); // same name, same owner

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            // findByInstituteName returns the same institute (same ID) — should NOT throw
            when(instituteRepository.findByInstituteName("Anna University"))
                    .thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);
            when(mapper.toResponse(stubInstitute)).thenReturn(stubResponse);

            InstituteResponse result = instituteService.updateInstitute(1L, request);
            assertThat(result).isNotNull();
        }
    }

    // =======================================================================
    // deleteInstitute()  — soft delete / toggle
    // =======================================================================

    @Nested
    @DisplayName("deleteInstitute()")
    class DeleteInstitute {

        @Test
        @DisplayName("Positive: toggles isActive from true to false")
        void deleteInstitute_activeInstitute_deactivates() {
            stubInstitute.setIsActive(true);
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);

            instituteService.deleteInstitute(1L);

            assertThat(stubInstitute.getIsActive()).isFalse();
            verify(instituteRepository).save(stubInstitute);
        }

        @Test
        @DisplayName("Positive: toggles isActive from false back to true")
        void deleteInstitute_inactiveInstitute_activates() {
            stubInstitute.setIsActive(false);
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(instituteRepository.save(any(Institute.class))).thenReturn(stubInstitute);

            instituteService.deleteInstitute(1L);

            assertThat(stubInstitute.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when ID does not exist")
        void deleteInstitute_notFound_throwsResourceNotFound() {
            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> instituteService.deleteInstitute(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Institute");
        }
    }

    // =======================================================================
    // getAllInstitutesWithTPOs()
    // =======================================================================

    @Nested
    @DisplayName("getAllInstitutesWithTPOs()")
    class GetAllInstitutesWithTPOs {

        @Test
        @DisplayName("Positive: returns paginated institutes with TPO and program details")
        void getAllWithTPOs_returnsMappedPage() {
            Pageable pageable = PageRequest.of(0, 6);
            Page<Institute> institutePage = new PageImpl<>(List.of(stubInstitute), pageable, 1);

            when(instituteRepository.findAll(pageable)).thenReturn(institutePage);
            when(contactRepository.findByInstituteInstituteId(1L))
                    .thenReturn(Collections.emptyList());
            when(instituteProgramRepository.findByInstituteInstituteId(1L))
                    .thenReturn(Collections.emptyList());

            InstituteWithTPOsResponse withTPOsResponse = new InstituteWithTPOsResponse();
            withTPOsResponse.setInstituteId(1L);
            withTPOsResponse.setInstituteName("Anna University");
            when(withTPOsMapper.toResponse(eq(stubInstitute), any(), any()))
                    .thenReturn(withTPOsResponse);

            Page<InstituteWithTPOsResponse> result =
                    instituteService.getAllInstitutesWithTPOs(pageable);

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getInstituteName()).isEqualTo("Anna University");
            assertThat(result.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("Positive: returns empty page when no institutes exist")
        void getAllWithTPOs_emptyDatabase_returnsEmptyPage() {
            Pageable pageable = PageRequest.of(0, 6);
            Page<Institute> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

            when(instituteRepository.findAll(pageable)).thenReturn(emptyPage);

            Page<InstituteWithTPOsResponse> result =
                    instituteService.getAllInstitutesWithTPOs(pageable);

            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }
    }

    // =======================================================================
    // getInstituteWithTPOsById()
    // =======================================================================

    @Nested
    @DisplayName("getInstituteWithTPOsById()")
    class GetInstituteWithTPOsById {

        @Test
        @DisplayName("Positive: returns institute response with TPO and program details")
        void getWithTPOsById_found_returnsResponse() {
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(stubInstitute));
            when(contactRepository.findByInstituteInstituteId(1L))
                    .thenReturn(Collections.emptyList());
            when(instituteProgramRepository.findByInstituteInstituteId(1L))
                    .thenReturn(Collections.emptyList());

            InstituteWithTPOsResponse withTPOsResponse = new InstituteWithTPOsResponse();
            withTPOsResponse.setInstituteId(1L);
            withTPOsResponse.setInstituteName("Anna University");
            withTPOsResponse.setTpoDetails(Collections.emptyList());
            withTPOsResponse.setPrograms(Collections.emptyList());
            when(withTPOsMapper.toResponse(eq(stubInstitute), any(), any()))
                    .thenReturn(withTPOsResponse);

            InstituteWithTPOsResponse result = instituteService.getInstituteWithTPOsById(1L);

            assertThat(result.getInstituteId()).isEqualTo(1L);
            assertThat(result.getInstituteName()).isEqualTo("Anna University");
            assertThat(result.getTpoDetails()).isEmpty();
        }

        @Test
        @DisplayName("Negative: throws ResourceNotFoundException when institute does not exist")
        void getWithTPOsById_notFound_throwsResourceNotFound() {
            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> instituteService.getInstituteWithTPOsById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Institute");
        }
    }

    // =======================================================================
    // getAllInstituteNames()
    // =======================================================================

    @Nested
    @DisplayName("getAllInstituteNames()")
    class GetAllInstituteNames {

        @Test
        @DisplayName("Positive: returns list of id-name pairs for all institutes")
        void getAllInstituteNames_returnsList() {
            Institute inst2 = institute(2L, "VIT University");
            when(instituteRepository.findAll()).thenReturn(List.of(stubInstitute, inst2));

            List<InstituteNameResponse> result = instituteService.getAllInstituteNames();

            assertThat(result).hasSize(2);
            assertThat(result).extracting(InstituteNameResponse::getInstituteName)
                    .containsExactlyInAnyOrder("Anna University", "VIT University");
            assertThat(result).extracting(InstituteNameResponse::getInstituteId)
                    .containsExactlyInAnyOrder(1L, 2L);
        }

        @Test
        @DisplayName("Positive: returns empty list when no institutes exist")
        void getAllInstituteNames_empty_returnsEmptyList() {
            when(instituteRepository.findAll()).thenReturn(Collections.emptyList());

            List<InstituteNameResponse> result = instituteService.getAllInstituteNames();

            assertThat(result).isEmpty();
        }
    }

    // =======================================================================
    // Private helpers
    // =======================================================================

    private InstituteRequest buildRequest(String name, String tier, String state, String city, Boolean active) {
        InstituteRequest r = new InstituteRequest();
        r.setInstituteName(name);
        r.setInstituteTier(tier);
        r.setState(state);
        r.setCity(city);
        r.setIsActive(active);
        return r;
    }

    private Institute institute(Long id, String name) {
        Institute i = new Institute();
        i.setInstituteId(id);
        i.setInstituteName(name);
        i.setIsActive(true);
        i.setInstitutePrograms(new ArrayList<>());
        i.setInstituteContacts(new ArrayList<>());
        return i;
    }

    private InstituteResponse response(Long id, String name) {
        InstituteResponse r = new InstituteResponse();
        r.setInstituteId(id);
        r.setInstituteName(name);
        r.setIsActive(true);
        return r;
    }
}
