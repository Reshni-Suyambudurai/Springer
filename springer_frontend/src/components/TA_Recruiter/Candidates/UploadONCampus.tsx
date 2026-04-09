import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { instituteApi } from "../../../services/hiring.api";
import { candidateApi } from "../../../services/drive.api";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type {
  CandidateRequest,
  CandidateValidationRequest,
  CandidateValidationResponse,
} from "../../../types/TA_Recruiter/Drive/candidate.types";
import { ValidationStatus } from "../../../types/TA_Recruiter/Drive/candidate.types";
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

interface UploadONCampusProps {
  cycleId: number | null;
  cycleYear?: number;
  cycleName?: string;
  driveId: number | null;
  driveName?: string;
}

const UploadONCampus: React.FC<UploadONCampusProps> = ({
  cycleId,
  cycleYear,
  cycleName,
  driveId,
  driveName,
}) => {
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteResponse | null>(null);
  const [bulkData, setBulkData] = useState<CandidateRequest[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, CandidateValidationResponse>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [batchDuplicateIndices, setBatchDuplicateIndices] = useState<Set<number>>(new Set());
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [errorEmailMap, setErrorEmailMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
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
    fetchInstitutes();
  }, []);

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/files/ONCampus_candidate_template.xlsx";
    link.download = "ONCampus_candidate_template.xlsx";
    link.click();
  };

  // ── Helpers ──

  const computeBatchDuplicates = (candidates: CandidateRequest[]): Set<number> => {
    const dupIndices = new Set<number>();
    const emailMap = new Map<string, number[]>();
    const aadhaarMap = new Map<string, number[]>();

    candidates.forEach((cand, idx) => {
      const email = (cand.email || "").trim().toLowerCase();
      if (email) {
        const indices = emailMap.get(email) || [];
        indices.push(idx);
        emailMap.set(email, indices);
      }
      const aadhaar = String(cand.aadhaarNumber || "").trim();
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

  const getValidationForCandidate = (email: string): CandidateValidationResponse | undefined => {
    return validationResults.get(email.toLowerCase());
  };

  const hasDuplicates = (): boolean => {
    return Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );
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

  // ── Validate against backend ──

  const validateCandidates = async (candidates: CandidateRequest[]) => {
    if (candidates.length === 0) return;

    setIsValidating(true);
    try {
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
        applicationType: "STANDARD",
      }));

      const response = await candidateApi.bulkValidateCandidates(validationRequests);

      if (response.success && response.data) {
        const resultsMap = new Map<string, CandidateValidationResponse>();
        response.data.forEach((result, idx) => {
          const email = candidates[idx]?.email?.toLowerCase();
          if (email) resultsMap.set(email, result);
        });
        setValidationResults(resultsMap);

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
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast(err.message || "Validation failed", "error");
    } finally {
      setIsValidating(false);
    }
  };

  // ── File upload handler ──

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedInstitute) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        const candidates: CandidateRequest[] = jsonData.map((row) => {
          let applicationType: "STANDARD" | "PREMIUM" = "STANDARD";
          const appTypeValue = row["Application Type"] || row["applicationType"] || "";
          if (typeof appTypeValue === "string") {
            const normalizedValue = appTypeValue.toUpperCase().trim();
            if (normalizedValue === "PREMIUM") {
              applicationType = "PREMIUM";
            }
          }

          return {
            instituteId: selectedInstitute.instituteId,
            cycleId: cycleId || 0,
            driveId: driveId || undefined,
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
              const skillIdsValue = row["SkillIds"] || row["skillIds"] || "";
              if (!skillIdsValue) return [];
              const skillIdsStr = String(skillIdsValue).trim();
              if (!skillIdsStr) return [];
              return skillIdsStr
                .split(",")
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
          if (!cand.cgpa || cand.cgpa === 0) errors.push(`Row ${idx + 2}: Missing CGPA`);
          if (!cand.passoutYear) errors.push(`Row ${idx + 2}: Missing Passout Year`);

          if (cand.dateOfBirth) {
            const isValidDate = dayjs(cand.dateOfBirth, "YYYY-MM-DD", true).isValid();
            if (!isValidDate) {
              errors.push(`Row ${idx + 2}: Invalid date of birth '${cand.dateOfBirth}'`);
            } else {
              if (dayjs(cand.dateOfBirth).isAfter(dayjs())) {
                errors.push(`Row ${idx + 2}: Date of birth cannot be in the future`);
              }
              const age = dayjs().diff(dayjs(cand.dateOfBirth), "year");
              if (age < 18) {
                errors.push(`Row ${idx + 2}: Candidate must be at least 18 years old`);
              }
            }
          }
        });

        if (errors.length > 0) {
          showToast("Validation errors found. Check data carefully.", "error");
          setErrorMessages(errors);
          setShowErrorOverlay(true);
        } else {
          setBulkData(candidates);
          setBatchDuplicateIndices(computeBatchDuplicates(candidates));
          showToast(`${candidates.length} candidates loaded from file`, "success");
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

  // ── Bulk upload to DB ──

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      showToast("No data to upload", "error");
      return;
    }

    const errors: string[] = [];
    const rowNum = (idx: number) => idx + 1;

    bulkData.forEach((cand, idx) => {
      if (!cand.email) {
        errors.push(`Row ${rowNum(idx)}: Missing Email`);
      } else if (!EMAIL_REGEX.test(cand.email)) {
        errors.push(`Row ${rowNum(idx)}: Invalid email format '${cand.email}'`);
      }
      if (!cand.mobile) {
        errors.push(`Row ${rowNum(idx)}: Missing Mobile Number`);
      } else if (!MOBILE_REGEX.test(cand.mobile)) {
        errors.push(`Row ${rowNum(idx)}: Mobile number must be exactly 10 digits (found: '${cand.mobile}')`);
      }
      if (cand.aadhaarNumber && !AADHAAR_REGEX.test(cand.aadhaarNumber)) {
        errors.push(`Row ${rowNum(idx)}: Aadhaar number must be exactly 12 digits (found: '${cand.aadhaarNumber}')`);
      }
      if (!cand.passoutYear) {
        errors.push(`Row ${rowNum(idx)}: Missing Passout Year`);
      } else if (cand.passoutYear < MIN_PASSOUT_YEAR || cand.passoutYear > MAX_PASSOUT_YEAR) {
        errors.push(`Row ${rowNum(idx)}: Passout year must be between ${MIN_PASSOUT_YEAR} and ${MAX_PASSOUT_YEAR} (found: ${cand.passoutYear})`);
      }
    });

    if (errors.length > 0) {
      setErrorMessages(errors);
      setShowErrorOverlay(true);
      showToast(`Found ${errors.length} validation error(s). Please fix them before uploading.`, "error");
      return;
    }

    if (validationResults.size === 0) {
      showToast("Please wait for validation to complete", "error");
      return;
    }

    const duplicatesExist = Array.from(validationResults.values()).some(
      (result) => result.status === ValidationStatus.DUPLICATE
    );
    if (duplicatesExist) {
      showToast("Cannot upload: duplicate candidates detected. Please remove them.", "error");
      return;
    }

    try {
      const response = await candidateApi.bulkCreateCandidates(bulkData);

      if (response.data.errorMessages && response.data.errorMessages.length > 0) {
        setErrorMessages(response.data.errorMessages);
        setShowErrorOverlay(true);
        const emailMap = new Map<number, string>();
        response.data.errorMessages.forEach((msg: string) => {
          const m = msg.match(/^Candidate\s*#(\d+):/i);
          if (m) {
            const num = parseInt(m[1], 10);
            const email = bulkData[num - 1]?.email?.toLowerCase();
            if (email) emailMap.set(num, email);
          }
        });
        setErrorEmailMap(emailMap);

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
        setBatchDuplicateIndices(new Set());
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
        const emailMap = new Map<number, string>();
        err.data.errorMessages.forEach((msg: string) => {
          const m = msg.match(/^Candidate\s*#(\d+):/i);
          if (m) {
            const num = parseInt(m[1], 10);
            const email = bulkData[num - 1]?.email?.toLowerCase();
            if (email) emailMap.set(num, email);
          }
        });
        setErrorEmailMap(emailMap);
        showToast("Bulk upload failed. See error details.", "error");
      } else {
        showToast(err.data?.message || err.message || "Upload failed", "error");
      }
    }
  };

  // ── Row actions ──

  const handleRemoveRow = (index: number) => {
    const removedEmail = bulkData[index]?.email?.toLowerCase();
    const updated = bulkData.filter((_, idx) => idx !== index);
    setBulkData(updated);
    setBatchDuplicateIndices(computeBatchDuplicates(updated));
    if (removedEmail) {
      const newValidationResults = new Map(validationResults);
      newValidationResults.delete(removedEmail);
      setValidationResults(newValidationResults);
    }
    showToast("Row removed", "success");
  };

  const handleRemoveDuplicates = () => {
    const duplicateEmails = new Set<string>();
    validationResults.forEach((result, email) => {
      if (result.status === ValidationStatus.DUPLICATE) {
        duplicateEmails.add(email);
      }
    });

    const indicesToRemove = new Set<number>(batchDuplicateIndices);
    bulkData.forEach((c, idx) => {
      if (duplicateEmails.has(c.email.toLowerCase())) {
        indicesToRemove.add(idx);
      }
    });

    if (indicesToRemove.size === 0) return;

    const filtered = bulkData.filter((_, idx) => !indicesToRemove.has(idx));
    const newValidationResults = new Map(validationResults);
    duplicateEmails.forEach((email) => newValidationResults.delete(email));

    setBulkData(filtered);
    setValidationResults(newValidationResults);
    setBatchDuplicateIndices(computeBatchDuplicates(filtered));
    showToast(`Removed ${indicesToRemove.size} duplicate row(s)`, "success");
  };

  return (
    <Box className="oncampus-wrapper">
      {/* Institute selector + Download Template row */}
      <Box className="oncampus-top-row">
        <Autocomplete
          className="oncampus-institute-dropdown"
          options={institutes}
          getOptionLabel={(option) => option.instituteName}
          value={selectedInstitute}
          onChange={(_, newValue) => {
            setSelectedInstitute(newValue);
            // Reset bulk data when institute changes
            setBulkData([]);
            setValidationResults(new Map());
            setBatchDuplicateIndices(new Set());
          }}
          renderInput={(params) => (
            <TextField {...params} label="Institute" placeholder="Search institute..." size="small" />
          )}
        />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadTemplate}
          className="oncampus-download-btn t-btn-small"
        >
          Download On-Campus Template
        </Button>
      </Box>

      {/* Upload zone - shown only when institute is selected and no data loaded */}
      {selectedInstitute && bulkData.length === 0 && (
        <Card className="add-candidates-upload-zone">
          <CardContent className="upload-zone-content">
            <UploadIcon className="upload-zone-icon" />
            <Typography variant="h6" className="upload-zone-title">
              Upload On-Campus Candidates
            </Typography>
            <Typography variant="body2" className="upload-zone-subtitle">
              {driveName
                ? `Institute: ${selectedInstitute.instituteName} | Drive: ${driveName} | Cycle: ${cycleName} - ${cycleYear}`
                : `Institute: ${selectedInstitute.instituteName} | Cycle: ${cycleName} - ${cycleYear}`}
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
          </CardContent>
        </Card>
      )}

      {/* Bulk Data Table */}
      {bulkData.length > 0 && (
        <Card className="add-candidates-bulk-card">
          <CardContent>
            <Box className="add-candidates-bulk-header">
              <Typography variant="h6">
                Uploaded Data ({bulkData.length} candidates)
                {isValidating && <span className="validation-loading"> - Validating...</span>}
              </Typography>
              <Box className="add-candidates-bulk-header-actions">
                {(hasDuplicates() || batchDuplicateIndices.size > 0) && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveDuplicates}
                    className="t-btn-secondary"
                    disabled={isValidating}
                  >
                    Remove Duplicates
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleBulkUpload}
                  className="t-btn-primary"
                  disabled={hasDuplicates() || batchDuplicateIndices.size > 0 || isValidating || validationResults.size === 0}
                >
                  Upload to Database
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} className="add-candidates-bulk-table">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className="t-head-cell">Index</TableCell>
                    <TableCell className="t-head-cell">First Name</TableCell>
                    <TableCell className="t-head-cell">Last Name</TableCell>
                    <TableCell className="t-head-cell">Email</TableCell>
                    <TableCell className="t-head-cell">Mobile</TableCell>
                    <TableCell className="t-head-cell">CGPA</TableCell>
                    <TableCell className="t-head-cell">Age</TableCell>
                    <TableCell className="t-head-cell">Passout Year</TableCell>
                    <TableCell className="t-head-cell">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkData.map((cand, index) => {
                    const validation = getValidationForCandidate(cand.email);
                    const isDuplicate = validation?.status === ValidationStatus.DUPLICATE;
                    const isOld = validation?.status === ValidationStatus.OLD;
                    const isBatchDup = batchDuplicateIndices.has(index);
                    const hasWarning = isDuplicate || isOld || isBatchDup;

                    const rowClassName = isDuplicate
                      ? "table-row-duplicate"
                      : isBatchDup
                        ? "table-row-batch-duplicate"
                        : isOld
                          ? "table-row-old"
                          : "";

                    return (
                      <TableRow key={index} className={rowClassName}>
                        <TableCell>
                          <Box className="index-cell-container">
                            {hasWarning && (
                              <span className={isDuplicate ? "danger-dot" : isBatchDup ? "batch-dup-dot" : "warning-dot"}></span>
                            )}
                            <span>{index + 1}</span>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={isBatchDup ? "Duplicate: Same email or aadhaar repeated in uploaded file" : validation?.comment || ""}
                            arrow
                            placement="top"
                            slotProps={{
                              tooltip: { className: "g-tooltip" },
                              arrow: { className: "g-tooltip-arrow" },
                            }}
                          >
                            <span className={isBatchDup ? "batch-duplicate-candidate-text" : ""}>
                              {cand.firstName}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{cand.lastName}</TableCell>
                        <TableCell>{cand.email}</TableCell>
                        <TableCell>{cand.mobile}</TableCell>
                        <TableCell>{cand.cgpa}</TableCell>
                        <TableCell>{calculateAge(cand.dateOfBirth)} yrs</TableCell>
                        <TableCell>{cand.passoutYear}</TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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
              {errorMessages.map((error, index) => {
                const candidateMatch = error.match(/^Candidate\s*#(\d+):/i);
                const candidateNum = candidateMatch ? parseInt(candidateMatch[1], 10) : null;
                const email = candidateNum !== null ? errorEmailMap.get(candidateNum) : undefined;
                const stillExists = email
                  ? bulkData.some((c) => c.email.toLowerCase() === email)
                  : false;

                return (
                  <Box key={index} className="error-message-item">
                    <Typography className="error-message-number">{index + 1}.</Typography>
                    <Typography className="error-message-text">{error}</Typography>
                    {candidateNum !== null && stillExists && (
                      <Tooltip title="Remove this candidate from table">
                        <IconButton
                          size="small"
                          className="error-message-delete-btn"
                          onClick={() => {
                            const updated = bulkData.filter(
                              (c) => c.email.toLowerCase() !== email
                            );
                            setBulkData(updated);
                            setBatchDuplicateIndices(computeBatchDuplicates(updated));
                            if (email) {
                              const newVR = new Map(validationResults);
                              newVR.delete(email);
                              setValidationResults(newVR);
                            }
                            setErrorMessages((prev) => {
                              const remaining = prev.filter((_, i) => i !== index);
                              if (remaining.length === 0) setShowErrorOverlay(false);
                              return remaining;
                            });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default UploadONCampus;
