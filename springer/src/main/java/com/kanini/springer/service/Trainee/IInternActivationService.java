package com.kanini.springer.service.Trainee;

import com.kanini.springer.dto.Trainee.InternActivationRequest;
import com.kanini.springer.dto.Trainee.InternActivationResponse;
import com.kanini.springer.dto.Trainee.BulkInternActivationRequest;
import com.kanini.springer.dto.Trainee.BulkInternActivationResponse;

public interface IInternActivationService {
    InternActivationResponse activateIntern(Long candidateId, InternActivationRequest request);
    BulkInternActivationResponse bulkActivateInterns(BulkInternActivationRequest request);
}
