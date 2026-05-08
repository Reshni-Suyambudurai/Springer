package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.InternWarningRequest;
import com.kanini.springer.dto.Academy.InternWarningResponse;

import java.util.List;

public interface IInternWarningService {

    // Recruiter / TC issues a warning to an intern
    InternWarningResponse issueWarning(InternWarningRequest request);

    // Get all warnings — TC / Recruiter view
    List<InternWarningResponse> getAllWarnings();

    // Get all warnings for a specific intern
    List<InternWarningResponse> getWarningsByStudent(Long studentId);

    // Get all warnings for a batch (TC / Recruiter view)
    List<InternWarningResponse> getWarningsByBatch(Integer programId, Integer batchNumber);

    // Intern acknowledges a warning with a comment
    InternWarningResponse acknowledgeWarning(Long warningId, String acknowledgementComment);
}
