package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.BatchCourseRequest;
import com.kanini.springer.dto.Academy.BatchCourseResponse;
import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.CourseStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Academy.BatchCourseMapper;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.impl.BatchCourseServiceImpl;
import com.kanini.springer.service.Common.INotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchCourseServiceImplTest {

    @InjectMocks private BatchCourseServiceImpl service;

    @Mock private BatchCourseRepository batchCourseRepository;
    @Mock private TrainingProgramRepository programRepository;
    @Mock private TrainingCourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private BatchCourseMapper mapper;
    @Mock private INotificationService notificationService;

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TrainingProgram buildProgram(Integer id, int batches) {
        TrainingProgram p = new TrainingProgram();
        p.setProgramId(id);
        p.setProgramName("Test Program");
        p.setNumberOfBatches(batches);
        return p;
    }

    private TrainingCourse buildCourse(Integer id) {
        TrainingCourse c = new TrainingCourse();
        c.setCourseId(id);
        c.setCourseName("Java Fundamentals");
        return c;
    }

    private User buildUser(Long id) {
        User u = new User();
        u.setUserId(id);
        u.setUsername("trainer1");
        return u;
    }

    private BatchCourse buildBatchCourse(Integer id) {
        BatchCourse bc = new BatchCourse();
        bc.setBatchCourseId(id);
        bc.setBatchNo(1);
        bc.setStatus(CourseStatus.PLANNED);
        bc.setCourse(buildCourse(1));
        bc.setProgram(buildProgram(1, 2));
        bc.setConductedBy(buildUser(10L));
        bc.setCreatedAt(LocalDateTime.now());
        return bc;
    }

    private BatchCourseResponse buildResponse(Integer id) {
        BatchCourseResponse r = new BatchCourseResponse();
        r.setBatchCourseId(id);
        r.setBatchNo(1);
        r.setStatus("PLANNED");
        return r;
    }

    private BatchCourseRequest buildRequest() {
        BatchCourseRequest req = new BatchCourseRequest();
        req.setProgramId(1);
        req.setCourseId(1);
        req.setConductedBy(10L);
        req.setBatchNo(1);
        req.setStartDate(LocalDate.of(2026, 1, 1));
        req.setEndDate(LocalDate.of(2026, 3, 31));
        return req;
    }

    // ── linkCourseToBatch ─────────────────────────────────────────────────────

    @Nested @DisplayName("linkCourseToBatch")
    class LinkCourseToBatch {

        @Test @DisplayName("success - links course to batch and sends notification")
        void link_valid_success() {
            BatchCourseRequest req = buildRequest();
            TrainingProgram program = buildProgram(1, 2);
            TrainingCourse course = buildCourse(1);
            User trainer = buildUser(10L);
            BatchCourse entity = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(program));
            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(course));
            when(userRepository.findById(10L)).thenReturn(Optional.of(trainer));
            when(mapper.toEntity(req)).thenReturn(entity);
            when(batchCourseRepository.save(entity)).thenReturn(entity);
            when(mapper.toResponse(entity)).thenReturn(response);

            BatchCourseResponse result = service.linkCourseToBatch(req);

            assertThat(result).isNotNull();
            assertThat(result.getBatchCourseId()).isEqualTo(1);
            verify(notificationService).createAndSend(eq(10L), anyString(), eq("COURSE_ASSIGNMENT"));
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for invalid program")
        void link_invalidProgram_throwsNotFound() {
            BatchCourseRequest req = buildRequest();
            when(programRepository.findByProgramId(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.linkCourseToBatch(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for invalid course")
        void link_invalidCourse_throwsNotFound() {
            BatchCourseRequest req = buildRequest();
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));
            when(courseRepository.findByCourseId(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.linkCourseToBatch(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for invalid trainer")
        void link_invalidTrainer_throwsNotFound() {
            BatchCourseRequest req = buildRequest();
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));
            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(buildCourse(1)));
            when(userRepository.findById(10L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.linkCourseToBatch(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws IllegalArgumentException for invalid batch number")
        void link_invalidBatchNo_throwsIllegalArgument() {
            BatchCourseRequest req = buildRequest();
            req.setBatchNo(5); // program only has 2 batches
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));
            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(buildCourse(1)));
            when(userRepository.findById(10L)).thenReturn(Optional.of(buildUser(10L)));

            assertThatThrownBy(() -> service.linkCourseToBatch(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid batch number");
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when end date before start date")
        void link_endBeforeStart_throwsIllegalArgument() {
            BatchCourseRequest req = buildRequest();
            req.setEndDate(LocalDate.of(2025, 12, 31)); // before startDate 2026-01-01
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));
            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(buildCourse(1)));
            when(userRepository.findById(10L)).thenReturn(Optional.of(buildUser(10L)));

            assertThatThrownBy(() -> service.linkCourseToBatch(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("End date cannot be before start date");
        }
    }

    // ── updateBatchCourseStatus ───────────────────────────────────────────────

    @Nested @DisplayName("updateBatchCourseStatus")
    class UpdateStatus {

        @Test @DisplayName("success - updates status to CANCELLED")
        void update_toCancelled_success() {
            BatchCourse bc = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);
            response.setStatus("CANCELLED");

            when(batchCourseRepository.findByBatchCourseId(1)).thenReturn(Optional.of(bc));
            when(batchCourseRepository.save(bc)).thenReturn(bc);
            when(mapper.toResponse(bc)).thenReturn(response);

            BatchCourseResponse result = service.updateBatchCourseStatus(1, "CANCELLED");
            assertThat(result.getStatus()).isEqualTo("CANCELLED");
        }

        @Test @DisplayName("failure - throws ValidationException when marking ACTIVE before start date")
        void update_activeBeforeStart_throwsValidation() {
            BatchCourse bc = buildBatchCourse(1);
            bc.setStartDate(LocalDateTime.now().plusDays(5));

            when(batchCourseRepository.findByBatchCourseId(1)).thenReturn(Optional.of(bc));

            assertThatThrownBy(() -> service.updateBatchCourseStatus(1, "ACTIVE"))
                    .isInstanceOf(ValidationException.class);
        }

        @Test @DisplayName("failure - throws ValidationException when marking COMPLETED before end date")
        void update_completedBeforeEnd_throwsValidation() {
            BatchCourse bc = buildBatchCourse(1);
            bc.setEndDate(LocalDateTime.now().plusDays(5));

            when(batchCourseRepository.findByBatchCourseId(1)).thenReturn(Optional.of(bc));

            assertThatThrownBy(() -> service.updateBatchCourseStatus(1, "COMPLETED"))
                    .isInstanceOf(ValidationException.class);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for unknown ID")
        void update_notFound_throwsNotFound() {
            when(batchCourseRepository.findByBatchCourseId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.updateBatchCourseStatus(99, "CANCELLED"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── getBatchCourseById ────────────────────────────────────────────────────

    @Nested @DisplayName("getBatchCourseById")
    class GetById {

        @Test @DisplayName("success - returns batch course for valid ID")
        void getById_found_returnsResponse() {
            BatchCourse bc = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);

            when(batchCourseRepository.findByBatchCourseId(1)).thenReturn(Optional.of(bc));
            when(mapper.toResponse(bc)).thenReturn(response);

            assertThat(service.getBatchCourseById(1).getBatchCourseId()).isEqualTo(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for unknown ID")
        void getById_notFound_throwsNotFound() {
            when(batchCourseRepository.findByBatchCourseId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getBatchCourseById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── getAllBatchCourses ────────────────────────────────────────────────────

    @Nested @DisplayName("getAllBatchCourses")
    class GetAll {

        @Test @DisplayName("success - returns all batch courses")
        void getAll_returnsList() {
            BatchCourse bc = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);

            when(batchCourseRepository.findAll()).thenReturn(List.of(bc));
            when(mapper.toResponse(bc)).thenReturn(response);

            assertThat(service.getAllBatchCourses()).hasSize(1);
        }

        @Test @DisplayName("success - returns empty list when none exist")
        void getAll_empty_returnsEmptyList() {
            when(batchCourseRepository.findAll()).thenReturn(Collections.emptyList());
            assertThat(service.getAllBatchCourses()).isEmpty();
        }
    }

    // ── getCoursesByProgram ───────────────────────────────────────────────────

    @Nested @DisplayName("getCoursesByProgram")
    class GetByProgram {

        @Test @DisplayName("success - returns courses for valid program")
        void getByProgram_found_returnsList() {
            BatchCourse bc = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));
            when(batchCourseRepository.findByProgram_ProgramId(1)).thenReturn(List.of(bc));
            when(mapper.toResponse(bc)).thenReturn(response);

            assertThat(service.getCoursesByProgram(1)).hasSize(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for unknown program")
        void getByProgram_notFound_throwsNotFound() {
            when(programRepository.findByProgramId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getCoursesByProgram(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── getCoursesByBatch ─────────────────────────────────────────────────────

    @Nested @DisplayName("getCoursesByBatch")
    class GetByBatch {

        @Test @DisplayName("success - returns courses for valid program and batch")
        void getByBatch_found_returnsList() {
            BatchCourse bc = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);

            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));
            when(batchCourseRepository.findByProgram_ProgramIdAndBatchNo(1, 1)).thenReturn(List.of(bc));
            when(mapper.toResponse(bc)).thenReturn(response);

            assertThat(service.getCoursesByBatch(1, 1)).hasSize(1);
        }

        @Test @DisplayName("failure - throws IllegalArgumentException for invalid batch number")
        void getByBatch_invalidBatchNo_throwsIllegalArgument() {
            when(programRepository.findByProgramId(1)).thenReturn(Optional.of(buildProgram(1, 2)));

            assertThatThrownBy(() -> service.getCoursesByBatch(1, 5))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── getCoursesByTrainingCourse ────────────────────────────────────────────

    @Nested @DisplayName("getCoursesByTrainingCourse")
    class GetByTrainingCourse {

        @Test @DisplayName("success - returns batch courses for valid course ID")
        void getByCourse_found_returnsList() {
            BatchCourse bc = buildBatchCourse(1);
            BatchCourseResponse response = buildResponse(1);

            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(buildCourse(1)));
            when(batchCourseRepository.findByCourse_CourseId(1)).thenReturn(List.of(bc));
            when(mapper.toResponse(bc)).thenReturn(response);

            assertThat(service.getCoursesByTrainingCourse(1)).hasSize(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for unknown course")
        void getByCourse_notFound_throwsNotFound() {
            when(courseRepository.findByCourseId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getCoursesByTrainingCourse(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ── removeCourseFromBatch ─────────────────────────────────────────────────

    @Nested @DisplayName("removeCourseFromBatch")
    class Remove {

        @Test @DisplayName("success - deletes batch course")
        void remove_found_deletes() {
            BatchCourse bc = buildBatchCourse(1);
            when(batchCourseRepository.findByBatchCourseId(1)).thenReturn(Optional.of(bc));

            service.removeCourseFromBatch(1);

            verify(batchCourseRepository).deleteById(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException for unknown ID")
        void remove_notFound_throwsNotFound() {
            when(batchCourseRepository.findByBatchCourseId(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.removeCourseFromBatch(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
