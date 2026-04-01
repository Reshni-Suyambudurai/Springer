package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.dto.Academy.BulkAttendanceMarkRequest;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/attendance")
@RequiredArgsConstructor
@Validated
public class AttendanceController {

    private final IAttendanceService attendanceService;

    @PostMapping("/mark")
    public ResponseEntity<ApiResponse<AttendanceResponse>> markAttendance(
            @Valid @RequestBody AttendanceMarkRequest request) {
        AttendanceResponse response = attendanceService.markAttendance(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attendance marked successfully", response));
    }

    @PostMapping("/mark-bulk")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> markAttendanceBulk(
            @Valid @RequestBody BulkAttendanceMarkRequest request) {
        List<AttendanceResponse> response = attendanceService.markAttendanceBulk(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bulk attendance marked successfully", response));
    }

    @GetMapping("/{studentId}/summary")
    public ResponseEntity<ApiResponse<AttendanceStatsResponse>> getAttendanceSummary(
            @PathVariable Long studentId) {
        AttendanceStatsResponse response = attendanceService.getAttendanceSummary(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Attendance summary retrieved successfully", response));
    }
}
