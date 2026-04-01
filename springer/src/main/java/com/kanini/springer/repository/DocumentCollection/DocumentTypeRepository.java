package com.kanini.springer.repository.DocumentCollection;

import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.enums.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {
    
    Optional<DocumentType> findByDocumentType(Enums.DocumentType documentType);
    
    boolean existsByDocumentType(Enums.DocumentType documentType);
}
