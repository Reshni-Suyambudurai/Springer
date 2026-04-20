package com.kanini.springer.repository.Academy;

import com.kanini.springer.entity.Academy.BatchSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatchScheduleRepository extends JpaRepository<BatchSchedule, Integer> {

    Optional<BatchSchedule> findByProgram_ProgramIdAndBatchNumber(Integer programId, Integer batchNumber);

    List<BatchSchedule> findByProgram_ProgramId(Integer programId);
}
