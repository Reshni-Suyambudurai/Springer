package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.Institute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstituteRepository extends JpaRepository<Institute, Long> {
    
    @Query("SELECT DISTINCT i FROM Institute i LEFT JOIN FETCH i.institutePrograms ip LEFT JOIN FETCH ip.program")
    List<Institute> findAllWithPrograms();
    
    @Query("SELECT i FROM Institute i LEFT JOIN FETCH i.institutePrograms ip LEFT JOIN FETCH ip.program WHERE i.instituteId = :id")
    Optional<Institute> findByIdWithPrograms(Long id);
    
    Optional<Institute> findByInstituteName(String instituteName);
    List<Institute> findByInstituteNameIn(Collection<String> names);
    List<Institute> findByIsActiveTrue();
    List<Institute> findByCity(String city);
    List<Institute> findByState(String state);
}
