package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.BatchAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchAllocationRepository extends JpaRepository<BatchAllocation, Long> {
    
    Optional<BatchAllocation> findByStudentId(Long studentId);
    
    List<BatchAllocation> findByProgram_ProgramId(Integer programId);
    
    List<BatchAllocation> findByProgram_ProgramIdAndBatchNumber(Integer programId, Integer batchNumber);
    
    List<BatchAllocation> findByCandidate_CandidateId(Long candidateId);
    
    List<BatchAllocation> findByIsActive(Boolean isActive);
    
    @Query("SELECT ba FROM BatchAllocation ba WHERE ba.program.programId = :programId AND ba.attendancePercentage >= :minAttendance")
    List<BatchAllocation> findByProgramAndMinAttendance(@Param("programId") Integer programId, @Param("minAttendance") java.math.BigDecimal minAttendance);
}
