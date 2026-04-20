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
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import BackButton from "../../Common/BackButton";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import "../../../css/TA_Recruiter/Institutes/AddInstitute.css";

const AddInstitute: React.FC = () => {
  const navigate = useNavigate();
  const [addDialog, setAddDialog] = useState(false);
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
      console.log("Bulk upload response:", response);
      
      // Check if there are any errors in the response
      if (response.data.errorMessages && response.data.errorMessages.length > 0) {
        // Show error overlay
        setErrorMessages(response.data.errorMessages);
        setShowErrorOverlay(true);
        
        // Show success toast if some were successful
        if (response.data.successfulInserts && response.data.successfulInserts.length > 0) {
          showToast(`${response.data.successfulInserts.length} institutes uploaded, ${response.data.errorMessages.length} failed`, "error");
        }
      } else {
        showToast(`${bulkData.length} institutes uploaded successfully`, "success");
        setBulkData([]);
      }
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        success?: boolean;
        data?: { errorMessages?: string[] };
      };

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

  const handleDownloadFormat = () => {
    const link = document.createElement("a");
    link.href = "/files/college_template.xlsx";
    link.download = "college_template.xlsx";
    link.click();
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

          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadFormat}
            variant="outlined"
            className="add-institute-header-btn t-btn-small"
          >
            Download Format
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
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth={showTpoForm ? "md" : "sm"} fullWidth>
        <DialogTitle>Add New Institute</DialogTitle>
        <DialogContent>
          <Box className={`add-institute-dialog-body${showTpoForm ? " add-institute-dialog-body--with-tpo" : ""}`}>
            {/* Left: Institute Form */}
            <Box className="add-institute-form">
            <TextField
              label="Institute Name *"
              fullWidth
              value={singleForm.instituteName}
              onChange={(e) => setSingleForm({ ...singleForm, instituteName: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Tier *</InputLabel>
              <Select
                value={singleForm.instituteTier}
                label="Tier"
                onChange={(e) => setSingleForm({ ...singleForm, instituteTier: e.target.value })}
              >
                <MenuItem value="TIER_1">TIER 1</MenuItem>
                <MenuItem value="TIER_2">TIER 2</MenuItem>
                <MenuItem value="TIER_3">TIER 3</MenuItem>
              </Select>
            </FormControl>
          
            <Autocomplete
              freeSolo
              options={["Tamil Nadu", "Andhra Pradesh", "Kerala", "Karnataka"]}
              value={singleForm.state}
              onChange={(_, newValue) => setSingleForm({ ...singleForm, state: newValue || "" })}
              onInputChange={(_, newValue) => setSingleForm({ ...singleForm, state: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="State *" fullWidth />
              )}
            />
              <TextField
              label="City *"
              fullWidth
              value={singleForm.city}
              onChange={(e) => setSingleForm({ ...singleForm, city: e.target.value })}
            />

            {/* TPO Toggle Button */}
            <Button
              variant="outlined"
              startIcon={showTpoForm ? <CloseIcon /> : <PersonAddIcon />}
              onClick={() => {
                setShowTpoForm(!showTpoForm);
                if (showTpoForm) setTpoForm({ tpoName: "", tpoEmail: "", tpoMobile: "", tpoDesignation: "" });
              }}
              className="t-btn-small add-institute-tpo-toggle"
            >
              {showTpoForm ? "Remove TPO" : "Add TPO Contact"}
            </Button>
            </Box>

            {/* Right: TPO Card */}
            {showTpoForm && (
              <Box className="add-institute-tpo-section">
                <Typography className="add-institute-tpo-title">TPO Contact Details</Typography>
                <Box className="add-institute-tpo-fields">
                  <TextField
                    label="TPO Name *"
                    fullWidth
                    value={tpoForm.tpoName}
                    onChange={(e) => setTpoForm({ ...tpoForm, tpoName: e.target.value })}
                  />
                  <TextField
                    label="TPO Email *"
                    fullWidth
                    type="email"
                    value={tpoForm.tpoEmail}
                    onChange={(e) => setTpoForm({ ...tpoForm, tpoEmail: e.target.value })}
                  />
                  <TextField
                    label="TPO Mobile *"
                    fullWidth
                    value={tpoForm.tpoMobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setTpoForm({ ...tpoForm, tpoMobile: val });
                    }}
                  />
                  <TextField
                    label="TPO Designation"
                    fullWidth
                    value={tpoForm.tpoDesignation}
                    onChange={(e) => setTpoForm({ ...tpoForm, tpoDesignation: e.target.value })}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setAddDialog(false)} className="t-dialog-cancel-btn">Cancel</Button>
          <Button onClick={handleAddSingle} variant="contained" className="t-dialog-confirm-btn">
            Add Institute
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Overlay */}
      {showErrorOverlay && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowErrorOverlay(false)}
        >
          <Box
            sx={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
              border: '1px solid var(--color-border)',
              boxShadow: '0 1px 4px var(--opacity-shadow-card)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Typography variant="h6" sx={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                Validation Errors ({errorMessages.length})
              </Typography>
              <IconButton onClick={() => setShowErrorOverlay(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {errorMessages.map((error, index) => (
                <Box
                  key={index}
                  sx={{
                    padding: '12px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: 'var(--color-danger)', minWidth: '24px' }}>
                    {index + 1}.
                  </Typography>
                  <Typography sx={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                    {error}
                  </Typography>
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
