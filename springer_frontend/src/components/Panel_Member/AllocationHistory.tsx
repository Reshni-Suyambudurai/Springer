import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, Typography, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { History as HistoryIcon, Person as PersonIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { tokenstore } from "../../auth/tokenstore";
import { hiringCycleApi } from "../../services/hiring.api";
import { driveAssignmentApi, candidateEvaluationApi } from "../../services/driveschedule.api";
import { roundTemplateApi } from "../../services/drive.api";
import { showToast } from "../../utils/toast";
import type { AppError } from "../../services/api.error";
import type { CycleWithDrivesResponse, DriveInfo } from "../../types/TA_Recruiter/Hiring/hiringCycle.types";
import type { DriveAssignmentResponse } from "../../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import { AssignmentStatus } from "../../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import "../../css/Panel_Member/AllocationHistory.css";

const AllocationHistory = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<CycleWithDrivesResponse[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<number | "">("");
  const [assignments, setAssignments] = useState<DriveAssignmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [cyclesLoading, setCyclesLoading] = useState(true);
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

  // Fetch cycles on mount
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        setCyclesLoading(true);
        const response = await hiringCycleApi.getAllCyclesWithDrives();
        if (response.data) {
          const data = response.data;
          setCycles(data);
          if (data.length > 0) {
            setSelectedCycle(data[0].cycleId);
            setDrives(data[0].drives);
          }
        }
      } catch (err) {
        showToast((err as AppError).message || "Failed to fetch hiring cycles", "error");
      } finally {
        setCyclesLoading(false);
      }
    };
    fetchCycles();
  }, []);

  // Fetch assignments when drive is selected
  const fetchAssignments = useCallback(async (driveId: number) => {
    const user = tokenstore.getUser();
    if (!user) {
      showToast("User not found. Please log in again.", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await driveAssignmentApi.getAssignmentsByUserId(user.userId, driveId);
      if (res.success && res.data) {
        setAssignments(res.data);
      } else {
        showToast(res.message || "Failed to load assignments.", "error");
        setAssignments([]);
      }
    } catch (err) {
      showToast((err as AppError).message || "Failed to load assignments.", "error");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDrive) {
      fetchAssignments(selectedDrive);
    } else {
      setAssignments([]);
    }
  }, [selectedDrive, fetchAssignments]);

  const handleCycleChange = (cycleId: number) => {
    setSelectedCycle(cycleId);
    const cycle = cycles.find((c) => c.cycleId === cycleId);
    setDrives(cycle?.drives || []);
    setSelectedDrive("");
  };

  const handleRowClick = async (assignment: DriveAssignmentResponse) => {
    if (!assignment.roundConfigId) return;
    try {
      const res = await roundTemplateApi.getRoundTemplateById(assignment.roundConfigId);
      if (!res.success || !res.data) {
        showToast(res.message || "Failed to load round template.", "error");
        return;
      }
      // Fetch existing evaluation if it exists
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
      } catch {
        // No evaluation found — navigate without it
      }
      navigate("/members/panel-scoring", {
        state: { assignment, roundTemplate: res.data },
      });
    } catch (err) {
      showToast((err as AppError).message || "Failed to load round template.", "error");
    }
  };

  const getStatusChipClass = (status: string) => {
    switch (status) {
      case "SELECTED": return "t-chip-success";
      case "REJECTED":
      case "CANCELLED": return "t-chip-error";
      case "DRAFT": return "t-chip-warning";
      default: return "t-chip-info";
    }
  };


  // Filtered assignments for table
  const filteredAssignments = assignments
    .filter((a) => {
      const assignmentDate = a.createdAt
        ? new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "";
      const matchesDate = filterDate === "ALL" || assignmentDate === filterDate;
      const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;
      return matchesDate && matchesStatus;
    });

  return (
    <Box className="t-page">
      <Card className="t-card">
        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box className="t-icon-box">
              <HistoryIcon className="ah-header-icon" />
            </Box>
            <Stack>
              <Typography className="t-page-title">Allocation History</Typography>
            </Stack>
          </Stack>
          <span className="ah-count-badge">{filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? "s" : ""}</span>
        </Box>

        <Box className="t-filter-bar">
          <FormControl size="small" className="ah-cycle-dropdown">
            <InputLabel>Hiring Cycle</InputLabel>
            <Select
              value={selectedCycle || ""}
              label="Hiring Cycle"
              onChange={(e) => handleCycleChange(Number(e.target.value))}
              disabled={cyclesLoading}
            >
              {cycles.map((cycle) => (
                <MenuItem
                  key={cycle.cycleId}
                  value={cycle.cycleId}
                  className={cycle.status === "OPEN" ? "ah-cycle-open" : "ah-cycle-closed"}
                >
                  {cycle.cycleName} - {cycle.cycleYear}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="ah-drive-dropdown">
            <InputLabel>Drive</InputLabel>
            <Select
              value={selectedDrive}
              label="Drive"
              onChange={(e) => setSelectedDrive(e.target.value as number | "")}
              disabled={drives.length === 0}
            >
              <MenuItem value="">Select Drive</MenuItem>
              {drives.map((drive) => (
                <MenuItem key={drive.driveId} value={drive.driveId}>
                  <Box className="ah-drive-option">
                    <span className={`ah-drive-dot ${drive.mode === "ON_CAMPUS" ? "ah-dot-oncampus" : "ah-dot-offcampus"}`} />
                    {drive.driveName}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="ah-status-dropdown" sx={{ minWidth: 120, marginRight: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              {Object.values(AssignmentStatus).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="ah-date-dropdown" sx={{ minWidth: 150, marginRight: 1 }}>
            <InputLabel>Date</InputLabel>
            <Select
              value={filterDate}
              label="Date"
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <MenuItem value="ALL">All Dates</MenuItem>
              {distinctDates.map((date) => (
                <MenuItem key={date} value={date}>{date}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box className="t-separator" />

        <Box className="t-table-section">
          {cyclesLoading || loading ? (
            <Box className="t-loading">
              <CircularProgress size={28} className="ah-spinner" />
              <Typography className="t-loading-text">
                {cyclesLoading ? "Loading cycles..." : "Loading assignments..."}
              </Typography>
            </Box>
          ) : !selectedDrive ? (
            <Box className="t-loading">
              <HistoryIcon className="t-empty-icon" />
              <Typography className="t-empty-text">Select a drive to view your allocation history</Typography>
            </Box>
          ) : (
            <TableContainer className="ah-table-scroll">
              <Table stickyHeader>
                <TableHead>
                  <TableRow className="t-head-row">
                    <TableCell className="t-head-cell">Index</TableCell>
                    <TableCell className="t-head-cell">Candidate</TableCell>
                    <TableCell className="t-head-cell">Round</TableCell>
                    <TableCell className="t-head-cell">Status</TableCell>
                    <TableCell className="t-head-cell">Assigned On</TableCell>
                    <TableCell className="t-head-cell">Assigned By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" className="t-empty-cell">
                        <HistoryIcon className="t-empty-icon" />
                        <Typography className="t-empty-text">No assignments found for this drive</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssignments
                      .map((a, idx) => (
                        <TableRow key={a.assignmentId} onClick={() => handleRowClick(a)} className={`t-row ${idx % 2 === 0 ? "t-row--even" : "t-row--odd"} ${a.roundConfigId ? "ah-row-clickable" : ""}`}>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{idx + 1}</Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Box className="ah-name-icon-box">
                                <PersonIcon className="ah-name-icon" />
                              </Box>
                              <Typography className="t-row-primary">{a.candidateName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell className="t-cell">
                            {a.roundName ? (
                              <Chip label={a.roundName} size="small" className="ah-round-chip" />
                            ) : (
                              <Typography className="t-row-secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell className="t-cell">
                            <Chip label={a.status} size="small" className={getStatusChipClass(a.status)} />
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {a.createdAt
                                ? new Date(a.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit", month: "short", year: "numeric",
                                  })
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{a.createdByName || "—"}</Typography>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default AllocationHistory;

