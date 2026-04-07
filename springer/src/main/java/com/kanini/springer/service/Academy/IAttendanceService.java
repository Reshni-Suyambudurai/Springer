package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.AttendanceMarkRequest;
import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.dto.Academy.BulkAttendanceMarkRequest;
import com.kanini.springer.dto.Academy.ExcelUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAttendanceService {

    AttendanceResponse markAttendance(AttendanceMarkRequest request);
    List<AttendanceResponse> markAttendanceBulk(BulkAttendanceMarkRequest request);
    AttendanceStatsResponse getAttendanceSummary(Long studentId);
    List<AttendanceResponse> getAttendanceRecords(Long studentId);
    ExcelUploadResponse uploadAttendanceFromExcel(MultipartFile file, Integer programId, Integer batchNumber);
}
