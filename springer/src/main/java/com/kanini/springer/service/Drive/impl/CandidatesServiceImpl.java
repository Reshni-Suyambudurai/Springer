package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Common.FieldChangeDTO;
import com.kanini.springer.dto.Common.ManualOverrideRequest;
import com.kanini.springer.dto.Drive.BulkCandidateCreateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateFilterRequest;
import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateResponse;
import com.kanini.springer.dto.Drive.CandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateValidationRequest;
import com.kanini.springer.dto.Drive.CandidateValidationResponse;
import com.kanini.springer.dto.Drive.EligibilityValidationResult;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.CandidateSkill;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.Skill;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.LifecycleStatus;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import com.kanini.springer.mapper.Drive.CandidateMapper;
import com.kanini.springer.repository.Drive.CandidateSkillRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.service.Drive.ICandidatesService;
import com.kanini.springer.service.Drive.IEligibilityRuleService;
import com.kanini.springer.specification.CandidateSpecification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.kanini.springer.dto.Drive.FilterOptionsResponse;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidatesServiceImpl implements ICandidatesService {
    
    private final CandidatesRepository candidatesRepository;
    private final InstituteRepository instituteRepository;
    private final HiringCycleRepository hiringCycleRepository;
    private final CandidateMapper mapper;
    private final IOverrideService overrideService;
    private final IEligibilityRuleService eligibilityRuleService;
    private final SkillRepository skillRepository;
    private final CandidateSkillRepository candidateSkillRepository;
    private final UserRepository userRepository;
    private final EntityManager entityManager;
    
    @Override
    @Transactional
    public CandidateResponse createCandidate(CandidateRequest request) {
        // Validate required fields
        if (request.getFirstName() == null || request.getFirstName().isBlank()) {
            throw new ValidationException("First name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ValidationException("Email is required");
        }
        if (request.getMobile() == null || request.getMobile().isBlank()) {
            throw new ValidationException("Mobile number is required");
        }
        
        // Validate cycle status if cycleId is provided
        if (request.getCycleId() != null) {
            validateCycleIsOpen(request.getCycleId());
        }
        
        // Get institute name for comprehensive matching
        Institute institute = instituteRepository.findById(request.getInstituteId())
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", request.getInstituteId()));
        String instituteName = institute.getInstituteName();
        
        // Check for existing candidate using comprehensive matching criteria
        List<Candidate> matches = candidatesRepository.findMatchingCandidates(
                request.getFirstName(),
                request.getLastName(),
                instituteName,
                request.getDegree(),
                request.getDepartment(),
                request.getDateOfBirth(),
                request.getPassoutYear(),
                request.getAadhaarNumber()
        );
        
        // If candidate exists, check cycle and provide detailed error
        if (!matches.isEmpty()) {
            Candidate existingCandidate = matches.get(0);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d/M/yy - h:mma");
            String candidateName = existingCandidate.getFirstName() + " " + existingCandidate.getLastName();
            String formattedDate = existingCandidate.getCreatedAt().format(formatter).toLowerCase();
            
            // Check if they're in the same cycle
            if (request.getCycleId() != null && existingCandidate.getCycle() != null && 
                existingCandidate.getCycle().getCycleId().equals(request.getCycleId())) {
                // Same cycle - reject with detailed message
                String errorMsg = String.format(
                        "Duplicate: %s applied on %s with %s stage and %s lifecycle status",
                        candidateName,
                        formattedDate,
                        existingCandidate.getApplicationStage(),
                        existingCandidate.getLifecycleStatus()
                );
                throw new ValidationException(errorMsg);
            }
            
            // Different cycle - reuse existing candidate and update cycleId
            HiringCycle newCycle = hiringCycleRepository.findById(request.getCycleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", request.getCycleId()));
            existingCandidate.setCycle(newCycle);
            
            // Update mutable fields with new values from the request
            existingCandidate.setFirstName(request.getFirstName());
            if (request.getLastName() != null) {
                existingCandidate.setLastName(request.getLastName());
            }
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                existingCandidate.setEmail(request.getEmail());
            }
            existingCandidate.setMobile(request.getMobile());
            if (request.getCgpa() != null) {
                existingCandidate.setCgpa(request.getCgpa());
            }
            existingCandidate.setHistoryOfArrears(request.getHistoryOfArrears());
            if (request.getDegree() != null) {
                existingCandidate.setDegree(request.getDegree());
            }
            if (request.getDepartment() != null) {
                existingCandidate.setDepartment(request.getDepartment());
            }
            
            // Note: DateOfBirth, PassoutYear, and Institute are NOT updated as they were used for identity verification
            
            // Re-check eligibility with updated data (CGPA may have changed)
            EligibilityValidationResult eligibilityResult = eligibilityRuleService.checkEligibility(
                    existingCandidate.getCgpa(),
                    existingCandidate.getPassoutYear(),
                    existingCandidate.getHistoryOfArrears(),
                    existingCandidate.getDegree(),
                    existingCandidate.getDepartment()
            );
            
            existingCandidate.setIsEligible(eligibilityResult.isEligible());
            
            if (!eligibilityResult.isEligible() && eligibilityResult.getFailedReasons() != null && !eligibilityResult.getFailedReasons().isEmpty()) {
                String reason = String.join("; ", eligibilityResult.getFailedReasons());
                existingCandidate.setReason(reason);
            } else {
                existingCandidate.setReason("");
            }
            
            // Reset applicationStage to APPLIED for new cycle
            existingCandidate.setApplicationStage(ApplicationStage.APPLIED);
            
            // Reset lifecycleStatus to ACTIVE for new cycle
            existingCandidate.setLifecycleStatus(LifecycleStatus.ACTIVE);
            
            // Set applicationType from request if provided
            if (request.getApplicationType() != null) {
                existingCandidate.setApplicationType(request.getApplicationType());
            }
            
            // Append to statusHistory
            appendStatusHistory(existingCandidate, existingCandidate.getApplicationStage(), "System");
            
            // Save updated candidate (createdAt remains old, updatedAt gets updated automatically)
            Candidate savedCandidate = candidatesRepository.save(existingCandidate);
            
            // Update skills if provided
            if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
                // Remove old skills
                candidateSkillRepository.deleteAll(savedCandidate.getCandidateSkills());
                // Map new skills
                mapCandidateSkills(savedCandidate, request.getSkillIds());
            }
            
            // Reload candidate with skills
            Long candidateId = savedCandidate.getCandidateId();
            savedCandidate = candidatesRepository.findByIdWithInstitute(candidateId)
                    .orElseThrow(() -> new ResourceNotFoundException("Candidate", "ID", candidateId));
            
            return mapper.toResponse(savedCandidate);
        }
        
        // No existing candidate - create new one
        Candidate candidate = mapper.toEntity(request);
        
        // Check if email already exists
        Optional<Candidate> existingEmail = candidatesRepository.findByEmail(request.getEmail());
        if (existingEmail.isPresent()) {
            String existingName = existingEmail.get().getFirstName() + 
                                  (existingEmail.get().getLastName() != null ? " " + existingEmail.get().getLastName() : "");
            throw new ValidationException("Email already exists for candidate: " + existingName);
        }
        
        // Check if aadhaar already exists (if provided)
        if (request.getAadhaarNumber() != null && !request.getAadhaarNumber().isBlank()) {
            Optional<Candidate> existingAadhaar = candidatesRepository.findByAadhaarNumber(request.getAadhaarNumber());
            if (existingAadhaar.isPresent()) {
                String existingName = existingAadhaar.get().getFirstName() + 
                                      (existingAadhaar.get().getLastName() != null ? " " + existingAadhaar.get().getLastName() : "");
                throw new ValidationException("Aadhaar number already exists for candidate: " + existingName);
            }
        }
        
        // Check eligibility based on rules
        EligibilityValidationResult eligibilityResult = eligibilityRuleService.checkEligibility(
                candidate.getCgpa(),
                candidate.getPassoutYear(),
                candidate.getHistoryOfArrears(),
                candidate.getDegree(),
                candidate.getDepartment()
        );
        
        candidate.setIsEligible(eligibilityResult.isEligible());
        
        if (!eligibilityResult.isEligible() && eligibilityResult.getFailedReasons() != null && !eligibilityResult.getFailedReasons().isEmpty()) {
            String reason = String.join("; ", eligibilityResult.getFailedReasons());
            candidate.setReason(reason);
        }
        
        // Initialize statusHistory with first entry
        // Note: applicationStage is set to APPLIED in mapper.toEntity()
        // Note: lifecycleStatus is set to ACTIVE in mapper.toEntity()
        // Note: applicationType is set from request in mapper.toEntity()
        appendStatusHistory(candidate, candidate.getApplicationStage(), "System");
        
        Candidate savedCandidate = candidatesRepository.save(candidate);
        
        // Map candidate skills
        if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
            mapCandidateSkills(savedCandidate, request.getSkillIds());
        }
        
        // Reload candidate with skills
        Long candidateId = savedCandidate.getCandidateId();
        savedCandidate = candidatesRepository.findByIdWithInstitute(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "ID", candidateId));
        
        return mapper.toResponse(savedCandidate);
    }
    
    @Override
    @Transactional
 
    public BulkCandidateCreateResponse bulkCreateCandidates(List<CandidateRequest> requests) {
        BulkCandidateCreateResponse response = new BulkCandidateCreateResponse();
        response.setTotalProcessed(requests.size());
        
        if (requests == null || requests.isEmpty()) {
            response.getErrorMessages().add("Request list cannot be empty");
            response.setFailureCount(1);
            return response;
        }
        
        // ===== PRE-FETCH: Batch load all lookup data in a few queries =====
        
        // 1) Batch fetch all existing emails (1 query instead of N)
        List<String> allEmails = requests.stream()
                .filter(r -> r.getEmail() != null && !r.getEmail().isBlank())
                .map(r -> r.getEmail().toLowerCase())
                .collect(Collectors.toList());
        Map<String, Candidate> existingEmailMap = new HashMap<>();
        if (!allEmails.isEmpty()) {
            candidatesRepository.findByEmailIn(allEmails).forEach(c ->
                    existingEmailMap.put(c.getEmail().toLowerCase(), c));
        }
        
        // 2) Batch fetch all existing aadhaars (1 query instead of N)
        List<String> allAadhaars = requests.stream()
                .filter(r -> r.getAadhaarNumber() != null && !r.getAadhaarNumber().isBlank())
                .map(CandidateRequest::getAadhaarNumber)
                .collect(Collectors.toList());
        Map<String, Candidate> existingAadhaarMap = new HashMap<>();
        if (!allAadhaars.isEmpty()) {
            candidatesRepository.findByAadhaarNumberIn(allAadhaars).forEach(c ->
                    existingAadhaarMap.put(c.getAadhaarNumber(), c));
        }
        
        // 3) Batch fetch all institutes (1 query instead of N)
        Set<Long> allInstituteIds = requests.stream()
                .filter(r -> r.getInstituteId() != null)
                .map(CandidateRequest::getInstituteId)
                .collect(Collectors.toSet());
        Map<Long, Institute> instituteMap = new HashMap<>();
        if (!allInstituteIds.isEmpty()) {
            instituteRepository.findAllById(allInstituteIds).forEach(inst ->
                    instituteMap.put(inst.getInstituteId(), inst));
        }
        
        // 4) Cache cycle validation (1 query per unique cycleId instead of N)
        Map<Long, HiringCycle> cycleCache = new HashMap<>();
        Set<Long> uniqueCycleIds = requests.stream()
                .filter(r -> r.getCycleId() != null)
                .map(CandidateRequest::getCycleId)
                .collect(Collectors.toSet());
        for (Long cycleId : uniqueCycleIds) {
            hiringCycleRepository.findById(cycleId).ifPresent(cycle -> cycleCache.put(cycleId, cycle));
        }
        
        // Phase 1: Validate all candidates before inserting any
        List<String> validationErrors = new ArrayList<>();
        Set<String> emailsInBatch = new HashSet<>();
        Set<String> aadhaarsInBatch = new HashSet<>();
        List<Candidate> candidatesToUpdate = new ArrayList<>();
        Set<Integer> updateIndices = new HashSet<>();
        
        for (int i = 0; i < requests.size(); i++) {
            CandidateRequest request = requests.get(i);
            String candidateRef = "Candidate #" + (i + 1);
            boolean isOldCandidate = false;
            
            // Check identity match FIRST to determine if this is an OLD candidate
            try {
                Institute institute = instituteMap.get(request.getInstituteId());
                if (institute == null) {
                    validationErrors.add(candidateRef + ": Institute not found with ID: " + request.getInstituteId());
                    continue;
                }
                String instituteName = institute.getInstituteName();
                
                List<Candidate> matches = candidatesRepository.findMatchingCandidates(
                        request.getFirstName(),
                        request.getLastName(),
                        instituteName,
                        request.getDegree(),
                        request.getDepartment(),
                        request.getDateOfBirth(),
                        request.getPassoutYear(),
                        request.getAadhaarNumber()
                );
                
                if (!matches.isEmpty()) {
                    Candidate existingCandidate = matches.get(0);
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d/M/yy - h:mma");
                    String candidateName = existingCandidate.getFirstName() + " " + existingCandidate.getLastName();
                    String formattedDate = existingCandidate.getCreatedAt().format(formatter).toLowerCase();
                    
                    // Check if same cycle
                    if (request.getCycleId() != null && existingCandidate.getCycle() != null && 
                        existingCandidate.getCycle().getCycleId().equals(request.getCycleId())) {
                        // Same cycle - DUPLICATE error
                        String errorMsg = String.format(
                                "Duplicate: %s applied on %s with %s stage and %s lifecycle status",
                                candidateName,
                                formattedDate,
                                existingCandidate.getApplicationStage(),
                                existingCandidate.getLifecycleStatus()
                        );
                        validationErrors.add(candidateRef + ": " + errorMsg);
                    } else {
                        // Different cycle - OLD candidate, reuse existing record
                        isOldCandidate = true;
                        candidatesToUpdate.add(existingCandidate);
                        updateIndices.add(i);
                    }
                }
            } catch (Exception e) {
                validationErrors.add(candidateRef + ": Error checking for duplicates - " + e.getMessage());
            }
            
            // Skip email/aadhaar uniqueness checks for OLD candidates (they reuse existing records)
            if (!isOldCandidate) {
                // Validate email uniqueness within batch
                if (request.getEmail() == null || request.getEmail().isBlank()) {
                    validationErrors.add(candidateRef + ": Email is required");
                } else {
                    if (emailsInBatch.contains(request.getEmail().toLowerCase())) {
                        validationErrors.add(candidateRef + ": Duplicate email within batch - " + request.getEmail());
                    } else {
                        emailsInBatch.add(request.getEmail().toLowerCase());
                        
                        // Check if email already exists in database (from pre-fetched map)
                        Candidate existingEmail = existingEmailMap.get(request.getEmail().toLowerCase());
                        if (existingEmail != null) {
                            String existingName = existingEmail.getFirstName() + 
                                                  (existingEmail.getLastName() != null ? " " + existingEmail.getLastName() : "");
                            validationErrors.add(candidateRef + ": Email already exists for candidate - " + existingName);
                        }
                    }
                }
                
                // Validate aadhaar uniqueness within batch (if provided)
                if (request.getAadhaarNumber() != null && !request.getAadhaarNumber().isBlank()) {
                    if (aadhaarsInBatch.contains(request.getAadhaarNumber())) {
                        validationErrors.add(candidateRef + ": Duplicate Aadhaar within batch - " + request.getAadhaarNumber());
                    } else {
                        aadhaarsInBatch.add(request.getAadhaarNumber());
                        
                        // Check if aadhaar already exists in database (from pre-fetched map)
                        Candidate existingAadhaar = existingAadhaarMap.get(request.getAadhaarNumber());
                        if (existingAadhaar != null) {
                            String existingName = existingAadhaar.getFirstName() + 
                                                  (existingAadhaar.getLastName() != null ? " " + existingAadhaar.getLastName() : "");
                            validationErrors.add(candidateRef + ": Aadhaar number already exists for candidate - " + existingName);
                        }
                    }
                }
            }
            
            // Validate cycle if provided (using cached cycle)
            if (request.getCycleId() != null) {
                HiringCycle cycle = cycleCache.get(request.getCycleId());
                if (cycle == null) {
                    validationErrors.add(candidateRef + ": Hiring cycle not found with ID: " + request.getCycleId());
                } else if (cycle.getStatus() != CycleStatus.OPEN) {
                    validationErrors.add(candidateRef + ": Cannot add candidates to cycle " + request.getCycleId() + ". Cycle status is " + cycle.getStatus() + ". Only OPEN cycles accept new candidates.");
                }
            }
            
            // Validate required fields
            if (request.getFirstName() == null || request.getFirstName().isBlank()) {
                validationErrors.add(candidateRef + ": First name is required");
            }
            if (request.getCgpa() == null) {
                validationErrors.add(candidateRef + ": CGPA is required");
            }
            if (request.getPassoutYear() == null) {
                validationErrors.add(candidateRef + ": Passout year is required");
            }
        }
        
        // If any validation errors, return failure response with no inserts
        if (!validationErrors.isEmpty()) {
            response.setErrorMessages(validationErrors);
            response.setFailureCount(requests.size());
            response.setSuccessCount(0);
            return response;
        }
        
        // Phase 2: All validations passed - proceed with inserts and updates
        List<Candidate> candidatesToInsert = new ArrayList<>();
        List<CandidateRequest> insertRequests = new ArrayList<>();
        List<CandidateRequest> updateRequests = new ArrayList<>();
        
        for (int i = 0; i < requests.size(); i++) {
            CandidateRequest request = requests.get(i);
            
            // Check if this is an update or insert (O(1) lookup with HashSet)
            if (updateIndices.contains(i)) {
                updateRequests.add(request);
            } else {
                // New candidate - create entity
                try {
                    Candidate candidate = mapper.toEntity(request);
                    
                    // Check eligibility based on rules
                    EligibilityValidationResult eligibilityResult = eligibilityRuleService.checkEligibility(
                            candidate.getCgpa(),
                            candidate.getPassoutYear(),
                            candidate.getHistoryOfArrears(),
                            candidate.getDegree(),
                            candidate.getDepartment()
                    );
                    
                    candidate.setIsEligible(eligibilityResult.isEligible());
                    
                    if (!eligibilityResult.isEligible() && eligibilityResult.getFailedReasons() != null && !eligibilityResult.getFailedReasons().isEmpty()) {
                        String reason = String.join("; ", eligibilityResult.getFailedReasons());
                        candidate.setReason(reason);
                    }
                    
                    // Initialize statusHistory with first entry
                    // Note: applicationStage is set to APPLIED in mapper.toEntity()
                    // Note: lifecycleStatus is set to ACTIVE in mapper.toEntity()
                    // Note: applicationType is set from request in mapper.toEntity()
                    appendStatusHistory(candidate, candidate.getApplicationStage(), "System");
                    
                    candidatesToInsert.add(candidate);
                    insertRequests.add(request);
                } catch (Exception e) {
                    // This shouldn't happen as we validated already, but handle gracefully
                    throw new ValidationException("Error creating candidate entity: " + e.getMessage());
                }
            }
        }
        
        // Update existing candidates (use cached cycle instead of per-row lookup)
        for (int i = 0; i < candidatesToUpdate.size(); i++) {
            Candidate existingCandidate = candidatesToUpdate.get(i);
            CandidateRequest request = updateRequests.get(i);
            
            // Update cycleId if provided (using cached cycle)
            if (request.getCycleId() != null) {
                HiringCycle newCycle = cycleCache.get(request.getCycleId());
                if (newCycle == null) {
                    throw new ResourceNotFoundException("Hiring cycle", "ID", request.getCycleId());
                }
                existingCandidate.setCycle(newCycle);
            }
            
            // Update mutable fields with new values from the request
            existingCandidate.setFirstName(request.getFirstName());
            if (request.getLastName() != null) {
                existingCandidate.setLastName(request.getLastName());
            }
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                existingCandidate.setEmail(request.getEmail());
            }
            existingCandidate.setMobile(request.getMobile());
            if (request.getCgpa() != null) {
                existingCandidate.setCgpa(request.getCgpa());
            }
            existingCandidate.setHistoryOfArrears(request.getHistoryOfArrears());
            if (request.getDegree() != null) {
                existingCandidate.setDegree(request.getDegree());
            }
            if (request.getDepartment() != null) {
                existingCandidate.setDepartment(request.getDepartment());
            }
            
            // Note: DateOfBirth, PassoutYear, and Institute are NOT updated as they were used for identity verification
            
            // Re-check eligibility with updated data (CGPA may have changed)
            EligibilityValidationResult eligibilityResult = eligibilityRuleService.checkEligibility(
                    existingCandidate.getCgpa(),
                    existingCandidate.getPassoutYear(),
                    existingCandidate.getHistoryOfArrears(),
                    existingCandidate.getDegree(),
                    existingCandidate.getDepartment()
            );
            
            existingCandidate.setIsEligible(eligibilityResult.isEligible());
            
            if (!eligibilityResult.isEligible() && eligibilityResult.getFailedReasons() != null && !eligibilityResult.getFailedReasons().isEmpty()) {
                String reason = String.join("; ", eligibilityResult.getFailedReasons());
                existingCandidate.setReason(reason);
            } else {
                existingCandidate.setReason("");
            }
            
            // Reset applicationStage to APPLIED for new cycle
            existingCandidate.setApplicationStage(ApplicationStage.APPLIED);
            
            // Reset lifecycleStatus to ACTIVE for new cycle
            existingCandidate.setLifecycleStatus(LifecycleStatus.ACTIVE);
            
            // Set applicationType from request if provided
            if (request.getApplicationType() != null) {
                existingCandidate.setApplicationType(request.getApplicationType());
            }
            
            // Append to statusHistory
            appendStatusHistory(existingCandidate, existingCandidate.getApplicationStage(), "System");
            
            // Update skills if provided
            if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
                // Remove old skills and clear the collection reference to avoid ObjectDeletedException
                if (existingCandidate.getCandidateSkills() != null && !existingCandidate.getCandidateSkills().isEmpty()) {
                    candidateSkillRepository.deleteAll(existingCandidate.getCandidateSkills());
                    existingCandidate.getCandidateSkills().clear();
                }
            }
        }
        
        // Flush deletes before saving to avoid Hibernate conflict with deleted entities
        candidateSkillRepository.flush();
        
        // Save all candidates (both new and updated) - single batch save
        List<Candidate> allCandidatesToSave = new ArrayList<>();
        allCandidatesToSave.addAll(candidatesToUpdate);
        allCandidatesToSave.addAll(candidatesToInsert);
        List<Candidate> savedCandidates = candidatesRepository.saveAll(allCandidatesToSave);
        
        // Flush to ensure all IDs are generated for new candidates
        candidatesRepository.flush();
        
        // ===== Batch skill mapping: pre-fetch all skills, collect all CandidateSkill entities, saveAll once =====
        List<CandidateRequest> allRequests = new ArrayList<>();
        allRequests.addAll(updateRequests);
        allRequests.addAll(insertRequests);
        
        // Collect all unique skill IDs across all requests
        Set<Long> allSkillIds = new HashSet<>();
        for (CandidateRequest req : allRequests) {
            if (req.getSkillIds() != null) {
                allSkillIds.addAll(req.getSkillIds());
            }
        }
        
        // Batch fetch all skills in 1 query
        Map<Long, Skill> skillMap = new HashMap<>();
        if (!allSkillIds.isEmpty()) {
            skillRepository.findAllById(allSkillIds).forEach(skill ->
                    skillMap.put(skill.getSkillId(), skill));
        }
        
        // Build all CandidateSkill entities and saveAll in 1 batch
        List<CandidateSkill> allCandidateSkills = new ArrayList<>();
        for (int i = 0; i < savedCandidates.size(); i++) {
            Candidate savedCandidate = savedCandidates.get(i);
            CandidateRequest request = allRequests.get(i);
            
            if (request.getSkillIds() != null && !request.getSkillIds().isEmpty()) {
                for (Long skillId : request.getSkillIds()) {
                    Skill skill = skillMap.get(skillId);
                    if (skill == null) {
                        throw new ResourceNotFoundException("Skill", "ID", skillId);
                    }
                    CandidateSkill candidateSkill = new CandidateSkill();
                    candidateSkill.setCandidate(savedCandidate);
                    candidateSkill.setSkill(skill);
                    allCandidateSkills.add(candidateSkill);
                }
            }
        }
        if (!allCandidateSkills.isEmpty()) {
            candidateSkillRepository.saveAll(allCandidateSkills);
        }
        
        // Batch reload all candidates with institute and skills (1 query instead of N)
        List<Long> savedIds = savedCandidates.stream()
                .map(Candidate::getCandidateId)
                .collect(Collectors.toList());
        
        List<Candidate> reloadedCandidates = candidatesRepository.findByIdsWithInstitute(savedIds);
        
        // Build success response
        List<CandidateResponse> candidateResponses = mapper.toResponseList(reloadedCandidates);
        response.setSuccessfulInserts(candidateResponses);
        response.setSuccessCount(candidateResponses.size());
        response.setFailureCount(0);
        
        return response;
    }
    
    @Override
    public List<CandidateResponse> getAllCandidates() {
        List<Candidate> candidates = candidatesRepository.findAllWithInstitute();
        return mapper.toResponseList(candidates);
    }
    
    @Override
    public CandidateResponse getCandidateById(Long candidateId) {
        Candidate candidate = candidatesRepository.findByIdWithInstitute(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "ID", candidateId));
        return mapper.toResponse(candidate);
    }
    
    @Override
    public List<CandidateResponse> getCandidatesByInstituteId(Long instituteId) {
        // Validate institute exists
        if (!instituteRepository.existsById(instituteId)) {
            throw new ResourceNotFoundException("Institute", "ID", instituteId);
        }
        
        List<Candidate> candidates = candidatesRepository.findByInstituteIdWithInstitute(instituteId);
        return mapper.toResponseList(candidates);
    }
    
    @Override
    public List<CandidateResponse> getCandidatesByCycleId(Long cycleId) {
        if (!hiringCycleRepository.existsById(cycleId)) {
            throw new ResourceNotFoundException("Hiring cycle", "ID", cycleId);
        }
        List<Candidate> candidates = candidatesRepository.findByCycleIdWithDetails(cycleId);
        return mapper.toResponseList(candidates);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CandidateResponse> getCandidatesByCycleIdAndStage(Long cycleId, String stage) {
        if (!hiringCycleRepository.existsById(cycleId)) {
            throw new ResourceNotFoundException("Hiring cycle", "ID", cycleId);
        }
        ApplicationStage applicationStage;
        try {
            applicationStage = ApplicationStage.valueOf(stage);
        } catch (IllegalArgumentException e) {
            throw new com.kanini.springer.exception.ValidationException("Invalid application stage: " + stage);
        }
        List<Candidate> candidates = candidatesRepository.findByCycleIdAndStageWithDetails(cycleId, applicationStage);
        return mapper.toResponseList(candidates);
    }
    
    @Override
    @Transactional
    public CandidateResponse updateCandidate(Long candidateId, CandidateUpdateRequest request) {
        // Validate mandatory fields
        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new ValidationException("Reason is required for eligibility status update");
        }
        if (request.getIsEligible() == null) {
            throw new ValidationException("Eligibility status is required");
        }
        if (request.getUpdatedBy() == null) {
            throw new ValidationException("User ID (updatedBy) is required for audit trail");
        }
        
        // Validate user exists BEFORE starting transaction operations
        if (!userRepository.existsById(request.getUpdatedBy())) {
            throw new ResourceNotFoundException("User", "ID", request.getUpdatedBy());
        }
        
        // Fetch candidate
        Candidate candidate = candidatesRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "ID", candidateId));
        
        // Create a copy for change detection
        Candidate oldCandidateCopy = createCandidateCopy(candidate);
        
        // Update only isEligible field
        candidate.setIsEligible(request.getIsEligible());
        
        // Detect changes
        List<FieldChangeDTO> changes = overrideService.detectChanges(oldCandidateCopy, candidate);
        
        // Save updated candidate
        Candidate updatedCandidate = candidatesRepository.save(candidate);
        
        // Log override if there are changes
        if (!changes.isEmpty()) {
            ManualOverrideRequest overrideRequest = new ManualOverrideRequest();
            overrideRequest.setEntityType("CANDIDATES");
            overrideRequest.setEntityId(candidateId);
            overrideRequest.setChanges(changes);
            overrideRequest.setOverrideReason(request.getReason());
            overrideRequest.setCreatedBy(request.getUpdatedBy());
            
            // No try-catch needed - if this fails, we want the whole transaction to rollback
            overrideService.logOverride(overrideRequest);
        }
        
        return mapper.toResponse(updatedCandidate);
    }
    
    @Override
    @Transactional
    public CandidateResponse updateCandidateStatus(Long candidateId, CandidateStatusUpdateRequest request) {
        Candidate candidate = candidatesRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate", "ID", candidateId));
        
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Status is required");
        }
        
        // Parse the new status
        ApplicationStage newStatus = ApplicationStage.valueOf(request.getStatus());

        String statusReason = request.getReason() != null ? request.getReason().trim() : null;
        if ((newStatus == ApplicationStage.DROPPED
                || newStatus == ApplicationStage.NOT_JOINED
                || newStatus == ApplicationStage.OFFER_REJECTED)
                && (statusReason == null || statusReason.isEmpty())) {
            throw new ValidationException("Reason is required when marking candidate as " + newStatus);
        }
        
        // Ineligible candidates cannot be moved to progression statuses
        if (!candidate.getIsEligible() && 
            (newStatus == ApplicationStage.SHORTLISTED ||
             newStatus == ApplicationStage.SELECTED ||
             newStatus == ApplicationStage.OFFERED ||
             newStatus == ApplicationStage.JOINED)) {
            throw new ValidationException("Cannot update status to " + newStatus + ". Candidate is not eligible. Only eligible candidates can progress in recruitment.");
        }
        
        // SELECTED is only allowed from SHORTLISTED
        if (newStatus == ApplicationStage.SELECTED && candidate.getApplicationStage() != ApplicationStage.SHORTLISTED) {
            throw new ValidationException("Cannot move to SELECTED. Candidate must be in SHORTLISTED status, but is currently " + candidate.getApplicationStage());
        }
        
        // Create copy for change detection
        Candidate oldCandidate = createCandidateCopy(candidate);
        
        // Update status
        ApplicationStage oldStatus = candidate.getApplicationStage();
        candidate.setApplicationStage(newStatus);
        
        // Fetch username for status history
        String userName = "Unknown";
        if (request.getUpdatedBy() != null) {
            User user = userRepository.findById(request.getUpdatedBy()).orElse(null);
            if (user != null) {
                userName = user.getUsername();
            }
        }
        
        // Append to statusHistory; include drop reason for audit readability
        String historyActor = userName;
        if ((newStatus == ApplicationStage.DROPPED
            || newStatus == ApplicationStage.NOT_JOINED
            || newStatus == ApplicationStage.OFFER_REJECTED)
            && statusReason != null && !statusReason.isEmpty()) {
            historyActor = userName + " (Reason: " + statusReason + ")";
        }
        appendStatusHistory(candidate, newStatus, historyActor);
        
        // Save
        Candidate updatedCandidate = candidatesRepository.save(candidate);
        
        // Log override if updatedBy is provided
        if (request.getUpdatedBy() != null) {
            List<FieldChangeDTO> changes = new ArrayList<>();
            FieldChangeDTO statusChange = new FieldChangeDTO();
            statusChange.setField("applicationStage");
            statusChange.setOld(oldStatus != null ? oldStatus.toString() : null);
            statusChange.setNewValue(newStatus.toString());
            changes.add(statusChange);
            
            ManualOverrideRequest overrideRequest = new ManualOverrideRequest();
            overrideRequest.setEntityType("CANDIDATES");
            overrideRequest.setEntityId(candidateId);
            overrideRequest.setChanges(changes);
                overrideRequest.setOverrideReason(
                    newStatus == ApplicationStage.DROPPED && statusReason != null && !statusReason.isEmpty()
                        ? "Dropped: " + statusReason
                        : "Status update"
                );
            overrideRequest.setCreatedBy(request.getUpdatedBy());
            
            try {
                overrideService.logOverride(overrideRequest);
            } catch (Exception e) {
                System.err.println("Error logging status override: " + e.getMessage());
            }
        }
        
        return mapper.toResponse(updatedCandidate);
    }
    
    @Override
    @Transactional
    public BulkCandidateStatusUpdateResponse bulkUpdateCandidateStatus(BulkCandidateStatusUpdateRequest request) {
        BulkCandidateStatusUpdateResponse response = new BulkCandidateStatusUpdateResponse();
        
        // Resolve candidate IDs: either from explicit list or from filters
        List<Long> candidateIds = request.getCandidateIds();
        if ((candidateIds == null || candidateIds.isEmpty()) && request.getFilterRequest() != null) {
            // Lightweight ID-only query using CriteriaQuery — SELECT candidate_id only, no entity loading
            Specification<Candidate> spec = CandidateSpecification.withFilters(request.getFilterRequest());
            CriteriaBuilder cb = entityManager.getCriteriaBuilder();
            CriteriaQuery<Long> idQuery = cb.createQuery(Long.class);
            Root<Candidate> root = idQuery.from(Candidate.class);
            idQuery.select(root.get("candidateId"));
            
            jakarta.persistence.criteria.Predicate predicate = spec.toPredicate(root, idQuery, cb);
            if (predicate != null) {
                idQuery.where(predicate);
            }
            
            candidateIds = entityManager.createQuery(idQuery).getResultList();
        }
        
        if (candidateIds == null || candidateIds.isEmpty()) {
            throw new ValidationException("No candidates to update. Provide candidateIds or filterRequest.");
        }
        
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Status is required");
        }
        
        // Parse and validate the new status
        ApplicationStage newStatus;
        try {
            newStatus = ApplicationStage.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid status: " + request.getStatus());
        }
        
        // Fetch username if updatedBy is provided
        String userName = "Unknown";
        if (request.getUpdatedBy() != null) {
            User user = userRepository.findById(request.getUpdatedBy()).orElse(null);
            if (user != null) {
                userName = user.getUsername();
            }
        }
        
        // Batch fetch all candidates in 1 query instead of N
        Map<Long, Candidate> candidateMap = new HashMap<>();
        candidatesRepository.findAllById(candidateIds).forEach(c ->
                candidateMap.put(c.getCandidateId(), c));
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        List<Candidate> candidatesToSave = new ArrayList<>();
        
        for (Long candidateId : candidateIds) {
            totalProcessed++;
            
            try {
                Candidate candidate = candidateMap.get(candidateId);
                
                if (candidate == null) {
                    response.getErrorMessages().add("Candidate with ID " + candidateId + " not found");
                    failureCount++;
                    continue;
                }
                
                // Ineligible candidates cannot be moved to progression statuses
                if (!candidate.getIsEligible() && 
                    (newStatus == ApplicationStage.SHORTLISTED ||
                     newStatus == ApplicationStage.SELECTED ||
                     newStatus == ApplicationStage.OFFERED ||
                     newStatus == ApplicationStage.JOINED)) {
                    
                    String candidateName = candidate.getFirstName() + 
                            (candidate.getLastName() != null ? " " + candidate.getLastName() : "");
                    response.getErrorMessages().add(candidateName + " is ineligible, status cannot be updated to next level");
                    failureCount++;
                    continue;
                }
                
                // SELECTED is only allowed from SHORTLISTED
                if (newStatus == ApplicationStage.SELECTED && candidate.getApplicationStage() != ApplicationStage.SHORTLISTED) {
                    String candidateName = candidate.getFirstName() + 
                            (candidate.getLastName() != null ? " " + candidate.getLastName() : "");
                    response.getErrorMessages().add(candidateName + " cannot move to SELECTED — must be SHORTLISTED, currently " + candidate.getApplicationStage());
                    failureCount++;
                    continue;
                }
                
                // Update status
                candidate.setApplicationStage(newStatus);
                
                // Append to statusHistory
                appendStatusHistory(candidate, newStatus, userName);
                
                candidatesToSave.add(candidate);
                response.getSuccessfulCandidateIds().add(candidateId);
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error updating candidate " + candidateId + ": " + e.getMessage());
                failureCount++;
            }
        }
        
        // Batch save all updated candidates in 1 query
        if (!candidatesToSave.isEmpty()) {
            candidatesRepository.saveAll(candidatesToSave);
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        
        return response;
    }
    
    @Override
    @Transactional
    public BulkCandidateLifecycleUpdateResponse bulkUpdateCandidateLifecycleStatus(BulkCandidateLifecycleUpdateRequest request) {
        BulkCandidateLifecycleUpdateResponse response = new BulkCandidateLifecycleUpdateResponse();
        
        // Resolve candidate IDs: either from explicit list or from filters
        List<Long> candidateIds = request.getCandidateIds();
        if ((candidateIds == null || candidateIds.isEmpty()) && request.getFilterRequest() != null) {
            Specification<Candidate> spec = CandidateSpecification.withFilters(request.getFilterRequest());
            CriteriaBuilder cb = entityManager.getCriteriaBuilder();
            CriteriaQuery<Long> idQuery = cb.createQuery(Long.class);
            Root<Candidate> root = idQuery.from(Candidate.class);
            idQuery.select(root.get("candidateId"));
            
            jakarta.persistence.criteria.Predicate predicate = spec.toPredicate(root, idQuery, cb);
            if (predicate != null) {
                idQuery.where(predicate);
            }
            
            candidateIds = entityManager.createQuery(idQuery).getResultList();
        }
        
        if (candidateIds == null || candidateIds.isEmpty()) {
            throw new ValidationException("No candidates to update. Provide candidateIds or filterRequest.");
        }
        
        if (request.getLifecycleStatus() == null || request.getLifecycleStatus().isBlank()) {
            throw new ValidationException("Lifecycle status is required");
        }
        
        // Parse and validate the new lifecycle status
        LifecycleStatus newLifecycleStatus;
        try {
            newLifecycleStatus = LifecycleStatus.valueOf(request.getLifecycleStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid lifecycle status: " + request.getLifecycleStatus() + ". Must be ACTIVE or CLOSED");
        }
        
        // Fetch username from updatedBy
        String userName = "Unknown";
        if (request.getUpdatedBy() != null) {
            User user = userRepository.findById(request.getUpdatedBy()).orElse(null);
            if (user != null) {
                userName = user.getUsername();
            }
        }
        
        // Batch fetch all candidates in 1 query instead of N
        Map<Long, Candidate> candidateMap = new HashMap<>();
        candidatesRepository.findAllById(candidateIds).forEach(c ->
                candidateMap.put(c.getCandidateId(), c));
        
        // Pre-compute timestamp once (same update batch = same time)
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("d/M/yy - h:mma");
        String formattedDate = now.format(formatter).toLowerCase();
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        List<Candidate> candidatesToSave = new ArrayList<>();
        
        for (Long candidateId : candidateIds) {
            totalProcessed++;
            
            try {
                Candidate candidate = candidateMap.get(candidateId);
                
                if (candidate == null) {
                    response.getErrorMessages().add("Candidate with ID " + candidateId + " not found");
                    failureCount++;
                    continue;
                }
                
                // Update lifecycle status
                candidate.setLifecycleStatus(newLifecycleStatus);
                
                // Append to statusHistory
                String historyEntry = "Lifecycle updated to " + newLifecycleStatus + " by " + userName + " on " + formattedDate + ".";
                
                String currentHistory = candidate.getStatusHistory();
                if (currentHistory == null || currentHistory.isEmpty()) {
                    candidate.setStatusHistory(historyEntry);
                } else {
                    candidate.setStatusHistory(currentHistory + "\n" + historyEntry);
                }
                
                candidatesToSave.add(candidate);
                response.getSuccessfulCandidateIds().add(candidateId);
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error updating candidate " + candidateId + ": " + e.getMessage());
                failureCount++;
            }
        }
        
        // Batch save all updated candidates in 1 query
        if (!candidatesToSave.isEmpty()) {
            candidatesRepository.saveAll(candidatesToSave);
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CandidateValidationResponse> bulkValidateCandidates(List<CandidateValidationRequest> requests) {
        List<CandidateValidationResponse> responses = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d/M/yy - h:mma");
        
        for (CandidateValidationRequest req : requests) {
            try {
                // Get institute name for query
                Institute institute = instituteRepository.findById(req.getInstituteId())
                        .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", req.getInstituteId()));
                String instituteName = institute.getInstituteName();
                
                // Find matching candidates
                List<Candidate> matches = candidatesRepository.findMatchingCandidates(
                        req.getFirstName(),
                        req.getLastName(),
                        instituteName,
                        req.getDegree(),
                        req.getDepartment(),
                        req.getDateOfBirth(),
                        req.getPassoutYear(),
                        req.getAadhaarNumber()
                );
                
                // Determine status and build comment
                CandidateValidationResponse response = new CandidateValidationResponse();
                response.setTempId(req.getTempId());
                
                if (matches.isEmpty()) {
                    response.setStatus("NEW");
                    response.setCanProceed(true);
                    response.setComment("New candidate - no existing record found");
                } else {
                    // Take the first match (most recent by default from query order)
                    Candidate match = matches.get(0);
                    String candidateName = match.getFirstName() + " " + match.getLastName();
                    String formattedDate = match.getCreatedAt().format(formatter).toLowerCase();
                    
                    // Check if in same cycle
                    if (match.getCycle().getCycleId().equals(req.getCycleId())) {
                        response.setStatus("DUPLICATE");
                        response.setCanProceed(false);
                        response.setComment(String.format(
                                "Duplicate: %s applied on %s with %s stage and %s lifecycle status",
                                candidateName,
                                formattedDate,
                                match.getApplicationStage(),
                                match.getLifecycleStatus()
                        ));
                    } else {
                        response.setStatus("OLD");
                        response.setCanProceed(true);
                        response.setComment(String.format(
                                "Old entry: %s Applied to %s on %s with %s stage and %s lifecycle status",
                                candidateName,
                                match.getCycle().getCycleName(),
                                formattedDate,
                                match.getApplicationStage(),
                                match.getLifecycleStatus()
                        ));
                    }
                }
                
                responses.add(response);
                
            } catch (Exception e) {
                // Handle validation error gracefully
                CandidateValidationResponse errorResponse = new CandidateValidationResponse();
                errorResponse.setTempId(req.getTempId());
                errorResponse.setStatus("ERROR");
                errorResponse.setCanProceed(false);
                errorResponse.setComment("Validation error: " + e.getMessage());
                responses.add(errorResponse);
            }
        }
        
        return responses;
    }
    
   
    
    /**
     * Helper method to create a copy of candidate for change detection
     */
    private Candidate createCandidateCopy(Candidate original) {
        Candidate copy = new Candidate();
        copy.setCandidateId(original.getCandidateId());
        copy.setInstitute(original.getInstitute());
        copy.setFirstName(original.getFirstName());
        copy.setLastName(original.getLastName());
        copy.setEmail(original.getEmail());
        copy.setMobile(original.getMobile());
        copy.setCgpa(original.getCgpa());
        copy.setHistoryOfArrears(original.getHistoryOfArrears());
        copy.setDegree(original.getDegree());
        copy.setDepartment(original.getDepartment());
        copy.setPassoutYear(original.getPassoutYear());
        copy.setDateOfBirth(original.getDateOfBirth());
        copy.setAadhaarNumber(original.getAadhaarNumber());
        copy.setIsEligible(original.getIsEligible());
        copy.setReason(original.getReason());
        copy.setApplicationStage(original.getApplicationStage());
        copy.setStatusHistory(original.getStatusHistory());
        copy.setApplicationType(original.getApplicationType());
        copy.setLifecycleStatus(original.getLifecycleStatus());
        return copy;
    }
    
    /**
     * Helper method to validate that a hiring cycle is OPEN
     * @param cycleId Cycle ID to validate
     * @throws ResourceNotFoundException if cycle not found
     * @throws ValidationException if not OPEN
     */
    private void validateCycleIsOpen(Long cycleId) {
        HiringCycle cycle = hiringCycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle", "ID", cycleId));
        
        if (cycle.getStatus() != CycleStatus.OPEN) {
            throw new ValidationException("Cannot add candidates to cycle " + cycleId + ". Cycle status is " + cycle.getStatus() + ". Only OPEN cycles accept new candidates.");
        }
    }
    
    /**
     * Helper method to map candidate skills
     */
    private void mapCandidateSkills(Candidate candidate, List<Long> skillIds) {
        for (Long skillId : skillIds) {
            Skill skill = skillRepository.findById(skillId)
                    .orElseThrow(() -> new ResourceNotFoundException("Skill", "ID", skillId));
            
            CandidateSkill candidateSkill = new CandidateSkill();
            candidateSkill.setCandidate(candidate);
            candidateSkill.setSkill(skill);
            
            candidateSkillRepository.save(candidateSkill);
        }
    }
    
    /**
     * Helper method to append status history with formatted timestamp
     * Format: "Updated to {stage} by {userName} on 24/3/25 - 10:12pm."
     * @param candidate The candidate to update
     * @param newStage The new application stage
     * @param userName The name of the user making the update
     */
    private void appendStatusHistory(Candidate candidate, com.kanini.springer.entity.enums.Enums.ApplicationStage newStage, String userName) {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("d/M/yy - h:mma");
        String formattedDate = now.format(formatter).toLowerCase();
        
        String historyEntry = "Updated to " + newStage + " by " + userName + " on " + formattedDate + ".";
        
        String currentHistory = candidate.getStatusHistory();
        if (currentHistory == null || currentHistory.isEmpty()) {
            candidate.setStatusHistory(historyEntry);
        } else {
            candidate.setStatusHistory(currentHistory + "\n" + historyEntry);
        }
    }
    
    /**
     * Get active candidates with pagination filtered by cycle
     * Returns only candidates with lifecycleStatus = ACTIVE for a specific cycle
     * Supports infinite scroll with page-based loading
     * 
     * @param cycleId Cycle ID to filter candidates
     * @param pageable Pagination information (page number, page size, sorting)
     * @return Page of active candidates for the specified cycle with all related data
     */
    @Override
    @Transactional(readOnly = true)
    public Page<CandidateResponse> getActiveCandidatesPaginated(Long cycleId, Pageable pageable) {
        // Fetch paginated candidates with cycleId and lifecycleStatus = ACTIVE
        Page<Candidate> candidatesPage = candidatesRepository.findByCycleIdAndLifecycleStatusWithDetails(
                cycleId,
                LifecycleStatus.ACTIVE, 
                pageable
        );
        
        // Map entities to response DTOs
        return candidatesPage.map(mapper::toResponse);
    }
    
    /**
     * Get candidates with dynamic filtering and pagination
     * Uses JPA Specifications for optimized dynamic queries
     * 
     * @param filterRequest Filter criteria including sorting and pagination
     * @return Page of filtered candidates
     */
    @Override
    @Transactional(readOnly = true)
    public Page<CandidateResponse> getCandidatesWithFilters(CandidateFilterRequest filterRequest) {
        // Build Specification from filter request
        Specification<Candidate> spec = CandidateSpecification.withFilters(filterRequest);
        
        // Create Pageable with sorting
        Sort sort = createSort(filterRequest.getSortBy(), filterRequest.getSortDirection());
        Pageable pageable = PageRequest.of(
                filterRequest.getPage() != null ? filterRequest.getPage() : 0,
                filterRequest.getSize() != null ? filterRequest.getSize() : 20,
                sort
        );
        
        // Execute query with specification
        Page<Candidate> candidatesPage = candidatesRepository.findAll(spec, pageable);
        
        // Map to response DTOs
        return candidatesPage.map(mapper::toResponse);
    }
    
    /**
     * Create Sort object from sortBy and sortDirection
     * Defaults to candidateId DESC if not specified
     */
    private Sort createSort(String sortBy, String sortDirection) {
        if (sortBy == null || sortBy.isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "candidateId");
        }
        
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;
        
        return Sort.by(direction, sortBy);
    }
    
    @Override
    @Transactional(readOnly = true)
    public FilterOptionsResponse getFilterOptionsByCycle(Long cycleId) {
        // Validate cycle exists
        HiringCycle cycle = hiringCycleRepository.findById(cycleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle not found with ID: " + cycleId));
        
        // Optimized: Use only 4 database queries (reduced from 7)
        // Each query fetches multiple related values using pairs
        
        // Query 1: Institute names
        List<String> institutes = candidatesRepository
                .findDistinctInstituteNamesByCycleAndStatus(cycleId, LifecycleStatus.ACTIVE);
        
        // Query 2: State-City pairs (builds both states list and state-to-cities map)
        List<Object[]> stateCityPairs = candidatesRepository
                .findDistinctStateCityPairsByCycleAndStatus(cycleId, LifecycleStatus.ACTIVE);
        
        java.util.Set<String> statesSet = new java.util.LinkedHashSet<>();
        java.util.Map<String, List<String>> stateToCitiesMap = new java.util.HashMap<>();
        
        for (Object[] pair : stateCityPairs) {
            String state = (String) pair[0];
            String city = (String) pair[1];
            
            statesSet.add(state);
            stateToCitiesMap
                    .computeIfAbsent(state, k -> new java.util.ArrayList<>())
                    .add(city);
        }
        
        List<String> states = new java.util.ArrayList<>(statesSet);
        java.util.Collections.sort(states);
        
        // Sort cities within each state
        stateToCitiesMap.forEach((state, citiesList) -> java.util.Collections.sort(citiesList));
        
        // Query 3: Degree-Department pairs (builds both degrees and departments lists)
        List<Object[]> degreeDepartmentPairs = candidatesRepository
                .findDistinctDegreeDepartmentPairsByCycleAndStatus(cycleId, LifecycleStatus.ACTIVE);
        
        java.util.Set<String> degreesSet = new java.util.LinkedHashSet<>();
        java.util.Set<String> departmentsSet = new java.util.LinkedHashSet<>();
        
        for (Object[] pair : degreeDepartmentPairs) {
            String degree = (String) pair[0];
            String department = (String) pair[1];
            
            if (degree != null) degreesSet.add(degree);
            if (department != null) departmentsSet.add(department);
        }
        
        List<String> degrees = new java.util.ArrayList<>(degreesSet);
        List<String> departments = new java.util.ArrayList<>(departmentsSet);
        java.util.Collections.sort(degrees);
        java.util.Collections.sort(departments);
        
        // Query 4: Skills
        List<String> skills = candidatesRepository
                .findDistinctSkillsByCycleAndStatus(cycleId, LifecycleStatus.ACTIVE);
        
        // Build and return response
        return new com.kanini.springer.dto.Drive.FilterOptionsResponse(
                institutes,
                states,
                stateToCitiesMap,
                degrees,
                departments,
                skills
        );
    }
}

