import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOverlay from "../../Common/ErrorOverlay";
// Commented out - header not displayed
// import AddIcon from "@mui/icons-material/Add";
// import BackButton from "../../Common/BackButton";
import { formApi, candidateRegistrationApi, candidateApi } from "../../../services/drive.api";
import type { FormRequest, FormResponse } from "../../../types/TA_Recruiter/Drive/form.types";
import type { CandidateRegistrationResponse, CandidateRegistrationUpdateRequest } from "../../../types/TA_Recruiter/Drive/candidateRegistration.types";
import type { CandidateValidationRequest, CandidateValidationResponse, CandidateRequest } from "../../../types/TA_Recruiter/Drive/candidate.types";
import { ValidationStatus } from "../../../types/TA_Recruiter/Drive/candidate.types";
import { showToast } from "../../../utils/toast";
import dayjs from "dayjs";
import "../../../css/TA_Recruiter/Candidates/Form.css";

// Type extension for window object
declare global {
  interface Window {
    __openFormAddDialog?: () => void;
  }
}

// Utility to detect batch duplicates
const computeBatchDuplicates = (registrations: CandidateRegistrationResponse[]): Set<number> => {
  const dupIndices = new Set<number>();
  const emailMap = new Map<string, number[]>();
  const aadhaarMap = new Map<string, number[]>();

  registrations.forEach((reg, idx) => {
    const email = (reg.email || "").trim().toLowerCase();
    if (email) {
      const indices = emailMap.get(email) || [];
      indices.push(idx);
      emailMap.set(email, indices);
    }
    const aadhaar = String(reg.aadhaarNo || "").trim();
    if (aadhaar) {
      const indices = aadhaarMap.get(aadhaar) || [];
      indices.push(idx);
      aadhaarMap.set(aadhaar, indices);
    }
  });

  emailMap.forEach((indices) => {
    if (indices.length > 1) indices.slice(1).forEach((i) => dupIndices.add(i));
  });
  aadhaarMap.forEach((indices) => {
    if (indices.length > 1) indices.slice(1).forEach((i) => dupIndices.add(i));
  });

  return dupIndices;
};

const Form: React.FC<{ onAddFormClick?: () => void }> = ({ onAddFormClick }) => {
  const location = useLocation();
  const navState = location.state as { driveId?: number; driveName?: string; cycleId?: number } | null;
  const driveId = navState?.driveId || null;
  const driveName = navState?.driveName || "";
  const cycleId = navState?.cycleId || null;

  const [forms, setForms] = useState<FormResponse[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormResponse | null>(null);
  const [registrations, setRegistrations] = useState<CandidateRegistrationResponse[]>([]);
  const [addDialog, setAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<Map<number, CandidateValidationResponse>>(new Map());
  const [batchDuplicateIndices, setBatchDuplicateIndices] = useState<Set<number>>(new Set());
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<CandidateRegistrationResponse | null>(null);
  const [editingRegistrationId, setEditingRegistrationId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [uploadErrorMessages, setUploadErrorMessages] = useState<string[]>([]);
  const [uploadErrorEmailMap, setUploadErrorEmailMap] = useState<Map<number, string>>(new Map());
  const [formData, setFormData] = useState<FormRequest>({
    driveId: driveId || 0,
    formName: "",
    status: true,
  });

  useEffect(() => {
    if (driveId) {
      fetchForms();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveId]);

  // Expose add dialog trigger to parent component
  useEffect(() => {
    if (onAddFormClick) {
      // Store the reference for parent to call
      window.__openFormAddDialog = () => setAddDialog(true);
    }
    return () => {
      delete window.__openFormAddDialog;
    };
  }, [onAddFormClick]);

  const fetchForms = useCallback(async () => {
    if (!driveId) return;
    
    try {
      setLoading(true);
      const response = await formApi.getFormsByDriveId(driveId);
      if (response.success && response.data) {
        setForms(response.data);
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to fetch forms";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  const fetchRegistrations = useCallback(async () => {
    if (!selectedForm) return;
    try {
      setLoading(true);
      const response = await candidateRegistrationApi.getRegistrationsByFormId(selectedForm.formId);
      if (response.success && response.data) {
        setRegistrations(response.data);
        setBatchDuplicateIndices(computeBatchDuplicates(response.data));
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to refresh registrations";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [selectedForm]);

  const handleAddForm = async () => {
    if (!formData.formName.trim()) {
      showToast("Form name is required", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await formApi.createForm(formData);
      if (response.success) {
        showToast(response.message || "Form created successfully", "success");
        setAddDialog(false);
        setFormData({ driveId: driveId || 0, formName: "", status: true });
        fetchForms();
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to create form";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = async (form: FormResponse) => {
    // Toggle: if clicking the same form, deselect it
    if (selectedForm?.formId === form.formId) {
      setSelectedForm(null);
      setRegistrations([]);
      setValidationResults(new Map());
      setBatchDuplicateIndices(new Set());
      setShowActionButtons(false);
      return;
    }

    setSelectedForm(form);
    setValidationResults(new Map());
    setBatchDuplicateIndices(new Set());
    setShowActionButtons(false);
    
    try {
      setLoading(true);
      const response = await candidateRegistrationApi.getRegistrationsByFormId(form.formId);
      if (response.success && response.data) {
        setRegistrations(response.data);
        setBatchDuplicateIndices(computeBatchDuplicates(response.data));
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to fetch registrations";
      showToast(errorMessage, "error");
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (form: FormResponse) => {
    try {
      const response = await formApi.updateForm(form.formId, { status: !form.status });
      if (response.success) {
        showToast(response.message || "Form status updated successfully", "success");
        fetchForms();
        if (selectedForm?.formId === form.formId) {
          setSelectedForm({ ...form, status: !form.status });
        }
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to update form status";
      showToast(errorMessage, "error");
    }
  };

  const generateFormLink = (form: FormResponse) => {
    const formattedDriveName = driveName?.replace(/\s+/g, "-") || "drive";
    const formattedFormName = form.formName.replace(/\s+/g, "-");
    return `${window.location.origin}/kanini-reg/${formattedDriveName}/${formattedFormName}/${form.formId}`;
  };

  const handleOpenForm = (form: FormResponse) => {
    const formattedDriveName = driveName?.replace(/\s+/g, "-") || "drive";
    const formattedFormName = form.formName.replace(/\s+/g, "-");
    window.open(`/kanini-reg/${formattedDriveName}/${formattedFormName}/${form.formId}`, "_blank");
  };

  const handleCopyLink = (form: FormResponse) => {
    const link = generateFormLink(form);
    navigator.clipboard.writeText(link).then(() => {
      showToast("Link copied to clipboard!", "success");
    }).catch(() => {
      showToast("Failed to copy link", "error");
    });
  };

  const handleDownloadQR = async (form: FormResponse) => {
    try {
      const QRCode = (await import("qrcode")).default;
      const link = generateFormLink(form);
      
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });

      const downloadLink = document.createElement("a");
      downloadLink.href = qrDataUrl;
      downloadLink.download = `${form.formName.replace(/\s+/g, "_")}_QR.png`;
      downloadLink.click();
      
      showToast("QR Code downloaded successfully!", "success");
    } catch {
      showToast("Failed to generate QR code", "error");
    }
  };

  const handleValidateRegistrations = async () => {
    if (registrations.length === 0) {
      showToast("No registrations to validate", "error");
      return;
    }

    setIsValidating(true);
    try {
      const validationRequests: CandidateValidationRequest[] = registrations.map((reg) => ({
        tempId: `reg-${reg.registrationId}`,
        instituteId: reg.instituteId || 0,
        cycleId: cycleId || 0,
        firstName: reg.fname,
        lastName: reg.lname || "",
        email: reg.email,
        mobile: reg.phone,
        cgpa: reg.cgpa,
        historyOfArrears: reg.historyOfArrears,
        degree: reg.degree,
        department: reg.department,
        passoutYear: reg.graduationYear,
        dateOfBirth: reg.dob,
        aadhaarNumber: reg.aadhaarNo || "",
        applicationType: reg.applicationType || "STANDARD",
      }));

      const response = await candidateApi.bulkValidateCandidates(validationRequests);

      if (response.success && response.data) {
        const resultsMap = new Map<number, CandidateValidationResponse>();
        response.data.forEach((result) => {
          // Extract registration ID from tempId (format: "reg-12" -> 12)
          const match = result.tempId?.match(/reg-(\d+)/);
          if (match) {
            const regId = parseInt(match[1], 10);
            resultsMap.set(regId, result);
          }
        });
        setValidationResults(resultsMap);
        setShowActionButtons(true);

        const duplicateCount = response.data.filter((r) => r.status === ValidationStatus.DUPLICATE).length;
        const oldCount = response.data.filter((r) => r.status === ValidationStatus.OLD).length;
        const newCount = response.data.filter((r) => r.status === ValidationStatus.NEW).length;

        if (duplicateCount > 0) {
          showToast(
            `Validation complete: ${newCount} new, ${oldCount} old entries, ${duplicateCount} duplicates (upload disabled)`,
            "error"
          );
        } else if (oldCount > 0) {
          showToast(
            `Validation complete: ${newCount} new, ${oldCount} old entries (can re-apply)`,
            "success"
          );
        } else {
          showToast(`All ${newCount} candidates validated successfully`, "success");
        }
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Validation failed";
      showToast(errorMessage, "error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    const indicesToRemove = new Set<number>(batchDuplicateIndices);
    
    // Also add DB duplicate indices
    registrations.forEach((reg, idx) => {
      const validation = validationResults.get(reg.registrationId);
      if (validation?.status === ValidationStatus.DUPLICATE) {
        indicesToRemove.add(idx);
      }
    });
    
    if (indicesToRemove.size === 0) {
      showToast("No duplicates to remove", "error");
      return;
    }
    
    // Collect registration IDs to delete from database
    const registrationIdsToDelete: number[] = [];
    registrations.forEach((reg, idx) => {
      if (indicesToRemove.has(idx)) {
        registrationIdsToDelete.push(reg.registrationId);
      }
    });

    try {
      setLoading(true);
      
      // Call bulk delete API
      const response = await candidateRegistrationApi.bulkDeleteRegistrations({
        registrationIds: registrationIdsToDelete
      });
      
      if (response.success) {
        // Update local state only after successful deletion
        const filteredRegs = registrations.filter((_, idx) => !indicesToRemove.has(idx));
        
        setRegistrations(filteredRegs);
        setBatchDuplicateIndices(computeBatchDuplicates(filteredRegs));
        
        // Update validation results map
        const newResultsMap = new Map<number, CandidateValidationResponse>();
        filteredRegs.forEach((reg) => {
          const validation = validationResults.get(reg.registrationId);
          if (validation) {
            newResultsMap.set(reg.registrationId, validation);
          }
        });
        setValidationResults(newResultsMap);
        
        showToast(response.message || `Removed ${indicesToRemove.size} duplicate row(s)`, "success");
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to remove duplicates";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRegistrations = async () => {
    if (registrations.length === 0) {
      showToast("No registrations to upload", "error");
      return;
    }

    if (validationResults.size === 0) {
      showToast("Please validate registrations before uploading", "error");
      return;
    }

    const hasDuplicates = Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );

    if (hasDuplicates || batchDuplicateIndices.size > 0) {
      showToast("Cannot upload: duplicate candidates detected. Please remove them.", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Convert registrations to CandidateRequest format
      const candidateRequests: CandidateRequest[] = registrations.map((reg) => {
        // Parse skills from comma-separated IDs
        const skillIds = reg.skills
          ? reg.skills.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
          : [];

        return {
          instituteId: reg.instituteId || 0,
          cycleId: cycleId || undefined,
          driveId: reg.driveId,
          firstName: reg.fname,
          lastName: reg.lname || "",
          email: reg.email,
          mobile: reg.phone,
          cgpa: reg.cgpa,
          historyOfArrears: reg.historyOfArrears,
          degree: reg.degree,
          department: reg.department,
          passoutYear: reg.graduationYear,
          dateOfBirth: reg.dob,
          aadhaarNumber: reg.aadhaarNo || "",
          applicationType: (reg.applicationType || "STANDARD") as "STANDARD" | "PREMIUM",
          skillIds: skillIds,
        };
      });

      const response = await candidateApi.bulkCreateCandidates(candidateRequests);

      if (response.data.errorMessages && response.data.errorMessages.length > 0) {
        // Build email map: 0-based error index → email of the failing registration
        const emailMap = new Map<number, string>();
        (response.data.errorMessages as string[]).forEach((msg: string, errorIdx: number) => {
          const match = msg.match(/Candidate\s*#(\d+)/i);
          if (match) {
            const candidateNum = parseInt(match[1], 10);
            const reg = registrations[candidateNum - 1];
            if (reg) emailMap.set(errorIdx, reg.email);
          }
        });
        setUploadErrorMessages(response.data.errorMessages);
        setUploadErrorEmailMap(emailMap);
        setShowErrorOverlay(true);
        if (response.data.successfulInserts && response.data.successfulInserts.length > 0) {
          showToast(`${response.data.successfulInserts.length} uploaded, ${response.data.errorMessages.length} failed`, "error");
        }
      } else {
        showToast(`${response.data.successfulInserts.length} candidates uploaded successfully!`, "success");
        
        // After successful upload, delete the uploaded registrations from candidate_registration table
        try {
          const uploadedRegistrationIds = registrations.map(reg => reg.registrationId);
          const deleteResponse = await candidateRegistrationApi.bulkDeleteRegistrations({
            registrationIds: uploadedRegistrationIds
          });
          
          if (deleteResponse.success) {
            showToast(deleteResponse.message || "Uploaded registrations removed successfully", "success");
          }
        } catch (deleteError) {
          const errorMessage = (deleteError as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (deleteError as Error)?.message || "Failed to remove uploaded registrations";
          showToast(errorMessage, "error");
        } finally {
          // Refresh the registrations list whether deletion succeeded or failed
          if (selectedForm) {
            handleFormClick(selectedForm);
          }
        }
      }
    } catch (error) {
      // handleAxiosError in drive.api.ts transforms the axios error into AppError<BulkErrorBody>
      // shape: { message: string, success: false, data: { errorMessages, successfulInserts, ... } }
      type BulkErrorBody = { errorMessages?: string[]; successfulInserts?: unknown[] };
      const appError = error as { message?: string; data?: BulkErrorBody };
      const bulkErrors = appError?.data?.errorMessages;

      if (bulkErrors && bulkErrors.length > 0) {
        const emailMap = new Map<number, string>();
        bulkErrors.forEach((msg: string, errorIdx: number) => {
          const match = msg.match(/Candidate\s*#(\d+)/i);
          if (match) {
            const reg = registrations[parseInt(match[1], 10) - 1];
            if (reg) emailMap.set(errorIdx, reg.email);
          }
        });
        setUploadErrorMessages(bulkErrors);
        setUploadErrorEmailMap(emailMap);
        setShowErrorOverlay(true);
        const successCount = appError?.data?.successfulInserts?.length ?? 0;
        if (successCount > 0) {
          showToast(`${successCount} uploaded, ${bulkErrors.length} failed`, "error");
        }
      } else {
        showToast(appError?.message || "Upload failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const getValidationForRegistration = (regId: number): CandidateValidationResponse | undefined => {
    return validationResults.get(regId);
  };

  const handleDeleteRegistration = async (registration: CandidateRegistrationResponse) => {
    setRegistrationToDelete(registration);
    setDeleteDialog(true);
  };

  const handleRemoveFromOverlay = useCallback(async (email: string, errorIndex: number) => {
    const regToRemove = registrations.find((reg) => reg.email === email);
    const updatedRegs = registrations.filter((reg) => reg.email !== email);
    setRegistrations(updatedRegs);
    setBatchDuplicateIndices(computeBatchDuplicates(updatedRegs));
    if (regToRemove) {
      const newValidationResults = new Map(validationResults);
      newValidationResults.delete(regToRemove.registrationId);
      setValidationResults(newValidationResults);
    }
    setUploadErrorMessages((prev) => {
      const updated = prev.filter((_, idx) => idx !== errorIndex);
      if (updated.length === 0) setShowErrorOverlay(false);
      return updated;
    });
    if (regToRemove) {
      try {
        await candidateRegistrationApi.deleteRegistration(regToRemove.registrationId);
      } catch {
        // Already removed from UI; DB cleanup failure is non-critical
      }
    }
  }, [registrations, validationResults]);

  const handleStartEdit = (reg: CandidateRegistrationResponse) => {
    setEditingRegistrationId(reg.registrationId);
    setEditValue(reg.collegeName || "");
  };

  const handleSaveEdit = async () => {
    if (editingRegistrationId === null) return;
    const trimmed = editValue.trim();
    setEditingRegistrationId(null);
    setEditValue("");
    if (!trimmed) return;
    try {
      setIsSaving(true);
      const payload: CandidateRegistrationUpdateRequest = { registrationId: editingRegistrationId, collegeName: trimmed };
      await candidateRegistrationApi.updateRegistration(editingRegistrationId, payload);
      await fetchRegistrations();
      showToast("College name updated", "success");
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Update failed";
      showToast(msg, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteRegistration = async () => {
    if (!registrationToDelete) return;

    try {
      setLoading(true);
      const response = await candidateRegistrationApi.deleteRegistration(registrationToDelete.registrationId);
      if (response.success) {
        showToast(response.message || "Registration deleted successfully", "success");
        // Remove from local state
        const updatedRegs = registrations.filter(reg => reg.registrationId !== registrationToDelete.registrationId);
        setRegistrations(updatedRegs);
        // Recompute batch duplicates
        setBatchDuplicateIndices(computeBatchDuplicates(updatedRegs));
        // Remove from validation results
        const newValidationResults = new Map(validationResults);
        newValidationResults.delete(registrationToDelete.registrationId);
        setValidationResults(newValidationResults);
        setDeleteDialog(false);
        setRegistrationToDelete(null);
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || "Failed to delete registration";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="form-page-container">
      {/* Header commented out - controlled by parent AddCandidates component
      <Card className="form-header-card">
        <Box className="form-header-left">
          <BackButton variant="header" />
          
          <Typography variant="h6" className="form-header-title">
            Forms Management
          </Typography>

          {driveName && (
            <Typography variant="body1" className="form-header-subtitle">
              {driveName}
            </Typography>
          )}
        </Box>

        <Box className="form-header-right">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            className="t-btn-primary"
          >
            Add Form
          </Button>
        </Box>
      </Card>
      */}

      {/* Forms List */}
      <Card className="form-list-card">
       
        {forms.length === 0 ? (
          <Box className="form-empty-state">
            <Typography variant="body2" className="form-empty-text">
              No forms created yet. Click "Add Form" to create one.
            </Typography>
          </Box>
        ) : (
          <Box className="form-cards-container">
            {forms.map((form) => (
              <Card
                key={form.formId}
                className={`form-card ${selectedForm?.formId === form.formId ? "form-card-selected" : ""}`}
              >
                <Box onClick={() => handleFormClick(form)} className="form-card-clickable">
                  <Box className="form-card-header">
                    <Typography variant="h6" className="form-card-title">
                      {form.formName}
                    </Typography>
                    <Typography
                      variant="body2"
                      className={`form-status-text ${form.status ? "form-status-active" : "form-status-inactive"}`}
                    >
                      {form.status ? "Accepting Response" : "Not Accepting Response"}
                    </Typography>
                  </Box>
                  <Box className="form-card-details">
                    <Typography variant="body2" className="form-card-detail">
                      Created: {dayjs(form.createdAt).format("MMM DD, YYYY")}
                    </Typography>
                    <Switch
                      checked={form.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(form);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box className="form-card-actions" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="Open Form" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenForm(form);
                      }}
                      className="form-action-btn"
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy Link" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(form);
                      }}
                      className="form-action-btn"
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download QR Code" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadQR(form);
                      }}
                      className="form-action-btn"
                    >
                      <QrCode2Icon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Card>

      {/* Registrations Table */}
      {selectedForm && (
        <Card className="form-registrations-card">
          <Box className="form-registrations-header">
            <Typography variant="h6" className="form-section-title">
              Registrations for "{selectedForm.formName}"
            </Typography>
            <Box className="form-registrations-actions">
              <Typography variant="body2" className="form-registrations-count">
                Total: {registrations.length}
                {registrations.filter(r => r.instituteId === 1).length > 0 && (
                  <span className="form-new-college-count">
                    &nbsp;| New Colleges: {registrations.filter(r => r.instituteId === 1).length}
                  </span>
                )}
                {isValidating && <span className="form-validating-text">- Validating...</span>}
              </Typography>            <Tooltip title="Refresh" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
              <IconButton onClick={fetchRegistrations} size="small" disabled={loading} className="form-action-btn">
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>              {!showActionButtons ? (
                <Button
                  variant="outlined"
                  onClick={handleValidateRegistrations}
                  className="t-btn-secondary"
                  disabled={isValidating || registrations.length === 0}
                >
                  {isValidating ? "Validating..." : "Validate"}
                </Button>
              ) : (
                <>
                  {(Array.from(validationResults.values()).some((r) => r.status === ValidationStatus.DUPLICATE) || batchDuplicateIndices.size > 0) && (
                    <Button
                      variant="outlined"
                      onClick={handleRemoveDuplicates}
                      className="t-btn-outlined-primary"
                      disabled={isValidating || loading}
                    >
                      Remove Duplicates
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={handleUploadRegistrations}
                    className="t-btn-primary"
                    disabled={
                      Array.from(validationResults.values()).some((r) => r.status === ValidationStatus.DUPLICATE) ||
                      batchDuplicateIndices.size > 0 ||
                      isValidating ||
                      validationResults.size === 0
                    }
                  >
                    Upload to Database
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {registrations.length === 0 ? (
            <Box className="form-empty-state">
              <Typography variant="body2" className="form-empty-text">
                No registrations found for this form.
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} className="form-table-container">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="t-head-cell">Registration ID</TableCell>
                    <TableCell className="t-head-cell">Name</TableCell>
                    <TableCell className="t-head-cell">Email</TableCell>
                    <TableCell className="t-head-cell">Phone</TableCell>
                    <TableCell className="t-head-cell">College</TableCell>
                    <TableCell className="t-head-cell">Degree</TableCell>
                    <TableCell className="t-head-cell">CGPA</TableCell>
                    <TableCell className="t-head-cell">Graduation Year</TableCell>
                    <TableCell className="t-head-cell">Submitted At</TableCell>
                    <TableCell className="t-head-cell">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrations.map((reg, idx) => {
                    const validation = getValidationForRegistration(reg.registrationId);
                    const isDuplicate = validation?.status === ValidationStatus.DUPLICATE;
                    const isOld = validation?.status === ValidationStatus.OLD;
                    const isBatchDuplicate = batchDuplicateIndices.has(idx);
                    const hasWarning = isDuplicate || isOld || isBatchDuplicate;

                    // Generate tooltip text
                    let tooltipText = "";
                    if (isBatchDuplicate) {
                      tooltipText = "Batch Duplicate: This candidate has duplicate email or aadhaar within the uploaded data";
                    } else if (validation?.comment) {
                      tooltipText = validation.comment;
                    }

                    const isOthersInstitute = reg.instituteId === 1;
                    const rowClassName = isBatchDuplicate
                      ? "table-row-batch-duplicate"
                      : isDuplicate
                        ? "table-row-duplicate"
                        : isOld
                          ? "table-row-old"
                          : isOthersInstitute
                            ? "table-row-others-institute"
                            : "";

                    return (
                      <TableRow key={reg.registrationId} className={rowClassName}>
                        <TableCell>
                          <Box className="index-cell-container">
                            {hasWarning && (
                              <span className={
                                isBatchDuplicate ? "batch-duplicate-dot" : 
                                isDuplicate ? "danger-dot" : "warning-dot"
                              }></span>
                            )}
                            <span>{reg.registrationId}</span>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {tooltipText ? (
                            <Tooltip
                              title={tooltipText}
                              arrow
                              classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                            >
                              <span className="form-name-with-validation">
                                {reg.fname} {reg.lname || ""}
                              </span>
                            </Tooltip>
                          ) : (
                            <span>{reg.fname} {reg.lname || ""}</span>
                          )}
                        </TableCell>
                        <TableCell>{reg.email}</TableCell>
                        <TableCell>{reg.phone}</TableCell>
                        <TableCell
                          onDoubleClick={() => handleStartEdit(reg)}
                          className="form-cell-editable"
                        >
                          {editingRegistrationId === reg.registrationId ? (
                            <input
                              autoFocus
                              className="form-inline-input"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Escape') { setEditingRegistrationId(null); setEditValue(""); } }}
                              onBlur={handleSaveEdit}
                              disabled={isSaving}
                            />
                          ) : isOthersInstitute ? (
                            <Tooltip
                              title={`"${reg.collegeName}" doesn't exist in our institute list`}
                              arrow
                              classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                            >
                              <span className="form-others-college-name">{reg.collegeName}</span>
                            </Tooltip>
                          ) : (
                            reg.collegeName
                          )}
                        </TableCell>
                        <TableCell>{reg.degree}</TableCell>
                        <TableCell>{reg.cgpa}</TableCell>
                        <TableCell>{reg.graduationYear}</TableCell>
                        <TableCell>
                          {dayjs(reg.submittedAt).format("MMM DD, YYYY HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Delete Registration" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
                            <IconButton
                              onClick={() => handleDeleteRegistration(reg)}
                              className="t-action-btn"
                              size="small"
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Add Form Dialog */}
      <Dialog
        open={addDialog}
        onClose={() => setAddDialog(false)}
        maxWidth="sm"
        fullWidth
        className="form-dialog"
      >
        <DialogTitle className="form-dialog-title">Add New Form</DialogTitle>
        <DialogContent className="form-dialog-content">
          <TextField
            label="Form Name"
            fullWidth
            value={formData.formName}
            onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
            placeholder="e.g., Campus Placement 2026 - Engineering"
            className="form-dialog-field"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
              />
            }
            label="Active (Allow registrations)"
            className="form-dialog-switch"
          />
        </DialogContent>
        <DialogActions className="form-dialog-actions">
          <Button onClick={() => setAddDialog(false)} className="t-btn-small">
            Cancel
          </Button>
          <Button
            onClick={handleAddForm}
            variant="contained"
            className="t-btn-primary"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Form"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Error Overlay */}
      {showErrorOverlay && (
        <ErrorOverlay
          errorMessages={uploadErrorMessages}
          errorEmailMap={uploadErrorEmailMap}
          onClose={() => setShowErrorOverlay(false)}
          onRemoveByEmail={handleRemoveFromOverlay}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setRegistrationToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
        className="form-dialog"
      >
        <DialogTitle className="form-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent className="form-dialog-content">
          <Typography>
            Are you sure to delete <strong>{registrationToDelete?.fname} {registrationToDelete?.lname || ""}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions className="form-dialog-actions">
          <Button 
            onClick={() => {
              setDeleteDialog(false);
              setRegistrationToDelete(null);
            }} 
            className="t-btn-small"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteRegistration}
            variant="contained"
            color="primary"
            className="t-btn-primary"
            disabled={loading}
          >
            {loading ? "Deleting..." : "OK"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Form;
