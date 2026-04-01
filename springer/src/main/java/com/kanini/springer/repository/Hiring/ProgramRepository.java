package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.Program;
import com.kanini.springer.entity.enums.Enums.ProgramName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProgramRepository extends JpaRepository<Program, Long> {
    Optional<Program> findByProgramName(ProgramName programName);
}
