package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.BatchCourseRequest;
import com.kanini.springer.dto.Academy.BatchCourseResponse;
import com.kanini.springer.entity.Academy.BatchCourse;
import org.springframework.stereotype.Component;

@Component
public class BatchCourseMapper {

    public BatchCourseResponse toResponse(BatchCourse entity) {
        if (entity == null) return null;

        BatchCourseResponse response = new BatchCourseResponse();
        response.setBatchCourseId(entity.getBatchCourseId());
        response.setBatchNo(entity.getBatchNo());
        response.setCreatedAt(entity.getCreatedAt());

        if (entity.getCourse() != null) {
            response.setCourseId(entity.getCourse().getCourseId());
            response.setCourseName(entity.getCourse().getCourseName());
        }

        if (entity.getProgram() != null) {
            response.setProgramId(entity.getProgram().getProgramId());
            if (entity.getProgram().getCycle() != null) {
                response.setCycleId(entity.getProgram().getCycle().getCycleId());
            }
        }

        response.setStartDate(entity.getStartDate() != null ? entity.getStartDate().toLocalDate() : null);
        response.setEndDate(entity.getEndDate() != null ? entity.getEndDate().toLocalDate() : null);

        if (entity.getConductedBy() != null) {
            response.setConductedBy(entity.getConductedBy().getUserId());
            response.setTrainerName(entity.getConductedBy().getUsername());
        }

        response.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);

        return response;
    }

    public BatchCourse toEntity(BatchCourseRequest request) {
        if (request == null) return null;

        BatchCourse entity = new BatchCourse();
        entity.setBatchNo(request.getBatchNo());
        return entity;
    }
}
