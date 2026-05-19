import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { instituteApi } from "../../../services/hiring.api";
import type { InstituteRequest } from "../../../types/TA_Recruiter/Hiring/institute.types";
import { showToast } from "../../../utils/toast";
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import BackButton from "../../Common/BackButton";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import "../../../css/TA_Recruiter/Institutes/AddInstitute.css";

const AddInstitute: React.FC = () => {
  const navigate = useNavigate();
  const [addDialog, setAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "contact" | "academic">("basic");
  const [bulkData, setBulkData] = useState<InstituteRequest[]>([]);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
  const [batchDuplicateIndices, setBatchDuplicateIndices] = useState<Set<number>>(new Set());
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [singleForm, setSingleForm] = useState<InstituteRequest>({
    instituteName: "",
    instituteTier: "TIER_1",
    state: "",
    city: "",
    isActive: true,
  });
  const [showTpoForm, setShowTpoForm] = useState(false);
  const [tpoForm, setTpoForm] = useState({
    tpoName: "",
    tpoEmail: "",
    tpoMobile: "",
    tpoDesignation: "",
  });

  const handleAddSingle = async () => {
    // Validate
    if (!singleForm.instituteName || !singleForm.city || !singleForm.state) {
      showToast("Please fill all required fields", "error");
      return;
    }

    // Validate TPO fields if form is shown
    if (showTpoForm) {
      if (!tpoForm.tpoName || !tpoForm.tpoEmail || !tpoForm.tpoMobile) {
        showToast("Please fill all required TPO fields", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tpoForm.tpoEmail)) {
        showToast("Please enter a valid TPO email", "error");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(tpoForm.tpoMobile)) {
        showToast("TPO mobile must be a valid 10-digit Indian number", "error");
        return;
      }
    }

    try {
      const request: InstituteRequest = {
        ...singleForm,
        ...(showTpoForm && tpoForm.tpoName ? { tpoContact: tpoForm } : {}),
      };
      await instituteApi.createInstitute(request);
      showToast("Institute added successfully", "success");
      setAddDialog(false);
      setSingleForm({
        instituteName: "",
        instituteTier: "TIER_1",
        state: "",
        city: "",
        isActive: true,
      });
      setTpoForm({ tpoName: "", tpoEmail: "", tpoMobile: "", tpoDesignation: "" });
      setShowTpoForm(false);
    } catch (error) {
      console.error(error);
      showToast("Failed to add institute", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        const institutes: InstituteRequest[] = jsonData.map((row) => {
          const tpoName = ( row["tpo_name"] || "") as string;
          const tpoEmail = (row["tpo_email"] || "") as string;
          const tpoMobile = String(row["tpo_mobile"] || row["tpoMobile"] || "").replace(/\D/g, "");
          const tpoDesignation = (row["tpo_designation"] || row["tpoDesignation"] || "") as string;

          const inst: InstituteRequest = {
            instituteName: ( row["instituteName"] || "") as string,
            instituteTier: (row["Tier"] || row["instituteTier"] || "TIER_1") as string,
            state: (row["State"] || row["state"] || "") as string,
            city: (row["City"] || row["city"] || "") as string, 
            isActive: true,
          };

          // Attach TPO contact only if at least name and email are present
          if (tpoName && tpoEmail) {
            inst.tpoContact = { tpoName, tpoEmail, tpoMobile, tpoDesignation };
          }

          return inst;
        });

        // Validate
        const errors: string[] = [];
        institutes.forEach((inst, idx) => {
          if (!inst.instituteName) errors.push(`Row ${idx + 1}: Missing Institute Name`);
          if (!inst.city) errors.push(`Row ${idx + 1}: Missing City`);
          if (!inst.state) errors.push(`Row ${idx + 1}: Missing State`);
        });

        if (errors.length > 0) {
          showToast(`Validation errors: ${errors.join(", ")}`, "error");
        } else {
          setBulkData(institutes);
          
          // Check for duplicates within the uploaded batch itself (only mark 2nd+ occurrences)
          const batchDups = new Set<number>();
          const nameCountMap = new Map<string, number[]>();
          institutes.forEach((inst, idx) => {
            const key = inst.instituteName.toLowerCase().trim();
            if (!nameCountMap.has(key)) {
              nameCountMap.set(key, []);
            }
            nameCountMap.get(key)!.push(idx);
          });
          nameCountMap.forEach((indices) => {
            if (indices.length > 1) {
              indices.slice(1).forEach(idx => batchDups.add(idx));
            }
          });
          setBatchDuplicateIndices(batchDups);
          
          // Check for duplicates against existing institutes in DB
          try {
            const response = await instituteApi.getAllInstituteNames();
            const existingNames = new Set(
              response.data.map(inst => inst.instituteName.toLowerCase())
            );
            
            const duplicates = new Set<number>();
            institutes.forEach((inst, idx) => {
              if (existingNames.has(inst.instituteName.toLowerCase())) {
                duplicates.add(idx);
              }
            });
            
            setDuplicateIndices(duplicates);
            
            if (duplicates.size > 0 || batchDups.size > 0) {
              const msgs: string[] = [];
              if (duplicates.size > 0) msgs.push(`${duplicates.size} DB duplicate(s)`);
              if (batchDups.size > 0) msgs.push(`${batchDups.size} batch duplicate(s)`);
              showToast(`${institutes.length} institutes loaded. ${msgs.join(", ")} found`, "error");
            } else {
              showToast(`${institutes.length} institutes loaded`, "success");
            }
          } catch (error: unknown) {
            const err = error as { message?: string };
            showToast(err.message || "Failed to check for duplicates", "error");
            // Still set the data even if duplicate check fails
            showToast(`${institutes.length} institutes loaded (duplicate check failed)`, "success");
          }
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        showToast(err.message || "Failed to read file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      showToast("No data to upload", "error");
      return;
    }
    try {
      const response = await instituteApi.bulkCreateInstitutes(bulkData);
      if (response.data.errorMessages && response.data.errorMessages.length > 0) {
        setErrorMessages(response.data.errorMessages);
        setShowErrorOverlay(true);
        if (response.data.successfulInserts && response.data.successfulInserts.length > 0) {
          showToast(`${response.data.successfulInserts.length} institutes uploaded, ${response.data.errorMessages.length} failed`, "error");
        }
      } else {
        showToast(`${bulkData.length} institutes uploaded successfully`, "success");
        setBulkData([]);
      }
    } catch (error: unknown) {
      const err = error as { message?: string; data?: { errorMessages?: string[] } };
      if (err.data?.errorMessages?.length) {
        setErrorMessages(err.data.errorMessages);
        setShowErrorOverlay(true);
      } else {
        showToast(err.message || "Upload failed", "error");
      }
    }
  };

  const handleRemoveRow = (index: number) => {
    const updated = bulkData.filter((_, idx) => idx !== index);
    setBulkData(updated);
    
    // Update DB duplicate indices
    const newDuplicates = new Set<number>();
    duplicateIndices.forEach(dupIdx => {
      if (dupIdx < index) {
        newDuplicates.add(dupIdx);
      } else if (dupIdx > index) {
        newDuplicates.add(dupIdx - 1);
      }
    });
    setDuplicateIndices(newDuplicates);
    
    // Recalculate batch duplicates from scratch with updated data (only mark 2nd+ occurrences)
    const batchDups = new Set<number>();
    const nameCountMap = new Map<string, number[]>();
    updated.forEach((inst, idx) => {
      const key = inst.instituteName.toLowerCase().trim();
      if (!nameCountMap.has(key)) {
        nameCountMap.set(key, []);
      }
      nameCountMap.get(key)!.push(idx);
    });
    nameCountMap.forEach((indices) => {
      if (indices.length > 1) {
        indices.slice(1).forEach(idx => batchDups.add(idx));
      }
    });
    setBatchDuplicateIndices(batchDups);
    
    showToast("Row removed", "success");
  };

  const handleRemoveDuplicates = () => {
    const allDuplicates = new Set([...duplicateIndices, ...batchDuplicateIndices]);
    if (allDuplicates.size === 0) return;
    const count = allDuplicates.size;
    const filtered = bulkData.filter((_, idx) => !allDuplicates.has(idx));
    setBulkData(filtered);
    setDuplicateIndices(new Set());
    setBatchDuplicateIndices(new Set());
    showToast(`Removed ${count} duplicate row(s)`, "success");
  };

  return (
    <Box className="add-institute-container">
      {/* Unified Header */}
      <Card className="add-institute-header">
        <Box className="add-institute-header-left">
          <BackButton onClick={() => navigate("/ta-recruiter/institutes")} variant="header" />
          
          <Typography variant="h6" className="add-institute-title">
            Institute Management
          </Typography>

          <Button
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            variant="contained"
            className="add-institute-header-btn t-btn-primary"
          >
            Add Institute
          </Button>


        </Box>
      </Card>

      {/* Upload Drop Zone */}
      {bulkData.length === 0 && (
        <Card className="add-institute-upload-zone">
          <CardContent className="add-institute-upload-zone-content">
            <UploadIcon className="add-institute-upload-zone-icon" />
            <Typography variant="h6" className="add-institute-upload-zone-title">
              Upload Institutes
            </Typography>
            <Typography variant="body2" className="add-institute-upload-zone-subtitle">
              Upload an Excel file (.xlsx, .xls) with institute data
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              className="add-institute-upload-zone-btn t-btn-primary"
            >
              Choose File
              <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileUpload} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Data Table */}
      {bulkData.length > 0 && (
        <Card className="add-institute-bulk-card">
          <CardContent>
            <Box className="add-institute-bulk-header">
              <Typography variant="h6">Uploaded Data ({bulkData.length} institutes)</Typography>
              <Box className="add-institute-bulk-header-actions">
                {(duplicateIndices.size > 0 || batchDuplicateIndices.size > 0) && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveDuplicates}
                    className="t-btn-secondary"
                  >
                    Remove Duplicates
                  </Button>
                )}
                <Button 
                  variant="contained" 
                  onClick={handleBulkUpload} 
                  className="t-btn-primary"
                  disabled={duplicateIndices.size > 0 || batchDuplicateIndices.size > 0}
                >
                  Upload to Database
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} className="add-institute-bulk-table">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="t-head-cell">Institute Name</TableCell>
                    <TableCell className="t-head-cell">Tier</TableCell>
                    <TableCell className="t-head-cell">City</TableCell>
                    <TableCell className="t-head-cell">State</TableCell>
                    <TableCell className="t-head-cell">TPO Name</TableCell>
                    <TableCell className="t-head-cell">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkData.map((inst, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {duplicateIndices.has(index) ? (
                          <Tooltip
                            title="Duplicate: Already exists in database"
                            arrow
                            classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                          >
                            <Box className="duplicate-name-container">
                              <span className="warning-dot"></span>
                              <span className="duplicate-name-text">{inst.instituteName}</span>
                            </Box>
                          </Tooltip>
                        ) : batchDuplicateIndices.has(index) ? (
                          <Tooltip
                            title="Duplicate: Repeated in uploaded file"
                            arrow
                            classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                          >
                            <Box className="batch-duplicate-name-container">
                              <span className="batch-warning-dot"></span>
                              <span className="batch-duplicate-name-text">{inst.instituteName}</span>
                            </Box>
                          </Tooltip>
                        ) : (
                          inst.instituteName
                        )}
                      </TableCell>
                      <TableCell>{inst.instituteTier}</TableCell>
                      <TableCell>{inst.city}</TableCell>
                      <TableCell>{inst.state}</TableCell>
                      <TableCell>{inst.tpoContact?.tpoName || "—"}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRow(index)}
                          className="t-action-btn"
                          title="Remove row"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Single Institute Dialog */}
      <Dialog open={addDialog} onClose={() => { setAddDialog(false); setActiveTab("basic"); }} maxWidth={false}
        PaperProps={{ className: 'ai-dialog-paper' }}>
        <DialogTitle className="ai-dialog-title-wrap">
          <Box className="ai-dialog-title-box">
            <Box>
              <Typography className="ai-dialog-heading">Add New Institute</Typography>
              <Typography className="ai-dialog-subheading">Enter all the details about the institute. All fields marked with * are required.</Typography>
            </Box>
            <IconButton size="small" onClick={() => { setAddDialog(false); setActiveTab("basic"); }}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          {/* Tabs */}
          <Box className="ai-tabs">
            {(["basic", "contact", "academic"] as const).map((tab) => (
              <button key={tab} className={`ai-tab${activeTab === tab ? " ai-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                {tab === "basic" ? "Basic Information" : tab === "contact" ? "Contact Details" : "Academic"}
              </button>
            ))}
          </Box>
        </DialogTitle>

        <DialogContent className="ai-dialog-content-wrap">
          {/* Basic Information */}
          {activeTab === "basic" && (
            <Box className="ai-form">
              <Box className="ai-row-2">
                <Box className="ai-field">
                  <label className="ai-label">Institute Name <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="Enter institute name" value={singleForm.instituteName}
                    onChange={(e) => setSingleForm({ ...singleForm, instituteName: e.target.value })} />
                </Box>
                <Box className="ai-field">
                  <label className="ai-label">Tier <span className="ai-req">*</span></label>
                  <select className="ai-select" value={singleForm.instituteTier} onChange={(e) => setSingleForm({ ...singleForm, instituteTier: e.target.value })}>
                    <option value="">Select tier</option>
                    <option value="TIER_1">TIER 1</option>
                    <option value="TIER_2">TIER 2</option>
                    <option value="TIER_3">TIER 3</option>
                  </select>
                </Box>
              </Box>
              <Box className="ai-row-3">
                <Box className="ai-field">
                  <label className="ai-label">City <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="Enter city" value={singleForm.city}
                    onChange={(e) => setSingleForm({ ...singleForm, city: e.target.value })} />
                </Box>
                <Box className="ai-field">
                  <label className="ai-label">State <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="Enter state" value={singleForm.state}
                    onChange={(e) => setSingleForm({ ...singleForm, state: e.target.value })} />
                </Box>
                <Box className="ai-field">
                  <label className="ai-label">Country</label>
                  <input className="ai-input" placeholder="Enter country" defaultValue="India" />
                </Box>
              </Box>
              <Box className="ai-row-2">
                <Box className="ai-field">
                  <label className="ai-label">Institute Type</label>
                  <select className="ai-select">
                    <option value="">Select type</option>
                    <option value="ENGINEERING">Engineering</option>
                    <option value="ARTS">Arts & Science</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="POLYTECHNIC">Polytechnic</option>
                  </select>
                </Box>
                <Box className="ai-field">
                  <label className="ai-label">Status <span className="ai-req">*</span></label>
                  <select className="ai-select" value={singleForm.isActive ? "active" : "inactive"}
                    onChange={(e) => setSingleForm({ ...singleForm, isActive: e.target.value === "active" })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Box>
              </Box>
            </Box>
          )}

          {/* Contact Details */}
          {activeTab === "contact" && (
            <Box className="ai-form">
              <Box className="ai-row-2">
                <Box className="ai-field">
                  <label className="ai-label">Official Email <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="contact@institute.edu" type="email"
                    value={tpoForm.tpoEmail} onChange={(e) => setTpoForm({ ...tpoForm, tpoEmail: e.target.value })} />
                </Box>
                <Box className="ai-field">
                  <label className="ai-label">Alternate Email</label>
                  <input className="ai-input" placeholder="admin@institute.edu" type="email" />
                </Box>
              </Box>
              <Box className="ai-field">
                <label className="ai-label">Website URL</label>
                <input className="ai-input" placeholder="https://www.institute.edu" type="url" />
              </Box>

              {/* Primary Contact Person */}
              <Box className="ai-contact-card">
                <Box className="ai-contact-card-header">
                  <Typography className="ai-contact-card-title">Primary Contact Person</Typography>
                  {!showTpoForm && (
                    <button className="ai-add-contact-btn" onClick={() => setShowTpoForm(true)}>
                      + Add
                    </button>
                  )}
                </Box>
                {showTpoForm && (
                  <>
                    <Box className="ai-row-2">
                      <Box className="ai-field">
                        <label className="ai-label">TPO Name <span className="ai-req">*</span></label>
                        <input className="ai-input" placeholder="Enter contact person name"
                          value={tpoForm.tpoName} onChange={(e) => setTpoForm({ ...tpoForm, tpoName: e.target.value })} />
                      </Box>
                      <Box className="ai-field">
                        <label className="ai-label">Phone <span className="ai-req">*</span></label>
                        <input className="ai-input" placeholder="+91 98765 43210"
                          value={tpoForm.tpoMobile} onChange={(e) => setTpoForm({ ...tpoForm, tpoMobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
                      </Box>
                    </Box>
                    <Box className="ai-field">
                      <label className="ai-label">Email</label>
                      <input className="ai-input" placeholder="person@institute.edu" type="email"
                        value={tpoForm.tpoEmail} onChange={(e) => setTpoForm({ ...tpoForm, tpoEmail: e.target.value })} />
                    </Box>
                  </>
                )}
              </Box>


            </Box>
          )}

          {/* Academic */}
          {activeTab === "academic" && (
            <Box className="ai-form">
              <Typography className="ai-academic-info-text">Select programs offered by this institute. Programs can also be added later from the institute details page.</Typography>
              <Box className="ai-field">
                <label className="ai-label">Programs</label>
                <Typography className="ai-academic-info-text">Programs can be added after creating the institute from the institute details page.</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions className="ai-dialog-actions-wrap">
          <button className="ai-cancel-btn" onClick={() => { setAddDialog(false); setActiveTab("basic"); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Cancel
          </button>
          <button className="ai-save-btn" onClick={handleAddSingle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
            Save
          </button>
        </DialogActions>
      </Dialog>

      {/* Error Overlay */}
      {showErrorOverlay && (
        <Box className="ai-error-overlay" onClick={() => setShowErrorOverlay(false)}>
          <Box className="ai-error-box" onClick={(e) => e.stopPropagation()}>
            <Box className="ai-error-header">
              <Typography variant="h6" className="ai-error-title">
                Validation Errors ({errorMessages.length})
              </Typography>
              <IconButton onClick={() => setShowErrorOverlay(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box className="ai-error-list">
              {errorMessages.map((error, index) => (
                <Box key={index} className="ai-error-item">
                  <Typography className="ai-error-num">{index + 1}.</Typography>
                  <Typography className="ai-error-msg">{error}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AddInstitute;
