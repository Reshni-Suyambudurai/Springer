import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { candidateApi } from "../../../services/drive.api";
import { overrideApi } from "../../../services/override.api";
import type { CandidateResponse, CandidateUpdateRequest } from "../../../types/TA_Recruiter/Drive/candidate.types";
import type { ManualOverrideResponse } from "../../../types/Common/override.types";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import BackButton from "../../Common/BackButton";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { internApi } from "../../../services/intern.api";
import ApplicationHistory from "../DriveProcess/ApplicationHistory";
import "../../../css/TA_Recruiter/Candidates/CandidateDetails.css";
import "../../../css/TA_Recruiter/Institutes/AddInstitute.css";

const formatIndianMobile = (mobile: string | number | null | undefined): string => {
  if (mobile === null || mobile === undefined || String(mobile).trim() === "") {
    return "N/A";
  }

  const rawMobile = String(mobile).trim();
  const digits = rawMobile.replace(/\D/g, "");
  const tenDigitMobile = digits.length >= 10 ? digits.slice(-10) : digits;

  if (tenDigitMobile.length !== 10) {
    return rawMobile;
  }

  return `+91 ${tenDigitMobile.slice(0, 5)} ${tenDigitMobile.slice(5)}`;
};

const formatDateLabel = (value: string | null | undefined): string => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTimeLabel = (value: string | null | undefined): string => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).toLowerCase()} ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
};

const getAgeFromDateOfBirth = (value: string | null | undefined): number | null => {
  if (!value) return null;

  const dateOfBirth = new Date(value);
  if (Number.isNaN(dateOfBirth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dateOfBirth.getMonth()
    || (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const CandidateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [candidate, setCandidate] = useState<CandidateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<ManualOverrideResponse[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<CandidateUpdateRequest>({
    isEligible: false,
    reason: "",
    updatedBy: 0,
  });

  // Activate intern dialog
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState("");
  const [activating, setActivating] = useState(false);
  const [driveDetailsExpanded, setDriveDetailsExpanded] = useState(false);

  const populateEditForm = useCallback((data: CandidateResponse) => {
    const user = tokenstore.getUser();
    setEditForm({
      isEligible: data.isEligible,
      reason: "",
      updatedBy: user?.userId || 0,
    });
  }, []);

  const fetchCandidateDetails = useCallback(async (candidateId: number) => {
    setLoading(true);
    try {
      const response = await candidateApi.getCandidateById(candidateId);
      if (response.data) {
        setCandidate(response.data);
        populateEditForm(response.data);
      }
    } catch (error: unknown) {
      // Extract error message from API response
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to fetch candidate details";
      showToast(errorMessage, "error");
      console.error("Error fetching candidate:", error);
    } finally {
      setLoading(false);
    }
  }, [populateEditForm]);

  const fetchOverrides = useCallback(async (candidateId: number) => {
    setLoadingOverrides(true);
    try {
      const response = await overrideApi.getOverridesByEntityTypeAndEntityId("CANDIDATES", candidateId);
      if (response.data) {
        setOverrides(response.data);
      }
    } catch (error) {
      console.error("Error fetching overrides:", error);
      // Don't show error toast - overrides are optional information
    } finally {
      setLoadingOverrides(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchCandidateDetails(Number(id));
      fetchOverrides(Number(id));
    }
  }, [id, fetchCandidateDetails, fetchOverrides]);

  const handleEditToggle = () => {
    if (candidate) {
      const user = tokenstore.getUser();
      if (!user || !user.userId) {
        showToast("User not authenticated. Please login again.", "error");
        return;
      }
      // Populate form and open dialog
      setEditForm({
        isEligible: candidate.isEligible,
        reason: "",
        updatedBy: user.userId,
      });
      setEditDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    if (candidate) {
      populateEditForm(candidate);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    // Validate reason is provided
    if (!editForm.reason || editForm.reason.trim() === "") {
      showToast("Please provide a reason for the eligibility update", "error");
      return;
    }
    
    // Validate user is authenticated
    if (!editForm.updatedBy || editForm.updatedBy === 0) {
      showToast("User not authenticated. Please login again.", "error");
      return;
    }
    
    setSaving(true);
    try {
      await candidateApi.updateCandidate(Number(id), editForm);
      showToast("Candidate eligibility updated successfully", "success");
      setEditDialogOpen(false);
      // Refresh candidate data and overrides
      await fetchCandidateDetails(Number(id));
      await fetchOverrides(Number(id));
    } catch (error: unknown) {
      // Extract error message from API response
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to update candidate eligibility";
      showToast(errorMessage, "error");
      console.error("Error updating candidate:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = useCallback(() => {
    navigate("/ta-recruiter/candidates");
  }, [navigate]);

  const handleActivateIntern = async () => {
    if (!outlookEmail.trim()) {
      showToast("Please enter the intern's Outlook email", "error");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(outlookEmail.trim())) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    setActivating(true);
    try {
      const res = await internApi.activateIntern(Number(id), { outlookEmail: outlookEmail.trim() });
      if (res.success) {
        showToast(res.message || "Intern activated successfully", "success");
        setActivateDialogOpen(false);
        setOutlookEmail("");
        await fetchCandidateDetails(Number(id));
      }
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : "Failed to activate intern";
      showToast(errorMessage, "error");
    } finally {
      setActivating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus) return;
    
    const user = tokenstore.getUser();
    if (!user || !user.userId) {
      showToast("User not authenticated. Please login again.", "error");
      return;
    }
    
    setUpdatingStatus(true);
    try {
      await candidateApi.updateCandidateStatus(Number(id), {
        status: selectedStatus,
        updatedBy: user.userId,
      });
      showToast("Candidate status updated successfully", "success");
      setStatusDialogOpen(false);
      setSelectedStatus("");
      // Refresh candidate data
      await fetchCandidateDetails(Number(id));
    } catch (error: unknown) {
      // Extract error message from API response
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to update candidate status";
      showToast(errorMessage, "error");
      console.error("Error updating status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const locationState = location.state as { driveId?: number } | null;
  const driveIdForHistory = locationState?.driveId ?? (candidate as (CandidateResponse & { driveId?: number }) | null)?.driveId;

  const dateOfBirthLabel = useMemo(() => {
    const formattedDate = formatDateLabel(candidate?.dateOfBirth);
    if (formattedDate === "N/A") return formattedDate;
    const age = getAgeFromDateOfBirth(candidate?.dateOfBirth);
    return age === null ? formattedDate : `${formattedDate} (${age} yrs)`;
  }, [candidate?.dateOfBirth]);

  const showApplicationHistory = Boolean(
    candidate &&
    driveIdForHistory &&
    !["APPLIED", "SHORTLISTED"].includes(candidate.applicationStage)
  );
  const shouldShowActivateInternCard = Boolean(candidate && candidate.applicationStage === "JOINED" && !candidate.userId);
  const shouldShowManualOverrideCard = loadingOverrides || overrides.length > 0;

  if (loading) {
    return (
      <Box className="t-loading">
        <CircularProgress />
        <Typography>Loading candidate details...</Typography>
      </Box>
    );
  }

  if (!candidate) {
    return (
      <Box className="candidate-details-error">
        <Typography variant="h6">Candidate not found</Typography>
        <BackButton onClick={handleBack} inline={true} />
      </Box>
    );
  }

  return (
    <Box className="candidate-details-container">
      {/* Header with Candidate Name */}
      <Card className="candidate-details-header-card">
        <CardContent className="header-card-content-compact">
          <Box className="header-layout-inline">
            <Box className="header-left">
              <Box className="candidate-header-back-wrap">
                <BackButton onClick={handleBack} variant="header" className="candidate-details-back-btn" />
              </Box>
              <Box className="candidate-avatar-box">
                {(candidate.firstName?.charAt(0) || "").toUpperCase()}
                {(candidate.lastName?.charAt(0) || "").toUpperCase()}
              </Box>

              <Box className="candidate-main-info">
                <Box className="candidate-name-row">
                  <Typography className="candidate-name-inline">
                    {candidate.firstName} {candidate.lastName}
                  </Typography>
                  <Chip
                    label={candidate.isEligible ? "Eligible" : "Ineligible"}
                    size="small"
                    className={`candidate-top-chip-eligibility ${candidate.isEligible ? "candidate-top-chip-eligibility-yes" : "candidate-top-chip-eligibility-no"}`}
                  />
                </Box>

                <Box className="candidate-top-meta-grid">
                  <Box className="candidate-top-meta-column">
                    <Box className="candidate-top-meta-row">
                      <EmailOutlinedIcon className="candidate-top-meta-icon" />
                      <Typography className="candidate-top-meta">
                        <span className="candidate-top-meta-label">Email:</span>{" "}
                        <span className="candidate-top-meta-value">{candidate.email || "N/A"}</span>
                      </Typography>
                    </Box>
                    <Box className="candidate-top-meta-row">
                      <CalendarTodayOutlinedIcon className="candidate-top-meta-icon" />
                      <Typography className="candidate-top-meta">
                        <span className="candidate-top-meta-label">Date of Birth:</span>{" "}
                        <span className="candidate-top-meta-value">{dateOfBirthLabel}</span>
                      </Typography>
                    </Box>
                  </Box>
                  <Box className="candidate-top-meta-column">
                    <Box className="candidate-top-meta-row">
                      <LocalPhoneOutlinedIcon className="candidate-top-meta-icon candidate-top-meta-icon-phone" />
                      <Typography className="candidate-top-meta">
                        <span className="candidate-top-meta-label">Phone No:</span>{" "}
                        <span className="candidate-top-meta-value">{formatIndianMobile(candidate.mobile)}</span>
                      </Typography>
                    </Box>
                    <Box className="candidate-top-meta-row">
                      <CreditCardOutlinedIcon className="candidate-top-meta-icon candidate-top-meta-icon-aadhaar" />
                      <Typography className="candidate-top-meta">
                        <span className="candidate-top-meta-label">Aadhaar No:</span>{" "}
                        <span className="candidate-top-meta-value">{candidate.aadhaarNumber || "N/A"}</span>
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <Box className="header-right">
              <Box className="candidate-header-actions">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditOutlinedIcon />}
                  onClick={handleEditToggle}
                  className="candidate-header-btn"
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SwapHorizOutlinedIcon />}
                  onClick={() => { setSelectedStatus(""); setStatusDialogOpen(true); }}
                  className="candidate-header-btn"
                >
                  Change Status
                </Button>
              </Box>
              <Box className="candidate-header-chips">
                <Chip
                  label={candidate.applicationStage || "SHORTLISTED"}
                  size="small"
                  className="candidate-top-chip-stage"
                />
                <Chip
                  label={candidate.applicationType || "STANDARD"}
                  size="small"
                  className="candidate-top-chip-type"
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Candidate Info Cards */}
      <Grid className="candidate-info-cards" container rowSpacing={0.5} columnSpacing={0}>
        {/* Academic Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title academic-section-title">
                <SchoolOutlinedIcon className="card-section-icon academic-section-icon" />
                Academic Information
              </Typography>
              
              {/* Academic Details Grid with institute inside */}
              <Box className="academic-details-grid">
                {/* Institute Header inside the box */}
                <Box className="academic-institute-header">
                  <Box className="academic-institute-avatar">
                    {(candidate.instituteName?.charAt(0) || "").toUpperCase()}
                    {(candidate.instituteName?.split(' ')[1]?.charAt(0) || "").toUpperCase()}
                  </Box>
                  <Box>
                    <Typography className="academic-institute-label">Institute</Typography>
                    <Typography className="academic-institute-name">
                      {candidate.instituteName || "N/A"}
                    </Typography>
                  </Box>
                </Box>

                <Box className="academic-column">
                  <Box className="academic-field">
                    <Typography className="academic-field-label">Degree</Typography>
                    <Typography className="academic-field-value">{candidate.degree || "N/A"}</Typography>
                  </Box>
                  <Box className="academic-field">
                    <Typography className="academic-field-label">CGPA</Typography>
                    <Typography className="academic-field-value academic-cgpa">{candidate.cgpa?.toFixed(2) || "N/A"}</Typography>
                  </Box>
                  <Box className="academic-field">
                    <Typography className="academic-field-label">Passout Year</Typography>
                    <Typography className="academic-field-value">{candidate.passoutYear || "N/A"}</Typography>
                  </Box>
                </Box>

                <Box className="academic-column">
                  <Box className="academic-field">
                    <Typography className="academic-field-label">Department</Typography>
                    <Typography className="academic-field-value">{candidate.department || "N/A"}</Typography>
                  </Box>
                  <Box className="academic-field">
                    <Typography className="academic-field-label">Arrears</Typography>
                    <Typography className="academic-field-value">{candidate.historyOfArrears || 0}</Typography>
                  </Box>
                  <Box className="academic-field">
                    <Typography className="academic-field-label">Location</Typography>
                    <Typography className="academic-field-value">
                      {candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : "N/A"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title skills-section-title">
                <WorkOutlineIcon className="card-section-icon skills-section-icon" />
                Skills
              </Typography>
              
              <Box className="skills-chip-container skills-details-grid">
                {candidate.skillNames && candidate.skillNames.length > 0 ? (
                  candidate.skillNames.map((skill, index) => (
                    <Chip key={index} label={skill} className="chip-skill" />
                  ))
                ) : (
                  <Typography className="no-data-text">No skills added</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reason and History Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card card-compact">
            <CardContent>
              <Typography variant="h6" className="card-section-title reason-history-section-title">
                <AssignmentIndOutlinedIcon className="card-section-icon reason-history-section-icon" />
                Reason and History
              </Typography>
              
              <Box className="reason-history-container reason-history-details-grid">
                {candidate.reason && (
                  <Box className="reason-section">
                    <Typography className="reason-section-label">Reason:</Typography>
                    <Typography className="reason-text-danger">
                      {candidate.reason}
                    </Typography>
                  </Box>
                )}

                <Box className="history-section">
                  <Typography className="history-section-label">Status History:</Typography>
                  <Box className="history-box-compact">
                    <Typography className="history-text-compact">
                      {candidate.statusHistory || "No status changes recorded"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activate Intern Card — shown only for JOINED candidates without user account */}
        {shouldShowManualOverrideCard && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="details-info-card override-card-compact">
              <CardContent>
                <Typography variant="h6" className="card-section-title">
                  <EditOutlinedIcon className="card-section-icon" />
                  Manual Override History
                </Typography>

                {loadingOverrides ? (
                  <Box className="override-loading-section">
                    <CircularProgress size={24} />
                    <Typography>Loading overrides...</Typography>
                  </Box>
                ) : (
                  <Box className="override-history-list">
                    {overrides.map((override) => (
                      <Box key={override.overrideId} className="override-history-item">
                        <Box className="override-history-top">
                          <Typography className="override-date-compact">
                            {formatDateTimeLabel(override.createdAt)}
                          </Typography>
                          <Typography className="override-user-compact">{override.createdByName}</Typography>
                        </Box>
                        <Box className="override-changes-list-compact">
                          {override.changes.map((change, idx) => (
                            <Box key={idx} className="override-change-compact">
                              <strong>{change.field}:</strong>
                              <span className="change-old-compact">{String(change.old ?? "N/A")}</span>
                              <span className="change-arrow-compact">→</span>
                              <span className="change-new-compact">{String(change.newValue ?? "N/A")}</span>
                            </Box>
                          ))}
                        </Box>
                        <Box className="override-history-reason-block">
                          <Typography className="override-history-reason-label">Reason</Typography>
                          <Typography className="override-reason-compact">{override.overrideReason || "N/A"}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {shouldShowActivateInternCard && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card className="details-info-card candidate-activate-card">
              <CardContent>
                <Typography variant="h6" className="card-section-title">
                  <RocketLaunchOutlinedIcon className="card-section-icon" />
                  Intern Activation
                </Typography>
                <Typography className="candidate-activate-text">
                  This candidate has joined. Activate their intern account to give them access to the Academy portal.
                </Typography>
                <button
                  type="button"
                  onClick={() => { setOutlookEmail(""); setActivateDialogOpen(true); }}
                  className="g-btn g-btn-primary candidate-activate-btn"
                >
                  <RocketLaunchOutlinedIcon className="candidate-activate-btn-icon" />
                  Activate as Intern
                </button>
              </CardContent>
            </Card>
          </Grid>
        )}

        {showApplicationHistory && (
          <Grid size={{ xs: 12 }}>
            <Accordion
              expanded={driveDetailsExpanded}
              onChange={(_, isExpanded) => setDriveDetailsExpanded(isExpanded)}
              className="drive-details-accordion"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                className="drive-details-accordion-summary"
              >
                <Typography variant="h6">Drive Details</Typography>
              </AccordionSummary>
              <AccordionDetails className="drive-details-accordion-details">
                {driveDetailsExpanded && (
                  <ApplicationHistory
                    driveId={Number(driveIdForHistory)}
                    candidateId={candidate.candidateId}
                    embeddedInCandidateDetails={true}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>

      {/* Activate Intern Dialog */}
      <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dialog-title">Activate Intern Account</DialogTitle>
        <DialogContent className="dialog-content">
          <Typography className="candidate-activate-dialog-text">
            Enter the Outlook email the candidate has created (e.g. <span className="candidate-activate-dialog-example">manohar.kanini@outlook.com</span>).
            Login credentials will be sent to this email.
          </Typography>
          <TextField
            fullWidth
            label="Intern Outlook Email *"
            type="email"
            value={outlookEmail}
            onChange={e => setOutlookEmail(e.target.value)}
            placeholder="firstname.kanini@outlook.com"
            helperText="The intern will use this email to log in to the Academy portal"
            className="dialog-text-field"
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button
            type="button"
            onClick={() => setActivateDialogOpen(false)}
            disabled={activating}
            className="g-btn g-btn-outline-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleActivateIntern}
            disabled={activating || !outlookEmail.trim()}
            className="g-btn g-btn-primary"
          >
            {activating ? "Activating..." : "Activate & Send Credentials"}
          </button>
        </DialogActions>
      </Dialog>



      {/* Eligibility Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleDialogClose}
        maxWidth={false}
        className="eligibility-dialog"
        PaperProps={{ className: "ai-dialog-paper" }}
      >
        <DialogTitle className="eligibility-dialog-title-wrap">
          <Box className="eligibility-dialog-header-row">
            <Box>
              <Typography className="eligibility-dialog-title">Update Candidate Eligibility</Typography>
              <Typography className="eligibility-dialog-subtitle">Change eligibility status with a reason for audit tracking.</Typography>
            </Box>
            <IconButton size="small" onClick={handleDialogClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="eligibility-dialog-content">
          <Box className="eligibility-dialog-form">
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isEligible}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isEligible: e.target.checked })
                  }
                />
              }
              label={editForm.isEligible ? "Eligible" : "Not Eligible"}
              className="eligibility-dialog-switch-label"
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for eligibility change *"
              value={editForm.reason}
              onChange={(e) =>
                setEditForm({ ...editForm, reason: e.target.value })
              }
              placeholder="Please provide a detailed reason for changing the eligibility status"
              required
              helperText="This reason will be logged in the audit trail"
              className="eligibility-dialog-text-field"
            />
          </Box>
        </DialogContent>
        <DialogActions className="eligibility-dialog-actions">
          <button
            onClick={handleSave}
            disabled={saving || !editForm.reason.trim()}
            className="g-btn g-btn-primary"
          >
            {saving ? "Saving..." : "Update Eligibility"}
          </button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => setStatusDialogOpen(false)}
        maxWidth={false}
        className="eligibility-dialog"
        PaperProps={{ className: "ai-dialog-paper cd-status-dialog-paper" }}
      >
        <DialogTitle className="eligibility-dialog-title-wrap">
          <Box className="eligibility-dialog-header-row">
            <Box>
              <Typography className="eligibility-dialog-title">Change Candidate Status</Typography>
              <Typography className="eligibility-dialog-subtitle">Update application status</Typography>
            </Box>
            <IconButton size="small" onClick={() => setStatusDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="eligibility-dialog-content">
          <FormControl fullWidth className="eligibility-dialog-select">
            <InputLabel>Select New Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Select New Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="APPLIED">APPLIED</MenuItem>
              <MenuItem value="SHORTLISTED">SHORTLISTED</MenuItem>
              <MenuItem value="ACCEPTED">ACCEPTED</MenuItem>
              <MenuItem value="JOINED">JOINED</MenuItem>
              <MenuItem value="NOT_JOINED">NOT_JOINED</MenuItem>
              <MenuItem value="OFFER_REJECTED">OFFER_REJECTED</MenuItem>
              <MenuItem value="DROPPED">DROPPED</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions className="eligibility-dialog-actions">
          <button
            onClick={handleStatusUpdate}
            disabled={!selectedStatus || updatingStatus}
            className="g-btn g-btn-primary"
          >
            {updatingStatus ? "Updating..." : "Update Status"}
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateDetails;
