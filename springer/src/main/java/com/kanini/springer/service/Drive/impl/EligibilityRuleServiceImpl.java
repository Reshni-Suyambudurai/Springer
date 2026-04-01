package com.kanini.springer.service.Drive.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.EligibilityRuleDTO;
import com.kanini.springer.dto.Drive.EligibilityRuleUpdateRequest;
import com.kanini.springer.dto.Drive.EligibilityValidationResult;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.service.Drive.IEligibilityRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class EligibilityRuleServiceImpl implements IEligibilityRuleService {
    
    private final ObjectMapper objectMapper;
    private static final String RULES_FILE_PATH = "EligibilityRule.json";
    
    @Override
    public EligibilityValidationResult checkEligibility(BigDecimal cgpa, Integer passoutYear, Integer historyOfArrears, String degree, String department) {
        EligibilityValidationResult result = new EligibilityValidationResult();
        result.setEligible(true);
        
        try {
            EligibilityRuleUpdateRequest rulesConfig = loadRulesFromFile();
            
            if (rulesConfig == null || rulesConfig.getRules() == null || rulesConfig.getRules().isEmpty()) {
                // No rules defined, consider eligible by default
                return result;
            }
            
            boolean isAndLogic = "AND".equalsIgnoreCase(rulesConfig.getLogic());
            boolean hasAnyPass = false;
            
            for (EligibilityRuleDTO rule : rulesConfig.getRules()) {
                boolean rulePass = evaluateRule(rule, cgpa, passoutYear, historyOfArrears, degree, department);
                
                if (!rulePass) {
                    String message = formatMessage(rule.getMessage(), rule);
                    result.addReason(message);
                }
                
                if (rulePass) {
                    hasAnyPass = true;
                }
                
                // For AND logic, if any rule fails, candidate is not eligible
                if (isAndLogic && !rulePass) {
                    result.setEligible(false);
                }
            }
            
            // For OR logic, candidate is eligible if at least one rule passes
            if (!isAndLogic) {
                result.setEligible(hasAnyPass);
            }
            
        } catch (Exception e) {
            System.err.println("Error validating eligibility: " + e.getMessage());
            result.setEligible(false);
            result.addReason("Error validating eligibility rules");
        }
        
        return result;
    }
    
    @Override
    public EligibilityRuleUpdateRequest getAllRules() {
        try {
            return loadRulesFromFile();
        } catch (IOException e) {
            throw new ValidationException("Failed to load eligibility rules: " + e.getMessage());
        }
    }
    
    @Override
    public EligibilityRuleUpdateRequest updateRules(EligibilityRuleUpdateRequest request) {
        try {
            // Validate request
            if (request.getRules() == null || request.getRules().isEmpty()) {
                throw new ValidationException("Rules cannot be empty");
            }
            
            if (request.getLogic() == null || request.getLogic().isBlank()) {
                request.setLogic("AND");
            }
            
            // Write to JSON file
            File file = new File(RULES_FILE_PATH);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, request);
            
            return request;
        } catch (IOException e) {
            throw new ValidationException("Failed to update eligibility rules: " + e.getMessage());
        }
    }
    
    /**
     * Load rules from JSON file
     */
    private EligibilityRuleUpdateRequest loadRulesFromFile() throws IOException {
        File file = new File(RULES_FILE_PATH);
        
        if (!file.exists()) {
            throw new ResourceNotFoundException("EligibilityRule.json", "file", RULES_FILE_PATH);
        }
        
        return objectMapper.readValue(file, EligibilityRuleUpdateRequest.class);
    }
    
    /**
     * Evaluate a single rule
     */
    private boolean evaluateRule(EligibilityRuleDTO rule, BigDecimal cgpa, Integer passoutYear, Integer historyOfArrears, String degree, String department) {
        String field = rule.getField();
        String operator = rule.getOperator();
        
        try {
            // Handle string fields (degree, department) with IN operator
            if ("IN".equalsIgnoreCase(operator)) {
                return evaluateInOperator(field, rule.getAllowedValues(), degree, department);
            }
            
            // Handle numeric fields
            Double fieldValue = null;
            
            // Get the field value based on the field name
            switch (field.toLowerCase()) {
                case "cgpa":
                    fieldValue = cgpa != null ? cgpa.doubleValue() : null;
                    break;
                case "passoutyear":
                    fieldValue = passoutYear != null ? passoutYear.doubleValue() : null;
                    break;
                case "historyofarrears":
                    fieldValue = historyOfArrears != null ? historyOfArrears.doubleValue() : null;
                    break;
                default:
                    return true; // Unknown field, pass by default
            }
            
            if (fieldValue == null) {
                return false; // Missing required data
            }
            
            // Evaluate based on operator
            return evaluateOperator(fieldValue, operator, rule.getValue(), rule.getMin(), rule.getMax());
            
        } catch (Exception e) {
            System.err.println("Error evaluating rule for field " + field + ": " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Evaluate operator
     */
    private boolean evaluateOperator(Double fieldValue, String operator, Double value, Integer min, Integer max) {
        switch (operator.toUpperCase()) {
            case ">=":
                return value != null && fieldValue >= value;
                
            case "<=":
                return value != null && fieldValue <= value;
                
            case ">":
                return value != null && fieldValue > value;
                
            case "<":
                return value != null && fieldValue < value;
                
            case "==":
            case "=":
                return value != null && fieldValue.equals(value);
                
            case "BETWEEN":
                return min != null && max != null && fieldValue >= min && fieldValue <= max;
                
            default:
                return true; // Unknown operator, pass by default
        }
    }
    
    /**
     * Evaluate IN operator for string fields (degree, department)
     */
    private boolean evaluateInOperator(String field, java.util.List<String> allowedValues, String degree, String department) {
        if (allowedValues == null || allowedValues.isEmpty()) {
            return true; // No restriction, pass by default
        }
        
        // Get the field value based on the field name and check directly
        switch (field.toLowerCase()) {
            case "degree":
                if (degree == null || degree.isBlank()) {
                    return false; // Missing required data
                }
                final String degreeValue = degree.trim();
                return allowedValues.stream()
                        .anyMatch(allowed -> allowed.equalsIgnoreCase(degreeValue));
                
            case "department":
                if (department == null || department.isBlank()) {
                    return false; // Missing required data
                }
                final String departmentValue = department.trim();
                return allowedValues.stream()
                        .anyMatch(allowed -> allowed.equalsIgnoreCase(departmentValue));
                
            default:
                return true; // Unknown field, pass by default
        }
    }
    
    /**
     * Format message with placeholders
     */
    private String formatMessage(String message, EligibilityRuleDTO rule) {
        if (message == null) {
            return "Eligibility criteria not met";
        }
        
        String formatted = message;
        
        if (rule.getValue() != null) {
            formatted = formatted.replace("{value}", rule.getValue().toString());
        }
        
        if (rule.getMin() != null) {
            formatted = formatted.replace("{min}", rule.getMin().toString());
        }
        
        if (rule.getMax() != null) {
            formatted = formatted.replace("{max}", rule.getMax().toString());
        }
        
        if (rule.getAllowedValues() != null && !rule.getAllowedValues().isEmpty()) {
            formatted = formatted.replace("{allowedValues}", String.join(", ", rule.getAllowedValues()));
        }
        
        return formatted;
    }
}
