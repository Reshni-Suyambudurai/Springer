// Drive Schedule Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

// Eligibility Rule structures
export interface EligibilityRuleDTO {
  field: string;
  operator: string; // ">=", "<=", ">", "<", "==", "BETWEEN", "IN"
  value?: number | null;
  min?: number | null;
  max?: number | null;
  allowedValues?: string[];
  message: string;
}

export interface EligibilityRuleUpdateRequest {
  rules: EligibilityRuleDTO[];
  logic: string; // AND or OR
}

export interface EligibilityValidationResult {
  eligible: boolean;
  failedReasons: string[];
}
