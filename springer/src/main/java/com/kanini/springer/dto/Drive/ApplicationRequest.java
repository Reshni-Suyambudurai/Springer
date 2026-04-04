package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.dto.Drive.CandidateFilterRequest;

/**
 * Request DTO for creating application(s) - single or bulk
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationRequest {
    
    private Long driveId;             // required
    private List<Long> candidateIds;  // used in select mode - can be single or multiple
    private CandidateFilterRequest filterRequest; // used in non-select mode - backend resolves all matching IDs
    private LocalDateTime batchTime;  // optional - scheduled batch time for the drive
    private Long createdBy;           // required - userId
}
