package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByEmail(String email);
    List<Candidate> findByApplicationStage(ApplicationStage applicationStage);
    List<Candidate> findByInstituteInstituteId(Long instituteId);
    boolean existsByEmail(String email);
    boolean existsByAadhaarNumber(String aadhaarNumber);
}
