package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSubmissionRequest {
    
    private Long documentTypeId;
    
    private Long candidateId;
    
    private Long cycleId;
    
    private MultipartFile file;
    
    private String token;
}
