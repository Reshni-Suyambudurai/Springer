package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import org.springframework.stereotype.Component;

@Component
public class TrainingCourseMapper {

    public TrainingCourseResponse toResponse(TrainingCourse entity) {
        if (entity == null) return null;

        TrainingCourseResponse response = new TrainingCourseResponse();
        response.setCourseId(entity.getCourseId());
        response.setCourseName(entity.getCourseName());
        response.setDescription(entity.getDescription());
        response.setMinScore(entity.getMinScore());
        response.setWeightage(entity.getWeightage());
        response.setIsCommunication(Boolean.TRUE.equals(entity.getIsCommunication()));
        response.setCommunicationTemplate(entity.getCommunicationTemplate());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }

    public TrainingCourse toEntity(TrainingCourseRequest request) {
        if (request == null) return null;

        TrainingCourse entity = new TrainingCourse();
        entity.setCourseName(request.getCourseName());
        entity.setDescription(request.getDescription());
        entity.setMinScore(request.getMinScore());
        entity.setWeightage(request.getWeightage());
        entity.setIsCommunication(Boolean.TRUE.equals(request.getIsCommunication()));
        // For communication courses: apply template (custom or default), clear weightage
        if (Boolean.TRUE.equals(request.getIsCommunication())) {
            entity.setWeightage(null);
            String tpl = (request.getCommunicationTemplate() != null
                    && !request.getCommunicationTemplate().isBlank())
                    ? request.getCommunicationTemplate()
                    : "[{\"name\":\"Grammar\",\"maxScore\":20},{\"name\":\"Proactiveness\",\"maxScore\":20},{\"name\":\"Fluency\",\"maxScore\":10}]";
            entity.setCommunicationTemplate(tpl);
        } else {
            entity.setWeightage(request.getWeightage());
            entity.setCommunicationTemplate(null);
        }
        return entity;
    }
}
