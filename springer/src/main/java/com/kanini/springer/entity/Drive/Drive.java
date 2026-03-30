package com.kanini.springer.entity.Drive;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.HiringReq.HiringCycle;

import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.DriveMode;
import com.kanini.springer.entity.enums.Enums.DriveStatus;

/**
 * The multiple drive schedules in a cycle like offcampus and oncampus at various location
 */
@Entity
@Table(name = "drive_schedule",
    indexes = {
        @Index(name = "idx_drive_cycle_id", columnList = "cycle_id"),
        @Index(name = "idx_drive_institute_id", columnList = "institute_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Drive {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long driveId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private HiringCycle cycle;
     
    private String driveName;
    
    @Column(columnDefinition = "TEXT")
    private String description; // optional
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriveMode driveMode; // ON_CAMPUS, OFF_CAMPUS
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute; // nullable if off-campus
    
    private LocalDate startDate; // start date of drive planning
    
    private LocalDate endDate; // end date of drive after contacting with TPOs
    
    private String location; // like chennai, coimbatore or online
    
    private Boolean eligibilityLocked; // locked once the drive date is confirmed   
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriveStatus status;
    
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdByUser;
    
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedByUser;
    
    @OneToMany(mappedBy = "drive", cascade = CascadeType.ALL)
    private List<DriveAssignment> driveAssignments;
    
    @OneToMany(mappedBy = "drive", cascade = CascadeType.ALL)
    private List<Application> applications;
    
    @OneToMany(mappedBy = "drive", cascade = CascadeType.ALL)
    private List<DriveRound> driveRounds;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
