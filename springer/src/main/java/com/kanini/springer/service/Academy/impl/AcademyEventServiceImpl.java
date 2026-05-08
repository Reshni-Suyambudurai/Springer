package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.AcademyEventRequest;
import com.kanini.springer.dto.Academy.AcademyEventResponse;
import com.kanini.springer.entity.Academy.AcademyEvent;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.repository.Academy.AcademyEventRepository;
import com.kanini.springer.repository.Academy.BatchAllocationRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Academy.IAcademyEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademyEventServiceImpl implements IAcademyEventService {

    private static final String RETRIEVED_SUCCESSFULLY = " retrieved successfully";

    private final AcademyEventRepository eventRepository;
    private final BatchAllocationRepository allocationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AcademyEventResponse createEvent(AcademyEventRequest request) {
        List<Integer> batchNumbers = request.getBatchNumbers();
        boolean allBatches = batchNumbers == null || batchNumbers.isEmpty();

        if (allBatches) {
            AcademyEvent saved = saveEvent(request, null);
            return toResponse(saved);
        }

        // Create one event per selected batch
        AcademyEvent lastSaved = null;
        for (Integer batchNo : batchNumbers) {
            lastSaved = saveEvent(request, batchNo);
        }
        if (lastSaved == null) {
            throw new IllegalArgumentException("No batch numbers provided to create events for.");
        }
        return toResponse(lastSaved);
    }

    private AcademyEvent saveEvent(AcademyEventRequest request, Integer batchNo) {
        AcademyEvent event = new AcademyEvent();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(LocalDate.parse(request.getEventDate()));
        event.setEventTime(request.getEventTime() != null && !request.getEventTime().isBlank()
                ? LocalTime.parse(request.getEventTime()) : null);
        event.setEventType(request.getEventType());
        event.setVenue(request.getVenue()); // ONLINE or OFFLINE
        event.setProgramId(request.getProgramId());
        event.setBatchNumber(batchNo);
        if (request.getCreatedBy() != null) {
            userRepository.findById(request.getCreatedBy()).ifPresent(event::setCreatedBy);
        }
        AcademyEvent saved = eventRepository.save(event);
        log.info("Academy event created: {} on {} for batch {}", saved.getTitle(), saved.getEventDate(), batchNo);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AcademyEventResponse> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateAscEventTimeAsc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AcademyEventResponse> getEventsForStudent(Long studentId) {
        BatchAllocation allocation = allocationRepository.findByStudentId(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        return eventRepository.findByProgramAndBatch(
                allocation.getProgram().getProgramId(),
                allocation.getBatchNumber())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void deleteEvent(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found: " + eventId);
        }
        eventRepository.deleteById(eventId);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private AcademyEventResponse toResponse(AcademyEvent e) {
        List<Integer> batchNums = e.getBatchNumber() != null
                ? java.util.Collections.singletonList(e.getBatchNumber())
                : null;
        return new AcademyEventResponse(
                e.getEventId(),
                e.getTitle(),
                e.getDescription(),
                e.getEventDate().toString(),
                e.getEventTime() != null ? e.getEventTime().toString() : null,
                e.getEventType(),
                e.getVenue(),
                e.getProgramId(),
                e.getBatchNumber(),
                batchNums,
                e.getCreatedBy() != null ? e.getCreatedBy().getUsername() : null,
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}
