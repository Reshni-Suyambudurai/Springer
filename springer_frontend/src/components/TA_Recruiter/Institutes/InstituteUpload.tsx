import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import BackButton from "../../Common/BackButton";
import { instituteApi } from "../../../services/hiring.api";
import { showToast } from "../../../utils/toast";
import * as XLSX from "xlsx";
import type { InstituteRequest } from "../../../types/TA_Recruiter/Hiring/institute.types";
import "../../../css/TA_Recruiter/Institutes/InstituteUpload.css";

const InstituteUpload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["instituteName *", "city *", "state *", "instituteTier *"],
      ["Anna University", "Chennai", "Tamil Nadu", "TIER_1"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Institutes");
    XLSX.writeFile(wb, "Institute_Template.xlsx");
  };

  const processFile = (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      showToast("Invalid file format. Use .xlsx, .xls or .csv", "error");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) { showToast("Please select a file first", "error"); return; }
    setUploading(true);
    try {
      const data = await selectedFile.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];

      const institutes: InstituteRequest[] = rows.map((row) => ({
        instituteName: String(row["instituteName *"] || row["instituteName"] || ""),
        city: String(row["city *"] || row["city"] || ""),
        state: String(row["state *"] || row["state"] || ""),
        instituteTier: String(row["instituteTier *"] || row["instituteTier"] || "TIER_1") as InstituteRequest["instituteTier"],
        isActive: true,
      }));

      await instituteApi.bulkCreateInstitutes(institutes);
      showToast(`Successfully uploaded ${institutes.length} institutes`, "success");
      navigate("/ta-recruiter/institutes");
    } catch (error) {
      console.error(error);
      showToast("Failed to upload institutes", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box className="inst-upload-page">
      {/* Header */}
      <Box className="inst-upload-header">
        <BackButton onClick={() => navigate("/ta-recruiter/institutes")} variant="header" />
        <Box>
          <Typography className="inst-upload-title">Upload Institutes via Excel</Typography>
          <Typography className="inst-upload-subtitle">Upload multiple institutes at once using our Excel template</Typography>
        </Box>
      </Box>

      <Box className="inst-upload-body">
        {/* Step 1 */}
        <Box className="inst-upload-step-card">
          <Box className="inst-upload-step-header">
            <Box className="inst-upload-step-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </Box>
            <Box>
              <Typography className="inst-upload-step-title">Step 1: Download Template</Typography>
              <Typography className="inst-upload-step-desc">Download our Excel template with all required fields. Fill in the institute details according to the format.</Typography>
            </Box>
          </Box>
          <button className="inst-upload-download-btn" onClick={handleDownloadTemplate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Excel Template
          </button>

          <Box className="inst-upload-preview-box">
            <Typography className="inst-upload-preview-title">Template Preview</Typography>
            <Box className="inst-upload-preview-table">
              <table>
                <thead>
                  <tr>
                    <th>instituteName *</th>
                    <th>city *</th>
                    <th>state *</th>
                    <th>instituteTier *</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Anna University</td>
                    <td>Chennai</td>
                    <td>Tamil Nadu</td>
                    <td>TIER_1</td>
                  </tr>
                </tbody>
              </table>
            </Box>
            <Box className="inst-upload-hints">
              <span className="inst-upload-hint-dot" />
              <Typography className="inst-upload-hint">All fields marked with * are mandatory</Typography>
            </Box>
            <Box className="inst-upload-hints">
              <span className="inst-upload-hint-dot" />
              <Typography className="inst-upload-hint">Ensure proper data format for each column</Typography>
            </Box>
            <Box className="inst-upload-hints">
              <span className="inst-upload-hint-dot" />
              <Typography className="inst-upload-hint">Maximum 500 institutes per upload</Typography>
            </Box>
          </Box>
        </Box>

        {/* Step 2 */}
        <Box className="inst-upload-step2-title">
          <Typography className="inst-upload-step-title">Step 2: Upload Filled Template</Typography>
        </Box>

        <Box
          className={`inst-upload-dropzone${dragOver ? " inst-upload-dropzone--active" : ""}${selectedFile ? " inst-upload-dropzone--selected" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Box className="inst-upload-drop-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </Box>
          {selectedFile ? (
            <Typography className="inst-upload-filename">{selectedFile.name}</Typography>
          ) : (
            <Typography className="inst-upload-drop-text">Drag and drop your Excel file here</Typography>
          )}
          <Typography className="inst-upload-or">or</Typography>
          <button className="inst-upload-browse-btn" onClick={() => fileInputRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Browse Files
          </button>
          <Typography className="inst-upload-formats">Supported formats: .xlsx, .xls, .csv (Max size: 10MB)</Typography>
          <input ref={fileInputRef} type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
        </Box>

        {/* Important Notes */}
        <Box className="inst-upload-notes">
          <Box className="inst-upload-notes-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <Typography className="inst-upload-notes-title">Important Notes:</Typography>
          </Box>
          {[
            "Ensure all mandatory fields are filled correctly",
            "Use the exact column names from the template",
            "Department names should be separated by commas if multiple",
            "Phone numbers should include country code",
            "Email addresses must be valid and unique",
          ].map((note, i) => (
            <Box key={i} className="inst-upload-hints">
              <span className="inst-upload-hint-dot inst-upload-hint-dot--orange" />
              <Typography className="inst-upload-hint inst-upload-hint--orange">{note}</Typography>
            </Box>
          ))}
        </Box>

        {/* Actions */}
        <Box className="inst-upload-actions">
          <button className="inst-upload-cancel-btn" onClick={() => navigate("/ta-recruiter/institutes")}>Cancel</button>
          <button className="inst-upload-process-btn" onClick={handleUpload} disabled={uploading || !selectedFile}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Processing..." : "Upload & Process"}
          </button>
        </Box>
      </Box>
    </Box>
  );
};

export default InstituteUpload;
