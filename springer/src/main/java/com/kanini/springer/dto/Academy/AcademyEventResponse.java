package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcademyEventResponse {
    private Long eventId;
    private String title;
    private String description;
    private String eventDate;
    private String eventTime;
    private String eventType;
    private String venue;          // ONLINE | OFFLINE
    private Integer programId;
    private Integer batchNumber;
    private List<Integer> batchNumbers;
    private String createdByName;
    private String createdAt;
}
