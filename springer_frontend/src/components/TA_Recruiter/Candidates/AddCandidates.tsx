
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { candidateApi } from "../../../services/drive.api";
import { instituteApi, skillsApi } from "../../../services/hiring.api";
import type { CandidateRequest } from "../../../types/TA_Recruiter/Drive/candidate.types";
import { Degree, Department } from "../../../types/TA_Recruiter/Drive/candidate.types";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { SkillResponse } from "../../../types/TA_Recruiter/Hiring/skill.types";
import { showToast } from "../../../utils/toast";
import { parseExcelRow, validateFileData } from "../../../utils/candidateValidation";
import { useBulkCandidateUpload } from "../../../hooks/useBulkCandidateUpload";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BackButton from "../../Common/BackButton";
import BulkCandidateTable from "../../Common/BulkCandidateTable";
import ErrorOverlay from "../../Common/ErrorOverlay";
import AddIcon from "@mui/icons-material/Add";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import UploadIcon from "@mui/icons-material/Upload";
import UploadONCampus from "./UploadONCampus";
import "../../../css/TA_Recruiter/Candidates/AddCandidates.css";

const AddCandidates: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { cycleId?: number; cycleYear?: number; cycleName?: string; driveId?: number; driveName?: string; instituteName?: string } | null;
  const cycleId = navState?.cycleId || null;
  const cycleYear = navState?.cycleYear;
  const cycleName = navState?.cycleName;
  const driveId = navState?.driveId || null;
  const driveName = navState?.driveName;
  const instituteName = navState?.instituteName;
  const [uploadMode, setUploadMode] = useState<"offcampus" | "oncampus">("offcampus");
  const [addDialog, setAddDialog] = useState(false);
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [skills, setSkills] = useState<SkillResponse[]>([]);

  const bulk = useBulkCandidateUpload({ cycleId });

  const [singleForm, setSingleForm] = useState<CandidateRequest>({
    instituteId: 0,
    cycleId: cycleId || 0,
    driveId: driveId || undefined,
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    cgpa: 0,
    historyOfArrears: 0,
    degree: "",
    department: "",
    passoutYear: new Date().getFullYear(),
    dateOfBirth: "",
    aadhaarNumber: "",
    applicationType: "STANDARD",
    skillIds: [],
  });

  const fetchInstitutes = async () => {
    try {
      const response = await instituteApi.getAllInstitutes();
      if (response.data) {
        setInstitutes(response.data);
      }
    } catch (error) {
      console.error("Error fetching institutes:", error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await skillsApi.getAllSkills();
      if (response.data) {
        setSkills(response.data);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    if (!cycleId) {
      showToast("No cycle selected. Please select a cycle first.", "error");
      navigate("/ta-recruiter/candidates");
      return;
    }
    fetchInstitutes();
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSingle = async () => {
    // Regex patterns for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    const aadhaarRegex = /^[0-9]{12}$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    // Validate required fields
    if (
      !singleForm.firstName ||
      !singleForm.email ||
      !singleForm.mobile ||
      !singleForm.instituteId ||
      singleForm.cgpa === 0 ||
      !singleForm.passoutYear ||
      !singleForm.degree ||
      !singleForm.department ||
      singleForm.historyOfArrears === undefined ||
      singleForm.historyOfArrears === null ||
      !singleForm.dateOfBirth
    ) {
      showToast("Please fill all required fields", "error");
      return;
    }

    // Validate first name (only letters and spaces)
    if (!nameRegex.test(singleForm.firstName)) {
      showToast("First name should contain only letters", "error");
      return;
    }

    // Validate last name if provided (only letters and spaces)
    if (singleForm.lastName && !nameRegex.test(singleForm.lastName)) {
      showToast("Last name should contain only letters", "error");
      return;
    }

    // Validate email format
    if (!emailRegex.test(singleForm.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    // Validate mobile number (10 digits)
    if (!mobileRegex.test(singleForm.mobile)) {
      showToast("Mobile number must be exactly 10 digits", "error");
      return;
    }

    // Validate aadhaar number if provided (12 digits)
    if (singleForm.aadhaarNumber && !aadhaarRegex.test(singleForm.aadhaarNumber)) {
      showToast("Aadhaar number must be exactly 12 digits", "error");
      return;
    }

    // Validate date of birth
    if (singleForm.dateOfBirth) {
      const isValidDate = dayjs(singleForm.dateOfBirth, "YYYY-MM-DD", true).isValid();
      if (!isValidDate) {
        showToast("Invalid date of birth. Please check the date .", "error");
        return;
      }
      
      // Check if date is not in the future
      if (dayjs(singleForm.dateOfBirth).isAfter(dayjs())) {
        showToast("Date of birth cannot be in the future.", "error");
        return;
      }
      
      // Check if candidate is at least 18 years old
      const age = dayjs().diff(dayjs(singleForm.dateOfBirth), 'year');
      if (age < 18) {
        showToast("Candidate must be at least 18 years old.", "error");
        return;
      }
    }

    try {
      await candidateApi.createCandidate(singleForm);
      showToast("Candidate added successfully", "success");
      setAddDialog(false);
      setSingleForm({
        instituteId: 0,
        cycleId: cycleId || 0,
        driveId: driveId || undefined,
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        cgpa: 0,
        historyOfArrears: 0,
        degree: "",
        department: "",
        passoutYear: new Date().getFullYear(),
        dateOfBirth: "",
        aadhaarNumber: "",
        applicationType: "STANDARD",
        skillIds: [],
      });
    } catch (error: unknown) {
      console.error(error);
      const err = error as { message: string; data?: string };
      // Display error data if present, otherwise show message
      const errorMessage = err.data || err.message || "Failed to add candidate";
      showToast(errorMessage, "error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        const candidates: CandidateRequest[] = jsonData.map((row) =>
          parseExcelRow(row, { cycleId: cycleId || 0, driveId: driveId || undefined })
        );

        const errors = validateFileData(candidates, { requireInstituteId: true });

        if (errors.length > 0) {
          showToast("Validation errors found. Check data carefully.", "error");
          bulk.setErrorMessages(errors);
          bulk.setShowErrorOverlay(true);
        } else {
          bulk.loadCandidates(candidates);
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to read file. Please check the format.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleDownloadFormat = () => {
    const link = document.createElement("a");
    link.href = "/files/candidate_data.xlsx";
    link.download = "candidate_data.xlsx";
    link.click();
  };

  const handleSkillChange = (_: unknown, newValue: SkillResponse[]) => {
    setSingleForm({
      ...singleForm,
      skillIds: newValue.map((skill) => skill.skillId),
    });
  };

  const handleRemoveSkill = (skillIdToRemove: number) => {
    setSingleForm({
      ...singleForm,
      skillIds: singleForm.skillIds.filter((id) => id !== skillIdToRemove),
    });
  };

  const getInstituteName = (id: number) => {
    const institute = institutes.find((inst) => inst.instituteId === id);
    return institute ? institute.instituteName : `ID: ${id}`;
  };

  return (
    <Box className="add-candidates-container">
      {/* Single Unified Header */}
      <Card className="add-candidates-header">
        <Box className="add-candidates-header-left">
          <BackButton onClick={() => navigate("/ta-recruiter/candidates")} variant="header" />
          
          <Typography variant="h6" className="add-candidates-cycle-name">
            {cycleName} - {cycleYear}
          </Typography>
        </Box>

        <Box className="add-candidates-header-right">
          <Box className="add-candidates-mode-toggle">
            <Button
              variant={uploadMode === "offcampus" ? "contained" : "outlined"}
              onClick={() => setUploadMode("offcampus")}
              className={uploadMode === "offcampus" ? "mode-btn active t-btn-primary" : "mode-btn t-btn-small"}
            >
              Off Campus
            </Button>
            <Button
              variant={uploadMode === "oncampus" ? "contained" : "outlined"}
              onClick={() => setUploadMode("oncampus")}
              className={uploadMode === "oncampus" ? "mode-btn active t-btn-primary" : "mode-btn t-btn-small"}
            >
              On Campus
            </Button>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            className="add-candidates-header-btn t-btn-primary"
          >
            Add Candidate
          </Button>
        </Box>
      </Card>

      {/* Upload Area */}
      {uploadMode === "offcampus" ? (
        <>
          {/* Off-campus meta + controls row */}
          <Box className="oncampus-top-row">
            <Box className="oncampus-meta-row">
              {(cycleName || cycleYear) && (
                <Typography className="oncampus-meta-chip">
                  {cycleName ? `${cycleName}${cycleYear ? ` - ${cycleYear}` : ""}` : cycleYear}
                </Typography>
              )}
              {driveName && <Typography className="oncampus-meta-chip">{driveName}</Typography>}
            </Box>

            <Box className="oncampus-controls-row">
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleDownloadFormat}
                className="oncampus-download-btn t-btn-small"
              >
                Download Off-Campus Template
              </Button>
            </Box>
          </Box>

          {/* File Upload Zone */}
          {bulk.bulkData.length === 0 && (
            <Card className="add-candidates-upload-zone oncampus-upload-zone">
              <CardContent className="upload-zone-content">
                <Box className="upload-zone-icon-shell">
                  <FileUploadOutlinedIcon className="upload-zone-icon" />
                </Box>
                <Typography variant="h6" className="upload-zone-title">
                  Upload Off-Campus Candidates
                </Typography>
                <Typography variant="body2" className="upload-zone-subtitle">
                  {driveName
                    ? `Drive Name: ${driveName} | Cycle: ${cycleName} - ${cycleYear}`
                    : `Cycle: ${cycleName} - ${cycleYear}`}
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  className="upload-zone-btn t-btn-primary"
                >
                  Upload File
                  <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileUpload} />
                </Button>
                <Typography className="upload-zone-formats">
                  Supported formats: .xlsx, .xls, .csv
                </Typography>
              </CardContent>
            </Card>
          )}

          {bulk.bulkData.length === 0 && (
            <Card className="oncampus-instructions-card">
              <CardContent>
                <Typography className="oncampus-instructions-title">Instructions:</Typography>
                <Typography className="oncampus-instructions-text">
                  Download the template using the "Download Off-Campus Template" button
                </Typography>
                <Typography className="oncampus-instructions-text">
                  Fill in candidate details in the template
                </Typography>
                <Typography className="oncampus-instructions-text">
                  Upload the completed file using the "Upload File" button
                </Typography>
                <Typography className="oncampus-instructions-text">
                  Ensure all required fields are filled correctly
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Bulk Data Table */}
          {bulk.bulkData.length > 0 && (
            <BulkCandidateTable
              bulkData={bulk.bulkData}
              isValidating={bulk.isValidating}
              batchDuplicateIndices={bulk.batchDuplicateIndices}
              getValidationForCandidate={bulk.getValidationForCandidate}
              hasDuplicates={bulk.hasDuplicates}
              onRemoveRow={bulk.handleRemoveRow}
              onRemoveDuplicates={bulk.handleRemoveDuplicates}
              onBulkUpload={bulk.handleBulkUpload}
              validationResultsSize={bulk.validationResults.size}
              extraColumns={[
                {
                  header: "Institute",
                  render: (cand) => getInstituteName(cand.instituteId),
                },
              ]}
            />
      )}
        </>
      ) : (
        <UploadONCampus
          cycleId={cycleId}
          cycleYear={cycleYear}
          cycleName={cycleName}
          driveId={driveId}
          driveName={driveName}
          instituteName={instituteName}
        />
      )}

      {/* Add Single Candidate Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth={false} PaperProps={{ className: "add-candidates-dialog-paper" }}>
        <DialogTitle className="add-candidates-dialog-title">
          <Box className="add-candidates-dialog-header">
            <Box>
              <Typography className="add-candidates-dialog-heading">Add New Candidate</Typography>
              <Typography className="add-candidates-dialog-subtitle">
                Enter all the details about the candidate. All fields marked with * are required.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setAddDialog(false)} className="add-candidates-dialog-close-btn" aria-label="Close dialog">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="add-candidates-dialog-content">
          <Box className="add-candidates-form">
            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  First Name (Enter as per aadhaar) <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="text"
                  value={singleForm.firstName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[a-zA-Z\s]*$/.test(value)) {
                      setSingleForm({ ...singleForm, firstName: value });
                    }
                  }}
                />
              </Box>
              <Box className="add-candidates-field">
                <label className="add-candidates-label">Last Name</label>
                <input
                  className="add-candidates-input"
                  type="text"
                  value={singleForm.lastName}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[a-zA-Z\s]*$/.test(value)) {
                      setSingleForm({ ...singleForm, lastName: value });
                    }
                  }}
                />
              </Box>
            </Box>

            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Email <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="email"
                  value={singleForm.email}
                  onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                />
              </Box>
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Mobile <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="text"
                  value={singleForm.mobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (/^[0-9]*$/.test(value) && value.length <= 10)) {
                      setSingleForm({ ...singleForm, mobile: value });
                    }
                  }}
                  maxLength={10}
                />
              </Box>
            </Box>

            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field add-candidates-field--full">
                <label className="add-candidates-label">
                  Institute <span className="add-candidates-req">*</span>
                </label>
                <Autocomplete
                  className="add-candidates-autocomplete"
                  fullWidth
                  options={institutes}
                  getOptionLabel={(option) => option.instituteName}
                  value={institutes.find((inst) => inst.instituteId === singleForm.instituteId) || null}
                  onChange={(_, newValue) =>
                    setSingleForm({ ...singleForm, instituteId: newValue?.instituteId || 0 })
                  }
                  renderInput={(params) => (
                    <TextField {...params} required />
                  )}
                />
              </Box>
            </Box>

            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  CGPA <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={singleForm.cgpa || ""}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, cgpa: parseFloat(e.target.value) || 0 })
                  }
                />
              </Box>
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  History of Arrears <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="number"
                  min="0"
                  value={singleForm.historyOfArrears || ""}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, historyOfArrears: parseInt(e.target.value) || 0 })
                  }
                />
              </Box>
            </Box>

            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Degree <span className="add-candidates-req">*</span>
                </label>
                <select
                  className="add-candidates-select"
                  value={singleForm.degree || ""}
                  onChange={(e) => setSingleForm({ ...singleForm, degree: e.target.value })}
                >
                  <option value="">Select degree</option>
                  {Object.values(Degree).map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </Box>
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Department <span className="add-candidates-req">*</span>
                </label>
                <select
                  className="add-candidates-select"
                  value={singleForm.department || ""}
                  onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                >
                  <option value="">Select department</option>
                  {Object.values(Department).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </Box>
            </Box>

            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Passed Year <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="number"
                  min={2020}
                  max={2050}
                  value={singleForm.passoutYear || ""}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, passoutYear: parseInt(e.target.value) || 0 })
                  }
                />
              </Box>
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Date of Birth <span className="add-candidates-req">*</span>
                </label>
                <input
                  className="add-candidates-input"
                  type="date"
                  value={singleForm.dateOfBirth}
                  onChange={(e) => setSingleForm({ ...singleForm, dateOfBirth: e.target.value })}
                />
              </Box>
            </Box>

            <Box className="add-candidates-form-row">
              <Box className="add-candidates-field">
                <label className="add-candidates-label">Aadhaar Number</label>
                <input
                  className="add-candidates-input"
                  type="text"
                  value={singleForm.aadhaarNumber}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || (/^[0-9]*$/.test(value) && value.length <= 12)) {
                      setSingleForm({ ...singleForm, aadhaarNumber: value });
                    }
                  }}
                  maxLength={12}
                />
                <Typography className="add-candidates-helper-text">12 digits (optional)</Typography>
              </Box>
              <Box className="add-candidates-field">
                <label className="add-candidates-label">
                  Application Type <span className="add-candidates-req">*</span>
                </label>
                <select
                  className="add-candidates-select"
                  value={singleForm.applicationType || "STANDARD"}
                  onChange={(e) => setSingleForm({ ...singleForm, applicationType: e.target.value as "STANDARD" | "PREMIUM" })}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </Box>
            </Box>

            <Box className="add-candidates-field add-candidates-field--full">
              <label className="add-candidates-label">Skills</label>
              <Autocomplete
                className="add-candidates-autocomplete"
                multiple
                fullWidth
                options={skills}
                getOptionLabel={(option) => option.skillName}
                value={skills.filter((skill) => singleForm.skillIds.includes(skill.skillId))}
                onChange={handleSkillChange}
                renderInput={(params) => (
                  <TextField {...params} />
                )}
                renderTags={() => null}
              />
            </Box>

            {singleForm.skillIds.length > 0 && (
              <Box className="add-candidates-skill-chips">
                {singleForm.skillIds.map((skillId) => {
                  const skill = skills.find((s) => s.skillId === skillId);
                  return (
                    <Chip
                      key={skillId}
                      label={skill?.skillName || `ID: ${skillId}`}
                      onDelete={() => handleRemoveSkill(skillId)}
                      variant="outlined"
                      size="medium"
                      className="add-candidates-skill-chip"
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="add-candidates-dialog-actions">
          <Button variant="outlined" onClick={() => setAddDialog(false)} className="t-dialog-cancel-btn">Cancel</Button>
          <Button onClick={handleAddSingle} variant="contained" className="t-dialog-confirm-btn">
            Add Candidate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Overlay */}
      {bulk.showErrorOverlay && (
        <ErrorOverlay
          errorMessages={bulk.errorMessages}
          errorEmailMap={bulk.errorEmailMap}
          bulkData={bulk.bulkData}
          onClose={() => bulk.setShowErrorOverlay(false)}
          onRemoveByEmail={bulk.handleRemoveByEmail}
        />
      )}
    </Box>
  );
};

export default AddCandidates;