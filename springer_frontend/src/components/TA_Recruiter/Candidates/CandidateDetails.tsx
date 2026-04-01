import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CategoryIcon from "@mui/icons-material/Category";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import TimelineIcon from "@mui/icons-material/Timeline";
import WorkIcon from "@mui/icons-material/Work";
import "../../../css/TA_Recruiter/Candidates/CandidateDetails.css";

const CandidateDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<CandidateResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusUpdateMode, setStatusUpdateMode] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<ManualOverrideResponse[]>([]);
  const [loadingOverrides, setLoadingOverrides] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<CandidateUpdateRequest>({
    isEligible: false,
    reason: "",
    updatedBy: 0,
  });

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
  }, []);

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

  const populateEditForm = (data: CandidateResponse) => {
    const user = tokenstore.getUser();
    setEditForm({
      isEligible: data.isEligible,
      reason: "", // Clear reason for new update
      updatedBy: user?.userId || 0,
    });
  };

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

  const handleBack = () => {
    navigate("/ta-recruiter/candidates");
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
      setStatusUpdateMode(false);
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

  const handleStatusModeToggle = () => {
    if (statusUpdateMode) {
      setSelectedStatus("");
    }
    setStatusUpdateMode(!statusUpdateMode);
  };

  if (loading) {
    return (
      <Box className="candidate-details-loading">
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
              <BackButton onClick={handleBack} inline={true} />
            </Box>
            
            <Box className="header-center">
              <Typography variant="h5" className="candidate-name-inline">
                {candidate.firstName} {candidate.lastName}
              </Typography>
              <Typography className="candidate-info-inline">
                <span className="degree-department-inline">{candidate.degree}</span>
                <span className="separator-inline"> - </span>
                <span className="degree-department-inline">{candidate.department}</span>
              </Typography>
            </Box>
            
            <Box className="header-right">
              <Chip
                label={candidate.isEligible ? "Eligible" : "Not Eligible"}
                className={candidate.isEligible ? "chip-eligible" : "chip-not-eligible"}
                size="small"
              />
              <Chip
                label={candidate.applicationStage}
                className="chip-status-primary"
                size="small"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Candidate Info Cards */}
      <Grid className="candidate-info-cards" container spacing={3}>
        {/* Personal Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <PersonIcon className="card-section-icon" />
                Personal Information
              </Typography>
              
              <Box className="info-list-simple">
                <Box className="info-line-item">
                  <Typography className="info-line-label">Email:</Typography>
                  <Typography className="info-line-value">{candidate.email}</Typography>
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Mobile:</Typography>
                  <Typography className="info-line-value">{candidate.mobile}</Typography>
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Date of Birth:</Typography>
                  <Typography className="info-line-value">{candidate.dateOfBirth || "N/A"}</Typography>
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Aadhaar Number:</Typography>
                  <Typography className="info-line-value">{candidate.aadhaarNumber || "Not Provided"}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <SchoolIcon className="card-section-icon" />
                Academic Information
              </Typography>
              
              <Box className="info-list-simple">
                <Box className="info-line-item">
                  <Typography className="info-line-label">Institute Name:</Typography>
                  <Typography className="info-line-value">{candidate.instituteName || "N/A"}</Typography>
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Location:</Typography>
                  <Typography className="info-line-value">
                    {candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : "N/A"}
                  </Typography>
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Degree:</Typography>
                  <Typography className="info-line-value">{candidate.degree || "N/A"}</Typography>
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Department:</Typography>
                  <Typography className="info-line-value">{candidate.department || "N/A"}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Performance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <AssignmentIndIcon className="card-section-icon" />
                Academic Performance
              </Typography>
              
              <Box className="performance-grid">
                <Box className="performance-item">
                  <Typography className="performance-key">CGPA</Typography>
                  <Typography className="performance-value">{candidate.cgpa?.toFixed(2) || "N/A"}</Typography>
                </Box>

                <Box className="performance-item">
                  <Typography className="performance-key">History of Arrears</Typography>
                  <Typography className="performance-value">{candidate.historyOfArrears || 0}</Typography>
                </Box>

                <Box className="performance-item">
                  <Typography className="performance-key">Passout Year</Typography>
                  <Typography className="performance-value">{candidate.passoutYear || "N/A"}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <CategoryIcon className="card-section-icon" />
                Application Details
              </Typography>
              
              <Box className="info-list-simple">
                <Box className="info-line-item">
                  <Typography className="info-line-label">Application Type:</Typography>
                  <Chip 
                    label={candidate.applicationType || "STANDARD"} 
                    className="chip-compact"
                  />
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Application Stage:</Typography>
                  <Chip 
                    label={candidate.applicationStage} 
                    className="chip-compact"
                  />
                </Box>

                <Box className="info-line-item">
                  <Typography className="info-line-label">Lifecycle Status:</Typography>
                  <Typography className="info-line-value">{candidate.lifecycleStatus || "N/A"}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Management Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card card-compact">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <EditIcon className="card-section-icon" />
                Status Management
              </Typography>
              
              <Box className="status-grid-horizontal">
                <Box className="status-column">
                  <Typography className="status-column-title">Eligibility</Typography>
                  <Box className="status-content">
                    <Chip
                      label={candidate.isEligible ? "Eligible" : "Not Eligible"}
                      className={candidate.isEligible ? "chip-status-active" : "chip-status-inactive"}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleEditToggle}
                      className="btn-status-action"
                    >
                      Edit
                    </Button>
                  </Box>
                </Box>

                <Box className="status-column">
                  <Typography className="status-column-title">Application Status</Typography>
                  <Box className="status-content">
                    {statusUpdateMode ? (
                      <Box className="status-update-compact">
                        <FormControl fullWidth size="small">
                          <InputLabel>Select Status</InputLabel>
                          <Select
                            value={selectedStatus}
                            label="Select Status"
                            onChange={(e) => setSelectedStatus(e.target.value)}
                          >
                            <MenuItem value="APPLIED">APPLIED</MenuItem>
                            <MenuItem value="SHORTLISTED">SHORTLISTED</MenuItem>
                            <MenuItem value="SELECTED">SELECTED</MenuItem>
                            <MenuItem value="REJECTED">REJECTED</MenuItem>
                            <MenuItem value="OFFERED">OFFERED</MenuItem>
                            <MenuItem value="JOINED">JOINED</MenuItem>
                            <MenuItem value="DROPPED">DROPPED</MenuItem>
                          </Select>
                        </FormControl>
                        <Box className="status-btn-group">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleStatusUpdate}
                            disabled={!selectedStatus || updatingStatus}
                            className="btn-status-save"
                          >
                            {updatingStatus ? "Updating..." : "Update"}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleStatusModeToggle}
                            className="btn-status-cancel"
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Chip
                          label={candidate.applicationStage}
                          className="chip-status-primary"
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleStatusModeToggle}
                          className="btn-status-action"
                        >
                          Change
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reason and History Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card card-compact">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <AssignmentIndIcon className="card-section-icon" />
                Reason and History
              </Typography>
              
              <Box className="reason-history-container">
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

        {/* Skills */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <WorkIcon className="card-section-icon" />
                Skills
              </Typography>
              
              <Box className="skills-chip-container">
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

        {/* Timeline Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="details-info-card">
            <CardContent>
              <Typography variant="h6" className="card-section-title">
                <TimelineIcon className="card-section-icon" />
                Timeline
              </Typography>
              
              <Box className="timeline-list">
                <Box className="timeline-item">
                  <Typography className="timeline-label">Created At:</Typography>
                  <Typography className="timeline-date">
                    {new Date(candidate.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }).toLowerCase()} {new Date(candidate.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Typography>
                </Box>

                <Box className="timeline-item">
                  <Typography className="timeline-label">Last Updated:</Typography>
                  <Typography className="timeline-date">
                    {new Date(candidate.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }).toLowerCase()} {new Date(candidate.updatedAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Manual Overrides Section */}
        {overrides.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card className="details-info-card override-card-compact">
              <CardContent>
                <Typography variant="h6" className="card-section-title">
                  <EditIcon className="card-section-icon" />
                  Manual Override History
                </Typography>
                
                {loadingOverrides ? (
                  <Box className="override-loading-section">
                    <CircularProgress size={24} />
                    <Typography>Loading overrides...</Typography>
                  </Box>
                ) : (
                  <Box className="override-table-wrapper-compact">
                    <table className="override-table-compact">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>User</th>
                          <th>Changes</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overrides.map((override) => (
                          <tr key={override.overrideId}>
                            <td className="override-date-compact">
                              {new Date(override.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }).toLowerCase()} {new Date(override.createdAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </td>
                            <td className="override-user-compact">{override.createdByName}</td>
                            <td className="override-changes-compact">
                              <Box className="override-changes-list-compact">
                                {override.changes.map((change, idx) => (
                                  <Box key={idx} className="override-change-compact">
                                    <strong>{change.field}:</strong>
                                    <span className="change-old-compact">{String(change.old ?? 'N/A')}</span>
                                    <span className="change-arrow-compact">→</span>
                                    <span className="change-new-compact">{String(change.newValue ?? 'N/A')}</span>
                                  </Box>
                                ))}
                              </Box>
                            </td>
                            <td className="override-reason-compact">{override.overrideReason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Eligibility Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        className="eligibility-dialog"
      >
        <DialogTitle className="dialog-title">Update Candidate Eligibility</DialogTitle>
        <DialogContent className="dialog-content">
          <Box className="dialog-form-container">
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
              className="dialog-switch-label"
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
              className="dialog-text-field"
            />
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button 
            onClick={handleDialogClose} 
            disabled={saving}
            className="dialog-btn-cancel"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={saving || !editForm.reason.trim()}
            className="dialog-btn-save"
          >
            {saving ? "Saving..." : "Update Eligibility"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateDetails;
