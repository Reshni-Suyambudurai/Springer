package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.BatchScheduleResponse;
import com.kanini.springer.entity.Academy.BatchSchedule;
import org.springframework.stereotype.Component;

@Component
public class BatchScheduleMapper {

    public BatchScheduleResponse toResponse(BatchSchedule entity) {
        if (entity == null) return null;

        BatchScheduleResponse response = new BatchScheduleResponse();
        response.setBatchScheduleId(entity.getBatchScheduleId());
        response.setBatchNumber(entity.getBatchNumber());
        response.setStartDate(entity.getStartDate());
        response.setEndDate(entity.getEndDate());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getProgram() != null) {
            response.setProgramId(entity.getProgram().getProgramId());
            response.setProgramName(entity.getProgram().getProgramName());
        }

        return response;
    }
}
