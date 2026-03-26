package com.kanini.springer.mapper.Drive;

import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateResponse;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.CandidateSkill;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.LifecycleStatus;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CandidateMapper {
    
    private final InstituteRepository instituteRepository;
    private final HiringCycleRepository hiringCycleRepository;
    
    /**
     * Convert Candidate entity to CandidateResponse DTO
     */
    public CandidateResponse toResponse(Candidate candidate) {
        if (candidate == null) {
            return null;
        }
        
        CandidateResponse response = new CandidateResponse();
        response.setCandidateId(candidate.getCandidateId());
        response.setFirstName(candidate.getFirstName());
        response.setLastName(candidate.getLastName());
        response.setEmail(candidate.getEmail());
        response.setMobile(candidate.getMobile());
        response.setCgpa(candidate.getCgpa());
        response.setHistoryOfArrears(candidate.getHistoryOfArrears());
        response.setDegree(candidate.getDegree());
        response.setDepartment(candidate.getDepartment());
        response.setPassoutYear(candidate.getPassoutYear());
        response.setDateOfBirth(candidate.getDateOfBirth());
        response.setAadhaarNumber(candidate.getAadhaarNumber());
        response.setIsEligible(candidate.getIsEligible());
        response.setReason(candidate.getReason());
        response.setStatusHistory(candidate.getStatusHistory());
        response.setCreatedAt(candidate.getCreatedAt());
        response.setUpdatedAt(candidate.getUpdatedAt());
        
        // Map institute details
        if (candidate.getInstitute() != null) {
            response.setInstituteId(candidate.getInstitute().getInstituteId());
            response.setInstituteName(candidate.getInstitute().getInstituteName());
            response.setState(candidate.getInstitute().getState());
            response.setCity(candidate.getInstitute().getCity());
        }
        
        // Map cycle details
        if (candidate.getCycle() != null) {
            response.setCycleId(candidate.getCycle().getCycleId());
        }
        
        // Map applicationType enum to string
        if (candidate.getApplicationType() != null) {
            response.setApplicationType(candidate.getApplicationType().toString());
        }
        
        // Map applicationStage enum to string
        if (candidate.getApplicationStage() != null) {
            response.setApplicationStage(candidate.getApplicationStage().toString());
        }
        
        // Map lifecycleStatus enum to string
        if (candidate.getLifecycleStatus() != null) {
            response.setLifecycleStatus(candidate.getLifecycleStatus().toString());
        }
        
        // Map candidate skills to skill names
        if (candidate.getCandidateSkills() != null && !candidate.getCandidateSkills().isEmpty()) {
            List<String> skillNames = candidate.getCandidateSkills().stream()
                    .filter(cs -> cs.getSkill() != null)
                    .map(cs -> cs.getSkill().getSkillName())
                    .collect(Collectors.toList());
            response.setSkillNames(skillNames);
        } else {
            response.setSkillNames(new ArrayList<>());
        }
        
        return response;
    }
    
    /**
     * Convert list of Candidate entities to list of response DTOs
     */
    public List<CandidateResponse> toResponseList(List<Candidate> candidates) {
        if (candidates == null) {
            return new ArrayList<>();
        }
        
        return candidates.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert CandidateRequest DTO to Candidate entity
     */
    public Candidate toEntity(CandidateRequest request) {
        Candidate candidate = new Candidate();
        
        // Set institute if provided
        if (request.getInstituteId() != null) {
            Institute institute = instituteRepository.findById(request.getInstituteId())
                    .orElseThrow(() -> new RuntimeException("Institute not found with ID: " + request.getInstituteId()));
            candidate.setInstitute(institute);
        }
        
        // Set cycle if provided
        if (request.getCycleId() != null) {
            HiringCycle cycle = hiringCycleRepository.findById(request.getCycleId())
                    .orElseThrow(() -> new RuntimeException("Hiring cycle not found with ID: " + request.getCycleId()));
            candidate.setCycle(cycle);
        }
        
        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setEmail(request.getEmail());
        candidate.setMobile(request.getMobile());
        candidate.setCgpa(request.getCgpa());
        candidate.setHistoryOfArrears(request.getHistoryOfArrears());
        candidate.setDegree(request.getDegree());
        candidate.setDepartment(request.getDepartment());
        candidate.setPassoutYear(request.getPassoutYear());
        candidate.setDateOfBirth(request.getDateOfBirth());
        candidate.setAadhaarNumber(request.getAadhaarNumber());
        
        // Set applicationType from request
        if (request.getApplicationType() != null) {
            candidate.setApplicationType(request.getApplicationType());
        }
        
        // Note: isEligible and reason are set by eligibility validation, not from request
        // ApplicationStage is always APPLIED for new candidates
        candidate.setApplicationStage(ApplicationStage.APPLIED);
        
        // LifecycleStatus is always ACTIVE for new candidates
        candidate.setLifecycleStatus(LifecycleStatus.ACTIVE);
        
        return candidate;
    }
}
