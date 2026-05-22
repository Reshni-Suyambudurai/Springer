import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import UploadIcon from "@mui/icons-material/Upload";
import { instituteApi } from "../../../services/hiring.api";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { CandidateRequest } from "../../../types/TA_Recruiter/Drive/candidate.types";
import { showToast } from "../../../utils/toast";
import { parseExcelRow, validateFileData } from "../../../utils/candidateValidation";
import { useBulkCandidateUpload } from "../../../hooks/useBulkCandidateUpload";
import BulkCandidateTable from "../../Common/BulkCandidateTable";
import ErrorOverlay from "../../Common/ErrorOverlay";
import * as XLSX from "xlsx";

interface UploadONCampusProps {
  cycleId: number | null;
  cycleYear?: number;
  cycleName?: string;
  driveId: number | null;
  driveName?: string;
  instituteName?: string;
}

const UploadONCampus: React.FC<UploadONCampusProps> = ({
  cycleId,
  cycleYear,
  cycleName,
  driveId,
  driveName,
  instituteName,
}) => {
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<InstituteResponse | null>(null);

  const bulk = useBulkCandidateUpload({ cycleId });

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const response = await instituteApi.getAllInstitutes();
        if (response.data) {
          setInstitutes(response.data);
          if (instituteName) {
            const matchedInstitute = response.data.find(
              (institute) => institute.instituteName === instituteName
            );
            if (matchedInstitute) {
              setSelectedInstitute(matchedInstitute);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching institutes:", error);
      }
    };
    fetchInstitutes();
  }, [instituteName]);

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/files/ONCampus_candidate_template.xlsx";
    link.download = "ONCampus_candidate_template.xlsx";
    link.click();
  };

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

        const candidates: CandidateRequest[] = jsonData.map((row) =>
          parseExcelRow(row, {
            cycleId: cycleId || 0,
            driveId: driveId || undefined,
            instituteId: selectedInstitute.instituteId,
          })
        );

        const errors = validateFileData(candidates);

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

  return (
    <Box className="oncampus-wrapper">
      {/* Drive/Institute meta + controls row */}
      <Box className="oncampus-top-row">
        <Box className="oncampus-meta-row">
         

          {driveName && <Typography className="oncampus-meta-chip">{driveName}</Typography>}
          <Typography className="oncampus-meta-chip">
            {selectedInstitute?.instituteName || instituteName || "Select Institute"}
          </Typography>
        </Box>

        <Box className="oncampus-controls-row">
          <Autocomplete
            className="oncampus-institute-dropdown"
            options={institutes}
            getOptionLabel={(option) => option.instituteName}
            value={selectedInstitute}
            onChange={(_, newValue) => {
              setSelectedInstitute(newValue);
              bulk.resetBulkState();
            }}
            renderInput={(params) => (
              <TextField {...params} label="Institute" placeholder="Search institute..." size="small" />
            )}
          />
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleDownloadTemplate}
            className="g-btn g-btn-outline-primary oncampus-download-btn"
          >
            Download On-Campus Template
          </Button>
        </Box>
      </Box>

      {/* Upload zone - shown only when institute is selected and no data loaded */}
      {selectedInstitute && bulk.bulkData.length === 0 && (
        <Card className="add-candidates-upload-zone oncampus-upload-zone">
          <CardContent className="upload-zone-content">
            <Box className="upload-zone-icon-shell">
              <FileUploadOutlinedIcon className="upload-zone-icon" />
            </Box>
            <Typography variant="h6" className="upload-zone-title">
              Upload Candidates
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
              className="g-btn g-btn-primary upload-zone-btn"
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

      {selectedInstitute && bulk.bulkData.length === 0 && (
        <Card className="oncampus-instructions-card">
          <CardContent>
            <Typography className="oncampus-instructions-title">Instructions:</Typography>
            <Typography className="oncampus-instructions-text">
              Download the template using the "Download On-Campus Template" button
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
        />
      )}

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

export default UploadONCampus;
