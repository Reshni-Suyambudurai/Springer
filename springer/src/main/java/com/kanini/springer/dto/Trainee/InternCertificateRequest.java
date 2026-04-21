package com.kanini.springer.dto.Trainee;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class InternCertificateRequest {

    @NotBlank(message = "Certificate name is required")
    private String certificateName;

    @NotBlank(message = "Issuer is required")
    private String issuer;

    private LocalDate issueDate;

    private MultipartFile file;
}
