package com.kanini.springer.service.Trainee;

import com.kanini.springer.dto.Trainee.InternCertificateResponse;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface IInternCertificateService {
    InternCertificateResponse uploadCertificate(Long studentId, String certificateName,
            String issuer, LocalDate issueDate, MultipartFile file);
    List<InternCertificateResponse> getCertificates(Long studentId);
    byte[] downloadCertificate(Long certificateId);
    void deleteCertificate(Long certificateId, Long studentId);
}
