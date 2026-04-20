import React, { useState, useMemo, useCallback } from "react";
import type { RoundEvaluationResponse } from "../../../../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";
import type { CandidateEvaluationResponse } from "../../../../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";
import {
  Box,
  Card,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EmailIcon from "@mui/icons-material/Email";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { candidateEvaluationApi } from "../../../../services/driveschedule.api";
import { tokenstore } from "../../../../auth/tokenstore";
import { showToast } from "../../../../utils/toast";
import "../../../../css/TA_Recruiter/DriveProcess/Scores/Round1.css";

export interface PanelCandidate {
  applicationId: number;
  candidateName: string;
  score: number;
}

interface Round1Props {
  data: RoundEvaluationResponse;
  onStatusUpdated?: () => void;
  onAllocatePanel?: (candidates: PanelCandidate[]) => void;
}

type SortDirection = "asc" | "desc";
const STATUS_OPTIONS = ["PASS", "FAIL", "ABSENT", "HOLD", "SKIP"] as const;

const Round1: React.FC<Round1Props> = ({ data, onStatusUpdated, onAllocatePanel }) => {
  const { roundTemplate, evaluations } = data;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedAvgColumns, setSelectedAvgColumns] = useState<string[]>([]);
  const [minAvgInput, setMinAvgInput] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterName, setFilterName] = useState("");
  const [showSkipReason, setShowSkipReason] = useState(false);
  const [skipReason, setSkipReason] = useState("");


  // Extract section names from the roundTemplate sections array
  const sectionNames: string[] = useMemo(() =>
    Array.isArray(roundTemplate.sections)
      ? (roundTemplate.sections as { sectionName: string; outOf: number }[]).map(
          (s) => s.sectionName
        )
      : [],
    [roundTemplate.sections]
  );

  const showAverage = selectedAvgColumns.length >= 2;

  // Sortable columns: Total Score + each section + Average (when active)
  const sortableColumns = useMemo(() => {
    const cols = ["Total Score", ...sectionNames];
    if (showAverage) cols.push("Average");
    return cols;
  }, [sectionNames, showAverage]);

  const handleToggleAvgColumn = useCallback((name: string) => {
    setSelectedAvgColumns((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedAvgColumns((prev) =>
      prev.length === sectionNames.length ? [] : [...sectionNames]
    );
  }, [sectionNames]);

  const handleClearFilters = useCallback(() => {
    setSelectedAvgColumns([]);
    setMinAvgInput("");
    setFilterStatus("");
    setFilterName("");
  }, []);

  const getAverage = useCallback((evalItem: CandidateEvaluationResponse): number => {
    if (selectedAvgColumns.length === 0) return 0;
    const sectionScore = evalItem.sectionScore as Record<string, number> | null;
    if (!sectionScore) return 0;
    const sum = selectedAvgColumns.reduce((acc, col) => acc + (sectionScore[col] ?? 0), 0);
    return sum / selectedAvgColumns.length;
  }, [selectedAvgColumns]);

  const handleRowDoubleClick = useCallback((applicationId: number) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedRows(new Set([applicationId]));
    } else {
      // Already in selection mode — toggle like single click
      setSelectedRows((prev) => {
        const next = new Set(prev);
        if (next.has(applicationId)) next.delete(applicationId);
        else next.add(applicationId);
        if (next.size === 0) setSelectionMode(false);
        return next;
      });
    }
  }, [selectionMode]);

  const handleRowClick = useCallback((applicationId: number) => {
    if (!selectionMode) return;
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(applicationId)) next.delete(applicationId);
      else next.add(applicationId);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  }, [selectionMode]);

  const handleClearSelection = useCallback(() => {
    setSelectedRows(new Set());
    setSelectionMode(false);
  }, []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Second click on same column: clear sort
      setSortColumn(null);
      setSortDirection("desc");
    } else {
      // First click on a column: sort descending
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedEvaluations = useMemo(() => {
    if (!sortColumn) return evaluations;

    const getValue = (evalItem: CandidateEvaluationResponse, column: string): number => {
      if (column === "Total Score") return evalItem.score ?? 0;
      if (column === "Average") {
        if (selectedAvgColumns.length === 0) return 0;
        const ss = evalItem.sectionScore as Record<string, number> | null;
        if (!ss) return 0;
        const sum = selectedAvgColumns.reduce((acc, col) => acc + (ss[col] ?? 0), 0);
        return sum / selectedAvgColumns.length;
      }
      const ss = evalItem.sectionScore as Record<string, number> | null;
      return ss?.[column] ?? 0;
    };

    return [...evaluations].sort((a, b) => {
      const aVal = getValue(a, sortColumn);
      const bVal = getValue(b, sortColumn);
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [evaluations, sortColumn, sortDirection, selectedAvgColumns]);

  const displayedEvaluations = useMemo(() => {
    let result = sortedEvaluations;
    if (filterName) {
      const search = filterName.toLowerCase();
      result = result.filter((e) => e.candidateName.toLowerCase().includes(search));
    }
    if (filterStatus) {
      result = result.filter((e) => e.evaluationStatus === filterStatus);
    }
    if (showAverage && minAvgInput) {
      const threshold = parseFloat(minAvgInput);
      if (!isNaN(threshold)) {
        result = result.filter((e) => getAverage(e) >= threshold);
      }
    }
    return result;
  }, [sortedEvaluations, filterName, filterStatus, showAverage, minAvgInput, getAverage]);

  const handleBulkUpdate = useCallback(async (reason?: string) => {
    if (!bulkStatus) return;
    // If SKIP, require reason via overlay
    if (bulkStatus === "SKIP" && !reason) {
      setShowSkipReason(true);
      return;
    }
    const targetIds = selectedRows.size > 0
      ? [...selectedRows]
      : displayedEvaluations.map((e) => e.applicationId);
    if (targetIds.length === 0) return;

    const user = tokenstore.getUser();
    if (!user) {
      showToast("User not found. Please log in again.", "error");
      return;
    }

    setUpdating(true);
    try {
      await candidateEvaluationApi.bulkUpdateEvaluationStatus({
        status: bulkStatus,
        applicationIds: targetIds,
        roundConfigId: roundTemplate.roundConfigId,
        updatedBy: user.userId,
        reason: bulkStatus === "SKIP" ? reason : undefined,
      });
      showToast("Updated successfully");
      setSelectedRows(new Set());
      setSelectionMode(false);
      setBulkStatus("");
      onStatusUpdated?.();
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || "Failed to update statuses", "error");
    } finally {
      setUpdating(false);
    }
  }, [bulkStatus, selectedRows, displayedEvaluations, onStatusUpdated]);

  

  return (
    <Box className="r1-container">
      <Box className="r1-main-layout">
        {/* Filter Sidebar */}
        {sidebarOpen && (
          <Box className="r1-sidebar">
            <Box className="r1-sidebar-header">
              <Typography variant="h6" className="r1-sidebar-title">
                Filters
              </Typography>
              <IconButton
                onClick={() => setSidebarOpen(false)}
                className="r1-sidebar-close-btn"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Box className="r1-sidebar-content">
              <Typography className="r1-sidebar-section-title">
                Average Columns
              </Typography>
              <Typography className="r1-sidebar-section-hint">
                Select 2+ sections to show an Average column
              </Typography>
              <Box className="r1-sidebar-checkboxes">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedAvgColumns.length === sectionNames.length}
                        indeterminate={selectedAvgColumns.length > 0 && selectedAvgColumns.length < sectionNames.length}
                        onChange={handleSelectAll}
                        size="small"
                        className="r1-sidebar-checkbox"
                      />
                    }
                    label="Select All"
                    className="r1-sidebar-checkbox-label r1-sidebar-select-all"
                  />
                  {sectionNames.map((name) => (
                    <FormControlLabel
                      key={name}
                      control={
                        <Checkbox
                          checked={selectedAvgColumns.includes(name)}
                          onChange={() => handleToggleAvgColumn(name)}
                          size="small"
                          className="r1-sidebar-checkbox"
                        />
                      }
                      label={name}
                      className="r1-sidebar-checkbox-label"
                    />
                  ))}
                </FormGroup>
              </Box>
              {showAverage && (
                <Box className="r1-sidebar-avg-filter">
                  <Typography className="r1-sidebar-section-title">
                    Avg above
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    placeholder="Min average..."
                    value={minAvgInput}
                    onChange={(e) => setMinAvgInput(e.target.value)}
                    className="r1-sidebar-avg-input"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Box>
              )}
            </Box>
            <Box className="r1-sidebar-footer">
              <Typography className="r1-sidebar-results-count">
                {displayedEvaluations.length} of {evaluations.length} shown
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearFilters}
                className="r1-sidebar-clear-btn"
                disabled={selectedAvgColumns.length === 0 && !minAvgInput && !filterStatus && !filterName}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}

        {/* Main Content */}
        <Box className={`r1-content ${sidebarOpen ? "r1-sidebar-open" : ""}`}>
          {/* Header bar with hamburger + round info */}
          <Card className="r1-header">
            <Box className="r1-header-left">
              <IconButton
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="r1-hamburger-btn"
                size="small"
              >
                <MenuIcon />
              </IconButton>
              <TextField
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Search name"
                size="small"
                className="r1-filter-name-input"
              />
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
                size="small"
                className="r1-filter-status-select"
              >
                <MenuItem value="">All Status</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
              <IconButton className="r1-email-btn" size="small">
                <EmailIcon />
              </IconButton>
              {onAllocatePanel && displayedEvaluations.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  className="r1-allocate-btn"
                  onClick={() => {
                    const eligible = displayedEvaluations.filter(
                      (e) => e.evaluationStatus === "PASS" || e.evaluationStatus === "HOLD" || e.evaluationStatus === "SKIP"
                    );
                    if (eligible.length === 0) return;
                    const seen = new Set<number>();
                    const candidates: PanelCandidate[] = [];
                    for (const e of eligible) {
                      if (!seen.has(e.applicationId)) {
                        seen.add(e.applicationId);
                        candidates.push({ applicationId: e.applicationId, candidateName: e.candidateName, score: e.score });
                      }
                    }
                    onAllocatePanel(candidates);
                  }}
                  disabled={displayedEvaluations.filter((e) => e.evaluationStatus === "PASS" || e.evaluationStatus === "HOLD" || e.evaluationStatus === "SKIP").length === 0}
                >
                  Allocate Panel ({new Set(displayedEvaluations.filter((e) => e.evaluationStatus === "PASS" || e.evaluationStatus === "HOLD" || e.evaluationStatus === "SKIP").map((e) => e.applicationId)).size})
                  <NavigateNextIcon className="r1-allocate-icon" />
                </Button>
              )}
            </Box>
            <Box className="r1-header-actions">
                <Select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  displayEmpty
                  size="small"
                  className="r1-status-select"
                >
                  <MenuItem value="" disabled>Set Status</MenuItem>
                  {STATUS_OPTIONS
                    .filter((s) => s !== "HOLD" && s !== "ABSENT" && !((roundTemplate.roundNo === 2 || roundTemplate.roundNo === 3) && s === "SKIP"))
                    .map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleBulkUpdate()}
                  disabled={!bulkStatus || updating}
                  className="r1-bulk-update-btn"
                >
                  {updating ? "Updating..." : selectedRows.size > 0
                    ? `Update (${selectedRows.size})`
                    : `Update All (${displayedEvaluations.length})`}
                </Button>
                {selectedRows.size > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleClearSelection}
                    className="r1-clear-selection-btn"
                  >
                    Clear Selection
                  </Button>
                )}
              </Box>

            <Box className="r1-summary-group">
              <Box className="r1-summary-item">
                <Typography className="r1-summary-label">Round</Typography>
                <Typography className="r1-summary-value">{roundTemplate.roundName}</Typography>
              </Box>
              <Box className="r1-summary-item">
                <Typography className="r1-summary-label">Out Of</Typography>
                <Typography className="r1-summary-value">{roundTemplate.outoffScore}</Typography>
              </Box>
              <Box className="r1-summary-item">
                <Typography className="r1-summary-label">Min Score</Typography>
                <Typography className="r1-summary-value">{roundTemplate.minScore}</Typography>
              </Box>
              <Box className="r1-summary-item">
                <Typography className="r1-summary-label">Weightage</Typography>
                <Typography className="r1-summary-value">{roundTemplate.weightage}%</Typography>
              </Box>
            </Box>
          </Card>

          {/* Evaluations table */}
          {evaluations.length === 0 ? (
            <Box className="r1-empty">
              <Typography className="r1-empty-text">No evaluations recorded for this round yet.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} className="r1-table-container">
              <Table className="r1-table">
                <TableHead>
                  <TableRow className="r1-thead-row">
                    <TableCell className="r1-th">Index</TableCell>
                    <TableCell className="r1-th">Candidate Name</TableCell>
                    {sortableColumns.map((col) => (
                      <TableCell
                        key={col}
                        className={`r1-th r1-th-sortable ${sortColumn === col ? "r1-th-active" : ""}`}
                        onClick={() => handleSort(col)}
                      >
                        <Box className="r1-th-sort-wrapper">
                          {col}
                          {sortColumn === col ? (
                            <ArrowUpwardIcon className="r1-sort-icon r1-sort-icon-active" />
                          ) : (
                            <ArrowDownwardIcon className="r1-sort-icon" />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                    {(roundTemplate.roundNo === 2 || roundTemplate.roundNo === 3) && (
                      <TableCell className="r1-th">Reviewed By</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedEvaluations.map((evalItem, index) => {
                    const sectionScore = evalItem.sectionScore as Record<string, number> | null;
                    const isSelected = selectedRows.has(evalItem.applicationId);
                    return (
                      <TableRow
                        key={evalItem.scoreId}
                        className={`r1-tbody-row ${isSelected ? "r1-row-selected" : ""} ${selectionMode ? "r1-row-selectable" : ""}`}
                        onDoubleClick={() => handleRowDoubleClick(evalItem.applicationId)}
                        onClick={() => handleRowClick(evalItem.applicationId)}
                      >
                        <TableCell className="r1-td">{index + 1}</TableCell>
                        <TableCell className="r1-td r1-td-name">
                          {evalItem.candidateName}
                          <span className={`r1-eval-badge r1-eval-${evalItem.evaluationStatus.toLowerCase()}`}>
                            {evalItem.evaluationStatus}
                          </span>
                        </TableCell>
                        <TableCell className="r1-td r1-td-score">{evalItem.score}</TableCell>
                        {sectionNames.map((name) => (
                          <TableCell key={name} className="r1-td">
                            {sectionScore?.[name] ?? "—"}
                          </TableCell>
                        ))}
                        {showAverage && (
                          <TableCell className="r1-td r1-td-avg">
                            {getAverage(evalItem).toFixed(2)}
                          </TableCell>
                        )}
                        {(roundTemplate.roundNo === 2 || roundTemplate.roundNo === 3) && (
                          <TableCell className="r1-td r1-td-reviewed-by">{evalItem.reviewedByName || "—"}</TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Skip reason overlay */}
      {showSkipReason && (
        <div className="r1-overlay-backdrop" onClick={() => setShowSkipReason(false)}>
          <div className="r1-overlay-card" onClick={(e) => e.stopPropagation()}>
            <Typography className="r1-overlay-title">Skip Reason</Typography>
            <textarea
              className="r1-overlay-textarea"
              placeholder="Enter reason for skipping..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              rows={3}
            />
            <div className="r1-overlay-actions">
              <Button
                className="r1-overlay-btn-cancel"
                variant="outlined"
                size="small"
                onClick={() => { setShowSkipReason(false); setSkipReason(""); }}
              >
                Cancel
              </Button>
              <Button
                className="r1-overlay-btn-submit"
                variant="contained"
                size="small"
                disabled={!skipReason.trim() || updating}
                onClick={() => {
                  setShowSkipReason(false);
                  handleBulkUpdate(skipReason.trim());
                  setSkipReason("");
                }}
              >
                {updating ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Round1;
