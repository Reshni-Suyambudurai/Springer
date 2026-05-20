import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, Chip, CircularProgress, Tooltip,
  Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from "@mui/material";
import {
  History as HistoryIcon,
  Person as PersonIcon,
  Grading as GradingIcon,
  Notes as NotesIcon,
  AccessTime as ClockIcon,
  CheckCircleOutline as ActiveIcon,
  CancelOutlined as InactiveIcon
} from "@mui/icons-material";
import { applicationApi } from "../../../services/driveschedule.api";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import type { AppError } from "../../../services/api.error";
import type {
  CandidateHistoryResponse,
  CandidateHistoryAssignment,
  CandidateHistoryEvaluation,
} from "../../../types/TA_Recruiter/DriveSchedule/application.types";
import "../../../css/TA_Recruiter/DriveProcess/ApplicationHistory.css";

interface LocationState {
  driveId: number;
  candidateId: number;
}

interface ApplicationHistoryProps {
  driveId?: number;
  candidateId?: number;
  embeddedInCandidateDetails?: boolean;
}

const ASSIGNMENT_CHIP: Record<string, string> = {
  PLANNED: "ah-chip-planned", DRAFT: "ah-chip-draft", SELECTED: "ah-chip-selected",
  REJECTED: "ah-chip-rejected", CANCELLED: "ah-chip-cancelled", HOLD: "ah-chip-hold",
};
const EVAL_CHIP: Record<string, string> = {
  PASS: "ah-chip-pass", FAIL: "ah-chip-fail", HOLD: "ah-chip-hold",
  ABSENT: "ah-chip-absent", SKIP: "ah-chip-skip", PENDING: "ah-chip-default",
};
const APP_CHIP: Record<string, string> = {
  ALLOTED: "ah-chip-planned", IN_DRIVE: "ah-chip-hold", DROPPED: "ah-chip-absent",
  FAILED: "ah-chip-fail", SELECTED: "ah-chip-selected",
};
const MODE_CHIP: Record<string, string> = {
  onCampus: "ah-chip-mode-campus", offCampus: "ah-chip-mode-off", Virtual: "ah-chip-mode-virtual",
};

interface RoundSummary {
  roundNo: number;
  roundConfigId: number;
  roundName: string;
  assignments: CandidateHistoryAssignment[];
  evaluations: CandidateHistoryEvaluation[];
}

const fmtDate = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

const fmtTime = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
};

const STATUS_COLOR: Record<string, string> = {
  PASS: "ah-hl-green", SELECTED: "ah-hl-green",
  FAIL: "ah-hl-red", FAILED: "ah-hl-red",
  ABSENT: "ah-hl-pink",
  HOLD: "ah-hl-blue",
  SKIP: "ah-hl-grey",
  DROPPED: "ah-hl-orange",
};
const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}:\d{2}[ap]m/i;

const formatHistoryLine = (line: string) => {
  return line.split(" ").map((word, i) => {
    const clean = word.replace(/[^A-Z_]/g, "");
    const cls = STATUS_COLOR[clean];
    if (cls) return { text: word, cls, key: i };
    if (DATE_REGEX.test(word)) return { text: word, cls: "ah-hl-date", key: i };
    return { text: word, cls: "", key: i };
  });
};

const getLatestEvaluation = (evaluations: CandidateHistoryEvaluation[]): CandidateHistoryEvaluation | null => {
  if (!evaluations.length) return null;
  return evaluations.reduce((latest, ev) =>
    new Date(ev.reviewedAt) > new Date(latest.reviewedAt) ? ev : latest
  );
};

const STATUS_DOT_CLASS: Record<string, string> = {
  PASS: "ah-dot-pass", FAIL: "ah-dot-fail", HOLD: "ah-dot-hold",
  ABSENT: "ah-dot-absent", SKIP: "ah-dot-skip",
};

const STATUS_LINE_CLASS: Record<string, string> = {
  PASS: "ah-line-pass", FAIL: "ah-line-fail", HOLD: "ah-line-hold",
  ABSENT: "ah-line-absent", SKIP: "ah-line-skip",
};

const ApplicationHistory = ({ driveId, candidateId, embeddedInCandidateDetails = false }: ApplicationHistoryProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const resolvedDriveId = useMemo(() => driveId ?? state?.driveId, [driveId, state?.driveId]);
  const resolvedCandidateId = useMemo(() => candidateId ?? state?.candidateId, [candidateId, state?.candidateId]);

  const [data, setData] = useState<CandidateHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [batchOptions, setBatchOptions] = useState<string[]>([]);
  const [selectedBatchTime, setSelectedBatchTime] = useState<string>("");
  const [updatingBatchTime, setUpdatingBatchTime] = useState(false);

  const handleBatchTimeUpdate = useCallback(async () => {
    if (!selectedBatchTime || !data) {
      showToast("Please select a batch time.", "error");
      return;
    }
    if (selectedBatchTime === data.batchTime) {
      showToast("Selected batch time is same as current batch time.", "error");
      return;
    }
    const user = tokenstore.getUser();
    if (!user || !user.userId) {
      showToast("User not authenticated. Please login again.", "error");
      return;
    }
    try {
      setUpdatingBatchTime(true);
      const res = await applicationApi.updateBatchTime({
        driveId: data.driveId,
        applicationId: data.applicationId,
        oldBatchTime: data.batchTime || "",
        newBatchTime: selectedBatchTime,
        updatedBy: user.userId,
      });
      if (res.success) {
        showToast("Batch time updated successfully.", "success");
        setData({ ...data, batchTime: selectedBatchTime });
      } else {
        showToast(res.message || "Failed to update batch time.", "error");
      }
    } catch (err) {
      showToast((err as AppError).message || "Failed to update batch time.", "error");
    } finally {
      setUpdatingBatchTime(false);
    }
  }, [data, selectedBatchTime]);

  const handleOverrideSubmit = useCallback(async () => {
    if (!data || !overrideStatus || !overrideReason.trim()) return;
    try {
      setOverrideSubmitting(true);
      const res = await applicationApi.overrideDriveStatus({
        applicationId: data.applicationId,
        status: overrideStatus,
        reason: overrideReason.trim(),
        userId: tokenstore.getUser()!.userId,
      });
      if (res.success) {
        showToast("Status overridden successfully.", "success");
        setData({ ...data, applicationStatus: overrideStatus });
        setOverrideDialogOpen(false);
        setOverrideStatus("");
        setOverrideReason("");
      } else {
        showToast(res.message || "Failed to override status.", "error");
      }
    } catch (err) {
      showToast((err as AppError).message || "Failed to override status.", "error");
    } finally {
      setOverrideSubmitting(false);
    }
  }, [data, overrideStatus, overrideReason]);

  useEffect(() => {
    if (!resolvedDriveId || !resolvedCandidateId) {
      showToast("Missing drive or candidate information.", "error");
      if (!driveId || !candidateId) navigate(-1);
      return;
    }
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await applicationApi.getCandidateHistory(resolvedDriveId, resolvedCandidateId);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          showToast(res.message || "Failed to load candidate history.", "error");
        }
      } catch (err) {
        showToast((err as AppError).message || "Failed to load candidate history.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [resolvedDriveId, resolvedCandidateId, navigate, driveId, candidateId]);

  useEffect(() => {
    if (!resolvedDriveId) return;

    const fetchBatchOptions = async () => {
      try {
        const res = await applicationApi.getDistinctBatchTimes(resolvedDriveId);
        if (res.success && res.data) {
          setBatchOptions(res.data);
        }
      } catch {
        // silently ignore — batch time options are non-critical
      }
    };
    fetchBatchOptions();
  }, [resolvedDriveId]);

  // Filter out the candidate's current batch time from the dropdown options
  const availableBatchOptions = useMemo(() => {
    const currentNormalized = data?.batchTime ? data.batchTime.substring(0, 16) : null;
    return batchOptions.filter((batch) => batch !== currentNormalized);
  }, [batchOptions, data?.batchTime]);

  // Group assignments + evaluations by round for a timeline view
  const rounds: RoundSummary[] = useMemo(() => {
    if (!data) return [];
    const roundMap = new Map<number, RoundSummary>();

    for (const a of data.assignments) {
      if (!roundMap.has(a.roundNo)) {
        roundMap.set(a.roundNo, { roundNo: a.roundNo, roundConfigId: a.roundConfigId, roundName: a.roundName, assignments: [], evaluations: [] });
      }
      roundMap.get(a.roundNo)!.assignments.push(a);
    }
    for (const e of data.evaluations) {
      if (!roundMap.has(e.roundNo)) {
        roundMap.set(e.roundNo, { roundNo: e.roundNo, roundConfigId: e.roundConfigId, roundName: e.roundName, assignments: [], evaluations: [] });
      }
      roundMap.get(e.roundNo)!.evaluations.push(e);
    }

    return [...roundMap.values()]
      .sort((a, b) => a.roundNo - b.roundNo)
      .map((round) => ({
        ...round,
        evaluations: [...round.evaluations].sort(
          (a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime()
        ),
      }));
  }, [data]);

  if (loading) {
    return (
      <Box className="ah-container">
        <Box className="ah-loading">
          <CircularProgress size={36} />
          <Typography className="ah-loading-text">Loading history...</Typography>
        </Box>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box className="ah-container">
        <Box className="ah-loading">
          <Typography className="ah-loading-text">No data available.</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="ah-container">
      {/* ─── Header Card ─── */}
      <Card className="ah-header-card">
        <Box className="ah-header">
          {/* Left Section */}
          <Box className="ah-header-left">
            <Box className="ah-header-icon">
              <HistoryIcon />
            </Box>
            <Box className="ah-header-info">
              
              {!embeddedInCandidateDetails && (
                <Typography className="ah-header-title">{data.candidateName}</Typography>
              )}
              <Typography className="ah-header-subtitle">{data.driveName}</Typography>
            </Box>
          </Box>

          {/* Center Section */}
          <Box className="ah-header-center">
            <Box className="ah-info-pill">
              <span className="ah-pill-label">Reg. Code</span>
              <span className="ah-pill-value">{data.registrationCode || "—"}</span>
            </Box>
            <Box className="ah-info-pill">
              <span className="ah-pill-label">Batch</span>
              <span className="ah-pill-value">
                {data.batchTime ? `${fmtDate(data.batchTime)} - ${fmtTime(data.batchTime)}` : "—"}
              </span>
            </Box>
          </Box>

          {/* Right Section */}
          <Box className="ah-header-right">
            {embeddedInCandidateDetails ? (
              <>
                <Select
                  value={selectedBatchTime}
                  onChange={(e) => setSelectedBatchTime(e.target.value)}
                  displayEmpty
                  size="small"
                  className="ah-override-select"
                >
                  <MenuItem value="">Select Batch Time</MenuItem>
                  {availableBatchOptions.length === 0 && (
                    <MenuItem value="" disabled>No other batch times available</MenuItem>
                  )}
                  {availableBatchOptions.map((batch) => {
                    const batchDate = new Date(batch);
                    const timeStr = batchDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                    const dateStr = batchDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                    return (
                      <MenuItem key={batch} value={batch}>
                        {dateStr} - {timeStr}
                      </MenuItem>
                    );
                  })}
                </Select>
                <Button
                  variant="contained"
                  size="small"
                  className="g-btn g-btn-primary ah-override-btn"
                  disabled={!selectedBatchTime || updatingBatchTime}
                  onClick={handleBatchTimeUpdate}
                >
                  {updatingBatchTime ? "Updating..." : "Update"}
                </Button>
              </>
            ) : (
              <>
                <Select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  displayEmpty
                  size="small"
                  className="ah-override-select"
                >
                  <MenuItem value="" disabled>Override Status</MenuItem>
                  <MenuItem value="DROPPED">DROPPED</MenuItem>
                  <MenuItem value="FAILED">FAILED</MenuItem>
                  <MenuItem value="SELECTED">SELECTED</MenuItem>
                </Select>
                <Button
                  variant="contained"
                  size="small"
                  className="g-btn g-btn-primary ah-override-btn"
                  disabled={!overrideStatus || overrideStatus === data.applicationStatus}
                  onClick={() => setOverrideDialogOpen(true)}
                >
                  Update
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Card>

      {/* ─── Level Progress Bar ─── */}
      {rounds.length > 0 && (
        <Card className="ah-level-bar">
          <Box className="ah-level-bar-left">
            <Chip label={data.applicationStatus} className={APP_CHIP[data.applicationStatus] || "ah-chip-default"} />
          </Box>
          
          <Box className="ah-level-bar-center">
            {rounds.map((round, rIdx) => {
              const latestEval = getLatestEvaluation(round.evaluations);
              const status = latestEval?.evaluationStatus || "PENDING";
              const dotCls = STATUS_DOT_CLASS[status] || "ah-dot-pending";
              const lineCls = STATUS_LINE_CLASS[status] || "ah-line-pending";
              return (
                <Box key={round.roundNo} className="ah-level-step">
                  <Box className={`ah-level-dot ${dotCls}`}>
                    <span className="ah-level-num">{round.roundConfigId}</span>
                  </Box>
               
                  {rIdx < rounds.length - 1 && (
                    <Box className="ah-level-bridge">
                      <Box className={`ah-level-connector ${lineCls}`} />
                      <Typography className={`ah-level-status ${dotCls}`}>{status}</Typography>
                      <Box className={`ah-level-connector ${lineCls}`} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          <Box className="ah-level-bar-right">
            <Chip label={data.driveMode} size="small" className={MODE_CHIP[data.driveMode] || "ah-chip-default"} />
          </Box>
        </Card>
      )}

      {/* ─── Scrollable Content ─── */}
      <Box className="ah-content">
        {/* Round Timeline */}
        {rounds.length === 0 ? (
          <Card className="ah-empty-card">
            <Typography className="ah-empty-text">No assignments or evaluations recorded yet.</Typography>
          </Card>
        ) : (
          <Box className="ah-timeline">
            {rounds.map((round, rIdx) => {
              const latestEval = getLatestEvaluation(round.evaluations);
              return (
                <Box key={round.roundNo} className="ah-tl-item">
                  {/* Timeline connector */}
                  <Box className="ah-tl-rail">
                    <Box className={`ah-tl-dot ${latestEval ? (STATUS_DOT_CLASS[latestEval.evaluationStatus] || "ah-dot-default") : "ah-dot-pending"}`}>
                      {round.roundNo}
                    </Box>
                    {rIdx < rounds.length - 1 && (
                      <Box className={`ah-tl-line ${latestEval ? (STATUS_LINE_CLASS[latestEval.evaluationStatus] || "ah-line-pending") : "ah-line-pending"}`} />
                    )}
                  </Box>

                  {/* Round Card */}
                  <Card className="ah-round-card">
                    {/* Round header */}
                    <Box className="ah-round-header">
                      <Typography className="ah-round-name">{round.roundName}</Typography>
                      {latestEval && <Chip label={latestEval.evaluationStatus} size="small" className={EVAL_CHIP[latestEval.evaluationStatus] || "ah-chip-default"} />}
                      {!latestEval && <Chip label="PENDING" size="small" className="ah-chip-default" />}
                      {round.evaluations.length > 1 && (
                        <Chip label={`${round.evaluations.length} Evaluations`} size="small" className="ah-chip-default ah-multi-eval-badge" />
                      )}
                    </Box>

                    {/* Round Card Body */}
                    <Box className="ah-round-body">
                      {/* Panel Assignments Summary at top */}
                      {round.assignments.length > 0 && (
                        <Box className="ah-panel-assignments-section">
                          <Typography className="ah-panel-assignments-label">
                            <PersonIcon /> Panel Members Assigned ({round.assignments.length})
                          </Typography>
                          <Box className="ah-panel-assignments-list">
                            {round.assignments.map((a) => (
                              <Box key={a.assignmentId} className="ah-panel-assignment-item">
                                <span className="ah-panel-assignment-name">{a.panelMemberName}</span>
                                <Chip label={a.status} size="small" className={ASSIGNMENT_CHIP[a.status] || "ah-chip-default"} />
                                <Tooltip title={a.isActive ? "Active" : "Inactive"} arrow classes={{ tooltip: 'g-tooltip', arrow: 'g-tooltip-arrow' }}>
                                  {a.isActive
                                    ? <ActiveIcon className="ah-panel-assignment-status-icon ah-panel-assignment-active" />
                                    : <InactiveIcon className="ah-panel-assignment-status-icon ah-panel-assignment-inactive" />}
                                </Tooltip>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Panel Evaluations */}
                      <Box className="ah-round-evaluations-grid">
                        {round.evaluations.length === 0 ? (
                          <Box className="ah-panel-no-eval">
                            <Typography className="ah-panel-no-eval-text">
                              <GradingIcon />
                              No evaluations recorded yet
                            </Typography>
                          </Box>
                        ) : (
                          round.evaluations.map((ev, evIdx) => {
                            const initials = ev.reviewedByName.split(' ').map(n => n[0]).join('').toUpperCase();
                            const isLatest = evIdx === round.evaluations.length - 1;
                            
                            return (
                              <Box 
                                key={ev.scoreId} 
                                className={`ah-panel-eval-card ah-eval-status-${ev.evaluationStatus.toLowerCase()}`}
                              >
                                {/* Left Column: Panel Identity, Status + DateTime */}
                                <Box className="ah-panel-eval-left">
                                  <Box className="ah-panel-eval-identity">
                                    <Box className="ah-panel-eval-avatar">{initials}</Box>
                                    <Box className="ah-panel-eval-name-block">
                                      <Typography className="ah-panel-eval-name">{ev.reviewedByName}</Typography>
                                      <Typography className="ah-panel-eval-role">Panel Member</Typography>
                                    </Box>
                                  </Box>
                                  
                                  <Box className="ah-panel-eval-status-time">
                                    {round.evaluations.length > 1 && (
                                      <Chip
                                        label={isLatest ? "Latest" : "Earlier"}
                                        size="small"
                                        className={isLatest ? "ah-panel-eval-badge-latest" : "ah-panel-eval-badge-earlier"}
                                      />
                                    )}
                                    <Chip 
                                      label={ev.evaluationStatus} 
                                      size="small" 
                                      className={EVAL_CHIP[ev.evaluationStatus] || "ah-chip-default"} 
                                    />
                                    <Box className="ah-panel-eval-timestamp">
                                      <ClockIcon className="ah-panel-eval-timestamp-icon" />
                                      <span>{fmtDate(ev.reviewedAt)} • {fmtTime(ev.reviewedAt)}</span>
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Right Column: Section Scores + Total Score at right end */}
                                <Box className="ah-panel-eval-right">
                                  {(ev.score !== null || ev.sectionScore) && (
                                    <Box className="ah-panel-eval-scores-row">
                                      {ev.sectionScore && (
                                        <Box className="ah-panel-eval-sections-left">
                                          {Object.entries(ev.sectionScore).map(([key, val]) => (
                                            <Chip 
                                              key={key} 
                                              label={`${key.replace(/_/g, ' ')}: ${val}`} 
                                              size="small" 
                                              className="ah-panel-eval-section-chip" 
                                            />
                                          ))}
                                        </Box>
                                      )}
                                      {ev.score !== null && (
                                        <Box className="ah-panel-eval-total-score">
                                          
                                          <span className="ah-panel-eval-total-value">
                                            {ev.score}{ev.outoffScore ? ` / ${ev.outoffScore}` : ''}
                                          </span>
                                        </Box>
                                      )}
                                    </Box>
                                  )}

                                  {ev.review && (
                                    <Box className={`ah-panel-eval-review-wrapper ah-review-${ev.evaluationStatus.toLowerCase()}`}>
                                      <Typography className="ah-panel-eval-review-text">
                                        "{ev.review}"
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            );
                          })
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Override History — above notes */}
        {data.overrides && data.overrides.length > 0 && (
          <Card className="ah-overrides-card">
         
            <Box className="ah-overrides-body">
              <Typography className="ah-overrides-label">Override History ({data.overrides.length})</Typography>
              <TableContainer>
                <Table size="small" className="ah-overrides-table">
                  <TableHead>
                    <TableRow>
                      <TableCell className="ah-ov-th">Index</TableCell>
                      <TableCell className="ah-ov-th">Change</TableCell>
                      <TableCell className="ah-ov-th">Reason</TableCell>
                      <TableCell className="ah-ov-th">By</TableCell>
                      <TableCell className="ah-ov-th">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.overrides.map((o, idx) => (
                      <TableRow key={o.overrideId}>
                        <TableCell className="ah-ov-td">{idx + 1}</TableCell>
                        <TableCell className="ah-ov-td">
                          {o.changes.map((c, i) => (
                            <Chip
                              key={i}
                              size="small"
                              className="t-chip-warning"
                              label={`${String(c.old)} \u2192 ${String(c.newValue)}`}
                            />
                          ))}
                        </TableCell>
                        <TableCell className="ah-ov-td">{o.overrideReason}</TableCell>
                        <TableCell className="ah-ov-td ah-ov-td-user">{o.createdByName}</TableCell>
                        <TableCell className="ah-ov-td ah-ov-td-date">{fmtDate(o.createdAt)} {fmtTime(o.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        )}

        {/* History Notes — at the end */}
        {data.history && (
          <Card className="ah-notes-card">
            <NotesIcon className="ah-notes-icon" />
            <Box className="ah-notes-body">
              <Typography className="ah-notes-label">History</Typography>
              <Box className="ah-notes-list">
                {data.history.split("\n").filter(Boolean).map((line, idx) => {
                  const segments = formatHistoryLine(line);
                  return (
                    <Box key={idx} className="ah-note-line">
                      <span className="ah-note-bullet">•</span>
                      <Typography className="ah-note-text">
                        {segments.map((seg) =>
                          seg.cls
                            ? <span key={seg.key}><span className={seg.cls}>{seg.text}</span>{" "}</span>
                            : <span key={seg.key}>{seg.text}{" "}</span>
                        )}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Card>
        )}
      </Box>

      {/* ─── Override Reason Dialog ─── */}
      <Dialog open={!embeddedInCandidateDetails && overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Override Status to {overrideStatus}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            className="ah-dialog-text-field"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)} disabled={overrideSubmitting} className="g-btn g-btn-outline-primary">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleOverrideSubmit}
            disabled={!overrideReason.trim() || overrideSubmitting}
          >
            {overrideSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationHistory;
