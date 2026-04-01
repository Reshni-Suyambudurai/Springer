import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { candidateApi } from "../../../services/drive.api";
import { showToast } from "../../../utils/toast";
import { syncEligibilityFiltersToSession } from "../../../utils/eligibilityFilterSync";
import BackButton from "../../Common/BackButton";
import { Degree, Department } from "../../../types/TA_Recruiter/Drive/candidate.types";
import type {
  EligibilityRuleDTO,
  EligibilityRuleUpdateRequest,
} from "../../../types/TA_Recruiter/Drive/eligibility.types";
import "../../../css/TA_Recruiter/Settings/EligibilityManagement.css";

const FIELD_OPTIONS = [
  { value: "cgpa", label: "CGPA" },
  { value: "passoutYear", label: "Passout Year" },
  { value: "historyOfArrears", label: "History of Arrears" },
  { value: "degree", label: "Degree" },
  { value: "department", label: "Department" },
];

const DEGREE_OPTIONS = Object.values(Degree);
const DEPARTMENT_OPTIONS = Object.values(Department);

const EligibilityManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null);
  const [editedRule, setEditedRule] = useState<EligibilityRuleDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<EligibilityRuleDTO[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchEligibilityRules();
  }, []);

  const fetchEligibilityRules = async () => {
    try {
      setLoading(true);
      const response = await candidateApi.getEligibilityRules();
      if (response.success && response.data) {
        setRules(response.data.rules || []);
      } else {
        showToast(response.message || "Failed to load eligibility rules", "error");
      }
    } catch (error: unknown) {
      console.error("Error fetching eligibility rules:", error);
      let errorMessage = "Failed to load eligibility rules";
      
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

  const handleOpenDialog = (index: number) => {
    setSelectedRuleIndex(index);
    setEditedRule({ ...rules[index] });
    setError("");
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRuleIndex(null);
    setEditedRule(null);
    setError("");
  };

  const validateRule = (rule: EligibilityRuleDTO): string => {
    if (rule.operator === "BETWEEN") {
      if (rule.min === null || rule.min === undefined) {
        return "Min value is required";
      }
      if (rule.max === null || rule.max === undefined) {
        return "Max value is required";
      }
      
      if (rule.field === "cgpa" || rule.field === "passoutYear" || rule.field === "historyOfArrears") {
        if (rule.min < 0) {
          return "Min value cannot be negative";
        }
        if (rule.max < 0) {
          return "Max value cannot be negative";
        }
      }
      
      if (rule.field === "cgpa") {
        if (rule.min > 10) {
          return "CGPA cannot exceed 10.0";
        }
        if (rule.max > 10) {
          return "CGPA cannot exceed 10.0";
        }
      }
      
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
      // Empty selection is allowed - backend treats it as "all values eligible"
    } else {
      if (rule.value === null || rule.value === undefined) {
        return "Value is required";
      }
      
      if (rule.field === "cgpa" || rule.field === "passoutYear" || rule.field === "historyOfArrears") {
        if (rule.value < 0) {
          return "Value cannot be negative";
        }
      }
      
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

  const handleSave = async () => {
    if (!editedRule || selectedRuleIndex === null) return;

    const validationError = validateRule(editedRule);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const updatedRules = [...rules];
      updatedRules[selectedRuleIndex] = editedRule;

      const updateData: EligibilityRuleUpdateRequest = {
        rules: updatedRules,
        logic: "AND",
      };

      const response = await candidateApi.updateEligibilityRules(updateData);
      if (response.success) {
        showToast("Eligibility rule updated successfully", "success");
        setRules(updatedRules);
        handleCloseDialog();
        
        syncEligibilityFiltersToSession().catch((err: unknown) => 
          console.warn("Failed to sync eligibility filters after update:", err)
        );
      } else {
        showToast(response.message || "Failed to update eligibility rule", "error");
      }
    } catch (error: unknown) {
      console.error("Error updating eligibility rule:", error);
      let errorMessage = "Failed to update eligibility rule";
      
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

  const handleFieldChange = (field: keyof EligibilityRuleDTO, value: string | number | string[] | null | undefined) => {
    if (!editedRule) return;
    
    const updatedRule = {
      ...editedRule,
      [field]: value,
    };
    setEditedRule(updatedRule);
    
    const validationError = validateRule(updatedRule);
    setError(validationError);
  };

  const handleSelectAll = (field: "degree" | "department") => {
    const allValues = field === "degree" ? DEGREE_OPTIONS : DEPARTMENT_OPTIONS;
    handleFieldChange("allowedValues", allValues);
  };

  const handleDeselectAll = () => {
    handleFieldChange("allowedValues", []);
  };

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (!editedRule) return;
    const currentValues = editedRule.allowedValues || [];
    
    let newValues: string[];
    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }
    
    handleFieldChange("allowedValues", newValues);
  };

  const formatFieldName = (field: string): string => {
    const option = FIELD_OPTIONS.find((opt) => opt.value === field);
    return option ? option.label : field;
  };

  const formatRuleValue = (rule: EligibilityRuleDTO): string => {
    if (rule.operator === "BETWEEN") {
      return `${rule.min} to ${rule.max}`;
    } else if (rule.operator === "IN") {
      const count = rule.allowedValues?.length || 0;
      return count === 0 ? "All eligible" : `${count} selected`;
    } else {
      return String(rule.value || "");
    }
  };

  if (loading) {
    return (
      <Box className="eligibility-loading-container">
        <CircularProgress />
        <Typography className="eligibility-loading-text">Loading eligibility rules...</Typography>
      </Box>
    );
  }

  return (
    <Box className="eligibility-management-container">
      {/* Centered Header */}
      <Card className="eligibility-header-card">
        <Box className="eligibility-header-content">
          <Box className="eligibility-header-left">
            <BackButton inline />
          </Box>
          
          <Box className="eligibility-header-center">
            <Typography variant="h5" component="h1">
              Eligibility Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure candidate eligibility criteria
            </Typography>
          </Box>

          <Box className="eligibility-header-right"></Box>
        </Box>
      </Card>

      {/* Scrollable Content */}
      <Box className="eligibility-content-wrapper">
        {rules.length === 0 ? (
          <Alert severity="info">No eligibility rules configured.</Alert>
        ) : (
          <Grid container spacing={3}>
            {rules.map((rule, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card className="eligibility-rule-card">
                  <CardContent className="eligibility-rule-card-content">
                    <Box className="eligibility-rule-header">
                      <Typography variant="h6" className="eligibility-rule-title">
                        {formatFieldName(rule.field)}
                      </Typography>
                      <IconButton
                        className="eligibility-edit-icon"
                        size="small"
                        onClick={() => handleOpenDialog(index)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                    
                    <Box className="eligibility-rule-details">
                      <Typography variant="body2" className="eligibility-rule-operator">
                        Operator: <span>{rule.operator}</span>
                      </Typography>
                      <Typography variant="body2" className="eligibility-rule-value">
                        Value: <span>{formatRuleValue(rule)}</span>
                      </Typography>
                    </Box>
                    
                    {rule.operator === "IN" && (
                      <Box className="eligibility-chips-preview">
                        {(!rule.allowedValues || rule.allowedValues.length === 0) ? (
                          <Chip 
                            label="All Eligible" 
                            size="small" 
                            className="eligibility-chip-all" 
                          />
                        ) : (
                          <>
                            {rule.allowedValues.slice(0, 3).map((val, idx) => (
                              <Chip key={idx} label={val} size="small" className="eligibility-chip" />
                            ))}
                            {rule.allowedValues.length > 3 && (
                              <Chip 
                                label={`+${rule.allowedValues.length - 3} more`} 
                                size="small" 
                                className="eligibility-chip-more"
                              />
                            )}
                          </>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth={editedRule?.operator === "IN" ? "md" : "xs"}
        fullWidth
        className="eligibility-dialog"
      >
        <DialogTitle className="eligibility-dialog-title">
          <Box className="dialog-title-container">
            <Typography variant="h6">
              Edit {editedRule ? formatFieldName(editedRule.field) : "Rule"}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small" className="dialog-close-btn">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent className="eligibility-dialog-content">
          {editedRule && (
            <Box className="eligibility-dialog-form">
              {editedRule.operator === "BETWEEN" ? (
                <Box className="eligibility-compact-form">
                  <Typography variant="body2" className="eligibility-compact-label">
                    {formatFieldName(editedRule.field)} Range
                  </Typography>
                  <Box className="eligibility-between-inputs">
                    <TextField
                      label="Min"
                      type="number"
                      fullWidth
                      size="small"
                      value={editedRule.min ?? ""}
                      onChange={(e) =>
                        handleFieldChange("min", e.target.value ? Number(e.target.value) : undefined)
                      }
                      error={!!error}
                      inputProps={{
                        min: 0,
                        step: editedRule.field === "cgpa" ? 0.01 : 1
                      }}
                    />
                    <Typography className="eligibility-range-separator">to</Typography>
                    <TextField
                      label="Max"
                      type="number"
                      fullWidth
                      size="small"
                      value={editedRule.max ?? ""}
                      onChange={(e) =>
                        handleFieldChange("max", e.target.value ? Number(e.target.value) : undefined)
                      }
                      error={!!error}
                      inputProps={{
                        min: 0,
                        step: editedRule.field === "cgpa" ? 0.01 : 1
                      }}
                    />
                  </Box>
                  <Box className="eligibility-error-space">
                    {error && (
                      <Typography className="eligibility-error-text">
                        {error}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ) : editedRule.operator === "IN" ? (
                <FormControl error={!!error} fullWidth>
                  <Typography variant="body2" className="eligibility-field-label">
                    Select {formatFieldName(editedRule.field)}
                  </Typography>
                  <Box className="eligibility-select-buttons">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSelectAll(editedRule.field === "degree" ? "degree" : "department")}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  </Box>
                  <FormGroup>
                    <Box className="eligibility-checkbox-container">
                      {(editedRule.field === "degree" ? DEGREE_OPTIONS : DEPARTMENT_OPTIONS).map((option) => (
                        <FormControlLabel
                          key={option}
                          control={
                            <Checkbox
                              checked={editedRule.allowedValues?.includes(option) || false}
                              onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                              size="small"
                            />
                          }
                          label={option}
                        />
                      ))}
                    </Box>
                  </FormGroup>
                  <FormHelperText className="eligibility-helper-text">
                    {(!editedRule.allowedValues || editedRule.allowedValues.length === 0) 
                      ? "No selection = All values are eligible" 
                      : `${editedRule.allowedValues.length} selected`}
                  </FormHelperText>
                </FormControl>
              ) : (
                <Box className="eligibility-compact-form">
                  <Typography variant="body2" className="eligibility-compact-label">
                    {formatFieldName(editedRule.field)} ({editedRule.operator})
                  </Typography>
                  <TextField
                    label="Value"
                    type="number"
                    fullWidth
                    size="small"
                    value={editedRule.value ?? ""}
                    onChange={(e) =>
                      handleFieldChange("value", e.target.value ? Number(e.target.value) : undefined)
                    }
                    error={!!error}
                    inputProps={{
                      min: 0,
                      step: editedRule.field === "cgpa" ? 0.01 : 1
                    }}
                  />
                  <Box className="eligibility-error-space">
                    {error && (
                      <Typography className="eligibility-error-text">
                        {error}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions className="eligibility-dialog-actions">
          <Button onClick={handleCloseDialog} variant="outlined" disabled={saving} size="small">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            size="small" 
            disabled={saving || !!error}
            className="eligibility-save-button"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EligibilityManagement;