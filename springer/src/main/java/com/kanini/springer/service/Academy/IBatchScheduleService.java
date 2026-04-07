package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.BatchScheduleRequest;
import com.kanini.springer.dto.Academy.BatchScheduleResponse;

import java.util.List;

public interface IBatchScheduleService {

    BatchScheduleResponse saveOrUpdateBatchSchedule(BatchScheduleRequest request);

    List<BatchScheduleResponse> getSchedulesByProgram(Integer programId);

    BatchScheduleResponse getScheduleByProgramAndBatch(Integer programId, Integer batchNumber);
}
