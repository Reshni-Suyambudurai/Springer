package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.enums.Enums.InstituteTier;

/**
 * All colleges data will stored here
 */
@Entity
@Table(name = "institutes",
    indexes = {

        @Index(name = "idx_institute_tier", columnList = "instituteTier"),
        @Index(name = "idx_institute_location", columnList = "state, city"),
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Institute {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long instituteId;
    
    @NotBlank(message = "Institute name is required")
    @Size(min = 2, max = 200, message = "Institute name must be between 2 and 200 characters")
    private String instituteName;
    
    @Enumerated(EnumType.STRING)
    private InstituteTier instituteTier; // TIER_1, TIER_2, TIER_3
 
    private String state;
    
    private String city;
    
    private Boolean isActive; // true=active institute
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "institute", cascade = CascadeType.ALL)
    private List<InstituteContact> instituteContacts;
    
    @OneToMany(mappedBy = "institute", cascade = CascadeType.ALL)
    private List<InstituteProgram> institutePrograms;
    
    @OneToMany(mappedBy = "institute", cascade = CascadeType.ALL)
    private List<Candidate> candidates;
    
    @OneToMany(mappedBy = "institute", cascade = CascadeType.ALL)
    private List<Drive> drives;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
