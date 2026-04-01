package com.kanini.springer.service.Hiring;

import com.kanini.springer.dto.Hiring.InstituteProgramRequest;
import com.kanini.springer.dto.Hiring.ProgramResponse;

import java.util.List;

public interface IProgramService {
    
    /**
     * Get all programs (name and ID)
     */
    List<ProgramResponse> getAllPrograms();
    
    /**
     * Add programs to an institute
     */
    void addProgramsToInstitute(List<InstituteProgramRequest> requests);
    
    /**
     * Remove a program from an institute
     */
    void removeInstituteProgramMapping(Long instituteProgramId);
}
