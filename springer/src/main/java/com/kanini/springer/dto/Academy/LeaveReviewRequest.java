package com.kanini.springer.dto.Academy;

import lombok.Data;

@Data
public class LeaveReviewRequest {
    private String decision; // APPROVE or REJECT
    private String remarks;
    private Long reviewedBy; // userId
}
