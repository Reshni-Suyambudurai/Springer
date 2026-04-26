package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.ExcelUploadResponse;
import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ITrainingScoreService {

    TrainingScoreResponse createScore(TrainingScoreRequest request);
    List<TrainingScoreResponse> getScoresByStudent(Long studentId);
    List<TrainingScoreResponse> getScoresByBatchAndCourse(Integer programId, Integer batchNumber, Integer courseId);
    TrainingScoreResponse updateScore(Integer scoreId, TrainingScoreRequest request);
    void deleteScore(Integer scoreId);
    ExcelUploadResponse uploadScoresFromExcel(MultipartFile file, Integer programId, Integer batchNumber, Integer courseId, Long reviewedBy);
}
