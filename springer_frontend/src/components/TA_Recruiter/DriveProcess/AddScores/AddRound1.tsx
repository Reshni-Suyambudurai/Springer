import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Box,
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
import AbcIcon from "@mui/icons-material/Abc";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import NumbersIcon from "@mui/icons-material/Numbers";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ErrorOverlay from "../../../Common/ErrorOverlay";
import { useNavbarAction } from "../../../../contexts/NavbarActionContext";
import { showToast } from "../../../../utils/toast";
import { candidateEvaluationApi } from "../../../../services/driveschedule.api";
import { roundTemplateApi } from "../../../../services/drive.api";
import { tokenstore } from "../../../../auth/tokenstore";
import "../../../../css/TA_Recruiter/DriveProcess/AddScores/AddRound1.css";

const IDENTITY_HEADERS = ["Registration_code", "Candidate_name", "Candidate_email"];
const STATUS_HEADER = "Status";
const STATIC_HEADERS = [...IDENTITY_HEADERS, STATUS_HEADER];
const EDITABLE_HEADERS = ["Candidate_name", "Candidate_email"];

interface AddRound1Props {
  roundNo?: 1 | 2 | 3;
}

interface RoundSection {
  sectionName: string;
  outOf: number | null;
}

const ROUND_NAMES = {
  1: "Aptitude",
  2: "Communication",
  3: "Technical",
} as const;

const formatSectionHeader = ({ sectionName, outOf }: RoundSection) =>
  outOf === null ? sectionName : `${sectionName} (Out of ${outOf})`;

const getRoundSections = (sections: unknown): RoundSection[] => {
  if (Array.isArray(sections)) {
    return sections
      .map((section) => {
        if (typeof section === "string") {
          return { sectionName: section.trim(), outOf: null };
        }
        if (section && typeof section === "object") {
          const item = section as { sectionName?: unknown; name?: unknown; outOf?: unknown };
          const parsedOutOf = Number(item.outOf);
          return {
            sectionName: String(item.sectionName ?? item.name ?? "").trim(),
            outOf: Number.isFinite(parsedOutOf) ? parsedOutOf : null,
          };
        }
        return { sectionName: "", outOf: null };
      })
      .filter((section) => section.sectionName);
  }

  if (sections && typeof sections === "object") {
    return Object.entries(sections as Record<string, unknown>).map(([sectionName, outOf]) => {
      const parsedOutOf = Number(outOf);
      return {
        sectionName,
        outOf: Number.isFinite(parsedOutOf) ? parsedOutOf : null,
      };
    });
  }

  return [];
};

const findSectionForHeader = (header: string, sections: RoundSection[]) => {
  const normalizedHeader = header.trim().toLowerCase();
  return sections.find((section) =>
    section.sectionName.toLowerCase() === normalizedHeader
    || formatSectionHeader(section).toLowerCase() === normalizedHeader
  );
};

const AddRound1: React.FC<AddRound1Props> = ({ roundNo = 1 }) => {
  const { driveId } = useParams<{ driveId: string }>();
  const roundName = ROUND_NAMES[roundNo];
  const { setAction } = useNavbarAction();
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
  const [dupEmailRowIds, setDupEmailRowIds] = useState<Set<number>>(new Set()); // Upload duplicate row IDs (email duplicates)
  const [templateSections, setTemplateSections] = useState<RoundSection[]>([]);
  const templateHeaders = templateSections.map(formatSectionHeader);

  // All headers = static + dynamic (score columns from Excel)
  const allHeaders = [...IDENTITY_HEADERS, ...dynamicHeaders, STATUS_HEADER];

  const computeDuplicates = (data: Record<string, unknown>[]) => {
    const seenEmails = new Set<string>();
    const dupEM = new Set<number>();
    data.forEach((row) => {
      const em = String(row["Candidate_email"] ?? "").trim().toLowerCase();
      const rowId = Number(row["_rowId"]);
      if (em) {
        if (seenEmails.has(em)) {
          dupEM.add(rowId);
        } else {
          seenEmails.add(em);
        }
      }
    });
    return { dupEM };
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
        const sourceDynamicHeaders = headerStrings.filter((h) => !staticLower.has(h.toLowerCase()));
        if (templateSections.length === 0) {
          showToast("Round template sections are still loading. Please try again.", "error");
          return;
        }

        const unknownHeaders = sourceDynamicHeaders.filter(
          (header) => !findSectionForHeader(header, templateSections)
        );
        if (unknownHeaders.length > 0) {
          showToast(`Unknown score field(s): ${unknownHeaders.join(", ")}`, "error");
          return;
        }

        const dynamic = sourceDynamicHeaders.map((header) =>
          formatSectionHeader(findSectionForHeader(header, templateSections)!)
        );

        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        if (jsonData.length === 0) {
          showToast("The uploaded file is empty", "error");
          return;
        }

        // Add unique row IDs to track duplicates properly
        const dataWithIds = jsonData.map((row, idx) => {
          const normalizedRow = { ...row };
          sourceDynamicHeaders.forEach((sourceHeader, headerIndex) => {
            normalizedRow[dynamic[headerIndex]] = row[sourceHeader];
          });
          return { ...normalizedRow, _rowId: idx };
        }) as Record<string, unknown>[];

        setDynamicHeaders(dynamic);
        setRows(dataWithIds);
        setFileName(file.name);

        // Build unique name options for filter
        const names = [...new Set(dataWithIds.map((r) => String(r["Candidate_name"] || "")).filter(Boolean))];
        setNameOptions(names);

        const { dupEM } = computeDuplicates(dataWithIds);
        setDupEmailRowIds(dupEM);

        showToast(`${dataWithIds.length} rows loaded from ${file.name}`, "success");
      } catch {
        showToast("Failed to read file. Please upload a valid .xlsx/.xls file", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  }, [templateSections]);

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
    const { dupEM } = computeDuplicates(updatedRows);
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
    const { dupEM: eEM } = computeDuplicates(updatedRows);
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
    setDupEmailRowIds(new Set());
  };

  const handleRemoveDuplicates = () => {
    const filtered = rows.filter((row) => {
      const rowId = Number(row["_rowId"]);
      return !dupEmailRowIds.has(rowId);
    });
    const count = rows.length - filtered.length;
    if (count === 0) return;
    setRows(filtered);
    const { dupEM } = computeDuplicates(filtered);
    setDupEmailRowIds(dupEM);
    showToast(`Removed ${count} duplicate row(s)`, "success");
  };

  const handleRemoveErrorRowsByEmail = (email: string, errorIndex: number) => {
    const normalizedEmail = email.trim().toLowerCase();
    const removedRegistrationCodes = new Set(
      rows
        .filter((row) => String(row["Candidate_email"] ?? "").trim().toLowerCase() === normalizedEmail)
        .map((row) => String(row["Registration_code"] ?? ""))
        .filter(Boolean)
    );
    const updatedRows = rows.filter(
      (row) => String(row["Candidate_email"] ?? "").trim().toLowerCase() !== normalizedEmail
    );

    setRows(updatedRows);
    setDupEmailRowIds(computeDuplicates(updatedRows).dupEM);
    setErrorMap((prev) => Object.fromEntries(
      Object.entries(prev).filter(([registrationCode]) =>
        !removedRegistrationCodes.has(registrationCode)
      )
    ));
    setUploadErrors((prev) => prev.filter((_, index) => index !== errorIndex));
    setErrorEmailMap((prev) => {
      const updated = new Map<number, string>();
      let newIndex = 0;
      for (const [oldIndex, mappedEmail] of prev.entries()) {
        if (oldIndex !== errorIndex) {
          updated.set(newIndex, mappedEmail);
          newIndex++;
        }
      }
      return updated;
    });
  };

  const handleDownloadFormat = async () => {
    try {
      const res = await roundTemplateApi.getRoundTemplateById(roundNo);
      const sectionHeaders = getRoundSections(res.data.sections).map(formatSectionHeader);
      const headers = [...IDENTITY_HEADERS, ...sectionHeaders, STATUS_HEADER];
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${roundName} Scores`);
      XLSX.writeFile(wb, `${roundName.toLowerCase()}_score_template.xlsx`);
    } catch {
      showToast("Failed to fetch round template", "error");
    }
  };

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;

    roundTemplateApi.getRoundTemplateById(roundNo)
      .then((response) => {
        if (active) setTemplateSections(getRoundSections(response.data.sections));
      })
      .catch((error) => {
        console.error(`Failed to load ${roundName} template fields:`, error);
        if (active) setTemplateSections([]);
      });

    return () => {
      active = false;
    };
  }, [roundNo, roundName]);

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
        const section = findSectionForHeader(header, templateSections);
        sections[section?.sectionName ?? header] = isNaN(val) ? 0 : val;
      });

      return {
        registrationCode: String(row["Registration_code"] ?? ""),
        candidateName: String(row["Candidate_name"] ?? ""),
        candidateEmail: String(row["Candidate_email"] ?? ""),
        sections,
        status: String(row[STATUS_HEADER] ?? "").trim(),
      };
    });

    const payload = {
      driveId: Number(driveId),
      roundConfigId: roundNo,
      roundNo,
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

  useEffect(() => {
    setAction({
      label: "Download Template",
      onClick: handleDownloadFormat,
      icon: <DownloadIcon fontSize="small" />,
    });
    return () => {
      setAction(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box className="ar1-container">

      {/* Drag and Drop zone — shown when no data */}
      {rows.length === 0 && (
        <>
          <Box className="ar1-upload-card">
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
                Drag and drop your Excel file here
              </Typography>
              <Typography variant="body2" className="ar1-dropzone-subtitle">
                or <span className="ar1-browse-link">browse files</span>
                <span className="ar1-file-support"> - supports .xlsx, .xls</span>
              </Typography>
            </Box>
          </Box>

          <Box className="ar1-fields-reference">
            <Typography className="ar1-fields-reference-label">
              Required Excel Fields
            </Typography>
            <Typography className="ar1-fields-reference-help">
              Ensure your spreadsheet contains the following exact column headers to prevent errors during upload:
            </Typography>
            <Box className="ar1-field-chips">
              {[...IDENTITY_HEADERS, ...templateHeaders, STATUS_HEADER].map((header) => {
                const isEmail = header === "Candidate_email";
                const isScore = templateHeaders.includes(header);
                return (
                  <Box className="ar1-field-chip" key={header}>
                    {isEmail ? (
                      <EmailOutlinedIcon className="ar1-field-chip-icon" />
                    ) : isScore ? (
                      <NumbersIcon className="ar1-field-chip-icon" />
                    ) : header !== STATUS_HEADER ? (
                      <AbcIcon className="ar1-field-chip-icon ar1-field-chip-icon-text" />
                    ) : null}
                    <span>{header}</span>
                  </Box>
                );
              })}
            </Box>
            <Box className="ar1-status-reference">
              <InfoOutlinedIcon className="ar1-status-reference-icon" />
              <Typography className="ar1-status-reference-text">
                <strong>Status Rules:</strong>{" "}
                {roundNo === 3
                  ? "Blank or PENDING records PENDING; PASS or SELECTED records PASS and marks the application SELECTED; FAIL records FAIL and marks the application FAILED; ABSENT or DROPPED records ABSENT and marks the application DROPPED."
                  : "Blank or PENDING records PENDING; PASS or SELECTED records PASS; FAIL records FAIL and marks the application FAILED; ABSENT or DROPPED records ABSENT and marks the application DROPPED."}
                <br />
                <strong>Score Rules:</strong>{" "}
                Enter a whole number from 0 through the category&apos;s displayed Out of value.
              </Typography>
            </Box>
          </Box>
        </>
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
            {dupEmailRowIds.size > 0 && (() => {
              // Calculate actual rows that would be removed
              const wouldRemove = rows.filter((row) => {
                const rowId = Number(row["_rowId"]);
                return dupEmailRowIds.has(rowId);
              }).length;
              return (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRemoveDuplicates}
                  className="ar1-btn-remove-dup"
                >
                  Remove Duplicates ({wouldRemove})
                </Button>
              );
            })()}
            <Button
              size="small"
              onClick={handleUpload}
              disabled={uploading || rows.length === 0 || Object.keys(errorMap).length > 0 || dupEmailRowIds.size > 0}
              className="ar1-btn ar1-btn-upload"
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? "Uploading..." : "Upload"}
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
                const rowId = Number(row["_rowId"]);
                const hasError = regCode !== "" && regCode in errorMap;
                const isDupEmail = dupEmailRowIds.has(rowId); // Upload duplicate email (blue) - 2nd+ occurrence only
                
                const rowDupClass = hasError 
                    ? "ar1-row-error" 
                    : isDupEmail 
                      ? "ar1-row-dup-email" 
                      : "";
                
                return (
                <TableRow key={originalIndex} className={`ar1-table-row ${rowDupClass}`}>
                  <TableCell className="ar1-td">{displayIndex + 1}</TableCell>
                  {allHeaders.map((header) => {
                    const isStaticError = hasError && STATIC_HEADERS.includes(header);
                    const isDupEM = isDupEmail && header === "Candidate_email";
                    
                    const cellClass = `ar1-td${
                      isStaticError ? " ar1-cell-error" : 
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
                      if (hasError) tooltipLines.push(errorMap[regCode]);
                      if (isDupEmail) tooltipLines.push("Duplicate: Email repeated in this upload");
                      
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
                              <span className={hasError ? "ar1-error-name" : "ar1-dup-name"}>
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
          onRemoveByEmail={handleRemoveErrorRowsByEmail}
        />
      )}
    </Box>
  );
};

export default AddRound1;
