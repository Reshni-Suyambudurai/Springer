package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.LeaveRequestRequest;
import com.kanini.springer.dto.Academy.LeaveRequestResponse;
import com.kanini.springer.dto.Academy.LeaveReviewRequest;

import java.util.List;

public interface ILeaveRequestService {
    LeaveRequestResponse applyLeave(LeaveRequestRequest request);
    LeaveRequestResponse reviewLeave(Long leaveId, LeaveReviewRequest request); // TA Recruiter only
    List<LeaveRequestResponse> getLeavesByStudent(Long studentId);
    List<LeaveRequestResponse> getAllLeaves();
    List<LeaveRequestResponse> getLeavesByBatch(Integer programId, Integer batchNumber);
    LeaveRequestResponse getLeaveById(Long leaveId);
}
