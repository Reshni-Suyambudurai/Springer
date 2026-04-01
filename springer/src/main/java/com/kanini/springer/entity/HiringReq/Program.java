package com.kanini.springer.entity.HiringReq;

import com.kanini.springer.entity.enums.Enums.ProgramName;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Programs offered by institutes (B.Tech, M.Tech, MBA, etc.)
 */
@Entity
@Table(name = "programs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Program {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long programId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    @NotNull(message = "Program name is required")
    private ProgramName programName; // B.Tech, M.Tech, MBA, etc.

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL)
    private List<InstituteProgram> institutePrograms;
}
