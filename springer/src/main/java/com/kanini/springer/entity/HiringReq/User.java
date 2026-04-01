package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.Academy.TrainingCourse;
import com.kanini.springer.entity.Academy.TrainingScore;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.DriveAssignment;
import com.kanini.springer.entity.utils.AuditTrail;
import com.kanini.springer.entity.utils.Notification;

/**
 * Contains the user of the website data
 */
@Entity
@Table(name = "users",
    indexes = {
        
        @Index(name = "idx_user_role_id", columnList = "role_id"),
   
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    private String department;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    private String location;
    
    private Boolean isActive; // true=active user, false=disabled
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL)
    private List<HiringDemand> hiringDemands;
    
    @OneToMany(mappedBy = "createdByUser", cascade = CascadeType.ALL)
    private List<Drive> drivesCreated;
    
    @OneToMany(mappedBy = "updatedByUser", cascade = CascadeType.ALL)
    private List<Drive> drivesUpdated;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<DriveAssignment> driveAssignments;
    
    @OneToMany(mappedBy = "createdByUser", cascade = CascadeType.ALL)
    private List<Application> applications;
    
    @OneToMany(mappedBy = "reviewedBy", cascade = CascadeType.ALL)
    private List<CandidateEvaluation> evaluations;
    
    @OneToMany(mappedBy = "conductedBy", cascade = CascadeType.ALL)
    private List<TrainingCourse> trainingCourses;
    
    @OneToMany(mappedBy = "reviewedBy", cascade = CascadeType.ALL)
    private List<TrainingScore> trainingScores;
    
    @OneToMany(mappedBy = "sentBy", cascade = CascadeType.ALL)
    private List<Notification> notificationsSent;
    
    @OneToMany(mappedBy = "sentTo", cascade = CascadeType.ALL)
    private List<Notification> notificationsReceived;
    
    @OneToMany(mappedBy = "updatedBy", cascade = CascadeType.ALL)
    private List<AuditTrail> auditTrails;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
