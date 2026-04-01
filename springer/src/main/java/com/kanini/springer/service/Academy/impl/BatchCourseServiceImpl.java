package com.kanini.springer.service.Academy.impl;

import com.kanini.springer.dto.Academy.BatchCourseRequest;
import com.kanini.springer.dto.Academy.BatchCourseResponse;
import com.kanini.springer.entity.Academy.BatchCourse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.mapper.Academy.BatchCourseMapper;
import com.kanini.springer.repository.Academy.BatchCourseRepository;
import com.kanini.springer.repository.Academy.TrainingCourseRepository;
import com.kanini.springer.repository.Academy.TrainingProgramRepository;
import com.kanini.springer.service.Academy.IBatchCourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BatchCourseServiceImpl implements IBatchCourseService {
    
    private final BatchCourseRepository batchCourseRepository;
    private final TrainingProgramRepository programRepository;
    private final TrainingCourseRepository courseRepository;
    private final BatchCourseMapper mapper;
    
    @Override
    @Transactional
    public BatchCourseResponse linkCourseToBatch(BatchCourseRequest request) {
        TrainingProgram program = programRepository.findByProgramId(request.getProgramId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Program not found with ID: " + request.getProgramId()));
        
        TrainingCourse course = courseRepository.findByCourseId(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + request.getCourseId()));
        
        // Validate batch number is valid for this program
        if (request.getBatchNo() == null || request.getBatchNo() < 1 || request.getBatchNo() > program.getNumberOfBatches()) {
            throw new IllegalArgumentException("Invalid batch number: " + request.getBatchNo() + ". Program has only " + program.getNumberOfBatches() + " batches. Valid range: 1-" + program.getNumberOfBatches());
        }

        // Validate course belongs to the same year as the program
        if (course.getStartDate() == null) {
            throw new IllegalArgumentException("Course ID: " + course.getCourseId() + " has no start date. Cannot validate year.");
        }
        int courseYear = course.getStartDate().getYear();
        if (courseYear != program.getProgramYear()) {
            throw new IllegalArgumentException(
                "Course '" + course.getCourseName() + "' belongs to year " + courseYear +
                " but program '" + program.getProgramName() + "' is for year " + program.getProgramYear() +
                ". You must create a new course for " + program.getProgramYear() + "."
            );
        }
        
        // Traceability: a course can only be linked to programs within the SAME hiring cycle
        // It can link to multiple programs/batches of the same cycle, but NOT across different cycles
        List<BatchCourse> existingLinks = batchCourseRepository.findByCourse_CourseId(request.getCourseId());
        Long targetCycleId = program.getCycle() != null ? program.getCycle().getCycleId() : null;
        boolean linkedToDifferentCycle = existingLinks.stream()
            .anyMatch(bc -> {
                Long existingCycleId = bc.getProgram() != null && bc.getProgram().getCycle() != null
                    ? bc.getProgram().getCycle().getCycleId() : null;
                return existingCycleId != null && !existingCycleId.equals(targetCycleId);
            });
        if (linkedToDifferentCycle) {
            throw new IllegalArgumentException(
                "Course '" + course.getCourseName() + "' is already linked to a program from a different hiring cycle. " +
                "For traceability, a course can only be used within one hiring cycle."
            );
        }

        BatchCourse batchCourse = mapper.toEntity(request);
        batchCourse.setProgram(program);
        batchCourse.setCourse(course);
        
        BatchCourse savedBatchCourse = batchCourseRepository.save(batchCourse);
        
        // Note: Training days are tracked in TrainingDayAttendance table, not in BatchAllocation
        // Daily attendance records are created separately through the attendance service
        
        return mapper.toResponse(savedBatchCourse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BatchCourseResponse getBatchCourseById(Integer batchCourseId) {
        BatchCourse batchCourse = batchCourseRepository.findByBatchCourseId(batchCourseId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Course not found with ID: " + batchCourseId));
        return mapper.toResponse(batchCourse);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getAllBatchCourses() {
        return batchCourseRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getCoursesByProgram(Integer programId) {
        // Validate program exists first
        programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Program not found with ID: " + programId));
        
        return batchCourseRepository.findByProgram_ProgramId(programId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getCoursesByBatch(Integer programId, Integer batchNumber) {
        // Validate program exists first
        TrainingProgram program = programRepository.findByProgramId(programId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Program not found with ID: " + programId));
        
        // Validate batch number is valid for this program
        if (batchNumber == null || batchNumber < 1 || batchNumber > program.getNumberOfBatches()) {
            throw new IllegalArgumentException("Invalid batch number: " + batchNumber + ". Program has only " + program.getNumberOfBatches() + " batches. Valid range: 1-" + program.getNumberOfBatches());
        }
        
        return batchCourseRepository.findByProgram_ProgramIdAndBatchNo(programId, batchNumber).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<BatchCourseResponse> getCoursesByTrainingCourse(Integer courseId) {
        // Validate course exists first
        courseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Training Course not found with ID: " + courseId));
        
        return batchCourseRepository.findByCourse_CourseId(courseId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void removeCourseFromBatch(Integer batchCourseId) {
        BatchCourse batchCourse = batchCourseRepository.findByBatchCourseId(batchCourseId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch Course not found with ID: " + batchCourseId));
        
        batchCourseRepository.deleteById(batchCourseId);
    }
}
