package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.AttendanceResponse;
import com.kanini.springer.dto.Academy.AttendanceStatsResponse;
import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.Academy.TrainingDayAttendance;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class AttendanceMapper {

    /**
     * Build AttendanceResponse after marking attendance for a student
     */
    public AttendanceResponse toAttendanceResponse(
            BatchAllocation student,
            TrainingDayAttendance record,
            long presentDays,
            long absentDays) {

        BigDecimal totalDays = BigDecimal.valueOf(presentDays + absentDays);
        BigDecimal percentage = totalDays.compareTo(BigDecimal.ZERO) > 0
                ? BigDecimal.valueOf(presentDays).divide(totalDays, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        String studentName = buildName(student);

        return AttendanceResponse.builder()
                .studentId(student.getStudentId())
                .studentName(studentName)
                .attendanceDate(record.getAttendanceDate())
                .isPresent(record.getIsPresent())
                .presentDays(presentDays)
                .absentDays(absentDays)
                .attendancePercentage(percentage)
                .build();
    }

    /**
     * Build AttendanceStatsResponse for a student summary
     */
    public AttendanceStatsResponse toStatsResponse(
            BatchAllocation student,
            long presentDays,
            long absentDays) {

        long totalDays = presentDays + absentDays;
        BigDecimal percentage = totalDays > 0
                ? BigDecimal.valueOf((double) presentDays / totalDays * 100)
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return AttendanceStatsResponse.builder()
                .studentId(student.getStudentId())
                .studentName(buildName(student))
                .presentDays(presentDays)
                .absentDays(absentDays)
                .totalDays(totalDays)
                .attendancePercentage(percentage)
                .build();
    }

    private String buildName(BatchAllocation student) {
        if (student.getCandidate() == null) return "Student #" + student.getStudentId();
        String first = student.getCandidate().getFirstName() != null ? student.getCandidate().getFirstName() : "";
        String last  = student.getCandidate().getLastName()  != null ? student.getCandidate().getLastName()  : "";
        return (first + " " + last).trim();
    }
}
