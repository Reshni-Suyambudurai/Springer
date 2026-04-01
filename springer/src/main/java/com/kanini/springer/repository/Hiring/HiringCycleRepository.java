package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HiringCycleRepository extends JpaRepository<HiringCycle, Long> {
    List<HiringCycle> findByStatus(CycleStatus status);
    Optional<HiringCycle> findByCycleYear(Integer cycleYear);
    List<HiringCycle> findByStatusOrderByCycleYearDesc(CycleStatus status);
}
