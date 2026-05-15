package com.kanini.springer.repository.DocumentCollection;

import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {
    
    Optional<DocumentType> findByDocumentType(String documentType);
    
    boolean existsByDocumentType(String documentType);
}
