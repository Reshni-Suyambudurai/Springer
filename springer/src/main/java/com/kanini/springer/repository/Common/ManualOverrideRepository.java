package com.kanini.springer.repository.Common;

import com.kanini.springer.entity.utils.ManualOverride;
import com.kanini.springer.entity.enums.Enums.OverrideEntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ManualOverrideRepository extends JpaRepository<ManualOverride, Long> {
    
    /**
     * Find all overrides from a specific date onwards
     */
    List<ManualOverride> findByCreatedAtGreaterThanEqual(LocalDateTime fromDate);
    
    /**
     * Find all overrides by entity type
     */
    List<ManualOverride> findByEntityType(OverrideEntityType entityType);
    
    /**
     * Find all overrides by entity type and entity ID
     */
    List<ManualOverride> findByEntityTypeAndEntityId(OverrideEntityType entityType, Long entityId);
    
    /**
     * Find all overrides by user ID
     */
    @Query("SELECT mo FROM ManualOverride mo WHERE mo.createdBy.userId = :userId")
    List<ManualOverride> findByCreatedByUserId(@Param("userId") Long userId);
    
    /**
     * Find overrides with JOIN FETCH to eagerly load user details
     */
    @Query("SELECT mo FROM ManualOverride mo JOIN FETCH mo.createdBy")
    List<ManualOverride> findAllWithUser();
    
    /**
     * Find overrides by entity type with user details
     */
    @Query("SELECT mo FROM ManualOverride mo JOIN FETCH mo.createdBy WHERE mo.entityType = :entityType")
    List<ManualOverride> findByEntityTypeWithUser(@Param("entityType") OverrideEntityType entityType);
    
    /**
     * Find overrides by entity type and entity ID with user details
     */
    @Query("SELECT mo FROM ManualOverride mo JOIN FETCH mo.createdBy WHERE mo.entityType = :entityType AND mo.entityId = :entityId")
    List<ManualOverride> findByEntityTypeAndEntityIdWithUser(@Param("entityType") OverrideEntityType entityType, @Param("entityId") Long entityId);
    
    /**
     * Find overrides from date with user details
     */
    @Query("SELECT mo FROM ManualOverride mo JOIN FETCH mo.createdBy WHERE mo.createdAt >= :fromDate")
    List<ManualOverride> findByCreatedAtGreaterThanEqualWithUser(@Param("fromDate") LocalDateTime fromDate);
    
    /**
     * Find overrides by user with user details
     */
    @Query("SELECT mo FROM ManualOverride mo JOIN FETCH mo.createdBy WHERE mo.createdBy.userId = :userId")
    List<ManualOverride> findByCreatedByUserIdWithUser(@Param("userId") Long userId);
}
