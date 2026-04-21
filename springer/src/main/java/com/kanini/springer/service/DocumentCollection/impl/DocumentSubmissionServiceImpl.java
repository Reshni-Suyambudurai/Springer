package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.DocumentCollection.DocumentSubmissionMapper;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.DocumentCollection.IDocumentSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentSubmissionServiceImpl implements IDocumentSubmissionService {
    
    private final DocumentSubmissionRepository submissionRepository;
    private final DocumentTypeRepository typeRepository;
    private final CandidateRepository candidateRepository;
    private final HiringCycleRepository cycleRepository;
    private final DocumentSubmissionMapper mapper;
    
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10MB
    
    @Override
    @Transactional
    public DocumentSubmissionResponse submitDocument(DocumentSubmissionRequest request) {
        // Validate inputs
        if (request.getCandidateId() == null) {
            throw new ValidationException("Candidate ID is required");
        }
        if (request.getDocumentTypeId() == null) {
            throw new ValidationException("Document type ID is required");
        }
        if (request.getCycleId() == null) {
            throw new ValidationException("Cycle ID is required");
        }
        if (request.getFile() == null || request.getFile().isEmpty ()) {
            throw new ValidationException("File is required");
        }
        
        // Validate file size
        if (request.getFile().getSize() > MAX_FILE_SIZE) {
            throw new ValidationException("File size exceeds 10MB limit");
        }
        
        // Get document type, candidate, and cycle
        DocumentType docType = typeRepository.findById(request.getDocumentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Document type not found with ID: " + request.getDocumentTypeId()));
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + request.getCandidateId()));
        HiringCycle cycle = cycleRepository.findById(request.getCycleId())
                .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle not found with ID: " + request.getCycleId()));

        // Block re-upload if already COLLECTED or APPROVED
        submissionRepository.findActiveSubmission(request.getCandidateId(), request.getDocumentTypeId(), request.getCycleId())
                .ifPresent(existing -> {
                    Enums.VerificationStatus s = existing.getVerificationStatus();
                    if (s == Enums.VerificationStatus.COLLECTED || s == Enums.VerificationStatus.APPROVED) {
                        throw new ValidationException("Document already submitted with status: " + s.name());
                    }
                });

        try {
            // Find existing PENDING or REJECTED record and update it, or create new
            Optional<DocumentSubmission> existingRecord = submissionRepository
                .findActiveSubmission(request.getCandidateId(), request.getDocumentTypeId(), request.getCycleId());

            DocumentSubmission submission = existingRecord.orElse(new DocumentSubmission());
            submission.setCandidate(candidate);
            submission.setDocumentType(docType);
            submission.setCycle(cycle);
            submission.setUploadedFile(request.getFile().getBytes());
            submission.setVerificationStatus(Enums.VerificationStatus.COLLECTED);
            
            DocumentSubmission saved = submissionRepository.save(submission);
            return mapper.toResponse(saved);
        } catch (IOException e) {
            throw new ValidationException("Failed to process file: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public DocumentSubmissionResponse getSubmissionById(Long documentId) {
        DocumentSubmission submission = submissionRepository.findByIdWithDetails(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("Document submission not found with ID: " + documentId));
        return mapper.toResponse(submission);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DocumentSubmissionResponse> getSubmissionsByCandidate(Long candidateId) {
        if (!candidateRepository.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate not found with ID: " + candidateId);
        }
        List<DocumentSubmission> submissions = submissionRepository.findByCandidateId(candidateId);
        return submissions.stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DocumentSubmissionResponse> getAllSubmissions(String status, Long cycleId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<DocumentSubmission> submissions;
        
        if (status != null && cycleId != null) {
            try {
                Enums.VerificationStatus verificationStatus = Enums.VerificationStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
                submissions = submissionRepository.findByVerificationStatusAndCycleId(verificationStatus, cycleId, pageable);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid verification status: " + status, e);
            }
        } else if (cycleId != null) {
            submissions = submissionRepository.findByCycleId(cycleId, pageable);
        } else if (status != null) {
            try {
                Enums.VerificationStatus verificationStatus = Enums.VerificationStatus.valueOf(status.toUpperCase(java.util.Locale.ROOT));
                submissions = submissionRepository.findByVerificationStatus(verificationStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid verification status: " + status, e);
            }
        } else {
            submissions = submissionRepository.findAllWithDetails(pageable);
        }
        
        return submissions.stream()
                .map(mapper::toResponse)
                .toList();
    }
    
    @Override
    @Transactional(readOnly = true)
    public byte[] downloadDocument(Long documentId) {
        DocumentSubmission submission = submissionRepository.findByIdWithDetails(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));
        
        byte[] fileContent = submission.getUploadedFile();
        if (fileContent == null || fileContent.length == 0) {
            throw new ValidationException("File content is empty");
        }
        
        return fileContent;
    }
    
    @Override
    @Transactional
    public void deleteSubmission(Long documentId) {
        DocumentSubmission submission = submissionRepository.findByIdWithDetails(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));
        
        if (submission.getVerificationStatus() != Enums.VerificationStatus.COLLECTED) {
            throw new ValidationException("Cannot delete already verified documents");
        }
        
        submissionRepository.delete(submission);
    }
}
