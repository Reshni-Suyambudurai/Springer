package com.kanini.springer.dto.Academy;

import lombok.Data;
import java.util.List;

@Data
public class AcademyEventRequest {
    private String title;
    private String description;
    private String eventDate;    // YYYY-MM-DD
    private String eventTime;    // HH:mm (optional)
    private String eventType;    // MEETING | ASSESSMENT | REVIEW | SESSION | CLIENT_VISIT | OTHER
    private String venue;        // ONLINE | OFFLINE
    private Integer programId;   // null = all programs
    private List<Integer> batchNumbers; // null or empty = all batches
    private Long createdBy;      // userId
}
