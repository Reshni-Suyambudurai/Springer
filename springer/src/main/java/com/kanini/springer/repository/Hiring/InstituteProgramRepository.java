package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.InstituteProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstituteProgramRepository extends JpaRepository<InstituteProgram, Long> {
    List<InstituteProgram> findByInstituteInstituteId(Long instituteId);
    List<InstituteProgram> findByProgramProgramId(Long programId);
}
