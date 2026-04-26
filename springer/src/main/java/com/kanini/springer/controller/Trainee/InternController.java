package com.kanini.springer.controller.Trainee;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Authentication.ChangePasswordRequest;
import com.kanini.springer.dto.Trainee.InternActivationRequest;
import com.kanini.springer.dto.Trainee.InternActivationResponse;
import com.kanini.springer.dto.Trainee.InternCertificateResponse;
import com.kanini.springer.dto.Trainee.InternDashboardResponse;
import com.kanini.springer.dto.Trainee.InternProfileRequest;
import com.kanini.springer.dto.Trainee.InternProfileResponse;
import com.kanini.springer.service.Trainee.IInternActivationService;
import com.kanini.springer.service.Trainee.IInternCertificateService;
import com.kanini.springer.service.Trainee.IInternProfileService;
import com.kanini.springer.service.Trainee.IInternService;
import com.kanini.springer.service.Trainee.impl.ChangePasswordServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/intern")
@RequiredArgsConstructor
public class InternController {

    private final IInternService internService;
    private final IInternActivationService internActivationService;
    private final ChangePasswordServiceImpl changePasswordService;
    private final IInternProfileService profileService;
    private final IInternCertificateService certificateService;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<ApiResponse<InternDashboardResponse>> getDashboard(
            @PathVariable Long userId) {
        InternDashboardResponse response = internService.getDashboard(userId);
        return ResponseEntity.ok(ApiResponse.success("Dashboard loaded successfully", response));
    }

    // ── Activation ────────────────────────────────────────────────────────────

    @PostMapping("/activate/{candidateId}")
    public ResponseEntity<ApiResponse<InternActivationResponse>> activateIntern(
            @PathVariable Long candidateId,
            @Valid @RequestBody InternActivationRequest request) {
        InternActivationResponse response = internActivationService.activateIntern(candidateId, request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    // ── Password ──────────────────────────────────────────────────────────────

    @PostMapping("/change-password/{userId}")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Long userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        changePasswordService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", "OK"));
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<InternProfileResponse>> getProfile(
            @PathVariable Long userId) {
        InternProfileResponse response = profileService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @GetMapping("/profile/by-student/{studentId}")
    public ResponseEntity<ApiResponse<InternProfileResponse>> getProfileByStudent(
            @PathVariable Long studentId) {
        InternProfileResponse response = profileService.getProfileByStudentId(studentId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", response));
    }

    @PostMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<InternProfileResponse>> saveOrUpdateProfile(
            @PathVariable Long userId,
            @Valid @RequestBody InternProfileRequest request) {
        InternProfileResponse response = profileService.saveOrUpdateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile saved successfully", response));
    }

    // ── Certificates ──────────────────────────────────────────────────────────

    @PostMapping(value = "/certificates/{studentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<InternCertificateResponse>> uploadCertificate(
            @PathVariable Long studentId,
            @RequestParam String certificateName,
            @RequestParam String issuer,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate issueDate,
            @RequestPart("file") MultipartFile file) {
        InternCertificateResponse response = certificateService.uploadCertificate(
                studentId, certificateName, issuer, issueDate, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Certificate uploaded successfully", response));
    }

    @GetMapping("/certificates/{studentId}")
    public ResponseEntity<ApiResponse<List<InternCertificateResponse>>> getCertificates(
            @PathVariable Long studentId) {
        List<InternCertificateResponse> response = certificateService.getCertificates(studentId);
        return ResponseEntity.ok(ApiResponse.success("Certificates retrieved successfully", response));
    }

    @GetMapping("/certificates/{certificateId}/file")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable Long certificateId) {
        byte[] fileData = certificateService.downloadCertificate(certificateId);

        String contentType = "application/octet-stream";
        if (fileData.length > 3) {
            if (fileData[0] == (byte) 0x25 && fileData[1] == (byte) 0x50) {
                contentType = "application/pdf";
            } else if (fileData[0] == (byte) 0xFF && fileData[1] == (byte) 0xD8) {
                contentType = "image/jpeg";
            } else if (fileData[0] == (byte) 0x89 && fileData[1] == (byte) 0x50) {
                contentType = "image/png";
            }
        }

        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .header("Content-Disposition", "inline; filename=certificate_" + certificateId)
                .body(fileData);
    }

    @DeleteMapping("/certificates/{certificateId}")
    public ResponseEntity<ApiResponse<Void>> deleteCertificate(
            @PathVariable Long certificateId,
            @RequestParam Long studentId) {
        certificateService.deleteCertificate(certificateId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Certificate deleted successfully"));
    }
}
