package com.kanini.springer.repository;

import com.kanini.springer.entity.utils.AuditTrail;
import com.kanini.springer.entity.enums.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {
    
    @Query("SELECT at FROM AuditTrail at WHERE at.entityType = ?1 AND at.entityId = ?2 ORDER BY at.logId DESC")
    List<AuditTrail> findByEntityTypeAndEntityId(Enums.AuditEntityType entityType, Long entityId);
    
    @Query("SELECT at FROM AuditTrail at WHERE at.entityType = ?1 AND at.entityId = ?2 AND at.action = ?3 ORDER BY at.logId DESC")
    List<AuditTrail> findByEntityTypeAndEntityIdAndAction(Enums.AuditEntityType entityType, Long entityId, Enums.AuditAction action);
}
