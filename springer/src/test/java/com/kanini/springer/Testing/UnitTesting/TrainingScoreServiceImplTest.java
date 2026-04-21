package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ScoreStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.TrainingScoreMapper;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Academy.TrainingScoreRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.impl.TrainingScoreServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrainingScoreServiceImplTest {

    @InjectMocks private TrainingScoreServiceImpl service;
    @Mock private TrainingScoreRepository scoreRepository;
    @Mock private TrainingCourseRepository courseRepository;
    @Mock private BatchAllocationRepository allocationRepository;
    @Mock private BatchCourseRepository batchCourseRepository;
    @Mock private UserRepository userRepository;
    @Mock private TrainingScoreMapper mapper;

    private TrainingCourse buildCourse(Integer id) {
        TrainingCourse c = new TrainingCourse();
        c.setCourseId(id);
        c.setCourseName("Java Fundamentals");
        c.setMinScore(60);
        c.setWeightage(30);
        return c;
    }

    private BatchAllocation buildAllocation(Long studentId) {
        BatchAllocation a = new BatchAllocation();
        a.setStudentId(studentId);
        a.setOverallWeightedScore(BigDecimal.ZERO);
        com.kanini.springer.entity.Drive.Candidate candidate = new com.kanini.springer.entity.Drive.Candidate();
        candidate.setCandidateId(10L);
        a.setCandidate(candidate);
        return a;
    }

    private TrainingScore buildScore(Long id, int score) {
        TrainingScore s = new TrainingScore();
        s.setScoreId(id);
        s.setScore(score);
        s.setStatus(ScoreStatus.GOOD);
        s.setCourse(buildCourse(1));
        s.setStudent(buildAllocation(101L));
        return s;
    }

    private TrainingScoreResponse buildResponse(Integer id) {
        TrainingScoreResponse r = new TrainingScoreResponse();
        r.setScoreId(id);
        return r;
    }

    @Nested @DisplayName("createScore")
    class CreateScore {

        @Test @DisplayName("success - creates score and recalculates overall")
        void create_valid_success() {
            TrainingCourse course = buildCourse(1);
            BatchAllocation student = buildAllocation(101L);
            User reviewer = new User(); reviewer.setUserId(5L);
            TrainingScore saved = buildScore(1L, 85);
            TrainingScoreResponse response = buildResponse(1);

            TrainingScoreRequest req = new TrainingScoreRequest();
            req.setCourseId(1);
            req.setStudentId(101L);
            req.setReviewedBy(5L);
            req.setScore(85);

            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(course));
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(userRepository.findById(5L)).thenReturn(Optional.of(reviewer));
            when(mapper.toEntity(req)).thenReturn(saved);
            when(scoreRepository.save(any())).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);
            when(scoreRepository.findAllByCandidateId(10L)).thenReturn(List.of(saved));
            when(allocationRepository.save(any())).thenReturn(student);

            TrainingScoreResponse result = service.createScore(req);
            assertThat(result).isNotNull();
            verify(scoreRepository).save(any());
        }

        @Test @DisplayName("failure - throws IllegalArgumentException when score > 100")
        void create_scoreAbove100_throwsIllegalArgument() {
            TrainingCourse course = buildCourse(1);
            BatchAllocation student = buildAllocation(101L);
            User reviewer = new User(); reviewer.setUserId(5L);

            TrainingScoreRequest req = new TrainingScoreRequest();
            req.setCourseId(1); req.setStudentId(101L); req.setReviewedBy(5L); req.setScore(150);

            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(course));
            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(userRepository.findById(5L)).thenReturn(Optional.of(reviewer));
            when(mapper.toEntity(req)).thenReturn(buildScore(1L, 150));

            assertThatThrownBy(() -> service.createScore(req))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("0 and 100");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when course not found")
        void create_courseNotFound_throwsNotFound() {
            TrainingScoreRequest req = new TrainingScoreRequest();
            req.setCourseId(99); req.setStudentId(101L); req.setReviewedBy(5L); req.setScore(80);

            when(courseRepository.findByCourseId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createScore(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void create_studentNotFound_throwsNotFound() {
            TrainingScoreRequest req = new TrainingScoreRequest();
            req.setCourseId(1); req.setStudentId(999L); req.setReviewedBy(5L); req.setScore(80);

            when(courseRepository.findByCourseId(1)).thenReturn(Optional.of(buildCourse(1)));
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.createScore(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getScoresByStudent")
    class GetByStudent {

        @Test @DisplayName("success - returns scores for valid student")
        void getByStudent_found_returnsList() {
            BatchAllocation student = buildAllocation(101L);
            TrainingScore score = buildScore(1L, 85);
            TrainingScoreResponse response = buildResponse(1);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(student));
            when(scoreRepository.findByStudent_StudentId(101L)).thenReturn(List.of(score));
            when(mapper.toResponse(score)).thenReturn(response);

            assertThat(service.getScoresByStudent(101L)).hasSize(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void getByStudent_notFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getScoresByStudent(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("deleteScore")
    class DeleteScore {

        @Test @DisplayName("success - deletes existing score")
        void delete_found_deletesSuccessfully() {
            TrainingScore score = buildScore(1L, 85);
            when(scoreRepository.findByScoreId(1)).thenReturn(Optional.of(score));

            service.deleteScore(1);
            verify(scoreRepository).delete(score);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void delete_notFound_throwsNotFound() {
            when(scoreRepository.findByScoreId(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.deleteScore(99))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
