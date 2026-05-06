package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.AcademyEventRequest;
import com.kanini.springer.dto.Academy.AcademyEventResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IAcademyEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/events")
@RequiredArgsConstructor
public class AcademyEventController {

    private final IAcademyEventService eventService;

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_HEAD')")
    @PostMapping
    public ResponseEntity<ApiResponse<AcademyEventResponse>> createEvent(
            @Valid @RequestBody AcademyEventRequest request) {
        AcademyEventResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created and notifications sent", response));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_HEAD','TA_MANAGER','INTERN')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<AcademyEventResponse>>> getAllEvents() {
        return ResponseEntity.ok(ApiResponse.success("Events retrieved", eventService.getAllEvents()));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_HEAD','TA_MANAGER','INTERN')")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<AcademyEventResponse>>> getEventsForStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success("Events retrieved", eventService.getEventsForStudent(studentId)));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_HEAD')")
    @DeleteMapping("/{eventId}")
    public ResponseEntity<ApiResponse<String>> deleteEvent(@PathVariable Long eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event deleted", "OK"));
    }
}
