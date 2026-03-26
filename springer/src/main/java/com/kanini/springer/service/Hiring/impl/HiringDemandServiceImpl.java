package com.kanini.springer.service.Hiring.impl;

import com.kanini.springer.dto.Hiring.HiringDemandRequest;
import com.kanini.springer.dto.Hiring.HiringDemandResponse;
import com.kanini.springer.entity.Drive.RequisitionSkill;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.HiringDemand;
import com.kanini.springer.entity.HiringReq.Skill;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApprovalStatus;
import com.kanini.springer.entity.enums.Enums.BusinessUnit;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Hiring.HiringDemandMapper;
import com.kanini.springer.repository.Drive.RequisitionSkillRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.HiringDemandRepository;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Hiring.IHiringDemandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HiringDemandServiceImpl implements IHiringDemandService {
    
    private final HiringDemandRepository demandRepository;
    private final HiringCycleRepository cycleRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final RequisitionSkillRepository requisitionSkillRepository;
    private final HiringDemandMapper mapper;
    
    @Override
    @Transactional
    public HiringDemandResponse createDemand(HiringDemandRequest request, Long userId) {
        // Validation: Check if cycle exists
        HiringCycle cycle = cycleRepository.findById(request.getCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", request.getCycleId()));
        
        // Validation: Check if cycle is OPEN
        if (cycle.getStatus() != CycleStatus.OPEN) {
            throw new ValidationException("Cannot create demand for a closed hiring cycle");
        }
        
        // Validation: Check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "ID", userId));
        
        // Validation: Demand count must be positive
        if (request.getDemandCount() <= 0) {
            throw new ValidationException("Demand count must be greater than zero");
        }
        
        // Validation: Check if all skill IDs exist
        List<Skill> skills = new ArrayList<>();
        for (Long skillId : request.getSkillIds()) {
            Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> new ResourceNotFoundException("Skill", "ID", skillId));
            skills.add(skill);
        }
        
        HiringDemand demand = new HiringDemand();
        demand.setCycle(cycle);
        demand.setBusinessUnit(BusinessUnit.valueOf(request.getBusinessUnit()));
        demand.setDemandCount(request.getDemandCount());
        demand.setCompensationBand(request.getCompensationBand());
        demand.setJobDescription(request.getJobDescription());
        demand.setApprovalStatus(request.getApprovalStatus());
        demand.setCreatedBy(user);
        
        HiringDemand savedDemand = demandRepository.save(demand);
        
        // Create RequisitionSkill entries for each skill
        List<RequisitionSkill> requisitionSkills = new ArrayList<>();
        for (Skill skill : skills) {
            RequisitionSkill requisitionSkill = new RequisitionSkill();
            requisitionSkill.setDemand(savedDemand);
            requisitionSkill.setSkill(skill);
            requisitionSkills.add(requisitionSkill);
        }
        requisitionSkillRepository.saveAll(requisitionSkills);
        
        // Reload demand to get the requisition skills for response
        Long demandId = savedDemand.getDemandId();
        savedDemand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring demand", "ID", demandId));
        
        return mapper.toResponse(savedDemand);
    }
    
    @Override
    public HiringDemandResponse getDemandById(Long demandId) {
        HiringDemand demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring demand", "ID", demandId));
        return mapper.toResponse(demand);
    }
    
    @Override
    public List<HiringDemandResponse> getAllDemands() {
        return demandRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<HiringDemandResponse> getDemandsByCycle(Long cycleId) {
        // Validation: Check if cycle exists
        if (!cycleRepository.existsById(cycleId)) {
            throw new ResourceNotFoundException("Hiring cycle", "ID", cycleId);
        }
        
        return demandRepository.findByCycleCycleId(cycleId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<HiringDemandResponse> getDemandsByStatus(String status) {
        try {
            ApprovalStatus approvalStatus = ApprovalStatus.valueOf(status.toUpperCase());
            return demandRepository.findByApprovalStatus(approvalStatus).stream()
                    .map(mapper::toResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid approval status: " + status + 
                    ". Valid values are: DRAFT, SUBMITTED, APPROVED, REJECTED");
        }
    }
    
    @Override
    @Transactional
    public HiringDemandResponse updateDemand(Long demandId, HiringDemandRequest request) {
        HiringDemand demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring demand", "ID", demandId));
        
        // Partial update - only update fields that are provided
        
        // Update cycle if provided
        if (request.getCycleId() != null) {
            // Validation: If changing cycle, check if new cycle exists and is OPEN
            if (!demand.getCycle().getCycleId().equals(request.getCycleId())) {
                HiringCycle newCycle = cycleRepository.findById(request.getCycleId())
                        .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", request.getCycleId()));
                
                if (newCycle.getStatus() != CycleStatus.OPEN) {
                    throw new ValidationException("Cannot move demand to a closed hiring cycle");
                }
                demand.setCycle(newCycle);
            }
        }
        
        // Update businessUnit if provided
        if (request.getBusinessUnit() != null && !request.getBusinessUnit().isBlank()) {
            demand.setBusinessUnit(BusinessUnit.valueOf(request.getBusinessUnit()));
        }
        
        // Update demandCount if provided
        if (request.getDemandCount() != null) {
            // Validation: Demand count must be positive
            if (request.getDemandCount() <= 0) {
                throw new ValidationException("Demand count must be greater than zero");
            }
            demand.setDemandCount(request.getDemandCount());
        }
        
        // Update compensationBand if provided
        if (request.getCompensationBand() != null && !request.getCompensationBand().isBlank()) {
            demand.setCompensationBand(request.getCompensationBand());
        }
        
        // Update jobDescription if provided
        if (request.getJobDescription() != null) {
            demand.setJobDescription(request.getJobDescription());
        }
        
        // Update approvalStatus if provided
        if (request.getApprovalStatus() != null) {
            demand.setApprovalStatus(request.getApprovalStatus());
        }
        
        HiringDemand updatedDemand = demandRepository.save(demand);
        
        // Update RequisitionSkills only if skillIds are provided
        if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
            // Validation: Check if all skill IDs exist
            List<Skill> skills = new ArrayList<>();
            for (Long skillId : request.getSkillIds()) {
                Skill skill = skillRepository.findById(skillId)
                        .orElseThrow(() -> new ResourceNotFoundException("Skill", "ID", skillId));
                skills.add(skill);
            }
            
            // Delete old skills and create new ones
            requisitionSkillRepository.deleteByDemandDemandId(demandId);
            
            List<RequisitionSkill> requisitionSkills = new ArrayList<>();
            for (Skill skill : skills) {
                RequisitionSkill requisitionSkill = new RequisitionSkill();
                requisitionSkill.setDemand(updatedDemand);
                requisitionSkill.setSkill(skill);
                requisitionSkills.add(requisitionSkill);
            }
            requisitionSkillRepository.saveAll(requisitionSkills);
        }
        
        // Reload demand to get the updated requisition skills
        updatedDemand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring demand", "ID", demandId));
        
        return mapper.toResponse(updatedDemand);
    }
    
    @Override
    @Transactional
    public void deleteDemand(Long demandId) {
        HiringDemand demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring demand", "ID", demandId));
        
        // Validation: Cannot delete if demand is already approved
        if (demand.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new ValidationException("Cannot delete approved hiring demand");
        }
        
        // Delete associated requisition skills first
        requisitionSkillRepository.deleteByDemandDemandId(demandId);
        
        demandRepository.delete(demand);
    }
}
