import React from "react";
import {
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
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { CandidateRequest, CandidateValidationResponse } from "../../types/TA_Recruiter/Drive/candidate.types";
import { ValidationStatus } from "../../types/TA_Recruiter/Drive/candidate.types";
import { calculateAge } from "../../utils/candidateValidation";

interface ExtraColumn {
  header: string;
  render: (cand: CandidateRequest, index: number) => React.ReactNode;
}

interface BulkCandidateTableProps {
  bulkData: CandidateRequest[];
  isValidating: boolean;
  batchDuplicateIndices: Set<number>;
  getValidationForCandidate: (email: string) => CandidateValidationResponse | undefined;
  hasDuplicates: () => boolean;
  onRemoveRow: (index: number) => void;
  onRemoveDuplicates: () => void;
  onBulkUpload: () => void;
  validationResultsSize: number;
  /** Extra columns to insert before the "Actions" column (e.g. Institute column for off-campus). */
  extraColumns?: ExtraColumn[];
}

const BulkCandidateTable: React.FC<BulkCandidateTableProps> = ({
  bulkData,
  isValidating,
  batchDuplicateIndices,
  getValidationForCandidate,
  hasDuplicates,
  onRemoveRow,
  onRemoveDuplicates,
  onBulkUpload,
  validationResultsSize,
  extraColumns = [],
}) => {
  if (bulkData.length === 0) return null;

  return (
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
                onClick={onRemoveDuplicates}
                className="t-btn-secondary"
                disabled={isValidating}
              >
                Remove Duplicates
              </Button>
            )}
            <Button
              variant="contained"
              onClick={onBulkUpload}
              className="t-btn-primary"
              disabled={hasDuplicates() || batchDuplicateIndices.size > 0 || isValidating || validationResultsSize === 0}
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
                {extraColumns.map((col) => (
                  <TableCell key={col.header} className="t-head-cell">
                    {col.header}
                  </TableCell>
                ))}
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
                          <span
                            className={
                              isDuplicate ? "danger-dot" : isBatchDup ? "batch-dup-dot" : "warning-dot"
                            }
                          ></span>
                        )}
                        <span>{index + 1}</span>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          isBatchDup
                            ? "Duplicate: Same email or aadhaar repeated in uploaded file"
                            : validation?.comment || ""
                        }
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
                    {extraColumns.map((col) => (
                      <TableCell key={col.header}>{col.render(cand, index)}</TableCell>
                    ))}
                    <TableCell>{cand.cgpa}</TableCell>
                    <TableCell>{calculateAge(cand.dateOfBirth)} yrs</TableCell>
                    <TableCell>{cand.passoutYear}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveRow(index)}
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
  );
};

export default BulkCandidateTable;
