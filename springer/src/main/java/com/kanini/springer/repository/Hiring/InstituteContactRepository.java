package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.InstituteContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstituteContactRepository extends JpaRepository<InstituteContact, Integer> {
    List<InstituteContact> findByInstituteInstituteId(Long instituteId);
    Optional<InstituteContact> findByTpoEmail(String email);
    List<InstituteContact> findByIsPrimaryTrue();
    
    @Query("SELECT ic FROM InstituteContact ic JOIN FETCH ic.institute WHERE ic.tpoId = :tpoId")
    Optional<InstituteContact> findByIdWithInstitute(@Param("tpoId") Integer tpoId);
}
