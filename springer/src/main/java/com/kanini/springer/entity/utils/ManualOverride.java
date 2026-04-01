package com.kanini.springer.entity.utils;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.OverrideEntityType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stores manual override audit records for tracking user-initiated overrides across entities
 */
@Entity
@Table(name = "manual_override",
    indexes = {
        @Index(name = "idx_override_entity", columnList = "entityType, entityId"),
        @Index(name = "idx_override_created_by", columnList = "created_by"),
        @Index(name = "idx_override_created_at", columnList = "createdAt")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualOverride {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long overrideId;
    
    @NotNull(message = "Entity type is required")
    @Enumerated(EnumType.STRING)
    private OverrideEntityType entityType;
    
    @NotNull(message = "Entity ID is required")
    private Long entityId;
    
    @NotNull(message = "Changes are required")
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private List<FieldChange> changes;
    
    @NotBlank(message = "Override reason is required")
    @Column(columnDefinition = "TEXT")
    private String overrideReason;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    /**
     * Represents a single field-level change
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FieldChange {
        private String field;
        private Object old;
        private Object newValue;
    }
}
