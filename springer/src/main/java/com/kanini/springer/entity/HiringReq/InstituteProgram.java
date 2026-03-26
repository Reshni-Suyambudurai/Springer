package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Junction table linking institutes to their offered programs
 */
@Entity
@Table(name = "institute_programs",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_institute_program", columnNames = {"institute_id", "program_id"})
    },
    indexes = {
        @Index(name = "idx_institute_program_institute", columnList = "institute_id"),
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteProgram {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id", nullable = false)
    private Institute institute;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = false)
    private Program program;
}
