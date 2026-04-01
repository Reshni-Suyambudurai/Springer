package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;

import java.util.List;

public interface IBatchAllocationService {

    BatchAllocationResponse createAllocation(BatchAllocationRequest request);

    BatchAllocationResponse getAllocationById(Long studentId);

    List<BatchAllocationResponse> getAllAllocations();

    List<BatchAllocationResponse> getAllocationsByProgram(Integer programId);

    List<BatchAllocationResponse> getAllocationsByBatch(Integer programId, Integer batchNumber);

    List<BatchAllocationResponse> getAllocationsByCandidate(Long candidateId);

    BatchAllocationResponse updateAllocation(Long studentId, BatchAllocationRequest request);

    void deleteAllocation(Long studentId);

    List<BatchAllocationResponse> getAllocationsByMinAttendance(Integer programId, double minAttendancePercentage);

    BatchAllocationResponse markProjectReady(Long studentId);
}
