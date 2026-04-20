import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, Chip, CircularProgress, IconButton, Tooltip,
  Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
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
  evaluation: CandidateHistoryEvaluation | null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

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

const STATUS_DOT_CLASS: Record<string, string> = {
  PASS: "ah-dot-pass", FAIL: "ah-dot-fail", HOLD: "ah-dot-hold",
  ABSENT: "ah-dot-absent", SKIP: "ah-dot-skip",
};

const STATUS_LINE_CLASS: Record<string, string> = {
  PASS: "ah-line-pass", FAIL: "ah-line-fail", HOLD: "ah-line-hold",
  ABSENT: "ah-line-absent", SKIP: "ah-line-skip",
};

const ApplicationHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [data, setData] = useState<CandidateHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [overrideStatus, setOverrideStatus] = useState("");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const handleOverrideSubmit = async () => {
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
  };

  useEffect(() => {
    if (!state?.driveId || !state?.candidateId) {
      showToast("Missing drive or candidate information.", "error");
      navigate(-1);
      return;
    }
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await applicationApi.getCandidateHistory(state.driveId, state.candidateId);
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
  }, [state, navigate]);

  // Group assignments + evaluations by round for a timeline view
  const rounds: RoundSummary[] = useMemo(() => {
    if (!data) return [];
    const roundMap = new Map<number, RoundSummary>();

    for (const a of data.assignments) {
      if (!roundMap.has(a.roundNo)) {
        roundMap.set(a.roundNo, { roundNo: a.roundNo, roundConfigId: a.roundConfigId, roundName: a.roundName, assignments: [], evaluation: null });
      }
      roundMap.get(a.roundNo)!.assignments.push(a);
    }
    for (const e of data.evaluations) {
      if (!roundMap.has(e.roundNo)) {
        roundMap.set(e.roundNo, { roundNo: e.roundNo, roundConfigId: e.roundConfigId, roundName: e.roundName, assignments: [], evaluation: null });
      }
      roundMap.get(e.roundNo)!.evaluation = e;
    }

    return [...roundMap.values()].sort((a, b) => a.roundNo - b.roundNo);
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
          <IconButton className="ah-back-btn" onClick={() => navigate(-1)}>
            <ArrowBackIcon />
          </IconButton>
          <Box className="ah-header-icon">
            <HistoryIcon />
          </Box>
          <Box className="ah-header-info">
            <Typography className="ah-header-title">{data.candidateName}</Typography>
            <Typography className="ah-header-subtitle">{data.driveName}</Typography>
          </Box>
          <Chip label={data.driveMode} size="small" className={MODE_CHIP[data.driveMode] || "ah-chip-default"} />
          <Chip label={data.applicationStatus} className={APP_CHIP[data.applicationStatus] || "ah-chip-default"} />
        </Box>

        <Box className="ah-info-strip">
          <Box className="ah-info-pill">
            <span className="ah-pill-label">Reg. Code</span>
            <span className="ah-pill-value">{data.registrationCode || "—"}</span>
          </Box>
          <Box className="ah-info-pill">
            <span className="ah-pill-label">Batch</span>
            <span className="ah-pill-value">
              {data.batchTime ? fmtDate(data.batchTime) + " " + fmtTime(data.batchTime) : "—"}
            </span>
          </Box>
          <Box className="ah-info-pill">
            <span className="ah-pill-label">Drive Status</span>
            <span className="ah-pill-value">{data.driveStatus || "—"}</span>
          </Box>
          <Box className="ah-override-group">
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
              className="t-btn-primary ah-override-btn"
              disabled={!overrideStatus || overrideStatus === data.applicationStatus}
              onClick={() => setOverrideDialogOpen(true)}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ─── Level Progress Bar ─── */}
      {rounds.length > 0 && (
        <Card className="ah-level-bar">
          {rounds.map((round, rIdx) => {
            const ev = round.evaluation;
            const status = ev?.evaluationStatus || "PENDING";
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
              const ev = round.evaluation;
              return (
                <Box key={round.roundNo} className="ah-tl-item">
                  {/* Timeline connector */}
                  <Box className="ah-tl-rail">
                    <Box className={`ah-tl-dot ${ev ? (STATUS_DOT_CLASS[ev.evaluationStatus] || "ah-dot-default") : "ah-dot-pending"}`}>
                      {round.roundNo}
                    </Box>
                    {rIdx < rounds.length - 1 && (
                      <Box className={`ah-tl-line ${ev ? (STATUS_LINE_CLASS[ev.evaluationStatus] || "ah-line-pending") : "ah-line-pending"}`} />
                    )}
                  </Box>

                  {/* Round Card */}
                  <Card className="ah-round-card">
                    {/* Round header */}
                    <Box className="ah-round-header">
                      <Typography className="ah-round-name">{round.roundName}</Typography>
                      {ev && <Chip label={ev.evaluationStatus} size="small" className={EVAL_CHIP[ev.evaluationStatus] || "ah-chip-default"} />}
                      {!ev && <Chip label="PENDING" size="small" className="ah-chip-default" />}
                    </Box>

                    {/* 2-column body: Panels | Evaluation */}
                    <Box className="ah-round-body">
                      {/* Left: Panel Members */}
                      <Box className="ah-round-col">
                        <Typography className="ah-col-label">
                          <PersonIcon className="ah-col-icon" /> Panel ({round.assignments.length})
                        </Typography>
                        {round.assignments.length === 0 ? (
                          <Typography className="ah-col-empty">No panel assigned</Typography>
                        ) : (
                          <Box className="ah-panel-list">
                            {round.assignments.map((a) => (
                              <Box key={a.assignmentId} className="ah-panel-row">
                                <Typography className="ah-panel-name">{a.panelMemberName}</Typography>
                                <Chip label={a.status} size="small" className={ASSIGNMENT_CHIP[a.status] || "ah-chip-default"} />
                                <Tooltip title={a.isActive ? "Active" : "Inactive"} arrow>
                                  {a.isActive
                                    ? <ActiveIcon className="ah-active-icon" />
                                    : <InactiveIcon className="ah-inactive-icon" />}
                                </Tooltip>
                                <Typography className="ah-panel-date">
                                  <ClockIcon className="ah-clock-icon" /> {fmtDate(a.createdAt)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>

                      {/* Right: Evaluation */}
                      <Box className="ah-round-col">
                        <Typography className="ah-col-label">
                          <GradingIcon className="ah-col-icon" /> Evaluation
                        </Typography>
                        {!ev ? (
                          <Typography className="ah-col-empty">Not evaluated yet</Typography>
                        ) : (
                          <Box className="ah-eval-block">
                            <Box className="ah-eval-score-row">
                              {/* <Box className="ah-score-circle">{ev.score}</Box> */}
                              {ev.sectionScore && (
                                <Box className="ah-section-scores">
                                  {Object.entries(ev.sectionScore).map(([key, val]) => (
                                    <Chip key={key} label={`${key}: ${val}`} size="small" className="ah-score-tag" />
                                  ))}
                                </Box>
                              )}
                            </Box>
                            {ev.review && (
                              <Typography className="ah-eval-review">"{ev.review}"</Typography>
                            )}
                            <Box className="ah-eval-meta">
                              <Typography className="ah-eval-reviewer">
                                <PersonIcon className="ah-meta-icon" /> {ev.reviewedByName}
                              </Typography>
                              <Typography className="ah-eval-date">
                                <ClockIcon className="ah-meta-icon" /> {fmtDate(ev.reviewedAt)} {fmtTime(ev.reviewedAt)}
                              </Typography>
                            </Box>
                          </Box>
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
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="xs" fullWidth>
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
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)} disabled={overrideSubmitting}>Cancel</Button>
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
