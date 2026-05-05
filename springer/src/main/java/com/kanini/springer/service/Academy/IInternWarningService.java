package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.InternWarningRequest;
import com.kanini.springer.dto.Academy.InternWarningResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface IInternWarningService {
    InternWarningResponse issueWarning(InternWarningRequest request);
    List<InternWarningResponse> getAllWarnings();
    List<InternWarningResponse> getWarningsByStudent(Long studentId);
    List<InternWarningResponse> getWarningsByBatch(Integer programId, Integer batchNumber);
    InternWarningResponse acknowledgeWarning(Long warningId, String acknowledgementComment);
    Page<InternWarningResponse> getWarningsFiltered(Integer programId, Integer batchNumber, String status, String warningType, String search, int page, int size);
}
