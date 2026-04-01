package com.kanini.springer.service.Hiring;

import com.kanini.springer.dto.Hiring.HiringCycleRequest;
import com.kanini.springer.dto.Hiring.HiringCycleResponse;
import com.kanini.springer.dto.Hiring.HiringCycleSummaryResponse;

import java.util.List;

public interface IHiringCycleService {
    
    HiringCycleResponse createCycle(HiringCycleRequest request);
    
    HiringCycleResponse getCycleById(Long cycleId);
    
    List<HiringCycleResponse> getAllCycles();
    
    List<HiringCycleSummaryResponse> getAllCycleSummaries();
    
    List<HiringCycleResponse> getCyclesByStatus(String status);
    
    HiringCycleResponse updateCycle(Long cycleId, HiringCycleRequest request);
    
    void deleteCycle(Long cycleId);
    
    HiringCycleResponse toggleCycleStatus(Long cycleId);
    
    byte[] getJdByCycleId(Long cycleId);
}
