package com.kanini.springer.service.Trainee;

import com.kanini.springer.dto.Trainee.InternActivationRequest;
import com.kanini.springer.dto.Trainee.InternActivationResponse;

public interface IInternActivationService {
    InternActivationResponse activateIntern(Long candidateId, InternActivationRequest request);
}
