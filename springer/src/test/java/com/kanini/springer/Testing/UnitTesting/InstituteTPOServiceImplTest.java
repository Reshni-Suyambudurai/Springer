package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Hiring.InstituteContactRequest;
import com.kanini.springer.dto.Hiring.InstituteContactResponse;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.InstituteContact;
import com.kanini.springer.entity.enums.Enums.ContactStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.InstituteContactMapper;
import com.kanini.springer.repository.Hiring.InstituteContactRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.service.Hiring.impl.InstituteTPOServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link InstituteTPOServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 * Each service method is covered in a dedicated {@link Nested} class
 * with both positive (happy-path) and negative (error-path) scenarios.
 */
@ExtendWith(MockitoExtension.class)
class InstituteTPOServiceImplTest {

    @InjectMocks
    private InstituteTPOServiceImpl service;

    @Mock
    private InstituteContactRepository contactRepository;

    @Mock
    private InstituteRepository instituteRepository;

    @Mock
    private InstituteContactMapper mapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private Institute buildInstitute(Long id, String name) {
        Institute inst = new Institute();
        inst.setInstituteId(id);
        inst.setInstituteName(name);
        return inst;
    }

    private InstituteContact buildContact(Integer id, String name, String email,
                                          String mobile, ContactStatus status, Institute institute) {
        InstituteContact c = new InstituteContact();
        c.setTpoId(id);
        c.setTpoName(name);
        c.setTpoEmail(email);
        c.setTpoMobile(mobile);
        c.setTpoStatus(status);
        c.setIsPrimary(false);
        c.setInstitute(institute);
        return c;
    }

    private InstituteContactResponse buildResponse(Integer id, String name, String email,
                                                    Long instituteId, String status) {
        InstituteContactResponse r = new InstituteContactResponse();
        r.setTpoId(id);
        r.setTpoName(name);
        r.setTpoEmail(email);
        r.setInstituteId(instituteId);
        r.setTpoStatus(status);
        r.setCreatedAt(LocalDateTime.now());
        return r;
    }

    private InstituteContactRequest buildRequest(Long instId, String name, String email,
                                                  String mobile, String status, Boolean isPrimary) {
        InstituteContactRequest r = new InstituteContactRequest();
        r.setInstituteId(instId);
        r.setTpoName(name);
        r.setTpoEmail(email);
        r.setTpoMobile(mobile);
        r.setTpoStatus(status);
        r.setIsPrimary(isPrimary);
        return r;
    }

    // =========================================================================
    // createContact
    // =========================================================================

    @Nested
    @DisplayName("createContact")
    class CreateContact {

        @Test
        @DisplayName("success - creates contact when email is unique and institute exists")
        void createContact_success() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContactRequest req = buildRequest(1L, "Ravi Kumar",
                    "ravi@annauniv.edu", "9876543210", "ACTIVE", true);

            InstituteContact saved = buildContact(10, "Ravi Kumar", "ravi@annauniv.edu",
                    "9876543210", ContactStatus.ACTIVE, inst);
            InstituteContactResponse response = buildResponse(10, "Ravi Kumar",
                    "ravi@annauniv.edu", 1L, "ACTIVE");

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(contactRepository.findByTpoEmail("ravi@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            InstituteContactResponse result = service.createContact(req);

            assertThat(result).isNotNull();
            assertThat(result.getTpoId()).isEqualTo(10);
            assertThat(result.getTpoName()).isEqualTo("Ravi Kumar");
            verify(contactRepository).save(any(InstituteContact.class));
        }

        @Test
        @DisplayName("success - defaults tpoStatus to ACTIVE and isPrimary to false when not provided")
        void createContact_defaults_statusAndisPrimary() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContactRequest req = buildRequest(1L, "Meena Devi",
                    "meena@annauniv.edu", "9000000001", null, null);

            InstituteContact saved = buildContact(11, "Meena Devi", "meena@annauniv.edu",
                    "9000000001", ContactStatus.ACTIVE, inst);
            InstituteContactResponse response = buildResponse(11, "Meena Devi",
                    "meena@annauniv.edu", 1L, "ACTIVE");

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(contactRepository.findByTpoEmail("meena@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            InstituteContactResponse result = service.createContact(req);

            assertThat(result).isNotNull();
            verify(contactRepository).save(argThat(c ->
                    c.getTpoStatus() == ContactStatus.ACTIVE && Boolean.FALSE.equals(c.getIsPrimary())));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when institute not found")
        void createContact_instituteNotFound() {
            InstituteContactRequest req = buildRequest(99L, "Ghost", "ghost@test.com",
                    "9999999999", null, null);

            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createContact(req))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(contactRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - throws ValidationException when email already exists")
        void createContact_duplicateEmail() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContactRequest req = buildRequest(1L, "Dup Guy",
                    "ravi@annauniv.edu", "9800000001", null, null);
            InstituteContact existing = buildContact(5, "Other Guy", "ravi@annauniv.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(contactRepository.findByTpoEmail("ravi@annauniv.edu")).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> service.createContact(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");

            verify(contactRepository, never()).save(any());
        }
    }

    // =========================================================================
    // bulkCreateContacts (institute/{id}/bulk)
    // =========================================================================

    @Nested
    @DisplayName("bulkCreateContacts")
    class BulkCreateContacts {

        @Test
        @DisplayName("success - all-or-nothing when all records are valid")
        void bulkCreateContacts_allValid_success() {
            Long instituteId = 1L;
            Institute inst = buildInstitute(instituteId, "Anna University");

            InstituteContactRequest r1 = buildRequest(null, "Sundar Ram",
                    "sundar@annauniv.edu", "9111111111", "ACTIVE", true);
            InstituteContactRequest r2 = buildRequest(null, "Lalitha Devi",
                    "lalitha@annauniv.edu", "9222222222", "ACTIVE", false);

            InstituteContact c1 = buildContact(20, "Sundar Ram", "sundar@annauniv.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContact c2 = buildContact(21, "Lalitha Devi", "lalitha@annauniv.edu",
                    "9222222222", ContactStatus.ACTIVE, inst);

            InstituteContactResponse resp1 = buildResponse(20, "Sundar Ram", "sundar@annauniv.edu", 1L, "ACTIVE");
            InstituteContactResponse resp2 = buildResponse(21, "Lalitha Devi", "lalitha@annauniv.edu", 1L, "ACTIVE");

            when(instituteRepository.findById(instituteId)).thenReturn(Optional.of(inst));
            when(contactRepository.findByTpoEmail("sundar@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.findByTpoEmail("lalitha@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(c1, c2);
            when(mapper.toResponse(c1)).thenReturn(resp1);
            when(mapper.toResponse(c2)).thenReturn(resp2);

            var result = service.bulkCreateContacts(instituteId, List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(2);
            assertThat(result.getFailureCount()).isEqualTo(0);
            assertThat(result.getSuccessfulInserts()).hasSize(2);
        }

        @Test
        @DisplayName("failure - early exit when institute not found")
        void bulkCreateContacts_instituteNotFound_earlyExit() {
            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            InstituteContactRequest r1 = buildRequest(null, "Someone",
                    "someone@test.com", "9100000001", "ACTIVE", false);

            var result = service.bulkCreateContacts(99L, List.of(r1));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(contactRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - all records fail when one has blank tpoName")
        void bulkCreateContacts_blankName_allFail() {
            Institute inst = buildInstitute(1L, "Anna University");
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));

            InstituteContactRequest r1 = buildRequest(null, "Valid Name",
                    "valid@annauniv.edu", "9100000001", "ACTIVE", false);
            InstituteContactRequest r2 = buildRequest(null, "  ",  // blank name
                    "blank@annauniv.edu", "9100000002", "ACTIVE", false);

            var result = service.bulkCreateContacts(1L, List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(contactRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - all records fail when one has invalid mobile pattern")
        void bulkCreateContacts_invalidMobile_allFail() {
            Institute inst = buildInstitute(1L, "Anna University");
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(contactRepository.findByTpoEmail("valid@annauniv.edu")).thenReturn(Optional.empty());

            InstituteContactRequest r1 = buildRequest(null, "Valid Name",
                    "valid@annauniv.edu", "9100000001", "ACTIVE", false);
            InstituteContactRequest r2 = buildRequest(null, "Invalid Mobile",
                    "invalid.mob@annauniv.edu", "1234",  // invalid mobile
                    "ACTIVE", false);

            var result = service.bulkCreateContacts(1L, List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(contactRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - all records fail when one has duplicate email")
        void bulkCreateContacts_duplicateEmail_allFail() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact existing = buildContact(5, "Existing",
                    "existing@annauniv.edu", "9000000000", ContactStatus.ACTIVE, inst);

            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst));
            when(contactRepository.findByTpoEmail("new@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.findByTpoEmail("existing@annauniv.edu")).thenReturn(Optional.of(existing));

            InstituteContactRequest r1 = buildRequest(null, "New Person",
                    "new@annauniv.edu", "9100000001", "ACTIVE", false);
            InstituteContactRequest r2 = buildRequest(null, "Dup Person",
                    "existing@annauniv.edu", "9100000002", "ACTIVE", false);

            var result = service.bulkCreateContacts(1L, List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(contactRepository, never()).save(any());
        }
    }

    // =========================================================================
    // bulkCreateAllContacts (/bulk)
    // =========================================================================

    @Nested
    @DisplayName("bulkCreateAllContacts")
    class BulkCreateAllContacts {

        @Test
        @DisplayName("success - all records valid with different institutes")
        void bulkCreateAllContacts_allValid_success() {
            Institute inst1 = buildInstitute(1L, "Anna University");
            Institute inst2 = buildInstitute(2L, "SSN");

            InstituteContactRequest r1 = buildRequest(1L, "TPO One",
                    "tpoone@annauniv.edu", "9111111111", "ACTIVE", false);
            InstituteContactRequest r2 = buildRequest(2L, "TPO Two",
                    "tpotwo@ssn.edu", "9222222222", "ACTIVE", false);

            InstituteContact c1 = buildContact(30, "TPO One", "tpoone@annauniv.edu",
                    "9111111111", ContactStatus.ACTIVE, inst1);
            InstituteContact c2 = buildContact(31, "TPO Two", "tpotwo@ssn.edu",
                    "9222222222", ContactStatus.ACTIVE, inst2);

            InstituteContactResponse resp1 = buildResponse(30, "TPO One", "tpoone@annauniv.edu", 1L, "ACTIVE");
            InstituteContactResponse resp2 = buildResponse(31, "TPO Two", "tpotwo@ssn.edu", 2L, "ACTIVE");

            when(contactRepository.findByTpoEmail("tpoone@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.findByTpoEmail("tpotwo@ssn.edu")).thenReturn(Optional.empty());
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst1));
            when(instituteRepository.findById(2L)).thenReturn(Optional.of(inst2));
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(c1, c2);
            when(mapper.toResponse(c1)).thenReturn(resp1);
            when(mapper.toResponse(c2)).thenReturn(resp2);

            var result = service.bulkCreateAllContacts(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(2);
            assertThat(result.getFailureCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("failure - all records fail when one has null instituteId")
        void bulkCreateAllContacts_nullInstituteId_allFail() {
            InstituteContactRequest r1 = buildRequest(1L, "Valid TPO",
                    "valid@test.com", "9100000001", "ACTIVE", false);
            InstituteContactRequest r2 = buildRequest(null, "No Institute",  // null instituteId
                    "noinst@test.com", "9100000002", "ACTIVE", false);

            var result = service.bulkCreateAllContacts(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(contactRepository, never()).save(any());
        }

        @Test
        @DisplayName("failure - all records fail when one references non-existent institute")
        void bulkCreateAllContacts_instituteNotFound_allFail() {
            Institute inst1 = buildInstitute(1L, "Anna University");

            InstituteContactRequest r1 = buildRequest(1L, "Valid TPO",
                    "valid@annauniv.edu", "9100000001", "ACTIVE", false);
            InstituteContactRequest r2 = buildRequest(99L, "Bad Inst TPO",
                    "badinst@test.com", "9100000002", "ACTIVE", false);

            when(contactRepository.findByTpoEmail("valid@annauniv.edu")).thenReturn(Optional.empty());
            when(contactRepository.findByTpoEmail("badinst@test.com")).thenReturn(Optional.empty());
            when(instituteRepository.findById(1L)).thenReturn(Optional.of(inst1));
            when(instituteRepository.findById(99L)).thenReturn(Optional.empty());

            var result = service.bulkCreateAllContacts(List.of(r1, r2));

            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
            verify(contactRepository, never()).save(any());
        }
    }

    // =========================================================================
    // getContactsByInstituteId
    // =========================================================================

    @Nested
    @DisplayName("getContactsByInstituteId")
    class GetContactsByInstituteId {

        @Test
        @DisplayName("success - returns list of contacts for valid institute")
        void getContactsByInstituteId_found_returnsList() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact c1 = buildContact(1, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContactResponse resp = buildResponse(1, "Ravi", "ravi@test.edu", 1L, "ACTIVE");

            when(instituteRepository.existsById(1L)).thenReturn(true);
            when(contactRepository.findByInstituteInstituteId(1L)).thenReturn(List.of(c1));
            when(mapper.toResponse(c1)).thenReturn(resp);

            List<InstituteContactResponse> result = service.getContactsByInstituteId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTpoId()).isEqualTo(1);
        }

        @Test
        @DisplayName("success - returns empty list when institute has no contacts")
        void getContactsByInstituteId_noContacts_returnsEmptyList() {
            when(instituteRepository.existsById(1L)).thenReturn(true);
            when(contactRepository.findByInstituteInstituteId(1L)).thenReturn(List.of());

            List<InstituteContactResponse> result = service.getContactsByInstituteId(1L);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("failure - throws RuntimeException when institute does not exist")
        void getContactsByInstituteId_instituteNotFound_throwsRuntimeException() {
            when(instituteRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> service.getContactsByInstituteId(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Institute not found");
        }
    }

    // =========================================================================
    // getContactById
    // =========================================================================

    @Nested
    @DisplayName("getContactById")
    class GetContactById {

        @Test
        @DisplayName("success - returns contact response for valid tpoId")
        void getContactById_found_returnsResponse() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact contact = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContactResponse response = buildResponse(5, "Ravi", "ravi@test.edu", 1L, "ACTIVE");

            when(contactRepository.findByIdWithInstitute(5)).thenReturn(Optional.of(contact));
            when(mapper.toResponse(contact)).thenReturn(response);

            InstituteContactResponse result = service.getContactById(5);

            assertThat(result).isNotNull();
            assertThat(result.getTpoId()).isEqualTo(5);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when tpoId does not exist")
        void getContactById_notFound_throwsResourceNotFoundException() {
            when(contactRepository.findByIdWithInstitute(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getContactById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // updateContact
    // =========================================================================

    @Nested
    @DisplayName("updateContact")
    class UpdateContact {

        @Test
        @DisplayName("success - partial update with new name and designation")
        void updateContact_partialUpdate_success() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact existing = buildContact(5, "Old Name", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContact updated = buildContact(5, "New Name", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContactResponse response = buildResponse(5, "New Name", "ravi@test.edu", 1L, "ACTIVE");

            InstituteContactRequest req = new InstituteContactRequest();
            req.setTpoName("New Name");
            req.setTpoDesignation("Lead TPO");

            when(contactRepository.findById(5)).thenReturn(Optional.of(existing));
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            InstituteContactResponse result = service.updateContact(5, req);

            assertThat(result).isNotNull();
            assertThat(result.getTpoName()).isEqualTo("New Name");
            verify(contactRepository).save(any(InstituteContact.class));
        }

        @Test
        @DisplayName("success - updating email to own current email does not trigger duplicate error")
        void updateContact_sameOwnerEmail_noFalsePositive() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact existing = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContact updated = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContactResponse response = buildResponse(5, "Ravi", "ravi@test.edu", 1L, "ACTIVE");

            InstituteContactRequest req = new InstituteContactRequest();
            req.setTpoEmail("ravi@test.edu");  // same as own email

            // When finding by email, returns the SAME contact (same tpoId=5)
            when(contactRepository.findById(5)).thenReturn(Optional.of(existing));
            when(contactRepository.findByTpoEmail("ravi@test.edu")).thenReturn(Optional.of(existing));
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            InstituteContactResponse result = service.updateContact(5, req);

            assertThat(result).isNotNull();
            verify(contactRepository).save(any());
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when contact not found")
        void updateContact_notFound_throwsResourceNotFoundException() {
            when(contactRepository.findById(99)).thenReturn(Optional.empty());

            InstituteContactRequest req = new InstituteContactRequest();
            req.setTpoName("Ghost");

            assertThatThrownBy(() -> service.updateContact(99, req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when new email is already taken by another contact")
        void updateContact_duplicateEmail_throwsValidationException() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact existing = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            // Different contact (tpoId=6) already owns the target email
            InstituteContact other = buildContact(6, "Other", "taken@test.edu",
                    "9222222222", ContactStatus.ACTIVE, inst);

            InstituteContactRequest req = new InstituteContactRequest();
            req.setTpoEmail("taken@test.edu");

            when(contactRepository.findById(5)).thenReturn(Optional.of(existing));
            when(contactRepository.findByTpoEmail("taken@test.edu")).thenReturn(Optional.of(other));

            assertThatThrownBy(() -> service.updateContact(5, req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }
    }

    // =========================================================================
    // deleteContact (toggle status)
    // =========================================================================

    @Nested
    @DisplayName("deleteContact")
    class DeleteContact {

        @Test
        @DisplayName("success - toggles status from ACTIVE to INACTIVE")
        void deleteContact_active_becomesInactive() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact contact = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);
            InstituteContact toggled = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.INACTIVE, inst);

            when(contactRepository.findByIdWithInstitute(5)).thenReturn(Optional.of(contact));
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(toggled);

            service.deleteContact(5);

            verify(contactRepository).save(argThat(c -> c.getTpoStatus() == ContactStatus.INACTIVE));
        }

        @Test
        @DisplayName("success - toggles status from INACTIVE to ACTIVE")
        void deleteContact_inactive_becomesActive() {
            Institute inst = buildInstitute(1L, "Anna University");
            InstituteContact contact = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.INACTIVE, inst);
            InstituteContact toggled = buildContact(5, "Ravi", "ravi@test.edu",
                    "9111111111", ContactStatus.ACTIVE, inst);

            when(contactRepository.findByIdWithInstitute(5)).thenReturn(Optional.of(contact));
            when(contactRepository.save(any(InstituteContact.class))).thenReturn(toggled);

            service.deleteContact(5);

            verify(contactRepository).save(argThat(c -> c.getTpoStatus() == ContactStatus.ACTIVE));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when contact not found")
        void deleteContact_notFound_throwsResourceNotFoundException() {
            when(contactRepository.findByIdWithInstitute(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteContact(99))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(contactRepository, never()).save(any());
        }
    }
}
