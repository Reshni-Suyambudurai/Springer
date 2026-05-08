package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.Academy.AcademyEventRequest;
import com.kanini.springer.dto.Academy.AcademyEventResponse;
import com.kanini.springer.entity.Academy.AcademyEvent;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Academy.AcademyEventRepository;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.impl.AcademyEventServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AcademyEventServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class AcademyEventServiceImplTest {

    @InjectMocks
    private AcademyEventServiceImpl service;

    @Mock private AcademyEventRepository eventRepository;
    @Mock private BatchAllocationRepository allocationRepository;
    @Mock private UserRepository userRepository;

    // =========================================================================
    // Helpers
    // =========================================================================

    private AcademyEvent buildEvent(Long id) {
        AcademyEvent e = new AcademyEvent();
        e.setEventId(id);
        e.setTitle("Sprint Review");
        e.setDescription("End of sprint review meeting");
        e.setEventDate(LocalDate.of(2026, 6, 15));
        e.setEventType("MEETING");
        e.setVenue("ONLINE");
        e.setProgramId(1);
        e.setBatchNumber(1);
        return e;
    }

    private AcademyEventRequest buildRequest() {
        AcademyEventRequest req = new AcademyEventRequest();
        req.setTitle("Sprint Review");
        req.setDescription("End of sprint review meeting");
        req.setEventDate("2026-06-15");
        req.setEventTime(null);
        req.setEventType("MEETING");
        req.setVenue("ONLINE");
        req.setProgramId(1);
        req.setBatchNumbers(List.of(1));
        req.setCreatedBy(null);
        return req;
    }

    private BatchAllocation buildAllocation(Long studentId, Integer programId, Integer batchNo) {
        TrainingProgram program = new TrainingProgram();
        program.setProgramId(programId);

        Candidate candidate = new Candidate();
        candidate.setCandidateId(10L);
        candidate.setEmail("intern@kanini.com");
        candidate.setFirstName("Ravi");

        BatchAllocation alloc = new BatchAllocation();
        alloc.setStudentId(studentId);
        alloc.setProgram(program);
        alloc.setBatchNumber(batchNo);
        alloc.setIsActive(true);
        alloc.setCandidate(candidate);
        return alloc;
    }

    // =========================================================================
    // createEvent
    // =========================================================================

    @Nested
    @DisplayName("createEvent")
    class CreateEvent {

        @Test
        @DisplayName("success - creates event and returns response")
        void createEvent_valid_returnsResponse() {
            AcademyEventRequest request = buildRequest();
            AcademyEvent saved = buildEvent(1L);

            when(eventRepository.save(any(AcademyEvent.class))).thenReturn(saved);

            AcademyEventResponse result = service.createEvent(request);

            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Sprint Review");
            assertThat(result.getEventType()).isEqualTo("MEETING");
            assertThat(result.getVenue()).isEqualTo("ONLINE");
            verify(eventRepository).save(any(AcademyEvent.class));
        }

        @Test
        @DisplayName("success - creates event with no programId targets all batches")
        void createEvent_noProgramId_createsSuccessfully() {
            AcademyEventRequest request = buildRequest();
            request.setProgramId(null);
            request.setBatchNumbers(null);

            AcademyEvent saved = buildEvent(1L);
            saved.setProgramId(null);
            saved.setBatchNumber(null);

            when(eventRepository.save(any(AcademyEvent.class))).thenReturn(saved);

            AcademyEventResponse result = service.createEvent(request);

            assertThat(result).isNotNull();
            verify(eventRepository).save(any(AcademyEvent.class));
        }
    }

    // =========================================================================
    // getAllEvents
    // =========================================================================

    @Nested
    @DisplayName("getAllEvents")
    class GetAllEvents {

        @Test
        @DisplayName("success - returns list of all events ordered by date")
        void getAllEvents_returnsList() {
            AcademyEvent event = buildEvent(1L);
            when(eventRepository.findAllByOrderByEventDateAscEventTimeAsc())
                    .thenReturn(List.of(event));

            List<AcademyEventResponse> result = service.getAllEvents();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getTitle()).isEqualTo("Sprint Review");
        }

        @Test
        @DisplayName("success - returns empty list when no events exist")
        void getAllEvents_empty_returnsEmptyList() {
            when(eventRepository.findAllByOrderByEventDateAscEventTimeAsc())
                    .thenReturn(Collections.emptyList());

            List<AcademyEventResponse> result = service.getAllEvents();

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // getEventsForStudent
    // =========================================================================

    @Nested
    @DisplayName("getEventsForStudent")
    class GetEventsForStudent {

        @Test
        @DisplayName("success - returns events for student's program and batch")
        void getEventsForStudent_found_returnsEvents() {
            BatchAllocation alloc = buildAllocation(101L, 1, 1);
            AcademyEvent event = buildEvent(1L);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(eventRepository.findByProgramAndBatch(1, 1)).thenReturn(List.of(event));

            List<AcademyEventResponse> result = service.getEventsForStudent(101L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getEventId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when student not found")
        void getEventsForStudent_studentNotFound_throwsNotFound() {
            when(allocationRepository.findByStudentId(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getEventsForStudent(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("success - returns empty list when no events for student's batch")
        void getEventsForStudent_noEvents_returnsEmpty() {
            BatchAllocation alloc = buildAllocation(101L, 1, 1);

            when(allocationRepository.findByStudentId(101L)).thenReturn(Optional.of(alloc));
            when(eventRepository.findByProgramAndBatch(1, 1)).thenReturn(Collections.emptyList());

            List<AcademyEventResponse> result = service.getEventsForStudent(101L);

            assertThat(result).isEmpty();
        }
    }

    // =========================================================================
    // deleteEvent
    // =========================================================================

    @Nested
    @DisplayName("deleteEvent")
    class DeleteEvent {

        @Test
        @DisplayName("success - deletes existing event")
        void deleteEvent_found_deletesSuccessfully() {
            when(eventRepository.existsById(1L)).thenReturn(true);

            service.deleteEvent(1L);

            verify(eventRepository).deleteById(1L);
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when event not found")
        void deleteEvent_notFound_throwsNotFound() {
            when(eventRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> service.deleteEvent(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("999");
        }
    }
}
