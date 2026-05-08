package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.BatchCourseRequest;
import com.kanini.springer.dto.Academy.BatchCourseResponse;
import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.CourseStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.BatchCourseMapper;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.INotificationService;
import com.kanini.springer.service.Academy.IBatchCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BatchCourseServiceImpl implements IBatchCourseService {

    private static final String PROGRAM_NOT_FOUND = "Training Program not found with ID: ";
    private static final String BATCH_COURSE_NOT_FOUND = "Batch Course not found with ID: ";

    private final BatchCourseRepository batchCourseRepository;
    private final TrainingProgramRepository programRepository;
    private final TrainingCourseRepository courseRepository;
    private final UserRepository userRepository;
    private final BatchCourseMapper mapper;
    private final INotificationService notificationService;

    @Override
    @Transactional
    public BatchCourseResponse linkCourseToBatch(BatchCourseRequest request) {

        TrainingProgram program = programRepository.findByProgramId(request.getProgramId())
                .orElseThrow(() -> new ResourceNotFoundException(PROGRAM_NOT_FOUND + request.getProgramId()));

        TrainingCourse course = courseRepository.findByCourseId(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + request.getCourseId()));

        User trainer = userRepository.findById(request.getConductedBy())
                .orElseThrow(() -> new ResourceNotFoundException("Trainer not found with ID: " + request.getConductedBy()));

        if (request.getBatchNo() == null || request.getBatchNo() < 1 || request.getBatchNo() > program.getNumberOfBatches()) {
            throw new IllegalArgumentException("Invalid batch number: " + request.getBatchNo()
                    + ". Program has " + program.getNumberOfBatches() + " batch(es). Valid range: 1-" + program.getNumberOfBatches());
        }

        if (request.getEndDate() != null && request.getStartDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }

        BatchCourse batchCourse = mapper.toEntity(request);
        batchCourse.setProgram(program);
        batchCourse.setCourse(course);
        batchCourse.setConductedBy(trainer);
        batchCourse.setStartDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null);
        batchCourse.setEndDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null);

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            batchCourse.setStatus(CourseStatus.valueOf(request.getStatus()));
        } else {
            batchCourse.setStatus(CourseStatus.PLANNED);
        }

        BatchCourse saved = batchCourseRepository.save(batchCourse);

        // Send instant notification to trainer via WebSocket
        String startStr = request.getStartDate() != null ? request.getStartDate().toString() : "TBD";
        String endStr   = request.getEndDate()   != null ? request.getEndDate().toString()   : "TBD";
        String message  = String.format(
            "You have been assigned to conduct '%s' for '%s' \u2014 Batch %d (%s to %s)",
            course.getCourseName(), program.getProgramName(),
            request.getBatchNo(), startStr, endStr
        );
        notificationService.createAndSend(request.getConductedBy(), message, "COURSE_ASSIGNMENT");

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BatchCourseResponse updateBatchCourseStatus(Integer batchCourseId, String status) {
        BatchCourse batchCourse = batchCourseRepository.findByBatchCourseId(batchCourseId)
                .orElseThrow(() -> new ResourceNotFoundException(BATCH_COURSE_NOT_FOUND + batchCourseId));

        CourseStatus newStatus = CourseStatus.valueOf(status);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // Cannot manually set ACTIVE if start date hasn't arrived yet
        if (newStatus == CourseStatus.ACTIVE
                && batchCourse.getStartDate() != null
                && now.isBefore(batchCourse.getStartDate())) {
            throw new com.kanini.springer.exception.ValidationException(
                "Cannot mark course as ACTIVE before its start date: "
                + batchCourse.getStartDate().toLocalDate());
        }

        // Cannot manually set COMPLETED if end date hasn't passed yet
        if (newStatus == CourseStatus.COMPLETED
                && batchCourse.getEndDate() != null
                && now.isBefore(batchCourse.getEndDate())) {
            throw new com.kanini.springer.exception.ValidationException(
                "Cannot mark course as COMPLETED before its end date: "
                + batchCourse.getEndDate().toLocalDate());
        }

        batchCourse.setStatus(newStatus);
        return mapper.toResponse(batchCourseRepository.save(batchCourse));
    }

    @Override
    @Transactional(readOnly = true)
    public BatchCourseResponse getBatchCourseById(Integer batchCourseId) {
        return mapper.toResponse(batchCourseRepository.findByBatchCourseId(batchCourseId)
                .orElseThrow(() -> new ResourceNotFoundException(BATCH_COURSE_NOT_FOUND + batchCourseId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getAllBatchCourses() {
        return batchCourseRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getCoursesByProgram(Integer programId) {
        programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException(PROGRAM_NOT_FOUND + programId));
        return batchCourseRepository.findByProgram_ProgramId(programId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getCoursesByBatch(Integer programId, Integer batchNumber) {
        TrainingProgram program = programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException(PROGRAM_NOT_FOUND + programId));
        if (batchNumber == null || batchNumber < 1 || batchNumber > program.getNumberOfBatches()) {
            throw new IllegalArgumentException("Invalid batch number: " + batchNumber);
        }
        return batchCourseRepository.findByProgram_ProgramIdAndBatchNo(programId, batchNumber).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getCoursesByTrainingCourse(Integer courseId) {
        courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        return batchCourseRepository.findByCourse_CourseId(courseId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void removeCourseFromBatch(Integer batchCourseId) {
        batchCourseRepository.findByBatchCourseId(batchCourseId)
                .orElseThrow(() -> new ResourceNotFoundException(BATCH_COURSE_NOT_FOUND + batchCourseId));
        batchCourseRepository.deleteById(batchCourseId);
    }
}
