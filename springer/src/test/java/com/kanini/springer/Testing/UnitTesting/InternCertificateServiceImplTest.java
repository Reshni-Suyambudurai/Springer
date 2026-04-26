package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Trainee.InternCertificateResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.InternCertificate;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.InternCertificateRepository;
import com.kanini.springer.service.Trainee.impl.InternCertificateServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link InternCertificateServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class InternCertificateServiceImplTest {

    @InjectMocks
    private InternCertificateServiceImpl service;

    @Mock private InternCertificateRepository certificateRepository;
    @Mock private BatchAllocationRepository allocationRepository;

    // =========================================================================
    // Helpers
    // =========================================================================

    private BatchAllocation buildAllocation(Long studentId) {
        BatchAllocation alloc = new BatchAllocation();
        alloc.setStudentId(studentId);
        return alloc;
    }

    private InternCertificate buildCertificate(Long certId, Long studentId) {
        BatchAllocation alloc = buildAllocation(studentId);
        InternCertificate cert = new InternCertificate();
        cert.setCertificateId(certId);
        cert.setStudent(alloc);
        cert.setCertificateName("AWS Cloud Practitioner");
        cert.setIssuer("Amazon Web Services");
        cert.setIssueDate(LocalDate.of(2026, 1, 15));
        cert.setFileData(new byte[]{1, 2, 3});
        return cert;
    }

    private MultipartFile buildFile(String name, long size) {
        byte[] content = new byte[(int) size];
        return new MockMultipartFile(name, name + ".pdf", "application/pdf", content);
    }

    // =========================================================================
    // uploadCertificate
    // =========================================================================

    @Nested
    @DisplayName("uploadCertificate")
    class UploadCertificate {

        @Test
        @DisplayName("success - uploads valid certificate file")
        void uploadCertificate_valid_returnsResponse() {
            BatchAllocation alloc = buildAllocation(101L);
            InternCertificate saved = buildCertificate(1L, 101L);
            MultipartFile file = buildFile("aws_cert", 1024);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(certificateRepository.save(any(InternCertificate.class))).thenReturn(saved);

            InternCertificateResponse result = service.uploadCertificate(
                    101L, "AWS Cloud Practitioner", "Amazon Web Services",
                    LocalDate.of(2026, 1, 15), file);

            assertThat(result).isNotNull();
            assertThat(result.getCertificateName()).isEqualTo("AWS Cloud Practitioner");
            assertThat(result.getIssuer()).isEqualTo("Amazon Web Services");
            verify(certificateRepository).save(any(InternCertificate.class));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void uploadCertificate_studentNotFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            MultipartFile file = buildFile("file", 100);
            assertThatThrownBy(() -> service.uploadCertificate(
                    999L, "Cert", "Issuer", null, file))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("failure - throws ValidationException when file is empty")
        void uploadCertificate_emptyFile_throwsValidation() {
            BatchAllocation alloc = buildAllocation(101L);
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));

            MultipartFile emptyFile = new MockMultipartFile("file", new byte[0]);

            assertThatThrownBy(() -> service.uploadCertificate(
                    101L, "Cert", "Issuer", null, emptyFile))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when file exceeds 5MB")
        void uploadCertificate_fileTooLarge_throwsValidation() {
            BatchAllocation alloc = buildAllocation(101L);
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));

            MultipartFile largeFile = buildFile("large", 6 * 1024 * 1024); // 6MB

            assertThatThrownBy(() -> service.uploadCertificate(
                    101L, "Cert", "Issuer", null, largeFile))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("5MB");
        }
    }

    // =========================================================================
    // getCertificates
    // =========================================================================

    @Nested
    @DisplayName("getCertificates")
    class GetCertificates {

        @Test
        @DisplayName("success - returns list of certificates for student")
        void getCertificates_found_returnsList() {
            InternCertificate cert = buildCertificate(1L, 101L);
            when(certificateRepository.findByStudent_StudentId(101L)).thenReturn(List.of(cert));

            List<InternCertificateResponse> result = service.getCertificates(101L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getCertificateName()).isEqualTo("AWS Cloud Practitioner");
        }

        @Test
        @DisplayName("success - returns empty list when student has no certificates")
        void getCertificates_none_returnsEmptyList() {
            when(certificateRepository.findByStudent_StudentId(101L)).thenReturn(Collections.emptyList());

            List<InternCertificateResponse> result = service.getCertificates(101L);

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // downloadCertificate
    // =========================================================================

    @Nested
    @DisplayName("downloadCertificate")
    class DownloadCertificate {

        @Test
        @DisplayName("success - returns file bytes for existing certificate")
        void downloadCertificate_found_returnsBytes() {
            InternCertificate cert = buildCertificate(1L, 101L);
            when(certificateRepository.findById(1L)).thenReturn(Optional.of(cert));

            byte[] result = service.downloadCertificate(1L);

            assertThat(result).isNotEmpty();
            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when certificate not found")
        void downloadCertificate_notFound_throwsNotFound() {
            when(certificateRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.downloadCertificate(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }

    // =========================================================================
    // deleteCertificate
    // =========================================================================

    @Nested
    @DisplayName("deleteCertificate")
    class DeleteCertificate {

        @Test
        @DisplayName("success - deletes certificate owned by student")
        void deleteCertificate_ownedByStudent_deletesSuccessfully() {
            InternCertificate cert = buildCertificate(1L, 101L);
            when(certificateRepository.findById(1L)).thenReturn(Optional.of(cert));

            service.deleteCertificate(1L, 101L);

            verify(certificateRepository).delete(cert);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when certificate not found")
        void deleteCertificate_notFound_throwsNotFound() {
            when(certificateRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deleteCertificate(999L, 101L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("failure - throws ValidationException when student does not own certificate")
        void deleteCertificate_notOwner_throwsValidation() {
            InternCertificate cert = buildCertificate(1L, 101L); // owned by student 101
            when(certificateRepository.findById(1L)).thenReturn(Optional.of(cert));

            assertThatThrownBy(() -> service.deleteCertificate(1L, 999L)) // different student
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("not authorized");
        }
    }
}
