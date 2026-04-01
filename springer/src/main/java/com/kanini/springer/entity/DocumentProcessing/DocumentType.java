package com.kanini.springer.entity.DocumentProcessing;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.enums.Enums;

/**
 * All the documents will be mentioned here
 */
@Entity
@Table(name = "document_types",
    indexes = {
        @Index(name = "idx_doc_type_enum", columnList = "documentType", unique = true)
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long documentTypeId;
    
    @Enumerated(EnumType.STRING)
    private Enums.DocumentType documentType;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "documentType", cascade = CascadeType.ALL)
    private List<DocumentSubmission> documentSubmissions;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
