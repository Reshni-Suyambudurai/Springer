package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.dto.Academy.BulkAttendanceMarkRequest;

import java.util.List;

public interface IAttendanceService {

    AttendanceResponse markAttendance(AttendanceMarkRequest request);

    List<AttendanceResponse> markAttendanceBulk(BulkAttendanceMarkRequest request);

    AttendanceStatsResponse getAttendanceSummary(Long studentId);
}
