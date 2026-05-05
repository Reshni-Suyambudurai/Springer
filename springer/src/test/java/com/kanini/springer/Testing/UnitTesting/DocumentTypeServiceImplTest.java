package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.DocumentCollection.DocumentTypeRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentTypeResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.DocumentCollection.DocumentTypeMapper;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.service.DocumentCollection.impl.DocumentTypeServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
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
 * Unit tests for {@link DocumentTypeServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class DocumentTypeServiceImplTest {

    @InjectMocks
    private DocumentTypeServiceImpl service;

    @Mock
    private DocumentTypeRepository typeRepository;

    @Mock
    private DocumentSubmissionRepository submissionRepository;

    @Mock
    private DocumentTypeMapper mapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private DocumentType buildEntity(Long id, Enums.DocumentType type) {
        DocumentType dt = new DocumentType();
        dt.setDocumentTypeId(id);
        dt.setDocumentType(type);
        dt.setCreatedAt(LocalDateTime.now());
        return dt;
    }

    private DocumentTypeResponse buildResponse(Long id, String type) {
        DocumentTypeResponse r = new DocumentTypeResponse();
        r.setDocumentTypeId(id);
        r.setDocumentType(type);
        return r;
    }

    // =========================================================================
    // createType
    // =========================================================================

    @Nested
    @DisplayName("createType")
    class CreateType {

        @Test
        @DisplayName("success - creates RESUME document type")
        void createType_resume_success() {
            DocumentTypeRequest request = new DocumentTypeRequest();
            request.setDocumentType("RESUME");

            DocumentType entity = buildEntity(1L, Enums.DocumentType.RESUME);
            DocumentTypeResponse response = buildResponse(1L, "RESUME");

            when(typeRepository.existsByDocumentType(Enums.DocumentType.RESUME)).thenReturn(false);
            when(mapper.toEntity(request)).thenReturn(entity);
            when(typeRepository.save(any(DocumentType.class))).thenReturn(entity);
            when(mapper.toResponse(entity)).thenReturn(response);

            DocumentTypeResponse result = service.createType(request);

            assertThat(result).isNotNull();
            assertThat(result.getDocumentType()).isEqualTo("RESUME");
            verify(typeRepository).save(any(DocumentType.class));
        }

        @Test
        @DisplayName("failure - throws ValidationException for duplicate document type")
        void createType_duplicate_throwsValidation() {
            DocumentTypeRequest request = new DocumentTypeRequest();
            request.setDocumentType("RESUME");

            when(typeRepository.existsByDocumentType(Enums.DocumentType.RESUME)).thenReturn(true);

            assertThatThrownBy(() -> service.createType(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid document type")
        void createType_invalidType_throwsValidation() {
            DocumentTypeRequest request = new DocumentTypeRequest();
            request.setDocumentType("INVALID_TYPE");
            assertThatThrownBy(() -> service.createType(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid document type");
        }

        @ParameterizedTest
        @NullAndEmptySource
        @DisplayName("failure - throws ValidationException for null or empty document type")
        void createType_nullOrEmpty_throwsValidation(String value) {
            DocumentTypeRequest request = new DocumentTypeRequest();
            request.setDocumentType(value);
            assertThatThrownBy(() -> service.createType(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("cannot be empty");
        }
    }

    // =========================================================================
    // getTypeById
    // =========================================================================

    @Nested
    @DisplayName("getTypeById")
    class GetTypeById {

        @Test
        @DisplayName("success - returns document type for valid ID")
        void getTypeById_found_returnsResponse() {
            DocumentType entity = buildEntity(1L, Enums.DocumentType.RESUME);
            DocumentTypeResponse response = buildResponse(1L, "RESUME");

            when(typeRepository.findById(1L)).thenReturn(Optional.of(entity));
            when(mapper.toResponse(entity)).thenReturn(response);

            DocumentTypeResponse result = service.getTypeById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getDocumentTypeId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent ID")
        void getTypeById_notFound_throwsNotFound() {
            when(typeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getTypeById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =========================================================================
    // getAllTypes
    // =========================================================================

    @Nested
    @DisplayName("getAllTypes")
    class GetAllTypes {

        @Test
        @DisplayName("success - returns list of all document types")
        void getAllTypes_returnsList() {
            DocumentType entity = buildEntity(1L, Enums.DocumentType.RESUME);
            DocumentTypeResponse response = buildResponse(1L, "RESUME");

            when(typeRepository.findAll()).thenReturn(List.of(entity));
            when(mapper.toResponse(entity)).thenReturn(response);

            List<DocumentTypeResponse> result = service.getAllTypes();

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("success - returns empty list when no types configured")
        void getAllTypes_empty_returnsEmptyList() {
            when(typeRepository.findAll()).thenReturn(Collections.emptyList());

            List<DocumentTypeResponse> result = service.getAllTypes();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // updateType
    // =========================================================================

    @Nested
    @DisplayName("updateType")
    class UpdateType {

        @Test
        @DisplayName("success - updates document type to PHOTO")
        void updateType_valid_success() {
            DocumentType entity = buildEntity(1L, Enums.DocumentType.RESUME);
            DocumentType updated = buildEntity(1L, Enums.DocumentType.PHOTO);
            DocumentTypeResponse response = buildResponse(1L, "PHOTO");

            DocumentTypeRequest request = new DocumentTypeRequest();
            request.setDocumentType("PHOTO");

            when(typeRepository.findById(1L)).thenReturn(Optional.of(entity));
            when(typeRepository.existsByDocumentType(Enums.DocumentType.PHOTO)).thenReturn(false);
            when(typeRepository.save(any(DocumentType.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            DocumentTypeResponse result = service.updateType(1L, request);

            assertThat(result.getDocumentType()).isEqualTo("PHOTO");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when type not found")
        void updateType_notFound_throwsNotFound() {
            when(typeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateType(99L, new DocumentTypeRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException for duplicate type on update")
        void updateType_duplicate_throwsValidation() {
            DocumentType entity = buildEntity(1L, Enums.DocumentType.RESUME);
            DocumentTypeRequest request = new DocumentTypeRequest();
            request.setDocumentType("PHOTO");

            when(typeRepository.findById(1L)).thenReturn(Optional.of(entity));
            when(typeRepository.existsByDocumentType(Enums.DocumentType.PHOTO)).thenReturn(true);

            assertThatThrownBy(() -> service.updateType(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already exists");
        }
    }

    // =========================================================================
    // deleteType
    // =========================================================================

    @Nested
    @DisplayName("deleteType")
    class DeleteType {

        @Test
        @DisplayName("success - deletes document type")
        void deleteType_found_deletesSuccessfully() {
            DocumentType entity = buildEntity(1L, Enums.DocumentType.RESUME);

            when(typeRepository.findById(1L)).thenReturn(Optional.of(entity));

            service.deleteType(1L);

            verify(typeRepository).delete(entity);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when type not found")
        void deleteType_notFound_throwsNotFound() {
            when(typeRepository.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.deleteType(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
