package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.dto.Academy.BulkAttendanceMarkRequest;
import com.kanini.springer.dto.Academy.ExcelUploadResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @GetMapping("/{studentId}/records")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendanceRecords(
            @PathVariable Long studentId) {
        List<AttendanceResponse> response = attendanceService.getAttendanceRecords(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Attendance records retrieved successfully", response));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ExcelUploadResponse>> uploadAttendance(
            @RequestPart("file") MultipartFile file,
            @RequestParam Integer programId,
            @RequestParam Integer batchNumber) {
        ExcelUploadResponse response = attendanceService.uploadAttendanceFromExcel(file, programId, batchNumber);
        String message = response.getSavedCount() + " record(s) saved, " + response.getFailedCount() + " failed out of " + response.getTotalRows();
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
