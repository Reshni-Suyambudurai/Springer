import { candidateApi } from "../services/drive.api";
import { tokenstore } from "../auth/tokenstore";
import type { CandidateFilters } from "../types/TA_Recruiter/Drive/candidate.types";
import type { EligibilityRuleDTO } from "../types/TA_Recruiter/Drive/driveSchedule.types";

/**
 * Syncs eligibility rules from the backend to sessionStorage candidate filters.
 * Extracts degree and department allowedValues from eligibility rules
 * and updates the sessionStorage filter accordingly.
 * 
 * This should be called:
 * 1. After successful login
 * 2. After updating eligibility rules in EligibilityManagement
 */
export const syncEligibilityFiltersToSession = async (): Promise<boolean> => {
  try {
    // Fetch eligibility rules from backend
    const response = await candidateApi.getEligibilityRules();
    
    if (!response.success || !response.data || !response.data.rules) {
      console.warn("Failed to fetch eligibility rules for filter sync");
      return false;
    }

    const rules: EligibilityRuleDTO[] = response.data.rules;

    // Extract degree and department rules (operator: "IN")
    const degreeRule = rules.find(rule => rule.field === "degree" && rule.operator === "IN");
    const departmentRule = rules.find(rule => rule.field === "department" && rule.operator === "IN");

    // Get current filters from sessionStorage or create empty ones
    const currentFilters = tokenstore.getCandidateFilters();
    
    const updatedFilters: CandidateFilters = {
      candidateName: currentFilters?.candidateName || "",
      instituteName: currentFilters?.instituteName || "",
      state: currentFilters?.state || "",
      cities: currentFilters?.cities || [],
      degrees: degreeRule?.allowedValues || [],
      departments: departmentRule?.allowedValues || [],
      eligibility: currentFilters?.eligibility || [],
      applicationTypes: currentFilters?.applicationTypes || [],
      applicationStages: currentFilters?.applicationStages || [],
      skills: currentFilters?.skills || []
    };

    // Save updated filters to sessionStorage
    const saved = tokenstore.saveCandidateFilters(updatedFilters);

    if (saved) {
      console.log("Eligibility filters synced to sessionStorage:", {
        degrees: updatedFilters.degrees,
        departments: updatedFilters.departments
      });
    }

    return saved;
  } catch (error) {
    console.error("Error syncing eligibility filters:", error);
    return false;
  }
};

/**
 * Clear eligibility-related filters from sessionStorage
 */
export const clearEligibilityFiltersFromSession = (): boolean => {
  try {
    const currentFilters = tokenstore.getCandidateFilters();
    
    if (!currentFilters) {
      return true; // Nothing to clear
    }

    const updatedFilters: CandidateFilters = {
      ...currentFilters,
      degrees: [],
      departments: []
    };

    return tokenstore.saveCandidateFilters(updatedFilters);
  } catch (error) {
    console.error("Error clearing eligibility filters:", error);
    return false;
  }
};
