package com.kanini.springer.repository.DocumentCollection;

import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.enums.Enums;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentSubmissionRepository extends JpaRepository<DocumentSubmission, Integer> {
    
    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle")
    Page<DocumentSubmission> findAllWithDetails(Pageable pageable);

    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.candidateDocumentId = ?1")
    Optional<DocumentSubmission> findByIdWithDetails(Integer id);

    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.candidate.candidateId = ?1")
    List<DocumentSubmission> findByCandidateId(Long candidateId);
    
    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.candidate.candidateId = ?1 AND ds.cycle.cycleId = ?2")
    List<DocumentSubmission> findByCandidateIdAndCycleId(Long candidateId, Long cycleId);

    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.candidate.candidateId = ?1 AND ds.cycle.cycleId = ?2 AND ds.verificationStatus != com.kanini.springer.entity.enums.Enums.VerificationStatus.REJECTED AND ds.verificationStatus != com.kanini.springer.entity.enums.Enums.VerificationStatus.PENDING")
    List<DocumentSubmission> findActiveSubmissionsByCandidateAndCycle(Long candidateId, Long cycleId);
    
    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.verificationStatus = ?1")
    List<DocumentSubmission> findByVerificationStatus(Enums.VerificationStatus verificationStatus);
    
    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.cycle.cycleId = ?1")
    List<DocumentSubmission> findByCycleId(Long cycleId);
    
    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.verificationStatus = ?1")
    Page<DocumentSubmission> findByVerificationStatus(Enums.VerificationStatus verificationStatus, Pageable pageable);
    
    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.cycle.cycleId = ?1")
    Page<DocumentSubmission> findByCycleId(Long cycleId, Pageable pageable);
    
    @Query("SELECT ds FROM DocumentSubmission ds JOIN FETCH ds.candidate JOIN FETCH ds.documentType JOIN FETCH ds.cycle WHERE ds.verificationStatus = ?1 AND ds.cycle.cycleId = ?2")
    Page<DocumentSubmission> findByVerificationStatusAndCycleId(Enums.VerificationStatus verificationStatus, Long cycleId, Pageable pageable);
    
    @Query("SELECT COUNT(ds) FROM DocumentSubmission ds WHERE ds.candidate.candidateId = ?1 AND ds.verificationStatus = ?2")
    Long countByCandidateIdAndVerificationStatus(Long candidateId, Enums.VerificationStatus verificationStatus);
    
    @Query("SELECT COUNT(ds) FROM DocumentSubmission ds WHERE ds.cycle.cycleId = ?1 AND ds.verificationStatus = ?2")
    Long countByCycleIdAndVerificationStatus(Long cycleId, Enums.VerificationStatus verificationStatus);
    
    @Query("SELECT COUNT(DISTINCT ds.candidate.candidateId) FROM DocumentSubmission ds WHERE ds.cycle.cycleId = ?1")
    Long countDistinctCandidateIdByCycleId(Long cycleId);
    
    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.uploadedNo = ?1")
    Optional<DocumentSubmission> findByUploadedNo(Long uploadedNo);

    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.candidate.candidateId = ?1 AND ds.documentType.documentTypeId = ?2 AND ds.cycle.cycleId = ?3 AND ds.verificationStatus = com.kanini.springer.entity.enums.Enums.VerificationStatus.PENDING")
    Optional<DocumentSubmission> findPendingSubmission(Long candidateId, Long documentTypeId, Long cycleId);

    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.candidate.candidateId = ?1 AND ds.documentType.documentTypeId = ?2 AND ds.cycle.cycleId = ?3 AND ds.verificationStatus != com.kanini.springer.entity.enums.Enums.VerificationStatus.REJECTED AND ds.verificationStatus != com.kanini.springer.entity.enums.Enums.VerificationStatus.PENDING")
    Optional<DocumentSubmission> findActiveSubmission(Long candidateId, Long documentTypeId, Long cycleId);
}
