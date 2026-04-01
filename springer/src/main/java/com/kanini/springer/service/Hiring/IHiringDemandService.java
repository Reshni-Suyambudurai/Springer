package com.kanini.springer.service.Hiring;

import com.kanini.springer.dto.Hiring.HiringDemandRequest;
import com.kanini.springer.dto.Hiring.HiringDemandResponse;

import java.util.List;

public interface IHiringDemandService {
    
    HiringDemandResponse createDemand(HiringDemandRequest request, Long userId);
    
    HiringDemandResponse getDemandById(Long demandId);
    
    List<HiringDemandResponse> getAllDemands();
    
    List<HiringDemandResponse> getDemandsByCycle(Long cycleId);
    
    List<HiringDemandResponse> getDemandsByStatus(String status);
    
    HiringDemandResponse updateDemand(Long demandId, HiringDemandRequest request);
    
    void deleteDemand(Long demandId);
}
