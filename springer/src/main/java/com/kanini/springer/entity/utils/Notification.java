package com.kanini.springer.entity.utils;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.HiringReq.User;

/**
 * Stores notifications sent between users in the system
 */
@Entity
@Table(name = "notifications",
    indexes = {
       
        @Index(name = "idx_notification_sent_to", columnList = "sent_to"),
        
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long notificationId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sent_by")
    private User sentBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sent_to")
    private User sentTo; // MVP. If sending to candidates, store sent_to as varchar (email/phone)
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
