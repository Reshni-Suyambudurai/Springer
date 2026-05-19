package com.kanini.springer.service.Trainee.impl;

import com.kanini.springer.dto.Trainee.InternCertificateResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.InternCertificate;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.InternCertificateRepository;
import com.kanini.springer.service.Trainee.IInternCertificateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternCertificateServiceImpl implements IInternCertificateService {

    private final InternCertificateRepository certificateRepository;
    private final BatchAllocationRepository allocationRepository;

    @Override
    @Transactional
    public InternCertificateResponse uploadCertificate(Long studentId, String certificateName,
            String issuer, LocalDate issueDate, MultipartFile file) {

        BatchAllocation student = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (certificateName == null || certificateName.isBlank()) {
            throw new ValidationException("Certificate name is required");
        }
        if (certificateName.trim().length() > 200) {
            throw new ValidationException("Certificate name cannot exceed 200 characters");
        }
        if (issuer == null || issuer.isBlank()) {
            throw new ValidationException("Issuer is required");
        }
        if (issuer.trim().length() > 200) {
            throw new ValidationException("Issuer cannot exceed 200 characters");
        }

        if (file == null || file.isEmpty()) {
            throw new ValidationException("Certificate file is required");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ValidationException("File size must be under 5MB");
        }

        try {
            InternCertificate cert = new InternCertificate();
            cert.setStudent(student);
            cert.setCertificateName(certificateName.trim());
            cert.setIssuer(issuer.trim());
            cert.setIssueDate(issueDate);
            cert.setFileData(file.getBytes());

            InternCertificate saved = certificateRepository.save(cert);
            log.info("Certificate uploaded for student: {}, cert: {}", studentId, certificateName);
            return toResponse(saved);
        } catch (Exception e) {
            throw new ValidationException("Failed to upload certificate: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<InternCertificateResponse> getCertificates(Long studentId) {
        return certificateRepository.findByStudent_StudentId(studentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadCertificate(Long certificateId) {
        InternCertificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + certificateId));

        if (cert.getFileData() == null || cert.getFileData().length == 0) {
            throw new ResourceNotFoundException("No file data found for certificate: " + certificateId);
        }

        return cert.getFileData();
    }

    @Override
    @Transactional
    public void deleteCertificate(Long certificateId, Long studentId) {
        InternCertificate cert = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found: " + certificateId));

        // Ownership check — intern can only delete their own certificates
        if (!cert.getStudent().getStudentId().equals(studentId)) {
            throw new ValidationException("You are not authorized to delete this certificate");
        }

        certificateRepository.delete(cert);
        log.info("Certificate deleted: {} by student: {}", certificateId, studentId);
    }

    private InternCertificateResponse toResponse(InternCertificate cert) {
        return new InternCertificateResponse(
                cert.getCertificateId(),
                cert.getStudent().getStudentId(),
                cert.getCertificateName(),
                cert.getIssuer(),
                cert.getIssueDate() != null ? cert.getIssueDate().toString() : null,
                cert.getUploadedAt() != null ? cert.getUploadedAt().toString() : null
        );
    }
}
