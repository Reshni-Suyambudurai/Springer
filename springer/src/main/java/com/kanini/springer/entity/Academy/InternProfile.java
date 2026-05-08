package com.kanini.springer.entity.Academy;

import com.kanini.springer.entity.HiringReq.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Stores intern's personal profile — bio and multiple profile links (LinkedIn, GitHub, HackerRank etc.)
 * Links stored as JSON array: [{"platform":"LinkedIn","url":"..."},{"platform":"HackerRank","url":"..."}]
 * One profile per user (intern)
 */
@Entity
@Table(name = "intern_profiles",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_intern_profile_user", columnNames = {"user_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    /**
     * JSON array of profile links
     * Format: [{"platform":"LinkedIn","url":"https://..."},{"platform":"HackerRank","url":"https://..."}]
     */
    @Column(columnDefinition = "JSON")
    private String profileLinks;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
