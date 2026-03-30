
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { candidateApi } from "../../../services/drive.api";
import { instituteApi, skillsApi } from "../../../services/hiring.api";
import type { CandidateRequest, CandidateValidationRequest, CandidateValidationResponse } from "../../../types/TA_Recruiter/Drive/candidate.types";
import { ValidationStatus, Degree, Department } from "../../../types/TA_Recruiter/Drive/candidate.types";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { SkillResponse } from "../../../types/TA_Recruiter/Hiring/skill.types";
import { showToast } from "../../../utils/toast";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// Validation constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9]{10}$/;
const AADHAAR_REGEX = /^[0-9]{12}$/;
const CURRENT_YEAR = new Date().getFullYear();
const MIN_PASSOUT_YEAR = 1950;
const MAX_PASSOUT_YEAR = CURRENT_YEAR + 5;

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
  Chip,
  Autocomplete,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import "../../../css/TA_Recruiter/Candidates/AddCandidates.css";

const AddCandidates: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cycleId = (location.state as { cycleId?: number; cycleYear?: number; cycleName?: string })?.cycleId || null;
  const cycleYear = (location.state as { cycleId?: number; cycleYear?: number; cycleName?: string })?.cycleYear;
  const cycleName = (location.state as { cycleId?: number; cycleYear?: number; cycleName?: string })?.cycleName;
  const [addDialog, setAddDialog] = useState(false);
  const [bulkData, setBulkData] = useState<CandidateRequest[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, CandidateValidationResponse>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [singleForm, setSingleForm] = useState<CandidateRequest>({
    instituteId: 0,
    cycleId: cycleId || 0,
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
        console.log("Skills API response:", response);
console.log("Skills data:", response.data);
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

        // Debug: Show column names from first row
        if (jsonData.length > 0) {
          console.log("DEBUG: Excel column names found:", Object.keys(jsonData[0]));
          console.log("DEBUG: First row data sample:", jsonData[0]);
        }

        const candidates: CandidateRequest[] = jsonData.map((row) => {
          // Parse application type (default to STANDARD if not provided)
          let applicationType: "STANDARD" | "PREMIUM" = "STANDARD";
          const appTypeValue = row["Application Type"] || row["applicationType"] || "";
          if (typeof appTypeValue === "string") {
            const normalizedValue = appTypeValue.toUpperCase().trim();
            if (normalizedValue === "PREMIUM") {
              applicationType = "PREMIUM";
            }
          }
          
          return {
            instituteId: Number(row["Institute ID"] || row["instituteId"] || 0),
            cycleId: cycleId || 0,
            firstName: (row["First Name"] || row["firstName"] || "") as string,
            lastName: (row["Last Name"] || row["lastName"] || "") as string,
            email: (row["Email"] || row["email"] || "") as string,
            mobile: (row["Mobile"] || row["mobile"] || "") as string,
          cgpa: Number(row["CGPA"] || row["cgpa"] || 0),
          historyOfArrears: Number(row["History of Arrears"] || row["historyOfArrears"] || 0),
          degree: (row["Degree"] || row["degree"] || "") as string,
          department: (row["Department"] || row["department"] || "") as string,
            passoutYear: Number(row["Passout Year"] || row["passoutYear"] || new Date().getFullYear()),
            dateOfBirth: (row["Date of Birth"] || row["dateOfBirth"] || "") as string,
            aadhaarNumber: (row["Aadhaar Number"] || row["aadhaarNumber"] || "") as string,
            applicationType: applicationType,
            skillIds: (() => {
              const skillIdsValue =  row["SkillIds"] ||   row["skillIds"] ||   "";
              if (!skillIdsValue) return [];
              
              const skillIdsStr = String(skillIdsValue).trim();
              if (!skillIdsStr) return [];
              
              // Split by comma and convert to numbers, filtering out invalid values
              return skillIdsStr.split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id) && id > 0);
            })(),
          };
        });

      

        // Basic validation
        const errors: string[] = [];
        candidates.forEach((cand, idx) => {
          if (!cand.firstName) errors.push(`Row ${idx + 2}: Missing First Name`);
          if (!cand.email) errors.push(`Row ${idx + 2}: Missing Email`);
          if (!cand.mobile) errors.push(`Row ${idx + 2}: Missing Mobile`);
          if (!cand.instituteId || cand.instituteId === 0) errors.push(`Row ${idx + 2}: Missing Institute ID`);
          if (!cand.cgpa || cand.cgpa === 0) errors.push(`Row ${idx + 2}: Missing CGPA`);
          if (!cand.passoutYear) errors.push(`Row ${idx + 2}: Missing Passout Year`);
          
          // Validate date of birth format and validity
          if (cand.dateOfBirth) {
            const isValidDate = dayjs(cand.dateOfBirth, "YYYY-MM-DD", true).isValid();
            if (!isValidDate) {
              errors.push(`Row ${idx + 2}: Invalid date of birth '${cand.dateOfBirth}' `);
            } else {
              // Check if date is not in the future
              if (dayjs(cand.dateOfBirth).isAfter(dayjs())) {
                errors.push(`Row ${idx + 2}: Date of birth cannot be in the future`);
              }
              
              // Check if candidate is at least 18 years old
              const age = dayjs().diff(dayjs(cand.dateOfBirth), 'year');
              if (age < 18) {
                errors.push(`Row ${idx + 2}: Candidate must be at least 18 years old`);
              }
            }
          }
        });

        if (errors.length > 0) {
          showToast(`Validation errors found. Check data carefully.`, "error");
          setErrorMessages(errors);
          setShowErrorOverlay(true);
        } else {
          setBulkData(candidates);
          showToast(`${candidates.length} candidates loaded from file`, "success");
          // Automatically validate candidates after loading
          validateCandidates(candidates);
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to read file. Please check the format.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const validateCandidates = async (candidates: CandidateRequest[]) => {
    if (candidates.length === 0) return;
    
    setIsValidating(true);
    try {
      // Create validation requests with tempId
      const validationRequests: CandidateValidationRequest[] = candidates.map((cand, index) => ({
        tempId: `row-${index + 1}`,
        instituteId: cand.instituteId,
        cycleId: cand.cycleId || cycleId || 0,
        firstName: cand.firstName,
        lastName: cand.lastName,
        email: cand.email,
        mobile: cand.mobile,
        cgpa: cand.cgpa,
        historyOfArrears: cand.historyOfArrears,
        degree: cand.degree,
        department: cand.department,
        passoutYear: cand.passoutYear,
        dateOfBirth: cand.dateOfBirth,
        aadhaarNumber: cand.aadhaarNumber,
        applicationType: "STANDARD", // Default application type
      }));

      const response = await candidateApi.bulkValidateCandidates(validationRequests);
      
      if (response.success && response.data) {
        // Create a map of tempId to validation response
        const resultsMap = new Map<string, CandidateValidationResponse>();
        response.data.forEach((result) => {
          resultsMap.set(result.tempId, result);
        });
        setValidationResults(resultsMap);

        // Count statuses
        const duplicateCount = response.data.filter(r => r.status === ValidationStatus.DUPLICATE).length;
        const oldCount = response.data.filter(r => r.status === ValidationStatus.OLD).length;
        const newCount = response.data.filter(r => r.status === ValidationStatus.NEW).length;

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
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast(err.message || "Validation failed", "error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      showToast("No data to upload", "error");
      return;
    }

    // Validate data before upload
    const errors: string[] = [];
    const rowNum = (idx: number) => idx + 1; // Row number starts from 1
    
    bulkData.forEach((cand, idx) => {
      // Validate email format
      if (!cand.email) {
        errors.push(`Row ${rowNum(idx)}: Missing Email`);
      } else if (!EMAIL_REGEX.test(cand.email)) {
        errors.push(`Row ${rowNum(idx)}: Invalid email format '${cand.email}'`);
      }
      
      // Validate mobile number (10 digits)
      if (!cand.mobile) {
        errors.push(`Row ${rowNum(idx)}: Missing Mobile Number`);
      } else if (!MOBILE_REGEX.test(cand.mobile)) {
        errors.push(`Row ${rowNum(idx)}: Mobile number must be exactly 10 digits (found: '${cand.mobile}')`);
      }
      
      // Validate aadhaar number (12 digits, optional)
      if (cand.aadhaarNumber && !AADHAAR_REGEX.test(cand.aadhaarNumber)) {
        errors.push(`Row ${rowNum(idx)}: Aadhaar number must be exactly 12 digits (found: '${cand.aadhaarNumber}')`);
      }
      
      // Validate passout year
      if (!cand.passoutYear) {
        errors.push(`Row ${rowNum(idx)}: Missing Passout Year`);
      } else if (cand.passoutYear < MIN_PASSOUT_YEAR || cand.passoutYear > MAX_PASSOUT_YEAR) {
        errors.push(`Row ${rowNum(idx)}: Passout year must be between ${MIN_PASSOUT_YEAR} and ${MAX_PASSOUT_YEAR} (found: ${cand.passoutYear})`);
      }
    });

    // If validation errors exist, show overlay and stop
    if (errors.length > 0) {
      setErrorMessages(errors);
      setShowErrorOverlay(true);
      showToast(`Found ${errors.length} validation error(s). Please fix them before uploading.`, "error");
      return;
    }

    // Check if validation has been performed
    if (validationResults.size === 0) {
      showToast("Please wait for validation to complete", "error");
      return;
    }

    // Check if any duplicates exist
    const duplicatesExist = Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );
    if (duplicatesExist) {
      showToast("Cannot upload: duplicate candidates detected. Please remove them.", "error");
      return;
    }

    try {
      const response = await candidateApi.bulkCreateCandidates(bulkData);

      // Check if there are any errors in the response
      if (response.data.errorMessages && response.data.errorMessages.length > 0) {
        // Show error overlay
        setErrorMessages(response.data.errorMessages);
        setShowErrorOverlay(true);

        // Show notification based on success/failure
        if (response.data.successfulInserts && response.data.successfulInserts.length > 0) {
          showToast(
            `${response.data.successfulInserts.length} candidates uploaded, ${response.data.errorMessages.length} failed`,
            "error"
          );
        } else {
          showToast("All candidates failed validation. See errors.", "error");
        }
      } else {
        showToast(`${response.data.successfulInserts.length} candidates uploaded successfully`, "success");
        setBulkData([]);
        setValidationResults(new Map());
      }
    } catch (error: unknown) {
      const err = error as {
        message: string;
        success: boolean;
        data?: { errorMessages?: string[]; message?: string };
      };

      if (err.data?.errorMessages?.length) {
        setErrorMessages(err.data.errorMessages);
        setShowErrorOverlay(true);
        showToast("Bulk upload failed. See error details.", "error");
      } else {
        showToast(err.data?.message || err.message || "Upload failed", "error");
      }
    }
  };

  const handleDownloadFormat = () => {
    const link = document.createElement("a");
    link.href = "/files/candidate_data.xlsx";
    link.download = "candidate_data.xlsx";
    link.click();
  };

  const handleRemoveRow = (index: number) => {
    const updated = bulkData.filter((_, idx) => idx !== index);
    setBulkData(updated);
    
    // Update validation results by removing the deleted row and shifting indices
    const newValidationResults = new Map<string, CandidateValidationResponse>();
    validationResults.forEach((value, key) => {
      const rowNum = parseInt(key.split("-")[1]);
      if (rowNum < index + 1) {
        newValidationResults.set(key, value);
      } else if (rowNum > index + 1) {
        newValidationResults.set(`row-${rowNum - 1}`, value);
      }
    });
    setValidationResults(newValidationResults);
    
    showToast("Row removed", "success");
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

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const getValidationForIndex = (index: number): CandidateValidationResponse | undefined => {
    const tempId = `row-${index + 1}`;
    return validationResults.get(tempId);
  };

  const hasDuplicates = (): boolean => {
    return Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );
  };

  return (
    <Box className="add-candidates-container">
      {/* Single Unified Header */}
      <Card className="add-candidates-header">
        <Box className="add-candidates-header-left">
          <IconButton onClick={() => navigate("/ta-recruiter/candidates")} className="add-candidates-back-btn">
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h6" className="add-candidates-cycle-name">
            {cycleName} - {cycleYear}
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            className="add-candidates-header-btn add-candidates-add-btn"
          >
            Add Candidate
          </Button>

          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            className="add-candidates-header-btn add-candidates-upload-btn"
          >
            Upload Candidates
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileUpload} />
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadFormat}
            className="add-candidates-header-btn add-candidates-download-btn"
          >
            Download Format
          </Button>
        </Box>
      </Card>

      {/* Bulk Data Table */}
      {bulkData.length > 0 && (
        <Card className="add-candidates-bulk-card">
          <CardContent>
            <Box className="add-candidates-bulk-header">
              <Typography variant="h6">
                Uploaded Data ({bulkData.length} candidates)
                {isValidating && <span className="validation-loading"> - Validating...</span>}
              </Typography>
              <Button
                variant="contained"
                onClick={handleBulkUpload}
                className="add-candidates-bulk-upload-btn"
                disabled={hasDuplicates() || isValidating || validationResults.size === 0}
              >
                Upload to Database
              </Button>
            </Box>

            <TableContainer component={Paper} className="add-candidates-bulk-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header">Index</TableCell>
                    <TableCell className="table-header">First Name</TableCell>
                    <TableCell className="table-header">Last Name</TableCell>
                    <TableCell className="table-header">Email</TableCell>
                    <TableCell className="table-header">Mobile</TableCell>
                    <TableCell className="table-header">Institute</TableCell>
                    <TableCell className="table-header">CGPA</TableCell>
                    <TableCell className="table-header">Age</TableCell>
                    <TableCell className="table-header">Passout Year</TableCell>
                    <TableCell className="table-header">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkData.map((cand, index) => {
                    const validation = getValidationForIndex(index);
                    const isDuplicate = validation?.status === ValidationStatus.DUPLICATE;
                    const isOld = validation?.status === ValidationStatus.OLD;
                    const hasWarning = isDuplicate || isOld;
                    const rowClassName = isDuplicate ? "table-row-duplicate" : isOld ? "table-row-old" : "";
                    
                    return (
                    <TableRow key={index} className={rowClassName}>
                      <TableCell>
                        <Box className="index-cell-container">
                          {hasWarning && (
                            <span className={isDuplicate ? "danger-dot" : "warning-dot"}></span>
                          )}
                          <span>{index + 1}</span>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={validation?.comment || ""} arrow placement="top">
                          <span>{cand.firstName}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{cand.lastName}</TableCell>
                      <TableCell>{cand.email}</TableCell>
                      <TableCell>{cand.mobile}</TableCell>
                      <TableCell>{getInstituteName(cand.instituteId)}</TableCell>
                      <TableCell>{cand.cgpa}</TableCell>
                      <TableCell>{calculateAge(cand.dateOfBirth)} yrs</TableCell>
                      <TableCell>{cand.passoutYear}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRow(index)}
                          className="bulk-delete-btn"
                          title="Remove row"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Single Candidate Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Candidate</DialogTitle>
        <DialogContent>
          <Box className="add-candidates-form">
            <Box className="add-candidates-form-row">
              <TextField
                label="First Name (Enter name as per aadhaar)"
                fullWidth
                required
                value={singleForm.firstName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only letters and spaces
                  if (value === "" || /^[a-zA-Z\s]*$/.test(value)) {
                    setSingleForm({ ...singleForm, firstName: value });
                  }
                }}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={singleForm.lastName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only letters and spaces
                  if (value === "" || /^[a-zA-Z\s]*$/.test(value)) {
                    setSingleForm({ ...singleForm, lastName: value });
                  }
                }}
              />
            </Box>

            <Box className="add-candidates-form-row">
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={singleForm.email}
                onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
              />
              <TextField
                label="Mobile"
                fullWidth
                required
                value={singleForm.mobile}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and max 10 digits
                  if (value === "" || (/^[0-9]*$/.test(value) && value.length <= 10)) {
                    setSingleForm({ ...singleForm, mobile: value });
                  }
                }}
                inputProps={{ maxLength: 10 }}
              />
            </Box>

            <Box className="add-candidates-form-row">
              <Autocomplete
                fullWidth
                options={institutes}
                getOptionLabel={(option) => option.instituteName}
                value={institutes.find((inst) => inst.instituteId === singleForm.instituteId) || null}
                onChange={(_, newValue) =>
                  setSingleForm({ ...singleForm, instituteId: newValue?.instituteId || 0 })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Institute" placeholder="Search institute..." required />
                )}
              />
            </Box>

            <Box className="add-candidates-form-row">
              <TextField
                label="CGPA"
                type="number"
                fullWidth
                required
                inputProps={{ step: 0.01, min: 0, max: 10 }}
                value={singleForm.cgpa || ""}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, cgpa: parseFloat(e.target.value) || 0 })
                }
              />
              <TextField
                label="History of Arrears"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0 }}
                value={singleForm.historyOfArrears || ""}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, historyOfArrears: parseInt(e.target.value) || 0 })
                }
              />
            </Box>

            <Box className="add-candidates-form-row">
              <FormControl fullWidth required>
                <InputLabel>Degree</InputLabel>
                <Select
                  value={singleForm.degree || ""}
                  label="Degree"
                  onChange={(e) => setSingleForm({ ...singleForm, degree: e.target.value })}
                >
                  {Object.values(Degree).map((degree) => (
                    <MenuItem key={degree} value={degree}>
                      {degree}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  value={singleForm.department || ""}
                  label="Department"
                  onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                >
                  {Object.values(Department).map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box className="add-candidates-form-row">
              <TextField
                label="Passout Year"
                type="number"
                fullWidth
                required
                inputProps={{ min: 2020, max: 2050 }}
                value={singleForm.passoutYear || ""}
                onChange={(e) =>
                  setSingleForm({ ...singleForm, passoutYear: parseInt(e.target.value) || 0 })
                }
              />
              <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                value={singleForm.dateOfBirth}
                onChange={(e) => setSingleForm({ ...singleForm, dateOfBirth: e.target.value })}
              />
            </Box>

            <Box className="add-candidates-form-row">
              <TextField
                label="Aadhaar Number"
                fullWidth
                value={singleForm.aadhaarNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and max 12 digits
                  if (value === "" || (/^[0-9]*$/.test(value) && value.length <= 12)) {
                    setSingleForm({ ...singleForm, aadhaarNumber: value });
                  }
                }}
                inputProps={{ maxLength: 12 }}
                helperText="12 digits (optional)"
              />
              <FormControl fullWidth required>
                <InputLabel>Application Type</InputLabel>
                <Select
                  value={singleForm.applicationType || "STANDARD"}
                  label="Application Type"
                  onChange={(e) => setSingleForm({ ...singleForm, applicationType: e.target.value as "STANDARD" | "PREMIUM" })}
                >
                  <MenuItem value="STANDARD">Standard</MenuItem>
                  <MenuItem value="PREMIUM">Premium</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Autocomplete
              multiple
              fullWidth
              options={skills}
              getOptionLabel={(option) => option.skillName}
              value={skills.filter((skill) => singleForm.skillIds.includes(skill.skillId))}
              onChange={handleSkillChange}
              renderInput={(params) => (
                <TextField {...params} label="Skills" placeholder="Search skills..." />
              )}
              renderTags={() => null}
            />

            {singleForm.skillIds.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {singleForm.skillIds.map((skillId) => {
                  const skill = skills.find((s) => s.skillId === skillId);
                  return (
                    <Chip
                      key={skillId}
                      label={skill?.skillName || `ID: ${skillId}`}
                      onDelete={() => handleRemoveSkill(skillId)}
                      color="primary"
                      variant="outlined"
                      size="medium"
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSingle} variant="contained" className="add-candidates-add-btn">
            Add Candidate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Overlay */}
      {showErrorOverlay && (
        <Box className="error-overlay" onClick={() => setShowErrorOverlay(false)}>
          <Box className="error-overlay-content" onClick={(e) => e.stopPropagation()}>
            <Box className="error-overlay-header">
              <Typography variant="h6" className="error-overlay-title">
                Validation Errors ({errorMessages.length})
              </Typography>
              <IconButton onClick={() => setShowErrorOverlay(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box className="error-overlay-messages">
              {errorMessages.map((error, index) => (
                <Box key={index} className="error-message-item">
                  <Typography className="error-message-number">{index + 1}.</Typography>
                  <Typography className="error-message-text">{error}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AddCandidates;