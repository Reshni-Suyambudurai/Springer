package com.kanini.springer.repository.DocumentCollection;

import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentSubmissionRepositoryCustom extends JpaRepository<DocumentSubmission, Integer> {

    // Query by candidate using the relationship
    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.candidate.candidateId = :candidateId ORDER BY ds.createdAt DESC")
    List<DocumentSubmission> findByCandidateId(@Param("candidateId") Long candidateId);

    // Query by candidate and cycle using relationships
    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.candidate.candidateId = :candidateId AND ds.cycle.cycleId = :cycleId ORDER BY ds.createdAt DESC")
    List<DocumentSubmission> findByCandidateIdAndCycleId(@Param("candidateId") Long candidateId, @Param("cycleId") Long cycleId);
    
    // Query by cycle
    @Query("SELECT ds FROM DocumentSubmission ds WHERE ds.cycle.cycleId = :cycleId ORDER BY ds.createdAt DESC")
    List<DocumentSubmission> findByCycleId(@Param("cycleId") Long cycleId);
    
    // Query by verification status
    List<DocumentSubmission> findByVerificationStatus(com.kanini.springer.entity.enums.Enums.VerificationStatus status);
}
