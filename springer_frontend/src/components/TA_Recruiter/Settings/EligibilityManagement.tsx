import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormControl,
  FormHelperText,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { candidateApi } from "../../../services/drive.api";
import { showToast } from "../../../utils/toast";
import { syncEligibilityFiltersToSession } from "../../../utils/eligibilityFilterSync";
import BackButton from "../../Common/BackButton";
import type {
  EligibilityRuleDTO,
  EligibilityRuleUpdateRequest,
} from "../../../types/TA_Recruiter/Drive/driveSchedule.types";
import "../../../css/TA_Recruiter/Settings/EligibilityManagement.css";

const FIELD_OPTIONS = [
  { value: "cgpa", label: "CGPA" },
  { value: "passoutYear", label: "Passout Year" },
  { value: "historyOfArrears", label: "History of Arrears" },
  { value: "degree", label: "Degree" },
  { value: "department", label: "Department" },
];

const DEGREE_OPTIONS = [
  "BE", "BTech", "ME", "MTech", "BSc", "MSc", "BCA", "MCA", 
  "BCom", "MCom", "MBA", "BA", "MA", "Diploma", "PhD"
];

const DEPARTMENT_OPTIONS = [
  "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AI", "DS", "AIML", 
  "CYBER SECURITY", "ROBOTICS", "COMPUTER APPLICATIONS", "INFORMATION SYSTEMS",
  "MATHEMATICS", "PHYSICS", "CHEMISTRY", "STATISTICS", "COMMERCE", 
  "BUSINESS ADMINISTRATION", "ECONOMICS", "ENGLISH"
];

const EligibilityManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<EligibilityRuleDTO[]>([]);
  const [originalData, setOriginalData] = useState<EligibilityRuleUpdateRequest | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchEligibilityRules();
  }, []);

  const fetchEligibilityRules = async () => {
    try {
      setLoading(true);
      const response = await candidateApi.getEligibilityRules();
      if (response.success && response.data) {
        setRules(response.data.rules || []);
        setOriginalData(response.data);
      } else {
        showToast(response.message || "Failed to load eligibility rules", "error");
      }
    } catch (error: unknown) {
      console.error("Error fetching eligibility rules:", error);
      let errorMessage = "Failed to load eligibility rules";
      
      // Extract error message from API response
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('response' in error) {
          const axiosError = error as { 
            response?: { data?: { message?: string } } 
          };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      }
      
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    if (originalData) {
      setRules(originalData.rules || []);
    }
    setErrors({});
    setEditMode(false);
  };

  const validateRule = (rule: EligibilityRuleDTO): string => {
    if (rule.operator === "BETWEEN") {
      if (rule.min === null || rule.min === undefined) {
        return "Min value is required";
      }
      if (rule.max === null || rule.max === undefined) {
        return "Max value is required";
      }
      
      // Check for negative values
      if (rule.field === "cgpa" || rule.field === "passoutYear" || rule.field === "historyOfArrears") {
        if (rule.min < 0) {
          return "Min value cannot be negative";
        }
        if (rule.max < 0) {
          return "Max value cannot be negative";
        }
      }
      
      // Additional validation for specific fields
      if (rule.field === "cgpa") {
        if (rule.min > 10) {
          return "CGPA cannot exceed 10.0";
        }
        if (rule.max > 10) {
          return "CGPA cannot exceed 10.0";
        }
      }
      
      // Check for 4-digit year for passoutYear field
      if (rule.field === "passoutYear") {
        const minStr = String(rule.min);
        const maxStr = String(rule.max);
        if (minStr.length !== 4 || maxStr.length !== 4) {
          return "Year must be a 4-digit number";
        }
        if (rule.min < 1900 || rule.min > 2100 || rule.max < 1900 || rule.max > 2100) {
          return "Year must be between 1900 and 2100";
        }
      }
      
      if (rule.min > rule.max) {
        return "Min value must be less than or equal to Max value";
      }
    } else if (rule.operator === "IN") {
      if (!rule.allowedValues || rule.allowedValues.length === 0) {
        return "At least one value must be selected";
      }
    } else {
      // For >=, <=, >, <, ==
      if (rule.value === null || rule.value === undefined) {
        return "Value is required";
      }
      
      // Check for negative values
      if (rule.field === "cgpa" || rule.field === "passoutYear" || rule.field === "historyOfArrears") {
        if (rule.value < 0) {
          return "Value cannot be negative";
        }
      }
      
      // Additional validation for specific fields
      if (rule.field === "cgpa" && rule.value > 10) {
        return "CGPA cannot exceed 10.0";
      }
      
      if (rule.field === "passoutYear") {
        const valueStr = String(rule.value);
        if (valueStr.length !== 4) {
          return "Year must be a 4-digit number";
        }
        if (rule.value < 1900 || rule.value > 2100) {
          return "Year must be between 1900 and 2100";
        }
      }
    }
    return "";
  };

  const validateAllRules = (): boolean => {
    const newErrors: Record<number, string> = {};
    let hasErrors = false;

    rules.forEach((rule, index) => {
      const error = validateRule(rule);
      if (error) {
        newErrors[index] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSave = async () => {
    // Validate all rules
    if (!validateAllRules()) {
      showToast("Please fix all validation errors before saving", "error");
      return;
    }

    try {
      setSaving(true);
      const updateData: EligibilityRuleUpdateRequest = {
        rules,
        logic: "AND", // Fixed to AND
      };

      const response = await candidateApi.updateEligibilityRules(updateData);
      if (response.success) {
        showToast("Eligibility rules updated successfully", "success");
        setOriginalData(response.data);
        setEditMode(false);
        fetchEligibilityRules();
        
        // Sync updated eligibility rules to sessionStorage filters
        syncEligibilityFiltersToSession().catch((err: unknown) => 
          console.warn("Failed to sync eligibility filters after update:", err)
        );
      } else {
        showToast(response.message || "Failed to update eligibility rules", "error");
      }
    } catch (error: unknown) {
      console.error("Error updating eligibility rules:", error);
      let errorMessage = "Failed to update eligibility rules";
      
      // Extract error message from API response
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('response' in error) {
          const axiosError = error as { 
            response?: { data?: { message?: string } } 
          };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      }
      
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRuleChange = (index: number, field: keyof EligibilityRuleDTO, value: string | number | string[] | null | undefined) => {
    const updatedRules = [...rules];
    updatedRules[index] = {
      ...updatedRules[index],
      [field]: value,
    };
    setRules(updatedRules);
    
    // Validate the rule and update errors
    const error = validateRule(updatedRules[index]);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[index] = error;
      } else {
        delete newErrors[index];
      }
      return newErrors;
    });
  };

  const handleSelectAll = (index: number, field: "degree" | "department") => {
    const allValues = field === "degree" ? DEGREE_OPTIONS : DEPARTMENT_OPTIONS;
    handleRuleChange(index, "allowedValues", allValues);
  };

  const handleDeselectAll = (index: number) => {
    handleRuleChange(index, "allowedValues", []);
  };

  const handleCheckboxChange = (index: number, value: string, checked: boolean) => {
    const rule = rules[index];
    const currentValues = rule.allowedValues || [];
    
    let newValues: string[];
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleRuleChange(index, "allowedValues", newValues);
  };

  const formatFieldName = (field: string): string => {
    const option = FIELD_OPTIONS.find((opt) => opt.value === field);
    return option ? option.label : field;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="eligibility-loading-container">
        <CircularProgress />
        <Typography className="eligibility-loading-text">Loading eligibility rules...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="eligibility-management-container">
      {/* Header with Back Navigation */}
      <Box className="eligibility-header">
        <BackButton inline />
        <Box className="eligibility-header-content">
          <Typography variant="h4" component="h1" gutterBottom>
            Eligibility Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure candidate eligibility criteria
          </Typography>
        </Box>
      </Box>

      <Card className="eligibility-card">
        <CardContent>
          <Box className="rules-simple-container">
            {rules.length === 0 ? (
              <Alert severity="info">No eligibility rules configured.</Alert>
            ) : (
              <>
                {rules.map((rule, index) => (
                  <Box key={index} className="rule-simple-item">
                    <Grid container spacing={3} alignItems="center">
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Typography variant="body1" fontWeight="600">
                          {formatFieldName(rule.field)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, md: 2 }}>
                        <Typography variant="body1" fontWeight="600">
                          {rule.operator}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, md: 7 }}>
                        {editMode ? (
                          <>
                            {rule.operator === "BETWEEN" ? (
                              <Box>
                                <Box className="eligibility-input-group-horizontal">
                                  <TextField
                                    size="small"
                                    type="number"
                                    placeholder="Min"
                                    value={rule.min ?? ""}
                                    onChange={(e) =>
                                      handleRuleChange(
                                        index,
                                        "min",
                                        e.target.value ? Number(e.target.value) : undefined
                                      )
                                    }
                                    error={!!errors[index]}
                                    className="eligibility-input-flex"
                                    inputProps={{
                                      min: 0,
                                      step: rule.field === "cgpa" ? 0.01 : 1
                                    }}
                                  />
                                  <Typography>to</Typography>
                                  <TextField
                                    size="small"
                                    type="number"
                                    placeholder="Max"
                                    value={rule.max ?? ""}
                                    onChange={(e) =>
                                      handleRuleChange(
                                        index,
                                        "max",
                                        e.target.value ? Number(e.target.value) : undefined
                                      )
                                    }
                                    error={!!errors[index]}
                                    className="eligibility-input-flex"
                                    inputProps={{
                                      min: 0,
                                      step: rule.field === "cgpa" ? 0.01 : 1
                                    }}
                                  />
                                </Box>
                                <Box className="eligibility-error-space">
                                  {errors[index] && (
                                    <FormHelperText error>
                                      {errors[index]}
                                    </FormHelperText>
                                  )}
                                </Box>
                              </Box>
                            ) : rule.operator === "IN" ? (
                              <FormControl error={!!errors[index]} fullWidth>
                                <Box className="eligibility-select-all-container">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleSelectAll(index, rule.field === "degree" ? "degree" : "department")}
                                  >
                                    Select All
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => handleDeselectAll(index)}
                                  >
                                    Deselect All
                                  </Button>
                                </Box>
                                <FormGroup>
                                  <Box className="eligibility-checkbox-grid">
                                    {(rule.field === "degree" ? DEGREE_OPTIONS : DEPARTMENT_OPTIONS).map((option) => (
                                      <FormControlLabel
                                        key={option}
                                        control={
                                          <Checkbox
                                            checked={rule.allowedValues?.includes(option) || false}
                                            onChange={(e) => handleCheckboxChange(index, option, e.target.checked)}
                                            size="small"
                                          />
                                        }
                                        label={option}
                                      />
                                    ))}
                                  </Box>
                                </FormGroup>
                                <Box className="eligibility-error-space">
                                  {errors[index] && (
                                    <FormHelperText error>
                                      {errors[index]}
                                    </FormHelperText>
                                  )}
                                </Box>
                              </FormControl>
                            ) : (
                              <Box>
                                <TextField
                                  size="small"
                                  type="number"
                                  fullWidth
                                  value={rule.value ?? ""}
                                  onChange={(e) =>
                                    handleRuleChange(
                                      index,
                                      "value",
                                      e.target.value ? Number(e.target.value) : undefined
                                    )
                                  }
                                  error={!!errors[index]}
                                  inputProps={{
                                    min: 0,
                                    step: rule.field === "cgpa" ? 0.01 : 1
                                  }}
                                />
                                <Box className="eligibility-error-space">
                                  {errors[index] && (
                                    <FormHelperText error>
                                      {errors[index]}
                                    </FormHelperText>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </>
                        ) : (
                          <Typography variant="body1" fontWeight="600">
                            {rule.operator === "BETWEEN"
                              ? `${rule.min} to ${rule.max}`
                              : rule.operator === "IN"
                              ? (
                                <Box className="eligibility-chips-container">
                                  {rule.allowedValues?.map((val, idx) => (
                                    <Chip key={idx} label={val} size="small" color="primary" variant="outlined" />
                                  ))}
                                </Box>
                              )
                              : rule.value}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </>
            )}
          </Box>

          {/* Action Buttons at Bottom */}
          <Box className="rules-actions">
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                color="primary"
                fullWidth
              >
                Edit Values
              </Button>
            ) : (
              <Box className="eligibility-actions-row">
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  color="success"
                  fullWidth
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default EligibilityManagement;