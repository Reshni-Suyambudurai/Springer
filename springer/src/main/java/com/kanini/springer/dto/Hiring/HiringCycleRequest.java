package com.kanini.springer.dto.Hiring;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HiringCycleRequest {
    
    private Integer cycleYear; // Required for POST, optional for PATCH
    
    private String cycleName; // Required for POST, optional for PATCH
    
    private Integer compensationBand;
    
    private Integer budget;
    
    private MultipartFile jd; // Job description file upload
}
