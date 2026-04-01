package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.Institute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstituteRepository extends JpaRepository<Institute, Long> {
    Optional<Institute> findByInstituteName(String instituteName);
    List<Institute> findByIsActiveTrue();
    List<Institute> findByCity(String city);
    List<Institute> findByState(String state);
}
