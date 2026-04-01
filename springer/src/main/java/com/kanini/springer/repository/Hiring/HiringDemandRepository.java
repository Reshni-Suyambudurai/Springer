package com.kanini.springer.repository.Hiring;

import com.kanini.springer.entity.HiringReq.HiringDemand;
import com.kanini.springer.entity.enums.Enums.ApprovalStatus;
import com.kanini.springer.entity.enums.Enums.BusinessUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HiringDemandRepository extends JpaRepository<HiringDemand, Long> {
    List<HiringDemand> findByApprovalStatus(ApprovalStatus status);
    List<HiringDemand> findByCycleCycleId(Long cycleId);
    List<HiringDemand> findByBusinessUnit(BusinessUnit businessUnit);
}
