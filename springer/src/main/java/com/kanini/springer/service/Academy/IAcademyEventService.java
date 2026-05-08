package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.AcademyEventRequest;
import com.kanini.springer.dto.Academy.AcademyEventResponse;

import java.util.List;

public interface IAcademyEventService {
    AcademyEventResponse createEvent(AcademyEventRequest request);
    List<AcademyEventResponse> getAllEvents();
    List<AcademyEventResponse> getEventsForStudent(Long studentId);
    void deleteEvent(Long eventId);
}
