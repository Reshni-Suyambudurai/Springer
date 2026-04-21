package com.kanini.springer.service.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveNotificationRequest {
    private String toEmail;
    private String toName;
    private String internName;
    private String leaveType;
    private String fromDate;
    private String toDate;
    private int totalDays;
    private String reason;
}
