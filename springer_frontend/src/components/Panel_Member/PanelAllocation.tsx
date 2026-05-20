import { useState, useEffect } from "react";
import {
  Box, Card, Typography, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, TextField, InputAdornment, MenuItem, Select,
} from "@mui/material";
import { Assignment as AssignIcon, Person as PersonIcon, Search as SearchIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { tokenstore } from "../../auth/tokenstore";
import { driveAssignmentApi, candidateEvaluationApi } from "../../services/driveschedule.api";
import { roundTemplateApi } from "../../services/drive.api";
import { showToast } from "../../utils/toast";
import type { AppError } from "../../services/api.error";
import type { DriveAssignmentResponse } from "../../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import { AssignmentStatus } from "../../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import "../../css/TA_Recruiter/DriveProcess/PanelAllocation.css";

import "../../css/Panel_Member/PanelAssignments.css"; // Reuse styles for status chips and empty state
 

const PanelAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<DriveAssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("ALL");

  // Extract unique dates from assignments
  const distinctDates = Array.from(
    new Set(
      assignments
        .map((a) => a.createdAt && new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }))
        .filter((d): d is string => !!d)
    )
  );

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const user = tokenstore.getUser();
        if (!user) {
          setError("User not found. Please log in again.");
          return;
        }
        const res = await driveAssignmentApi.getAssignmentsByUserIdAndStatus(user.userId, "PLANNED,DRAFT,HOLD");
        if (res.success && res.data) {
          setAssignments(res.data);
        } else {
          const msg = res.message || "Failed to load assignments.";
          setError(msg);
          showToast(msg, "error");
        }
      } catch (err: unknown) {
        const msg = (err as AppError).message || "Failed to load assignments.";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const filtered = assignments.filter((a) => {
    const matchesName = !searchName || a.candidateName.toLowerCase().includes(searchName.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
    const assignmentDate = a.createdAt
      ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "";
    const matchesDate = filterDate === "ALL" || assignmentDate === filterDate;
    return matchesName && matchesStatus && matchesDate;
  });

  const handleRowClick = async (assignment: DriveAssignmentResponse) => {
    if (!assignment.roundConfigId) return;
    try {
      const res = await roundTemplateApi.getRoundTemplateById(assignment.roundConfigId);
      if (!res.success || !res.data) {
        showToast(res.message || "Failed to load round template.", "error");
        return;
      }
      // For non-PLANNED (e.g. DRAFT), fetch existing evaluation
      if (assignment.status !== "PLANNED") {
        try {
          const user = tokenstore.getUser();
          if (!user) return;
          const evalRes = await candidateEvaluationApi.getEvaluationByApplicationAndRound(
            assignment.applicationId, assignment.roundConfigId, user.userId
          );
          if (evalRes.success && evalRes.data) {
            navigate("/members/panel-scoring", {
              state: { assignment, roundTemplate: res.data, evaluation: evalRes.data },
            });
            return;
          }
        } catch (evalErr) {
          showToast((evalErr as AppError).message || "Failed to load evaluation.", "error");
          return;
        }
      }
      navigate("/members/panel-scoring", {
        state: { assignment, roundTemplate: res.data },
      });
    } catch (err: unknown) {
      showToast((err as AppError).message || "Failed to load round template.", "error");
    }
  };

  // Use the same status chip class logic as AllocationHistory
  const getStatusChipClass = (status: string) => {
    switch (status) {
      case "PLANNED": return "t-chip-info";
      case "HOLD": return "t-chip-hold";
      case "DRAFT": return "t-chip-warning";
      case "SELECTED": return "t-chip-success";
      case "REJECTED": return "t-chip-error";
      case "CANCELLED": return "t-chip-cancelled";
      default: return "t-chip-info";
    }
  };

  return (
    <Box className="t-page">
      <Card className="t-card">

        <Box className="t-filter-bar">
          <TextField
            placeholder="Search by candidate name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            size="small"
            className="t-search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="t-search-icon" />
                </InputAdornment>
              ),
            }}
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
            className="pm-assign-status-select"
          >
            <MenuItem value="ALL">All Status</MenuItem>
            {[AssignmentStatus.PLANNED, AssignmentStatus.DRAFT, AssignmentStatus.HOLD].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
          <Select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            size="small"
            className="pm-assign-date-select"
          >
            <MenuItem value="ALL">All Dates</MenuItem>
            {distinctDates.map((date) => (
              <MenuItem key={date} value={date}>{date}</MenuItem>
            ))}
          </Select>
          <Box className="t-filter-spacer" />
          <span className="pm-assign-filter-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </Box>

        <Box className="t-separator" />

        <Box className="t-table-section">
          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={28} className="t-spinner" />
              <Typography className="t-loading-text">Loading assignments...</Typography>
            </Box>
          ) : error ? (
            <Box className="t-loading">
              <AssignIcon className="t-empty-icon" />
              <Typography className="t-empty-text">{error}</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="pm-assign-table-scroll">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="t-head-row">
                      <TableCell className="t-head-cell">Index</TableCell>
                      <TableCell className="t-head-cell">Candidate</TableCell>
                      <TableCell className="t-head-cell">Drive</TableCell>
                      <TableCell className="t-head-cell">Round</TableCell>
                      <TableCell className="t-head-cell">Status</TableCell>
                      <TableCell className="t-head-cell">Assigned On</TableCell>
                      <TableCell className="t-head-cell">Assigned By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" className="t-empty-cell">
                          <AssignIcon className="t-empty-icon" />
                          <Typography className="t-empty-text">
                            No assignments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((a, idx) => (
                        <TableRow
                          key={a.assignmentId}
                          onClick={() => handleRowClick(a)}
                          className={`t-row ${idx % 2 === 0 ? "t-row--even" : "t-row--odd"} ${a.roundConfigId ? "pm-assign-row-clickable" : ""}`}
                        >
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {idx + 1}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Box className="pm-assign-name-icon-box">
                                <PersonIcon className="pm-assign-person-icon" />
                              </Box>
                              <Typography className="t-row-primary">{a.candidateName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{a.driveName}</Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            {a.roundName ? (
                              <Chip label={a.roundName} size="small" className="pm-assign-round-chip" />
                            ) : (
                              <Typography className="t-row-secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell className="t-cell">
                            <Chip
                              label={a.status}
                              size="small"
                              className={getStatusChipClass(a.status)}
                            />
                          </TableCell>
                       
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {a.createdAt
                                ? new Date(a.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {a.createdByName || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default PanelAssignments;
