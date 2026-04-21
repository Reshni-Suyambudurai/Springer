package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingCourseMapper;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.service.Academy.impl.TrainingCourseServiceImpl;
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

@ExtendWith(MockitoExtension.class)
class TrainingCourseServiceImplTest {

    @InjectMocks private TrainingCourseServiceImpl service;
    @Mock private TrainingCourseRepository courseRepository;
    @Mock private TrainingCourseMapper mapper;

    private TrainingCourse buildCourse(Integer id, String name) {
        TrainingCourse c = new TrainingCourse();
        c.setCourseId(id);
        c.setCourseName(name);
        c.setWeightage(30);
        c.setMinScore(60);
        return c;
    }

    private TrainingCourseResponse buildResponse(Integer id, String name) {
        TrainingCourseResponse r = new TrainingCourseResponse();
        r.setCourseId(id);
        r.setCourseName(name);
        return r;
    }

    @Nested @DisplayName("createCourse")
    class CreateCourse {

        @Test @DisplayName("success - creates and returns course")
        void create_valid_success() {
            TrainingCourseRequest req = new TrainingCourseRequest();
            req.setCourseName("Java Fundamentals");
            TrainingCourse entity = buildCourse(1, "Java Fundamentals");
            TrainingCourseResponse response = buildResponse(1, "Java Fundamentals");

            when(mapper.toEntity(req)).thenReturn(entity);
            when(courseRepository.save(entity)).thenReturn(entity);
            when(mapper.toResponse(entity)).thenReturn(response);

            TrainingCourseResponse result = service.createCourse(req);
            assertThat(result.getCourseName()).isEqualTo("Java Fundamentals");
            verify(courseRepository).save(entity);
        }
    }

    @Nested @DisplayName("getCourseById")
    class GetById {

        @Test @DisplayName("success - returns course for valid ID")
        void getById_found_returnsResponse() {
            TrainingCourse course = buildCourse(1, "Java Fundamentals");
            TrainingCourseResponse response = buildResponse(1, "Java Fundamentals");

            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(course));
            when(mapper.toResponse(course)).thenReturn(response);

            TrainingCourseResponse result = service.getCourseById(1);
            assertThat(result.getCourseId()).isEqualTo(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void getById_notFound_throwsNotFound() {
            when(courseRepository.findByCourseId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getCourseById(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getAllCourses")
    class GetAll {

        @Test @DisplayName("success - returns all courses")
        void getAll_returnsList() {
            TrainingCourse course = buildCourse(1, "Java Fundamentals");
            TrainingCourseResponse response = buildResponse(1, "Java Fundamentals");

            when(courseRepository.findAll()).thenReturn(List.of(course));
            when(mapper.toResponse(course)).thenReturn(response);

            List<TrainingCourseResponse> result = service.getAllCourses();
            assertThat(result).hasSize(1);
        }

        @Test @DisplayName("success - returns empty list when no courses")
        void getAll_empty_returnsEmptyList() {
            when(courseRepository.findAll()).thenReturn(Collections.emptyList());
            assertThat(service.getAllCourses()).isEmpty();
        }
    }

    @Nested @DisplayName("updateCourse")
    class UpdateCourse {

        @Test @DisplayName("success - updates course name")
        void update_valid_success() {
            TrainingCourse course = buildCourse(1, "Old Name");
            TrainingCourseResponse response = buildResponse(1, "New Name");
            TrainingCourseRequest req = new TrainingCourseRequest();
            req.setCourseName("New Name");

            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(course));
            when(courseRepository.save(course)).thenReturn(course);
            when(mapper.toResponse(course)).thenReturn(response);

            TrainingCourseResponse result = service.updateCourse(1, req);
            assertThat(result.getCourseName()).isEqualTo("New Name");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void update_notFound_throwsNotFound() {
            when(courseRepository.findByCourseId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.updateCourse(99, new TrainingCourseRequest()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("deleteCourse")
    class DeleteCourse {

        @Test @DisplayName("success - archives course by prefixing name")
        void delete_found_archivesCourse() {
            TrainingCourse course = buildCourse(1, "Java Fundamentals");
            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(course));
            when(courseRepository.save(course)).thenReturn(course);

            service.deleteCourse(1);

            assertThat(course.getCourseName()).startsWith("[ARCHIVED]");
            verify(courseRepository).save(course);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void delete_notFound_throwsNotFound() {
            when(courseRepository.findByCourseId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.deleteCourse(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
