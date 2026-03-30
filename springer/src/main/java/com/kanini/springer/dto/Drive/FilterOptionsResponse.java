package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response DTO containing distinct filter options for a specific cycle
 * Used to populate filter dropdowns in the frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilterOptionsResponse {
    
    /**
     * Distinct institute names
     */
    private List<String> institutes;
    
    /**
     * Distinct states
     */
    private List<String> states;
    
    /**
     * State to cities mapping
     * Maps each state to its list of cities
     * Example: { "Karnataka": ["Bangalore", "Mysore"], "Maharashtra": ["Mumbai", "Pune"] }
     */
    private Map<String, List<String>> stateToCitiesMap;
    
    /**
     * Distinct degrees
     */
    private List<String> degrees;
    
    /**
     * Distinct departments
     */
    private List<String> departments;
    
    /**
     * Distinct skills
     */
    private List<String> skills;
}
