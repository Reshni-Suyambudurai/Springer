import React, { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Box,
  Card,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BackButton from "../../../Common/BackButton";
import ErrorOverlay from "../../../Common/ErrorOverlay";
import { showToast } from "../../../../utils/toast";
import { candidateEvaluationApi } from "../../../../services/driveschedule.api";
import { roundTemplateApi } from "../../../../services/drive.api";
import { tokenstore } from "../../../../auth/tokenstore";
import "../../../../css/TA_Recruiter/DriveProcess/AddScores/AddRound1.css";

const STATIC_HEADERS = ["Registration_code", "Candidate_name", "Candidate_email"];
const EDITABLE_HEADERS = ["Candidate_name", "Candidate_email"];

const AddRound1: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const [dynamicHeaders, setDynamicHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [dragging, setDragging] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [errorEmailMap, setErrorEmailMap] = useState<Map<number, string>>(new Map());
  const [dupRowIds, setDupRowIds] = useState<Set<number>>(new Set()); // Upload duplicate row IDs (reg code duplicates)
  const [dupEmailRowIds, setDupEmailRowIds] = useState<Set<number>>(new Set()); // Upload duplicate row IDs (email duplicates)
  const [dbDupRegCodes, setDbDupRegCodes] = useState<Set<string>>(new Set()); // DB duplicates (red)
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // All headers = static + dynamic (score columns from Excel)
  const allHeaders = [...STATIC_HEADERS, ...dynamicHeaders];

  const computeDuplicates = (data: Record<string, unknown>[]) => {
    const regCodeMap = new Map<string, number[]>();
    const emailMap = new Map<string, number[]>();
    data.forEach((row) => {
      const rc = String(row["Registration_code"] ?? "").trim().toLowerCase();
      const em = String(row["Candidate_email"] ?? "").trim().toLowerCase();
      const rowId = Number(row["_rowId"]);
      if (rc) {
        if (!regCodeMap.has(rc)) regCodeMap.set(rc, []);
        regCodeMap.get(rc)!.push(rowId);
      }
      if (em) {
        if (!emailMap.has(em)) emailMap.set(em, []);
        emailMap.get(em)!.push(rowId);
      }
    });
    const dupRC = new Set<number>();
    const dupEM = new Set<number>();
    // Only mark 2nd, 3rd, etc. occurrences as duplicates (skip first with slice(1))
    regCodeMap.forEach((rowIds) => { if (rowIds.length > 1) rowIds.slice(1).forEach(id => dupRC.add(id)); });
    emailMap.forEach((rowIds) => { if (rowIds.length > 1) rowIds.slice(1).forEach(id => dupEM.add(id)); });
    return { dupRC, dupEM };
  };

  const checkDatabaseDuplicates = async (data: Record<string, unknown>[]) => {
    if (!driveId) return;
    
    setCheckingDuplicates(true);
    try {
      const candidates = data.map((row) => ({
        applicationId: 0, // Will be resolved by backend via registrationCode
        registrationCode: String(row["Registration_code"] ?? ""),
      })).filter(c => c.registrationCode);

      if (candidates.length === 0) {
        setDbDupRegCodes(new Set());
        return;
      }

      const response = await candidateEvaluationApi.checkExistingEvaluations({
        driveId: Number(driveId),
        roundConfigId: 1,
        candidates,
      });

      if (response.success && response.data) {
        const existingRegCodes = new Set(
          response.data.existingEvaluations.map(e => e.registrationCode.toLowerCase())
        );
        
        const dbDups = new Set<string>();
        data.forEach((row) => {
          const regCode = String(row["Registration_code"] ?? "").trim().toLowerCase();
          if (regCode && existingRegCodes.has(regCode)) {
            dbDups.add(regCode);
          }
        });
        
        setDbDupRegCodes(dbDups);
        
        if (dbDups.size > 0) {
          showToast(
            `${dbDups.size} record(s) already exist in database`,
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Failed to check existing evaluations:", error);
      showToast("Failed to check for existing evaluations", "error");
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      showToast("Please upload a valid .xlsx or .xls file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const sheetHeaders = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] || [];
        const headerStrings = sheetHeaders.map(String);

        // Dynamic headers = everything from Excel that isn't one of the 3 static columns
        const staticLower = new Set(STATIC_HEADERS.map((h) => h.toLowerCase()));
        const dynamic = headerStrings.filter((h) => !staticLower.has(h.toLowerCase()));

        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        if (jsonData.length === 0) {
          showToast("The uploaded file is empty", "error");
          return;
        }

        // Add unique row IDs to track duplicates properly
        const dataWithIds = jsonData.map((row, idx) => ({ ...row, _rowId: idx })) as Record<string, unknown>[];

        setDynamicHeaders(dynamic);
        setRows(dataWithIds);
        setFileName(file.name);

        // Build unique name options for filter
        const names = [...new Set(dataWithIds.map((r) => String(r["Candidate_name"] || "")).filter(Boolean))];
        setNameOptions(names);

        const { dupRC, dupEM } = computeDuplicates(dataWithIds);
        setDupRowIds(dupRC);
        setDupEmailRowIds(dupEM);

        // Check for DB duplicates
        checkDatabaseDuplicates(dataWithIds);

        showToast(`${dataWithIds.length} rows loaded from ${file.name}`, "success");
      } catch {
        showToast("Failed to read file. Please upload a valid .xlsx/.xls file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveRow = (index: number) => {
    const regCode = String(rows[index]?.["Registration_code"] ?? "");
    if (regCode && regCode in errorMap) {
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[regCode];
        return next;
      });
    }
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
    const { dupRC, dupEM } = computeDuplicates(updatedRows);
    setDupRowIds(dupRC);
    setDupEmailRowIds(dupEM);
    if (editingIndex === index) setEditingIndex(null);
    showToast("Row removed", "success");
  };

  const handleStartEdit = (index: number) => {
    const row = rows[index];
    setEditValues({
      Candidate_name: String(row["Candidate_name"] ?? ""),
      Candidate_email: String(row["Candidate_email"] ?? ""),
    });
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updatedRows = rows.map((row, i) => (i === editingIndex ? { ...row, ...editValues } : row));
    setRows(updatedRows);
    const { dupRC: eRC, dupEM: eEM } = computeDuplicates(updatedRows);
    setDupRowIds(eRC);
    setDupEmailRowIds(eEM);
    // Clear error for this row
    const regCode = String(rows[editingIndex]["Registration_code"] ?? "");
    if (regCode && regCode in errorMap) {
      setErrorMap((prev) => {
        const next = { ...prev };
        delete next[regCode];
        return next;
      });
    }
    // Update name options with new data
    const updatedNames = [...new Set(rows.map((r, i) =>
      String(i === editingIndex ? editValues["Candidate_name"] : r["Candidate_name"] || "")
    ).filter(Boolean))];
    setNameOptions(updatedNames);
    setEditingIndex(null);
    setEditValues({});
    showToast("Row updated", "success");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValues({});
  };

  const filteredRows = rows
    .map((row, originalIndex) => ({ row, originalIndex }))
    .filter(({ row }) => {
      if (!searchName) return true;
      const name = String(row["Candidate_name"] ?? "").toLowerCase();
      return name.includes(searchName.toLowerCase());
    });

  const handleClear = () => {
    setDynamicHeaders([]);
    setRows([]);
    setFileName("");
    setSearchName("");
    setEditingIndex(null);
    setEditValues({});
    setNameOptions([]);
    setErrorMap({});
    setDupRowIds(new Set());
    setDupEmailRowIds(new Set());
    setDbDupRegCodes(new Set());
  };

  const handleRemoveDuplicates = () => {
    const allDupRowIds = new Set([...dupRowIds, ...dupEmailRowIds]);
    const filtered = rows.filter((row) => {
      const rowId = Number(row["_rowId"]);
      const rc = String(row["Registration_code"] ?? "").trim().toLowerCase();
      // Remove if: row ID is in duplicate list OR registration code exists in DB
      return !allDupRowIds.has(rowId) && !dbDupRegCodes.has(rc);
    });
    const count = rows.length - filtered.length;
    if (count === 0) return;
    setRows(filtered);
    const { dupRC, dupEM } = computeDuplicates(filtered);
    setDupRowIds(dupRC);
    setDupEmailRowIds(dupEM);
    setDbDupRegCodes(new Set()); // Clear DB duplicates as they were removed
    showToast(`Removed ${count} duplicate row(s)`, "success");
  };

  const handleDownloadFormat = async () => {
    try {
      const res = await roundTemplateApi.getRoundTemplateById(1);
      const sections = res.data.sections;
      const sectionHeaders: string[] = Array.isArray(sections)
        ? (sections as { sectionName: string }[]).map((s) => s.sectionName)
        : [];
      const headers = [...STATIC_HEADERS, ...sectionHeaders];
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Aptitude Scores");
      XLSX.writeFile(wb, "aptitude_score_template.xlsx");
    } catch {
      showToast("Failed to fetch round template", "error");
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (rows.length === 0) {
      showToast("No data to upload", "error");
      return;
    }

    const user = tokenstore.getUser();
    if (!user) {
      showToast("User not authenticated", "error");
      return;
    }

    const evaluations = rows.map((row) => {
      const sections: Record<string, number> = {};
      dynamicHeaders.forEach((header) => {
        const val = Number(row[header]);
        sections[header] = isNaN(val) ? 0 : val;
      });

      return {
        registrationCode: String(row["Registration_code"] ?? ""),
        candidateName: String(row["Candidate_name"] ?? ""),
        candidateEmail: String(row["Candidate_email"] ?? ""),
        sections,
      };
    });

    const payload = {
      roundConfigId: 1,
      roundNo: 1,
      updatedBy: user.userId,
      evaluations,
    };

    try {
      setUploading(true);
      setErrorMap({});
      const response = await candidateEvaluationApi.bulkCreateEvaluations(payload);
      const result = response.data;
      if (result.failureCount > 0 && result.errorMessages) {
        const mapped: Record<string, string> = {};
        const errors: string[] = [];
        const emailMap = new Map<number, string>();
        let errorIdx = 0;
        for (const [key, msg] of Object.entries(result.errorMessages)) {
          const idx = Number(key);
          const regCode = String(rows[idx]?.["Registration_code"] ?? "");
          const email = String(rows[idx]?.["Candidate_email"] ?? "").toLowerCase();
          if (regCode) mapped[regCode] = msg;
          if (email) emailMap.set(errorIdx, email);
          errors.push(msg);
          errorIdx++;
        }
        setErrorMap(mapped);
        setUploadErrors(errors);
        setErrorEmailMap(emailMap);
      } else {
        setUploadErrors([]);
        setErrorEmailMap(new Map());
      }
      showToast(
        `Upload complete — ${result.successCount} succeeded, ${result.failureCount} failed`,
        result.failureCount > 0 ? "error" : "success"
      );
      if (result.failureCount === 0) {
        setRows([]);
        setDynamicHeaders([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      showToast("Failed to upload evaluations", "error");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box className="ar1-container">
      <Card className="ar1-header">
        <Box className="ar1-header-left">
          <BackButton variant="header" />
          <Typography variant="h6" className="ar1-title">
            Upload Aptitude Score
          </Typography>
        </Box>

        <Box className="ar1-header-actions">
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownloadFormat}
            className="ar1-btn ar1-btn-download"
          >
            Download Template
          </Button>
        </Box>
      </Card>

      {/* Drag and Drop zone — shown when no data */}
      {rows.length === 0 && (
        <Box
          className={`ar1-dropzone ${dragging ? "ar1-dropzone-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
          />
          <CloudUploadIcon className="ar1-dropzone-icon" />
          <Typography variant="h6" className="ar1-dropzone-title">
            Drag & drop your Excel file here
          </Typography>
          <Typography variant="body2" className="ar1-dropzone-subtitle">
            or click to browse — supports .xlsx, .xls
          </Typography>
        </Box>
      )}

      {/* File info + search */}
      {fileName && (
        <Box className="ar1-file-info">
          <Typography className="ar1-file-name">
            File: {fileName} — {rows.length} row(s)
          </Typography>
          <Box className="ar1-file-info-right">
            <Box className="ar1-search-wrap">
              <SearchIcon className="ar1-search-icon" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="ar1-search-input"
                list="ar1-name-options"
              />
              <datalist id="ar1-name-options">
                {nameOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Box>
            <Button size="small" onClick={handleClear} className="ar1-btn-clear">
              Clear
            </Button>
            {(dupRowIds.size > 0 || dupEmailRowIds.size > 0 || dbDupRegCodes.size > 0) && (() => {
              // Calculate actual rows that would be removed
              const allDupRowIds = new Set([...dupRowIds, ...dupEmailRowIds]);
              const wouldRemove = rows.filter((row) => {
                const rowId = Number(row["_rowId"]);
                const rc = String(row["Registration_code"] ?? "").trim().toLowerCase();
                return allDupRowIds.has(rowId) || dbDupRegCodes.has(rc);
              }).length;
              return (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRemoveDuplicates}
                  className="ar1-btn-remove-dup"
                  disabled={checkingDuplicates}
                >
                  Remove Duplicates ({wouldRemove})
                </Button>
              );
            })()}
            <Button
              size="small"
              onClick={handleUpload}
              disabled={uploading || rows.length === 0 || Object.keys(errorMap).length > 0 || checkingDuplicates}
              className="ar1-btn ar1-btn-upload"
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? "Uploading..." : checkingDuplicates ? "Checking..." : "Upload"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Data Table */}
      {rows.length > 0 && (
        <TableContainer component={Paper} className="ar1-table-container">
          <Table className="ar1-table">
            <TableHead>
              <TableRow className="ar1-table-head-row">
                <TableCell className="ar1-th">#</TableCell>
                {allHeaders.map((header) => (
                  <TableCell key={header} className="ar1-th">{header}</TableCell>
                ))}
                <TableCell className="ar1-th">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map(({ row, originalIndex }, displayIndex) => {
                const regCode = String(row["Registration_code"] ?? "");
                const regCodeLower = regCode.trim().toLowerCase();
                const rowId = Number(row["_rowId"]);
                const hasError = regCode !== "" && regCode in errorMap;
                const isDbDup = dbDupRegCodes.has(regCodeLower); // DB duplicate (red - priority)
                const isDupRegCode = dupRowIds.has(rowId); // Upload duplicate reg code (blue) - 2nd+ occurrence only
                const isDupEmail = dupEmailRowIds.has(rowId); // Upload duplicate email (blue) - 2nd+ occurrence only
                
                // Priority: DB dup (red) > Upload error > Upload dup email > Upload dup reg code
                const rowDupClass = isDbDup 
                  ? "ar1-row-db-dup" 
                  : hasError 
                    ? "ar1-row-error" 
                    : isDupEmail 
                      ? "ar1-row-dup-email" 
                      : isDupRegCode 
                        ? "ar1-row-dup-regcode" 
                        : "";
                
                return (
                <TableRow key={originalIndex} className={`ar1-table-row ${rowDupClass}`}>
                  <TableCell className="ar1-td">{displayIndex + 1}</TableCell>
                  {allHeaders.map((header) => {
                    const isStaticError = hasError && STATIC_HEADERS.includes(header);
                    const isDbDupCell = isDbDup && header === "Registration_code";
                    const isDupRC = isDupRegCode && header === "Registration_code";
                    const isDupEM = isDupEmail && header === "Candidate_email";
                    
                    const cellClass = `ar1-td${
                      isDbDupCell ? " ar1-cell-db-dup" : 
                      isStaticError ? " ar1-cell-error" : 
                      isDupRC ? " ar1-cell-dup-regcode" : 
                      isDupEM ? " ar1-cell-dup-email" : 
                      ""
                    }`;
                    
                    const cellContent =
                      editingIndex === originalIndex && EDITABLE_HEADERS.includes(header) ? (
                        <TextField
                          size="small"
                          value={editValues[header] ?? ""}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, [header]: e.target.value }))
                          }
                          className="ar1-edit-input"
                        />
                      ) : (
                        String(row[header] ?? "")
                      );

                    // Candidate_name: show a combined tooltip for all applicable errors/duplicates
                    if (header === "Candidate_name" && editingIndex !== originalIndex) {
                      const tooltipLines: string[] = [];
                      if (isDbDup) tooltipLines.push("Already exists in database");
                      if (hasError) tooltipLines.push(errorMap[regCode]);
                      const duplicateParts: string[] = [];
                      if (isDupRegCode) duplicateParts.push("Registration code");
                      if (isDupEmail) duplicateParts.push("Email");
                      if (duplicateParts.length > 0) {
                        tooltipLines.push(`Duplicate: ${duplicateParts.join(" and ")} repeated in this upload`);
                      }
                      
                      if (tooltipLines.length > 0) {
                        return (
                          <TableCell key={header} className={cellClass}>
                            <Tooltip
                              title={
                                <span style={{ whiteSpace: "pre-line" }}>
                                  {tooltipLines.join("\n")}
                                </span>
                              }
                              arrow
                              placement="top"
                              classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                            >
                              <span className={isDbDup ? "ar1-db-dup-name" : hasError ? "ar1-error-name" : "ar1-dup-name"}>
                                {String(row[header] ?? "")}
                              </span>
                            </Tooltip>
                          </TableCell>
                        );
                      }
                    }

                    return (
                      <TableCell key={header} className={cellClass}>
                        {cellContent}
                      </TableCell>
                    );
                  })}
                  <TableCell className="ar1-td">
                    <Box className="ar1-actions-cell">
                      {editingIndex === originalIndex ? (
                        <>
                          <IconButton size="small" onClick={handleSaveEdit} className="ar1-save-btn">
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEdit} className="ar1-cancel-btn">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton size="small" onClick={() => handleStartEdit(originalIndex)} className="ar1-edit-btn">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRemoveRow(originalIndex)} className="ar1-delete-btn">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {uploadErrors.length > 0 && (
        <ErrorOverlay
          errorMessages={uploadErrors}
          errorEmailMap={errorEmailMap}
          onClose={() => setUploadErrors([])}
          onRemoveByEmail={(email, errorIndex) => {
            setRows((prev) => prev.filter((r) => String(r["Candidate_email"] ?? "").toLowerCase() !== email));
            setUploadErrors((prev) => {
              const remaining = prev.filter((_, i) => i !== errorIndex);
              if (remaining.length === 0) setErrorEmailMap(new Map());
              return remaining;
            });
            setErrorEmailMap((prev) => {
              const updated = new Map<number, string>();
              let newIdx = 0;
              for (const [oldIdx, e] of prev.entries()) {
                if (oldIdx !== errorIndex) {
                  updated.set(newIdx, e);
                  newIdx++;
                }
              }
              return updated;
            });
          }}
        />
      )}
    </Box>
  );
};

export default AddRound1;
