package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.LeaveRequest;
import com.kanini.springer.entity.enums.Enums.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    // All leaves for a student
    List<LeaveRequest> findByStudent_StudentIdOrderByAppliedAtDesc(Long studentId);

    // All leaves — for TC and TA views
    List<LeaveRequest> findAllByOrderByAppliedAtDesc();

    // Filter by status
    List<LeaveRequest> findByStatusOrderByAppliedAtDesc(LeaveStatus status);

    // All leaves for a program+batch
    List<LeaveRequest> findByStudent_Program_ProgramIdAndStudent_BatchNumberOrderByAppliedAtDesc(
            Integer programId, Integer batchNumber);

    // Sum of approved leave days for a student
    @Query("SELECT COALESCE(SUM(DATEDIFF(l.toDate, l.fromDate) + 1), 0) FROM LeaveRequest l " +
           "WHERE l.student.studentId = :studentId AND l.status = 'APPROVED'")
    Integer sumApprovedLeaveDays(@Param("studentId") Long studentId);
}
