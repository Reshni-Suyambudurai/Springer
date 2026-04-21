package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.ApplicationMapper;
import com.kanini.springer.mapper.Common.ManualOverrideMapper;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidateEvaluationRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveAssignmentRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Common.ManualOverrideRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.service.Drive.impl.ApplicationServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
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
 * Unit tests for {@link ApplicationServiceImpl}.
 *
 * Uses Mockito only — no Spring context loaded.
 * Each service method has a dedicated {@link Nested} class.
 */
@ExtendWith(MockitoExtension.class)
class ApplicationServiceImplTest {

    @InjectMocks
    private ApplicationServiceImpl service;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private CandidatesRepository candidatesRepository;

    @Mock
    private DriveRepository driveRepository;

    @Mock
    private DriveAssignmentRepository driveAssignmentRepository;

    @Mock
    private CandidateEvaluationRepository candidateEvaluationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationMapper mapper;

    @Mock
    private EntityManager entityManager;

    @Mock
    private IOverrideService overrideService;

    @Mock
    private ManualOverrideRepository manualOverrideRepository;

    @Mock
    private ManualOverrideMapper manualOverrideMapper;

    // =========================================================================
    // Helpers
    // =========================================================================

    private Drive buildDrive(Long id) {
        Drive drive = new Drive();
        drive.setDriveId(id);
        drive.setDriveName("Test Drive");
        return drive;
    }

    private User buildUser(Long id) {
        User user = new User();
        user.setUserId(id);
        user.setUsername("testuser");
        return user;
    }

    private Candidate buildCandidate(Long id, ApplicationStage stage, boolean eligible) {
        Candidate candidate = new Candidate();
        candidate.setCandidateId(id);
        candidate.setFirstName("John");
        candidate.setLastName("Doe");
        candidate.setEmail("john@test.com");
        candidate.setApplicationStage(stage);
        candidate.setIsEligible(eligible);
        return candidate;
    }

    private Application buildApplication(Long id, Drive drive, Candidate candidate) {
        Application app = new Application();
        app.setApplicationId(id);
        app.setDrive(drive);
        app.setCandidate(candidate);
        app.setApplicationStatus(ApplicationStatus.ALLOTED);
        app.setRegistrationCode("KA-DRIVE");
        return app;
    }

    private ApplicationResponse buildResponse(Long id) {
        ApplicationResponse r = new ApplicationResponse();
        r.setApplicationId(id);
        r.setApplicationStatus("ALLOTED");
        return r;
    }

    // =========================================================================
    // createApplications
    // =========================================================================

    @Nested
    @DisplayName("createApplications")
    class CreateApplications {

        @Test
        @DisplayName("failure - throws ValidationException when driveId is null")
        void createApplications_nullDriveId_throwsValidation() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(null);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(1L));

            assertThatThrownBy(() -> service.createApplications(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Drive ID is required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when createdBy is null")
        void createApplications_nullCreatedBy_throwsValidation() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(null);
            request.setCandidateIds(List.of(1L));

            assertThatThrownBy(() -> service.createApplications(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Created by user ID is required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when candidateIds is empty")
        void createApplications_emptyCandidateIds_throwsValidation() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of());

            assertThatThrownBy(() -> service.createApplications(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Candidate IDs list cannot be empty");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when drive does not exist")
        void createApplications_nonExistentDrive_throwsNotFound() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(99L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(1L));

            when(driveRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createApplications(request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when createdBy user does not exist")
        void createApplications_nonExistentUser_throwsNotFound() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(99L);
            request.setCandidateIds(List.of(1L));

            when(driveRepository.findById(1L)).thenReturn(Optional.of(buildDrive(1L)));
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.createApplications(request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("success - creates application for eligible SHORTLISTED candidate")
        void createApplications_eligibleShortlisted_success() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(10L));

            Drive drive = buildDrive(1L);
            User user = buildUser(1L);
            Candidate candidate = buildCandidate(10L, ApplicationStage.SHORTLISTED, true);
            Application saved = buildApplication(1L, drive, candidate);
            ApplicationResponse response = buildResponse(1L);

            when(driveRepository.findById(1L)).thenReturn(Optional.of(drive));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(candidatesRepository.findAllById(List.of(10L))).thenReturn(List.of(candidate));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of(saved));
            when(candidatesRepository.saveAll(anyList())).thenReturn(List.of(candidate));
            when(mapper.toResponse(saved)).thenReturn(response);

            BulkApplicationResponse result = service.createApplications(request);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(0);
            assertThat(result.getSuccessfulApplications()).hasSize(1);
            verify(applicationRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("success - creates application for eligible INVITED candidate")
        void createApplications_eligibleInvited_success() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(10L));

            Drive drive = buildDrive(1L);
            User user = buildUser(1L);
            Candidate candidate = buildCandidate(10L, ApplicationStage.INVITED, true);
            Application saved = buildApplication(1L, drive, candidate);
            ApplicationResponse response = buildResponse(1L);

            when(driveRepository.findById(1L)).thenReturn(Optional.of(drive));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(candidatesRepository.findAllById(List.of(10L))).thenReturn(List.of(candidate));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of(saved));
            when(candidatesRepository.saveAll(anyList())).thenReturn(List.of(candidate));
            when(mapper.toResponse(saved)).thenReturn(response);

            BulkApplicationResponse result = service.createApplications(request);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(result.getFailureCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("failure - skips candidate not SHORTLISTED or INVITED")
        void createApplications_wrongStage_skipsCandidate() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(10L));

            Drive drive = buildDrive(1L);
            User user = buildUser(1L);
            Candidate candidate = buildCandidate(10L, ApplicationStage.APPLIED, true);

            when(driveRepository.findById(1L)).thenReturn(Optional.of(drive));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(candidatesRepository.findAllById(List.of(10L))).thenReturn(List.of(candidate));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of());

            BulkApplicationResponse result = service.createApplications(request);

            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getSuccessCount()).isEqualTo(0);
            assertThat(result.getErrorMessages()).isNotEmpty();
        }

        @Test
        @DisplayName("failure - skips ineligible candidate")
        void createApplications_ineligibleCandidate_skipsCandidate() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(10L));

            Drive drive = buildDrive(1L);
            User user = buildUser(1L);
            Candidate candidate = buildCandidate(10L, ApplicationStage.SHORTLISTED, false);

            when(driveRepository.findById(1L)).thenReturn(Optional.of(drive));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(candidatesRepository.findAllById(List.of(10L))).thenReturn(List.of(candidate));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of());

            BulkApplicationResponse result = service.createApplications(request);

            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getErrorMessages().get(0)).contains("not eligible");
        }

        @Test
        @DisplayName("failure - reports missing candidate in batch")
        void createApplications_candidateNotFound_reportsError() {
            ApplicationRequest request = new ApplicationRequest();
            request.setDriveId(1L);
            request.setCreatedBy(1L);
            request.setCandidateIds(List.of(99L));

            Drive drive = buildDrive(1L);
            User user = buildUser(1L);

            when(driveRepository.findById(1L)).thenReturn(Optional.of(drive));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(candidatesRepository.findAllById(List.of(99L))).thenReturn(Collections.emptyList());
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of());

            BulkApplicationResponse result = service.createApplications(request);

            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getErrorMessages().get(0)).contains("not found");
        }
    }

    // =========================================================================
    // getAllApplications
    // =========================================================================

    @Nested
    @DisplayName("getAllApplications")
    class GetAllApplications {

        @Test
        @DisplayName("success - returns list of all applications")
        void getAllApplications_returnsList() {
            Drive drive = buildDrive(1L);
            Candidate candidate = buildCandidate(1L, ApplicationStage.SCHEDULED, true);
            Application app = buildApplication(1L, drive, candidate);
            ApplicationResponse response = buildResponse(1L);

            when(applicationRepository.findAll()).thenReturn(List.of(app));
            when(mapper.toResponse(app)).thenReturn(response);

            List<ApplicationResponse> result = service.getAllApplications();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getApplicationId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("success - returns empty list when no applications")
        void getAllApplications_empty_returnsEmptyList() {
            when(applicationRepository.findAll()).thenReturn(Collections.emptyList());

            List<ApplicationResponse> result = service.getAllApplications();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // getApplicationsByDriveId
    // =========================================================================

    @Nested
    @DisplayName("getApplicationsByDriveId")
    class GetApplicationsByDriveId {

        @Test
        @DisplayName("success - returns applications for valid drive")
        void getApplicationsByDriveId_found_returnsList() {
            Drive drive = buildDrive(1L);
            Candidate candidate = buildCandidate(1L, ApplicationStage.SCHEDULED, true);
            Application app = buildApplication(1L, drive, candidate);
            ApplicationResponse response = buildResponse(1L);

            when(applicationRepository.findByDriveDriveId(1L)).thenReturn(List.of(app));
            when(mapper.toResponse(app)).thenReturn(response);
            when(candidateEvaluationRepository.findLatestStatusByApplicationIds(any())).thenReturn(Collections.emptyList());

            List<ApplicationResponse> result = service.getApplicationsByDriveId(1L);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("failure - throws ValidationException when driveId is null")
        void getApplicationsByDriveId_nullId_throwsValidation() {
            assertThatThrownBy(() -> service.getApplicationsByDriveId(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Drive ID is required");
        }
    }

    // =========================================================================
    // updateApplicationStatus
    // =========================================================================

    @Nested
    @DisplayName("updateApplicationStatus")
    class UpdateApplicationStatus {

        @Test
        @DisplayName("success - updates application status")
        void updateApplicationStatus_valid_success() {
            Drive drive = buildDrive(1L);
            Candidate candidate = buildCandidate(1L, ApplicationStage.SCHEDULED, true);
            Application app = buildApplication(1L, drive, candidate);
            app.setApplicationStatus(ApplicationStatus.IN_DRIVE);
            Application updated = buildApplication(1L, drive, candidate);
            updated.setApplicationStatus(ApplicationStatus.SELECTED);

            ApplicationResponse response = buildResponse(1L);
            response.setApplicationStatus("SELECTED");

            ApplicationStatusUpdateRequest request = new ApplicationStatusUpdateRequest("SELECTED", 1L);

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));
            when(applicationRepository.save(any(Application.class))).thenReturn(updated);
            when(mapper.toResponse(updated)).thenReturn(response);

            ApplicationResponse result = service.updateApplicationStatus(1L, request);

            assertThat(result.getApplicationStatus()).isEqualTo("SELECTED");
            verify(applicationRepository).save(any(Application.class));
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException for non-existent application")
        void updateApplicationStatus_notFound_throwsNotFound() {
            when(applicationRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateApplicationStatus(99L,
                    new ApplicationStatusUpdateRequest("SELECTED", 1L)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when applicationId is null")
        void updateApplicationStatus_nullId_throwsValidation() {
            assertThatThrownBy(() -> service.updateApplicationStatus(null,
                    new ApplicationStatusUpdateRequest("SELECTED", 1L)))
                    .isInstanceOf(ValidationException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when status is blank")
        void updateApplicationStatus_blankStatus_throwsValidation() {
            assertThatThrownBy(() -> service.updateApplicationStatus(1L,
                    new ApplicationStatusUpdateRequest("", 1L)))
                    .isInstanceOf(ValidationException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid status string")
        void updateApplicationStatus_invalidStatus_throwsValidation() {
            Drive drive = buildDrive(1L);
            Candidate candidate = buildCandidate(1L, ApplicationStage.SCHEDULED, true);
            Application app = buildApplication(1L, drive, candidate);

            when(applicationRepository.findById(1L)).thenReturn(Optional.of(app));

            assertThatThrownBy(() -> service.updateApplicationStatus(1L,
                    new ApplicationStatusUpdateRequest("INVALID_STATUS", 1L)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid application status");
        }
    }

    // =========================================================================
    // bulkUpdateApplicationStatus
    // =========================================================================

    @Nested
    @DisplayName("bulkUpdateApplicationStatus")
    class BulkUpdateApplicationStatus {

        @Test
        @DisplayName("failure - throws ValidationException when applications list is empty")
        void bulkUpdate_emptyList_throwsValidation() {
            BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
            request.setApplicationIds(List.of());

            assertThatThrownBy(() -> service.bulkUpdateApplicationStatus(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Application IDs list cannot be empty");
        }

        @Test
        @DisplayName("success - updates IN_DRIVE to SELECTED and sets candidate stage to SELECTED")
        void bulkUpdate_selectedStatus_updatesCandidateStage() {
            Drive drive = buildDrive(1L);
            Candidate candidate = buildCandidate(1L, ApplicationStage.SCHEDULED, true);
            Application app = buildApplication(1L, drive, candidate);
            app.setApplicationStatus(ApplicationStatus.IN_DRIVE);

            ApplicationResponse response = buildResponse(1L);
            response.setApplicationStatus("SELECTED");

            BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
            request.setApplicationIds(List.of(1L));
            request.setApplicationStatus("SELECTED");

            when(applicationRepository.findAllById(List.of(1L))).thenReturn(List.of(app));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of(app));
            when(candidatesRepository.saveAll(anyList())).thenReturn(List.of(candidate));
            when(mapper.toResponse(app)).thenReturn(response);

            BulkApplicationStatusUpdateResponse result = service.bulkUpdateApplicationStatus(request);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(candidate.getApplicationStage()).isEqualTo(ApplicationStage.SELECTED);
        }

        @Test
        @DisplayName("success - IN_DRIVE to FAILED sets candidate stage to REJECTED")
        void bulkUpdate_failedStatus_setsCandidateRejected() {
            Drive drive = buildDrive(1L);
            Candidate candidate = buildCandidate(1L, ApplicationStage.SCHEDULED, true);
            Application app = buildApplication(1L, drive, candidate);
            app.setApplicationStatus(ApplicationStatus.IN_DRIVE);

            ApplicationResponse response = buildResponse(1L);
            BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
            request.setApplicationIds(List.of(1L));
            request.setApplicationStatus("FAILED");

            when(applicationRepository.findAllById(List.of(1L))).thenReturn(List.of(app));
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of(app));
            when(candidatesRepository.saveAll(anyList())).thenReturn(List.of(candidate));
            when(mapper.toResponse(app)).thenReturn(response);

            BulkApplicationStatusUpdateResponse result = service.bulkUpdateApplicationStatus(request);

            assertThat(result.getSuccessCount()).isEqualTo(1);
            assertThat(candidate.getApplicationStage()).isEqualTo(ApplicationStage.REJECTED);
        }

        @Test
        @DisplayName("failure - reports error for non-existent application")
        void bulkUpdate_nonExistentApp_reportsError() {
            BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
            request.setApplicationIds(List.of(99L));
            request.setApplicationStatus("IN_DRIVE");

            when(applicationRepository.findAllById(List.of(99L))).thenReturn(Collections.emptyList());
            when(applicationRepository.saveAll(anyList())).thenReturn(List.of());

            BulkApplicationStatusUpdateResponse result = service.bulkUpdateApplicationStatus(request);

            assertThat(result.getFailureCount()).isEqualTo(1);
            assertThat(result.getErrorMessages()).isNotEmpty();
        }

        @Test
        @DisplayName("failure - throws ValidationException for invalid status string")
        void bulkUpdate_invalidStatus_throwsValidation() {
            BulkApplicationStatusUpdateRequest request = new BulkApplicationStatusUpdateRequest();
            request.setApplicationIds(List.of(1L));
            request.setApplicationStatus("GARBAGE");

            assertThatThrownBy(() -> service.bulkUpdateApplicationStatus(request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Invalid application status");
        }
    }

    // =========================================================================
    // getBatchCandidatesByDriveId
    // =========================================================================

    @Nested
    @DisplayName("getBatchCandidatesByDriveId")
    class GetBatchCandidatesByDriveId {

        @Test
        @DisplayName("failure - throws ValidationException when driveId is null")
        void getBatchCandidates_nullDriveId_throwsValidation() {
            assertThatThrownBy(() -> service.getBatchCandidatesByDriveId(null))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Drive ID is required");
        }

        @Test
        @DisplayName("success - returns empty map when no applications found")
        void getBatchCandidates_noApplications_returnsEmptyMap() {
            when(applicationRepository.findByDriveDriveId(1L)).thenReturn(Collections.emptyList());

            var result = service.getBatchCandidatesByDriveId(1L);

            assertThat(result).isEmpty();
        }
    }
}
