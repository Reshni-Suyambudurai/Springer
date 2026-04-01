package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.enums.Enums.RoleName;

/**
 * To specify what are the roles is contained
 */
@Entity
@Table(name = "roles",
    indexes = {
        @Index(name = "idx_role_name", columnList = "roleName", unique = true)
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;
    
    @Enumerated(EnumType.STRING)
    private RoleName roleName;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL)
    private List<User> users;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
