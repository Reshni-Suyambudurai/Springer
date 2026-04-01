import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { instituteApi, instituteTPOApi, programApi } from "../../../services/hiring.api";
import type { InstituteWithTPOsResponse, TPODetails } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { ProgramResponse } from "../../../types/TA_Recruiter/Hiring/program.types";
import { showToast } from "../../../utils/toast";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import "../../../css/TA_Recruiter/Institutes/InstitutesDetails.css";

const InstitutesDetails: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<InstituteWithTPOsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPrograms, setAllPrograms] = useState<ProgramResponse[]>([]);
  
  // TPO Dialog states
  const [editTPODialog, setEditTPODialog] = useState(false);
  const [addTPODialog, setAddTPODialog] = useState(false);
  const [editTPO, setEditTPO] = useState<TPODetails | null>(null);
  const [tpoForm, setTPOForm] = useState({
    tpoName: "",
    tpoEmail: "",
    tpoMobile: "",
    tpoDesignation: "",
    tpoStatus: "ACTIVE",
    isPrimary: false,
  });

  // Program Dialog states
  const [addProgramDialog, setAddProgramDialog] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<number | "">("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instituteResponse, programsResponse] = await Promise.all([
          instituteApi.getInstituteWithTPOsById(Number(instituteId)),
          programApi.getAllPrograms()
        ]);
        setData(instituteResponse.data);
        setAllPrograms(programsResponse.data);
      } catch (error) {
        console.log(error);
        showToast("Failed to load institute details", "error");
      } finally {
        setLoading(false);
      }
    };
    
    if (instituteId) fetchData();
  }, [instituteId]);

  const refreshData = async () => {
    try {
      const response = await instituteApi.getInstituteWithTPOsById(Number(instituteId));
      setData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // ==================== Helper Functions ====================
  const getTierClassName = (tier: string): string => {
    switch (tier) {
      case "TIER_1":
        return "tier-chip-tier1";
      case "TIER_2":
        return "tier-chip-tier2";
      case "TIER_3":
        return "tier-chip-tier3";
      default:
        return "";
    }
  };

  // ==================== TPO Handlers ====================
  const handleOpenAddTPO = () => {
    setTPOForm({
      tpoName: "",
      tpoEmail: "",
      tpoMobile: "",
      tpoDesignation: "",
      tpoStatus: "ACTIVE",
      isPrimary: false,
    });
    setAddTPODialog(true);
  };

  const handleAddTPO = async () => {
    // Validation
    if (!tpoForm.tpoName.trim()) {
      showToast("TPO name is required", "error");
      return;
    }
    if (!tpoForm.tpoEmail.trim()) {
      showToast("Email is required", "error");
      return;
    }
    if (!tpoForm.tpoMobile.trim()) {
      showToast("Mobile number is required", "error");
      return;
    }

    try {
      await instituteTPOApi.createContact({
        instituteId: Number(instituteId),
        ...tpoForm
      });
      showToast("TPO contact added successfully", "success");
      setAddTPODialog(false);
      refreshData();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to add TPO contact";
      showToast(errorMessage, "error");
    }
  };

  const handleEditClick = (tpo: TPODetails) => {
    setEditTPO(tpo);
    setTPOForm({
      tpoName: tpo.tpoName,
      tpoEmail: tpo.tpoEmail,
      tpoMobile: tpo.tpoMobile,
      tpoDesignation: tpo.tpoDesignation || "",
      tpoStatus: tpo.tpoStatus,
      isPrimary: tpo.isPrimary,
    });
    setEditTPODialog(true);
  };

  const handleEditSave = async () => {
    if (!editTPO) return;
    try {
      await instituteTPOApi.updateContact(editTPO.tpoId, tpoForm);
      showToast("TPO contact updated successfully", "success");
      setEditTPODialog(false);
      refreshData();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to update TPO contact";
      showToast(errorMessage, "error");
    }
  };

  const handleToggleStatus = async (tpoId: number, currentStatus: string) => {
    try {
      await instituteTPOApi.deleteContact(tpoId);
      showToast(`TPO contact ${currentStatus === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`, "success");
      refreshData();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to toggle TPO status";
      showToast(errorMessage, "error");
    }
  };

  // ==================== Program Handlers ====================
  const handleOpenAddProgram = () => {
    setSelectedProgramId("");
    setAddProgramDialog(true);
  };

  const handleAddProgram = async () => {
    if (!selectedProgramId) return;
    try {
      await programApi.addProgramsToInstitute([{
        instituteId: Number(instituteId),
        programId: Number(selectedProgramId)
      }]);
      showToast("Program added successfully", "success");
      setAddProgramDialog(false);
      refreshData();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to add program";
      showToast(errorMessage, "error");
    }
  };

  const handleRemoveProgram = async (instituteProgramId: number) => {
    try {
      await programApi.removeInstituteProgramMapping(instituteProgramId);
      showToast("Program removed successfully", "success");
      refreshData();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : "Failed to remove program";
      showToast(errorMessage, "error");
    }
  };

  const getAvailablePrograms = () => {
    if (!data) return allPrograms;
    const existingProgramIds = data.programs.map(p => p.programId);
    return allPrograms.filter(p => !existingProgramIds.includes(p.programId));
  };

  if (loading) {
    return (
      <Box className="details-loading">
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box className="details-not-found">
        <Typography variant="h6">Institute not found</Typography>
      </Box>
    );
  }

  return (
    <Box className="institute-details-page">
      {/* Back Button */}
      <IconButton onClick={() => navigate("/ta-recruiter/institutes")} className="details-back-btn">
        <ArrowBackIcon />
      </IconButton>

      {/* Top Section: Institute Info (Left) & Programs (Right) */}
      <Box className="details-top-section">
        {/* Left: Institute Information Card */}
        <Card className="details-info-card">
          <CardContent>
            <Box className="details-info-header">
              <SchoolIcon className="details-info-icon" />
              <Box className="details-info-content">
                <Typography variant="h5" className="details-institute-name">
                  {data.instituteName}
                </Typography>
                <Box className="details-badges">
                  <Chip label={data.instituteTier} size="small" className={getTierClassName(data.instituteTier)} />
                  <Chip 
                    label={data.isActive ? "Active" : "Inactive"} 
                    size="small" 
                    className={data.isActive ? "status-chip-active" : "status-chip-inactive"}
                  />
                </Box>
                <Box className="details-location">
                  <LocationOnIcon className="details-location-icon" />
                  <Typography variant="body1">
                    {data.city}, {data.state}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Right: Programs Card */}
        <Card className="details-programs-card">
          <CardContent>
            <Box className="details-programs-header">
              <Typography variant="h6" className="details-section-title">
                Programs ({data.programs.length})
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleOpenAddProgram}
                className="details-add-btn"
                size="small"
              >
                Add Program
              </Button>
            </Box>
            
            {data.programs.length === 0 ? (
              <Typography className="details-empty-text">No programs available</Typography>
            ) : (
              <Box className="details-programs-list">
                {data.programs.map((program) => (
                  <Box key={program.instituteProgramId} className="details-program-item">
                    <Typography className="details-program-name">
                      {program.programName.replace(/_/g, ' ')}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveProgram(program.instituteProgramId)}
                      className="details-program-delete-btn"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Bottom Section: TPO Contacts (Centered) */}
      <Box className="details-tpo-section">
        <Card className="details-tpo-card">
          <CardContent>
            <Box className="details-tpo-header">
              <Typography variant="h6" className="details-section-title">
                TPO Contacts ({data.tpoDetails.length})
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleOpenAddTPO}
                className="details-add-btn"
              >
                Add TPO
              </Button>
            </Box>
            
            {data.tpoDetails.length === 0 ? (
              <Typography className="details-empty-text">No TPO contacts available</Typography>
            ) : (
              <TableContainer component={Paper} className="details-tpo-table-container">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="details-table-header">Name</TableCell>
                      <TableCell className="details-table-header">Email</TableCell>
                      <TableCell className="details-table-header">Mobile</TableCell>
                      <TableCell className="details-table-header">Designation</TableCell>
                      <TableCell className="details-table-header">Status</TableCell>
                      <TableCell className="details-table-header">Primary</TableCell>
                      <TableCell className="details-table-header" align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.tpoDetails.map((tpo) => (
                      <TableRow key={tpo.tpoId} className="details-table-row">
                        <TableCell>{tpo.tpoName}</TableCell>
                        <TableCell>
                          <Box className="details-table-cell-with-icon">
                            <EmailIcon className="details-cell-icon" />
                            {tpo.tpoEmail}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box className="details-table-cell-with-icon">
                            <PhoneIcon className="details-cell-icon" />
                            {tpo.tpoMobile}
                          </Box>
                        </TableCell>
                        <TableCell>{tpo.tpoDesignation || "-"}</TableCell>
                        <TableCell>
                          <Chip 
                            label={tpo.tpoStatus} 
                            size="small" 
                            className={tpo.tpoStatus === "ACTIVE" ? "status-chip-active" : "status-chip-inactive"}
                            onClick={() => handleToggleStatus(tpo.tpoId, tpo.tpoStatus)}
                          />
                        </TableCell>
                        <TableCell>
                          {tpo.isPrimary && (
                            <Chip label="Primary" size="small" className="primary-chip" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(tpo)}
                            className="details-edit-btn"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Add Program Dialog */}
      <Dialog open={addProgramDialog} onClose={() => setAddProgramDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Program</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Program</InputLabel>
            <Select
              value={selectedProgramId}
              label="Select Program"
              onChange={(e) => setSelectedProgramId(e.target.value as number)}
            >
              {getAvailablePrograms().map((program) => (
                <MenuItem key={program.programId} value={program.programId}>
                  {program.programName.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddProgramDialog(false)}>Cancel</Button>
          <Button onClick={handleAddProgram} variant="contained" disabled={!selectedProgramId}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add TPO Dialog */}
      <Dialog open={addTPODialog} onClose={() => setAddTPODialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add TPO Contact</DialogTitle>
        <DialogContent>
          <Box className="details-dialog-form">
            <TextField
              label="TPO Name *"
              fullWidth
              value={tpoForm.tpoName}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoName: e.target.value })}
            />
            <TextField
              label="Email *"
              fullWidth
              type="email"
              value={tpoForm.tpoEmail}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoEmail: e.target.value })}
            />
            <TextField
              label="Mobile *"
              fullWidth
              value={tpoForm.tpoMobile}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoMobile: e.target.value })}
            />
            <TextField
              label="Designation"
              fullWidth
              value={tpoForm.tpoDesignation}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoDesignation: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={tpoForm.isPrimary}
                  onChange={(e) => setTPOForm({ ...tpoForm, isPrimary: e.target.checked })}
                />
              }
              label="Primary Contact"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTPODialog(false)}>Cancel</Button>
          <Button onClick={handleAddTPO} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit TPO Dialog */}
      <Dialog open={editTPODialog} onClose={() => setEditTPODialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit TPO Contact</DialogTitle>
        <DialogContent>
          <Box className="details-dialog-form">
            <TextField
              label="TPO Name"
              fullWidth
              value={tpoForm.tpoName}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoName: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={tpoForm.tpoEmail}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoEmail: e.target.value })}
            />
            <TextField
              label="Mobile"
              fullWidth
              value={tpoForm.tpoMobile}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoMobile: e.target.value })}
            />
            <TextField
              label="Designation"
              fullWidth
              value={tpoForm.tpoDesignation}
              onChange={(e) => setTPOForm({ ...tpoForm, tpoDesignation: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={tpoForm.isPrimary}
                  onChange={(e) => setTPOForm({ ...tpoForm, isPrimary: e.target.checked })}
                />
              }
              label="Primary Contact"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTPODialog(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstitutesDetails;
