package com.kanini.springer.repository.DocumentCollection;

import com.kanini.springer.entity.DocumentProcessing.OfferLetter;
import com.kanini.springer.entity.enums.Enums;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OfferLetterRepository extends JpaRepository<OfferLetter, Long> {
    
    @Query("SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle WHERE o.candidate.candidateId = ?1")
    Optional<OfferLetter> findByCandidateId(Long candidateId);
    
    @Query("SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle WHERE o.cycle.cycleId = ?1")
    List<OfferLetter> findByCycleId(Long cycleId);

    @Query("SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle WHERE o.response = ?1")
    List<OfferLetter> findByResponse(Enums.OfferResponse response);

    @Query(value = "SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle WHERE o.cycle.cycleId = ?1",
           countQuery = "SELECT COUNT(o) FROM OfferLetter o WHERE o.cycle.cycleId = ?1")
    Page<OfferLetter> findByCycleId(Long cycleId, Pageable pageable);

    @Query(value = "SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle WHERE o.response = ?1",
           countQuery = "SELECT COUNT(o) FROM OfferLetter o WHERE o.response = ?1")
    Page<OfferLetter> findByResponse(Enums.OfferResponse response, Pageable pageable);

    @Query("SELECT COUNT(o) FROM OfferLetter o WHERE o.cycle.cycleId = ?1 AND o.response = ?2")
    Long countByCycleIdAndResponse(Long cycleId, Enums.OfferResponse response);

    @Query("SELECT o.candidate.candidateId FROM OfferLetter o WHERE o.cycle.cycleId = ?1")
    List<Long> findCandidateIdsByCycleId(Long cycleId);

    @Query(value = "SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle",
           countQuery = "SELECT COUNT(o) FROM OfferLetter o")
    Page<OfferLetter> findAllWithDetails(Pageable pageable);

    @Query("SELECT o FROM OfferLetter o JOIN FETCH o.candidate JOIN FETCH o.cycle WHERE o.offerId = ?1")
    Optional<OfferLetter> findByIdWithDetails(Long offerId);
}
