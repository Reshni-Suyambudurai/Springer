import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { applicationApi, candidateEvaluationApi } from "../../../services/driveschedule.api";
import { emailTemplateApi } from "../../../services/emailtemplate.api";
import type { ApplicationResponse, BatchCandidatesMap, FinalizeApplicationsRequest } from "../../../types/TA_Recruiter/DriveSchedule/application.types";
import type { RoundEvaluationResponse, BulkRoundSkipRequest } from "../../../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import { tokenstore } from "../../../auth/tokenstore";
import { Box, Card, Typography, CircularProgress, Select, MenuItem, Button, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmailIcon from "@mui/icons-material/Email";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import copy from "copy-to-clipboard";
import BackButton from "../../Common/BackButton";
import Round1 from "./Scores/Round1";
import type { PanelCandidate } from "./Scores/Round1";
import "../../../css/TA_Recruiter/DriveProcess/DriveCandidates.css";
import { EMAIL_TEMPLATE_IDS } from "../../../config/emailTemplateConfig";

const ROUND_NO_MAP: Record<string, number> = {
  APTITUDE: 1,
  COMMUNICATION: 2,
  TECHNICAL: 3,
};

const DriveCandidates: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driveName, setDriveName] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>(searchParams.get("batch") || "ALL");
  const [selectedRound, setSelectedRound] = useState<string>(searchParams.get("round") || "ALL");
  const [batchMap, setBatchMap] = useState<BatchCandidatesMap>({});
  const [roundEvaluation, setRoundEvaluation] = useState<RoundEvaluationResponse | null>(null);
  const [evaluationsLoading, setEvaluationsLoading] = useState<boolean>(false);

  // Filter state
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updateStatusTo, setUpdateStatusTo] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [updating, setUpdating] = useState<boolean>(false);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedRoundFilters, setSelectedRoundFilters] = useState<Set<number>>(new Set());
  const [showReasonOverlay, setShowReasonOverlay] = useState<boolean>(false);
  const [skipReason, setSkipReason] = useState<string>("");
  
  // Finalize dialog states
  const [showFinalizeDialog, setShowFinalizeDialog] = useState<boolean>(false);
  const [finalizeDialogVariant, setFinalizeDialogVariant] = useState<"warning" | "confirm">("confirm");
  const [unfinishedCount, setUnfinishedCount] = useState<number>(0);
  const [finalizing, setFinalizing] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [emailingSending, setEmailSending] = useState<boolean>(false);
  const [copiedPassEmails, setCopiedPassEmails] = useState<boolean>(false);

  useEffect(() => {
    if (driveId) {
      const id = parseInt(driveId);
      fetchApplications(id);
      fetchBatchCandidates(id);
    }
  }, [driveId]);

  const handleRefresh = async () => {
    if (driveId && !refreshing) {
      const id = parseInt(driveId);
      setRefreshing(true);
      try {
        await fetchApplicationsOnly(id);
        showToast("Data refreshed successfully", "success");
      } catch {
        showToast("Failed to refresh data", "error");
      } finally {
        setRefreshing(false);
      }
    }
  };

  const updateFilter = (key: "batch" | "round", value: string) => {
    if (key === "batch") setSelectedBatch(value);
    else setSelectedRound(value);
    setSearchParams((prev) => {
      if (value === "ALL") prev.delete(key);
      else prev.set(key, value);
      return prev;
    }, { replace: true });
  };

  const fetchApplications = async (id: number) => {
    try {
      setLoading(true);
      const response = await applicationApi.getApplicationsByDriveId(id);

      if (response.data.success && response.data.data) {
        setApplications(response.data.data);
        if (response.data.data.length > 0) {
          setDriveName(response.data.data[0].driveName);
        }
      } else {
        showToast(response.data.message || "Failed to fetch candidates", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsOnly = async (id: number) => {
    try {
      const response = await applicationApi.getApplicationsByDriveId(id);

      if (response.data.success && response.data.data) {
        setApplications(response.data.data);
        if (response.data.data.length > 0) {
          setDriveName(response.data.data[0].driveName);
        }
      } else {
        showToast(response.data.message || "Failed to fetch candidates", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
      throw error;
    }
  };

  const fetchBatchCandidates = async (id: number) => {
    try {
      const response = await applicationApi.getBatchCandidatesByDriveId(id);
      if (response.data.success && response.data.data) {
        setBatchMap(response.data.data);
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    }
  };

  // Fetch evaluations when batch + round are both selected
  useEffect(() => {
    const roundNo = ROUND_NO_MAP[selectedRound];
    if (!roundNo || selectedBatch === "ALL") {
      setRoundEvaluation(null);
      return;
    }
    const applicationIds = batchMap[selectedBatch];
    if (!applicationIds || applicationIds.length === 0) {
      setRoundEvaluation(null);
      return;
    }
    fetchRoundEvaluations(roundNo, applicationIds);
  }, [selectedRound, selectedBatch, batchMap]);

  const fetchRoundEvaluations = async (roundNo: number, applicationIds: number[]) => {
    try {
      setEvaluationsLoading(true);
      const response = await candidateEvaluationApi.getEvaluationsByRoundAndApplications({
        roundNo,
        applicationIds,
      });
      if (response.success && response.data) {
        setRoundEvaluation(response.data);
      } else {
        setRoundEvaluation(null);
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
      setRoundEvaluation(null);
    } finally {
      setEvaluationsLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "IN_DRIVE":     return "dc-status-badge dc-status-in-drive";
      case "PASSED":       return "dc-status-badge dc-status-passed";
      case "SELECTED":     return "dc-status-badge dc-status-selected";
      case "FAILED":       return "dc-status-badge dc-status-failed";
      case "DROPPED":      return "dc-status-badge dc-status-dropped";
      case "ALLOTED":      return "dc-status-badge dc-status-on-hold";
      default:             return "dc-status-badge";
    }
  };

  const formatBatchTime = (batchTime: string) => {
    if (!batchTime || batchTime === "Unscheduled") return "Unscheduled";
    return new Date(batchTime).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };


  const formatUserDate = (name?: string, dateIso?: string) => {
    if (!name) return "-";
    if (!dateIso) return name;
    const d = new Date(dateIso);
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { name, date, time };
  };

  const handleStart = async () => {
    const user = tokenstore.getUser();
    if (!user) {
      showToast("User not found. Please log in again.", "error");
      return;
    }
    const ids = filteredApplications.map((app) => app.applicationId);
    if (ids.length === 0) {
      showToast("No candidates to start.", "error");
      return;
    }
    try {
      const response = await applicationApi.bulkUpdateApplicationStatus({
        applicationIds: ids,
        applicationStatus: "IN_DRIVE",
        updatedBy: user.userId,
      });
      if (response.data.success && response.data.data) {
        const { successCount, failureCount, successfulUpdates } = response.data.data;
        showToast(`Started: ${successCount} succeeded, ${failureCount} failed`, "success");
        // Merge updated applications into local state without full reload
        setApplications((prev) =>
          prev.map((app) => {
            const updated = successfulUpdates.find((u) => u.applicationId === app.applicationId);
            return updated ?? app;
          })
        );
      } else {
        showToast(response.data.message || "Failed to start drive", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    }
  };

  const batchOptions = Object.keys(batchMap);

  // Derive distinct round config IDs and evaluation statuses from data
  const distinctRounds = useMemo(() => {
    const rounds = new Set<number>();
    applications.forEach((app) => { if (app.latestRoundConfigId) rounds.add(app.latestRoundConfigId); });
    return Array.from(rounds).sort((a, b) => a - b);
  }, [applications]);

  const distinctEvalStatuses = useMemo(() => {
    const statuses = new Set<string>();
    applications.forEach((app) => { if (app.evaluationStatus) statuses.add(app.evaluationStatus); });
    return Array.from(statuses);
  }, [applications]);

  const toggleRoundFilter = (roundId: number) => {
    setSelectedRoundFilters((prev) => {
      const next = new Set(prev);
      if (next.has(roundId)) next.delete(roundId);
      else next.add(roundId);
      return next;
    });
  };

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Batch filter
      if (selectedBatch !== "ALL") {
        const appIds = batchMap[selectedBatch];
        if (!appIds || !appIds.includes(app.applicationId)) return false;
      }
      // Status filter — matches applicationStatus OR evaluationStatus
      if (statusFilter !== "ALL" && app.applicationStatus !== statusFilter && app.evaluationStatus !== statusFilter) return false;
      // Round filter
      if (selectedRoundFilters.size > 0 && !selectedRoundFilters.has(app.latestRoundConfigId)) return false;
      // Search by name or email
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const nameMatch = app.candidateName?.toLowerCase().includes(q);
        const emailMatch = app.candidateEmail?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [applications, selectedBatch, batchMap, statusFilter, searchText, selectedRoundFilters]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchText, statusFilter, selectedBatch, selectedRoundFilters]);

  const handleCopyPassEmails = useCallback(() => {
    const passEmails = filteredApplications
      .filter((app) => app.evaluationStatus === "PASS" || app.evaluationStatus === "PASSED")
      .map((app) => app.candidateEmail)
      .filter(Boolean) as string[];
    if (passEmails.length === 0) {
      showToast("No passed candidates found in the current view", "error");
      return;
    }
    copy(passEmails.join(', '));
    setCopiedPassEmails(true);
    setTimeout(() => setCopiedPassEmails(false), 2000);
  }, [filteredApplications]);

  const handleEmailPassCandidates = useCallback(async () => {
    const passApps = filteredApplications.filter(
      (app) => app.evaluationStatus === "PASS" || app.evaluationStatus === "PASSED"
    );

    if (passApps.length === 0) {
      showToast("No passed candidates found in the current view", "error");
      return;
    }

    const roundName = selectedRound !== "ALL" ? selectedRound : null;

    setEmailSending(true);
    try {
      await emailTemplateApi.sendPersonalizedEmail({
        templateId: EMAIL_TEMPLATE_IDS.ROUND_PASS_INVITE,
        driveName: driveName || undefined,
        roundName: roundName,
        recipients: passApps.map((app) => ({
          email: app.candidateEmail,
          candidateName: app.candidateName ?? null,
          roundNo: app.latestRoundConfigId ? String(app.latestRoundConfigId) : null,
        })),
      });
      showToast(`Emails sent to ${passApps.length} passed candidate(s)`, "success");
    } catch (err: unknown) {
      const appError = err as { message?: string };
      showToast(appError?.message ?? "Failed to send emails", "error");
    } finally {
      setEmailSending(false);
    }
  }, [filteredApplications, selectedRound, driveName]);

  const toggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set()); // exiting select mode clears selection
      return !prev;
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkRoundSkip = async (reason?: string) => {
    if (!updateStatusTo) {
      showToast("Select a status to update to", "error");
      return;
    }
    // If SKIP, require reason via overlay
    if (updateStatusTo === "SKIP" && !reason) {
      setShowReasonOverlay(true);
      return;
    }
    // If no rows manually selected, use all filtered applications
    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : filteredApplications.map((a) => a.applicationId);
    if (ids.length === 0) {
      showToast("No candidates in the table", "error");
      return;
    }
    const user = tokenstore.getUser();
    if (!user) {
      showToast("User not found. Please log in again.", "error");
      return;
    }
    const payload: BulkRoundSkipRequest = {
      applicationIds: ids,
      roundConfigId: 1,
      reviewedBy: user.userId,
      status: updateStatusTo as BulkRoundSkipRequest["status"],
      reason: updateStatusTo === "SKIP" ? reason : undefined,
    };
    try {
      setUpdating(true);
      const response = await candidateEvaluationApi.bulkRoundSkip(payload);
      if (response.success) {
        showToast(response.message || "Updated successfully", "success");
        setSelectedIds(new Set());
        setUpdateStatusTo("");
        // Re-fetch data
        if (driveId) fetchApplications(parseInt(driveId));
      } else {
        showToast(response.message || "Update failed", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleFinalizeClick = () => {
    // Determine which applications to finalize based on batch selection
    let applicationsToFinalize: ApplicationResponse[] = [];
    
    if (selectedBatch === "ALL") {
      // All applications across all batches
      applicationsToFinalize = applications;
    } else {
      // Filter by selected batch
      const batchAppIds = batchMap[selectedBatch];
      if (batchAppIds && batchAppIds.length > 0) {
        applicationsToFinalize = applications.filter(app => batchAppIds.includes(app.applicationId));
      }
    }

    if (applicationsToFinalize.length === 0) {
      showToast("No applications to finalize", "error");
      return;
    }

    // Check status validity
    const validStatuses = ["SELECTED", "FAILED", "DROPPED"];
    const invalidApps = applicationsToFinalize.filter(app => !validStatuses.includes(app.applicationStatus));
    const unfinished = invalidApps.length;

    if (unfinished > 0) {
      // Show warning dialog first
      setUnfinishedCount(unfinished);
      setFinalizeDialogVariant("warning");
      setShowFinalizeDialog(true);
    } else {
      // All valid, show confirmation
      setFinalizeDialogVariant("confirm");
      setShowFinalizeDialog(true);
    }
  };

  const handleFinalizeConfirm = async () => {
    // Collect application IDs
    let applicationIds: number[] = [];
    
    if (selectedBatch === "ALL") {
      applicationIds = applications.map(app => app.applicationId);
    } else {
      const batchAppIds = batchMap[selectedBatch];
      if (batchAppIds) {
        applicationIds = batchAppIds;
      }
    }

    if (applicationIds.length === 0) {
      showToast("No applications to finalize", "error");
      setShowFinalizeDialog(false);
      return;
    }

    // Check if all applications have status != ALLOTED and != IN_DRIVE
    const isClosed = applications.every(
      (app) => app.applicationStatus !== "ALLOTED" && app.applicationStatus !== "IN_DRIVE"
    );

    const request: FinalizeApplicationsRequest = { 
      applicationIds,
      isClosed 
    };

    try {
      setFinalizing(true);
      const response = await applicationApi.finalizeApplications(request);
      
      if (response.success && response.data) {
        showToast(
          `Successfully finalized! ${response.data.updatedCount} candidate(s) updated.`,
          "success"
        );
        setShowFinalizeDialog(false);
        // Refresh data
        if (driveId) fetchApplications(parseInt(driveId));
      } else {
        showToast(response.message || "Failed to finalize applications", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    } finally {
      setFinalizing(false);
    }
  };

  const handleWarningProceed = () => {
    // User acknowledged warning, now show final confirmation
    setFinalizeDialogVariant("confirm");
  };

  const hasAlloted = filteredApplications.some((app) => app.applicationStatus === "ALLOTED");
  const canAddScores = !hasAlloted && filteredApplications.length > 0;
 
  if (loading) {
    return (
      <Box className="dc-container">
        <Box className="dc-loading">
          <CircularProgress size={40} className="dc-loading-spinner" />
          <Typography className="dc-loading-text">Loading candidates...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="dc-container">
      {/* Header — mirrors InstitutesList / DriveList pattern */}
      <Card className="dc-header">
        <Box className="dc-header-left">
          <BackButton variant="header" />
          <Typography variant="h6" className="dc-title">
            {driveName ? `${driveName} — Candidates` : "Drive Candidates"}
          </Typography>
        </Box>

        <Box className="dc-header-actions">
          <Select
            value={selectedBatch}
            onChange={(e) => updateFilter("batch", e.target.value as string)}
            className="dc-select"
            size="small"
            displayEmpty
          >
            <MenuItem value="ALL">All Batches</MenuItem>
            {batchOptions.map((batch) => (
              <MenuItem key={batch} value={batch}>
                {formatBatchTime(batch)}
              </MenuItem>
            ))}
          </Select>

          <Select
            value={selectedRound}
            onChange={(e) => updateFilter("round", e.target.value as string)}
            className="dc-select"
            size="small"
          >
            <MenuItem value="ALL">All Rounds</MenuItem>
            <MenuItem value="APTITUDE">Aptitude</MenuItem>
            <MenuItem value="COMMUNICATION">Communication</MenuItem>
            <MenuItem value="TECHNICAL">Technical</MenuItem>
          </Select>

          {evaluationsLoading && <CircularProgress size={20} />}
          <Button variant="contained" className="dc-btn-action" onClick={handleStart} disabled={selectedRound !== "ALL"}>Start</Button>
          <Button variant="contained" className="dc-btn-action" disabled={!canAddScores} onClick={() => navigate(`/drive-process/add-scores/${driveId}/round1`)}>Add Score</Button>
          
          <Button variant="contained" className="dc-btn-action" onClick={handleFinalizeClick}>Finalize</Button>
        </Box>
      </Card>

      {/* Filter bar — above the table */}
      {selectedRound === "ALL" && (
        <Card className="dc-filter-bar">
          <span className="dc-round-checkboxes">
            {distinctRounds.map((r) => (
              <label key={r} className={`dc-round-chip${selectedRoundFilters.has(r) ? " dc-round-chip-active" : ""}`}>
                <input type="checkbox" checked={selectedRoundFilters.has(r)} onChange={() => toggleRoundFilter(r)} />
                R{r}
              </label>
            ))}
          </span>

          <select
            className="dc-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option disabled>── Application ──</option>
            <option value="ALLOTED">Alloted</option>
            <option value="IN_DRIVE">In Drive</option>
            <option value="DROPPED">Dropped</option>
            <option value="FAILED">Failed</option>
            <option value="SELECTED">Selected</option>
            {distinctEvalStatuses.length > 0 && <option disabled>── Evaluation ──</option>}
            {distinctEvalStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <input
            type="text"
            className="dc-filter-input"
            placeholder="Search by name or email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <Button
            variant={selectMode ? "outlined" : "contained"}
            className={selectMode ? "dc-btn-select-active" : "dc-btn-action"}
            onClick={toggleSelectMode}
          >
            {selectMode ? `Cancel (${selectedIds.size})` : "Select"}
          </Button>

          <select
            className="dc-filter-select"
            value={updateStatusTo}
            onChange={(e) => setUpdateStatusTo(e.target.value)}
          >
            <option value="">Update Status To...</option>
            <option value="ABSENT">Absent</option>
            <option value="HOLD">Hold</option>
            <option value="SKIP">Skip</option>
          </select>

          <Button
            variant="contained"
            className="dc-btn-action"
            disabled={!updateStatusTo || updating}
            onClick={() => handleBulkRoundSkip()}
          >
            {updating ? "Updating..." : selectedIds.size > 0 ? `Update (${selectedIds.size})` : `Update All (${filteredApplications.length})`}
          </Button>

          <Box className="dc-filter-bar-spacer" />

          <Tooltip title="Refresh data" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
              className="dc-icon-btn"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Send Email to Passed Candidates" arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
            <span>
              <IconButton
                className="dc-email-btn"
                onClick={handleEmailPassCandidates}
                disabled={emailingSending}
              >
                {emailingSending ? <CircularProgress size={18} /> : <EmailIcon />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={copiedPassEmails ? "Copied!" : "Copy passed candidates' emails"} arrow classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}>
            <span>
              <IconButton
                className={copiedPassEmails ? "dc-copy-pass-btn-copied" : "dc-copy-pass-btn"}
                onClick={handleCopyPassEmails}
                disabled={emailingSending}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Card>
      )}

      {/* Content area: Round scores view OR candidates table */}
      {roundEvaluation && selectedRound !== "ALL" && selectedBatch !== "ALL" ? (
        <Round1 data={roundEvaluation} onStatusUpdated={() => {
          const roundNo = ROUND_NO_MAP[selectedRound];
          const applicationIds = batchMap[selectedBatch];
          if (roundNo && applicationIds?.length) fetchRoundEvaluations(roundNo, applicationIds);
        }} onAllocatePanel={(candidates: PanelCandidate[]) => {
          navigate(`/drive-process/panel-allocation/${driveId}`, {
            state: {
              candidates,
              roundNo: ROUND_NO_MAP[selectedRound],
              batchTime: selectedBatch,
              driveName,
            }
          });
        }} />
      ) : evaluationsLoading ? (
        <Box className="dc-loading">
          <CircularProgress size={30} className="dc-loading-spinner" />
          <Typography className="dc-loading-text">Loading round data...</Typography>
        </Box>
      ) : filteredApplications.length === 0 ? (
        <Card className="dc-empty-card">
          <Typography variant="h6" className="dc-empty-title">
            No candidates found
          </Typography>
          <Typography variant="body2" className="dc-empty-subtitle">
            No applications have been submitted for this drive yet.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} className="dc-table-container">
          <Table className="dc-table">
            <TableHead>
              <TableRow className="dc-table-head-row">
                <TableCell className="dc-th">Index</TableCell>
                <TableCell className="dc-th">Candidate Name</TableCell>
                <TableCell className="dc-th">Email</TableCell>
              
                <TableCell className="dc-th">Round No</TableCell>
                <TableCell className="dc-th">Evaluation</TableCell>
                <TableCell className="dc-th">Created By</TableCell>
                <TableCell className="dc-th">Updated By</TableCell>
                
                <TableCell className="dc-th">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((app, index) => (
                <TableRow key={app.applicationId}
                  className={`dc-table-row${selectedIds.has(app.applicationId) ? " dc-row-selected" : ""}`}
                  onClick={() => {
                    if (selectMode) toggleSelect(app.applicationId);
                    else navigate("/drive-process/application-history", { state: { driveId: app.driveId, candidateId: app.candidateId } });
                  }}
                >
                  <TableCell className="dc-td">{index + 1}</TableCell>
                  <TableCell className="dc-td dc-td-name">{app.candidateName}</TableCell>
                  <TableCell className="dc-td">{app.candidateEmail}</TableCell>
                 
                 
                  <TableCell className="dc-td">{app.latestRoundConfigId || "-"}</TableCell>
                  <TableCell className="dc-td">
                    <span className={`dc-eval-badge dc-eval-${app.evaluationStatus.toLowerCase()}`}>
                      {app.evaluationStatus}
                    </span>
                  </TableCell>

                  <TableCell className="dc-td">
                    {(() => {
                      const result = formatUserDate(app.createdByName, app.createdAt);
                      if (typeof result === "string") return result;
                      return (
                        <Tooltip
                          title={
                            <span className="dc-tooltip-content">
                              <span className="dc-tooltip-date">{result.date}</span>
                              <span className="dc-tooltip-time">{result.time}</span>
                            </span>
                          }
                          arrow
                          placement="top"
                          classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                        >
                          <span className="dc-user-name">{result.name}</span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="dc-td">
                    {(() => {
                      const result = formatUserDate(app.updatedByName, app.updatedAt);
                      if (typeof result === "string") return result;
                      return (
                        <Tooltip
                          title={
                            <span className="dc-tooltip-content">
                              <span className="dc-tooltip-date">{result.date}</span>
                              <span className="dc-tooltip-time">{result.time}</span>
                            </span>
                          }
                          arrow
                          placement="top"
                          classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
                        >
                          <span className="dc-user-name">{result.name}</span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                   <TableCell className="dc-td">
                    <span className={getStatusClass(app.applicationStatus)}>
                      {app.applicationStatus.replace("_", " ")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {/* Skip reason overlay */}
      {showReasonOverlay && (
        <div className="dc-overlay-backdrop" onClick={() => setShowReasonOverlay(false)}>
          <div className="dc-overlay-card" onClick={(e) => e.stopPropagation()}>
            <Typography className="dc-overlay-title">Skip Reason</Typography>
            <textarea
              className="dc-overlay-textarea"
              placeholder="Enter reason for skipping..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              rows={3}
            />
            <div className="dc-overlay-actions">
              <Button
                className="dc-overlay-btn-cancel"
                variant="outlined"
                size="small"
                onClick={() => { setShowReasonOverlay(false); setSkipReason(""); }}
              >
                Cancel
              </Button>
              <Button
                className="dc-overlay-btn-submit"
                variant="contained"
                size="small"
                disabled={!skipReason.trim() || updating}
                onClick={() => {
                  setShowReasonOverlay(false);
                  handleBulkRoundSkip(skipReason.trim());
                  setSkipReason("");
                }}
              >
                {updating ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize confirmation dialog */}
      {showFinalizeDialog && (
        <div className="dc-overlay-backdrop" onClick={() => !finalizing && setShowFinalizeDialog(false)}>
          <div className="dc-finalize-dialog" onClick={(e) => e.stopPropagation()}>
            {finalizeDialogVariant === "warning" ? (
              <>
                <Typography className="dc-dialog-title dc-dialog-title-warning">⚠️ Warning</Typography>
                <Typography className="dc-dialog-message">
                  {unfinishedCount} candidate(s) haven't finished the interview process 
                  (status is IN_DRIVE). Would you like to proceed anyway?
                </Typography>
                <div className="dc-dialog-actions">
                  <Button
                    className="dc-dialog-btn-cancel"
                    variant="outlined"
                    size="small"
                    onClick={() => setShowFinalizeDialog(false)}
                    disabled={finalizing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="dc-dialog-btn-proceed"
                    variant="contained"
                    size="small"
                    onClick={handleWarningProceed}
                    disabled={finalizing}
                  >
                    Proceed
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Typography className="dc-dialog-title">Confirm Finalization</Typography>
                <Typography className="dc-dialog-message">
                  Are you sure you want to finalize these applications? 
                  This will update candidate stages based on their application status.
                  {selectedBatch === "ALL" 
                    ? ` All ${applications.length} applications will be finalized.`
                    : ` Applications in the selected batch will be finalized.`}
                </Typography>
                <div className="dc-dialog-actions">
                  <Button
                    className="dc-dialog-btn-cancel"
                    variant="outlined"
                    size="small"
                    onClick={() => setShowFinalizeDialog(false)}
                    disabled={finalizing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="dc-dialog-btn-confirm"
                    variant="contained"
                    size="small"
                    onClick={handleFinalizeConfirm}
                    disabled={finalizing}
                  >
                    {finalizing ? "Finalizing..." : "Confirm"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Box>
  );
};

export default DriveCandidates;
