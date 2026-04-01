package com.kanini.springer.repository.Drive;

import com.kanini.springer.entity.Drive.CandidateEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateEvaluationRepository extends JpaRepository<CandidateEvaluation, Long> {
    List<CandidateEvaluation> findByApplicationApplicationId(Long applicationId);
    List<CandidateEvaluation> findByRoundConfigRoundConfigId(Long roundConfigId);
    Optional<CandidateEvaluation> findByApplicationApplicationIdAndRoundConfigRoundConfigId(Long applicationId, Long roundConfigId);
}
