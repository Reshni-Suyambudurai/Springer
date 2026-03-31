package com.kanini.springer.entity.Drive;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.AssignmentStatus;

/**
 * The company employee who are assigned to conduct the drive rounds
 */
@Entity
@Table(name = "drivepanel_assignments",
    indexes = {
        @Index(name = "idx_assignment_drive_id", columnList = "drive_id"),
        @Index(name = "idx_assignment_application_id", columnList = "application_id"),
        @Index(name = "idx_assignment_round_config_id", columnList = "round_config_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer assignmentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drive_id")
    private Drive drive;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_config_id")
    private RoundTemplate roundConfig; // which round this assignment is for
    
    @Enumerated(EnumType.STRING)
    private AssignmentStatus status; // PLANNED, DRAFT, SELECTED, REJECTED, CANCELLED
    
    private Boolean isActive; // true=current assignment
    
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdByUser;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
