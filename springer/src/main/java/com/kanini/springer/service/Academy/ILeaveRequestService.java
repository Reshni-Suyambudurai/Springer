package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.LeaveRequestRequest;
import com.kanini.springer.dto.Academy.LeaveRequestResponse;
import com.kanini.springer.dto.Academy.LeaveReviewRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ILeaveRequestService {
    LeaveRequestResponse applyLeave(LeaveRequestRequest request);
    LeaveRequestResponse reviewLeave(Long leaveId, LeaveReviewRequest request);
    List<LeaveRequestResponse> getLeavesByStudent(Long studentId);
    List<LeaveRequestResponse> getAllLeaves();
    List<LeaveRequestResponse> getLeavesByBatch(Integer programId, Integer batchNumber);
    LeaveRequestResponse getLeaveById(Long leaveId);
    Page<LeaveRequestResponse> getLeavesFiltered(Integer programId, Integer batchNumber, String status, String search, int page, int size);
}
