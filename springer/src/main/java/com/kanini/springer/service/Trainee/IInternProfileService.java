package com.kanini.springer.service.Trainee;

import com.kanini.springer.dto.Trainee.InternProfileRequest;
import com.kanini.springer.dto.Trainee.InternProfileResponse;

public interface IInternProfileService {
    InternProfileResponse getProfile(Long userId);
    InternProfileResponse getProfileByStudentId(Long studentId);
    InternProfileResponse saveOrUpdateProfile(Long userId, InternProfileRequest request);
}
