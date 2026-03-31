package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Hiring.InstituteProgramRequest;
import com.kanini.springer.dto.Hiring.ProgramResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteProgram;
import com.kanini.springer.entity.HiringReq.Program;
import com.kanini.springer.entity.enums.Enums.ProgramName;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Hiring.InstituteProgramRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.ProgramRepository;
import com.kanini.springer.service.Hiring.impl.ProgramServiceImpl;
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
 * Unit tests for {@link ProgramServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 * Each service method has a dedicated {@link Nested} class
 * with positive (happy-path) and negative (error-path) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class ProgramServiceImplTest {

    @InjectMocks
    private ProgramServiceImpl service;

    @Mock
    private ProgramRepository programRepository;

    @Mock
    private InstituteProgramRepository instituteProgramRepository;

    @Mock
    private InstituteRepository instituteRepository;

    // =========================================================================
    // Helpers
    // =========================================================================

    private Program buildProgram(Long id, ProgramName name) {
        Program p = new Program();
        p.setProgramId(id);
        p.setProgramName(name);
        return p;
    }

    private Institute buildInstitute(Long id, String name) {
        Institute inst = new Institute();
        inst.setInstituteId(id);
        inst.setInstituteName(name);
        return inst;
    }

    private InstituteProgram buildInstituteProgram(Long id, Institute institute, Program program) {
        InstituteProgram ip = new InstituteProgram();
        ip.setId(id);
        ip.setInstitute(institute);
        ip.setProgram(program);
        return ip;
    }

    // =========================================================================
    // getAllPrograms
    // =========================================================================

    @Nested
    @DisplayName("getAllPrograms")
    class GetAllPrograms {

        @Test
        @DisplayName("success - returns list of program responses with name()")
        void getAllPrograms_multiplePrograms_returnsMappedList() {
            Program p1 = buildProgram(1L, ProgramName.B_TECH);
            Program p2 = buildProgram(2L, ProgramName.M_TECH);
            Program p3 = buildProgram(3L, ProgramName.MBA);

            when(programRepository.findAll()).thenReturn(List.of(p1, p2, p3));

            List<ProgramResponse> result = service.getAllPrograms();

            assertThat(result).hasSize(3);
            assertThat(result).extracting(ProgramResponse::getProgramName)
                    .containsExactlyInAnyOrder("B_TECH", "M_TECH", "MBA");
            assertThat(result).extracting(ProgramResponse::getProgramId)
                    .containsExactlyInAnyOrder(1L, 2L, 3L);
        }

        @Test
        @DisplayName("success - returns empty list when no programs exist")
        void getAllPrograms_noPrograms_returnsEmptyList() {
            when(programRepository.findAll()).thenReturn(Collections.emptyList());

            List<ProgramResponse> result = service.getAllPrograms();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // addProgramsToInstitute
    // =========================================================================

    @Nested
    @DisplayName("addProgramsToInstitute")
    class AddProgramsToInstitute {

        @Test
        @DisplayName("success - creates new mapping when no duplicate exists")
        void addProgramsToInstitute_newMapping_savesCalled() {
            Institute inst = buildInstitute(1L, "Anna University");
            Program prog = buildProgram(4L, ProgramName.MCA);

            InstituteProgramRequest request = new InstituteProgramRequest(1L, 4L);

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(programRepository.findById(4L)).thenReturn(Optional.of(prog));
            when(instituteProgramRepository.findByInstituteInstituteId(1L))
                    .thenReturn(Collections.emptyList());

            service.addProgramsToInstitute(List.of(request));

            verify(instituteProgramRepository).save(any(InstituteProgram.class));
        }

        @Test
        @DisplayName("success - skips saving when mapping already exists (idempotent)")
        void addProgramsToInstitute_duplicateMapping_savesNotCalled() {
            Institute inst = buildInstitute(1L, "Anna University");
            Program prog = buildProgram(1L, ProgramName.B_TECH);

            // Existing mapping: institute 1 <-> program 1
            InstituteProgram existing = buildInstituteProgram(10L, inst, prog);

            InstituteProgramRequest request = new InstituteProgramRequest(1L, 1L);

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(programRepository.findById(1L)).thenReturn(Optional.of(prog));
            when(instituteProgramRepository.findByInstituteInstituteId(1L))
                    .thenReturn(List.of(existing));

            service.addProgramsToInstitute(List.of(request));

            verify(instituteProgramRepository, never()).save(any());
        }

        @Test
        @DisplayName("success - processes multiple requests, saves only new mappings")
        void addProgramsToInstitute_multipleRequests_savesOnlyNew() {
            Institute inst1 = buildInstitute(1L, "Anna University");
            Institute inst2 = buildInstitute(2L, "SSN");
            Program prog4 = buildProgram(4L, ProgramName.MCA);
            Program prog5 = buildProgram(5L, ProgramName.BCA);

            // inst1 already has prog4 mapped; inst2 + prog5 is new
            InstituteProgram existingForInst1 = buildInstituteProgram(10L, inst1, prog4);

            InstituteProgramRequest r1 = new InstituteProgramRequest(1L, 4L); // dup
            InstituteProgramRequest r2 = new InstituteProgramRequest(2L, 5L); // new

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst1));
            when(programRepository.findById(4L)).thenReturn(Optional.of(prog4));
            when(instituteProgramRepository.findByInstituteInstituteId(1L))
                    .thenReturn(List.of(existingForInst1));

            when(instituteRepository.findById(2L)).thenReturn(Optional.of(inst2));
            when(programRepository.findById(5L)).thenReturn(Optional.of(prog5));
            when(instituteProgramRepository.findByInstituteInstituteId(2L))
                    .thenReturn(Collections.emptyList());

            service.addProgramsToInstitute(List.of(r1, r2));

            // Only one save — for the non-duplicate mapping (inst2 + prog5)
            verify(instituteProgramRepository, times(1)).save(any(InstituteProgram.class));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when institute does not exist")
        void addProgramsToInstitute_instituteNotFound_throwsResourceNotFoundException() {
            InstituteProgramRequest request = new InstituteProgramRequest(99L, 1L);

            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.addProgramsToInstitute(List.of(request)))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(instituteProgramRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when program does not exist")
        void addProgramsToInstitute_programNotFound_throwsResourceNotFoundException() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteProgramRequest request = new InstituteProgramRequest(1L, 99L);

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(programRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.addProgramsToInstitute(List.of(request)))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(instituteProgramRepository, never()).save(any());
        }
    }

    // =========================================================================
    // removeInstituteProgramMapping
    // =========================================================================

    @Nested
    @DisplayName("removeInstituteProgramMapping")
    class RemoveInstituteProgramMapping {

        @Test
        @DisplayName("success - deletes existing mapping")
        void removeInstituteProgramMapping_existingId_deleteCalled() {
            Institute inst = buildInstitute(1L, "Anna University");
            Program prog = buildProgram(1L, ProgramName.B_TECH);
            InstituteProgram ip = buildInstituteProgram(5L, inst, prog);

            when(instituteProgramRepository.findById(5L)).thenReturn(Optional.of(ip));

            service.removeInstituteProgramMapping(5L);

            verify(instituteProgramRepository).delete(ip);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when mapping ID does not exist")
        void removeInstituteProgramMapping_notFound_throwsResourceNotFoundException() {
            when(instituteProgramRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.removeInstituteProgramMapping(99L))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(instituteProgramRepository, never()).delete(any());
        }
    }
}
