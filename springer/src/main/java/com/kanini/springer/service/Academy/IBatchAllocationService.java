package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;
import com.kanini.springer.dto.Academy.BatchTransferRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IBatchAllocationService {

    BatchAllocationResponse createAllocation(BatchAllocationRequest request);
    BatchAllocationResponse getAllocationById(Long studentId);
    List<BatchAllocationResponse> getAllAllocations();
    List<BatchAllocationResponse> getAllocationsByProgram(Integer programId);
    List<BatchAllocationResponse> getAllocationsByBatch(Integer programId, Integer batchNumber);
    BatchAllocationResponse updateAllocation(Long studentId, BatchAllocationRequest request);
    void deleteAllocation(Long studentId);
    BatchAllocationResponse markProjectReady(Long studentId);
    BatchAllocationResponse transferStudent(Long studentId, BatchTransferRequest request);

    /** Paginated + filtered — used by CandidateProgress to avoid fetching all students at once. */
    Page<BatchAllocationResponse> getAllocationsByProgramFiltered(
            Integer programId, Integer batchNumber, Boolean isActive,
            String search, int page, int size);
}
