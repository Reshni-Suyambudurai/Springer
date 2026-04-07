import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationApi, candidateEvaluationApi } from "../../../services/driveschedule.api";
import type { ApplicationResponse, BatchCandidatesMap } from "../../../types/TA_Recruiter/DriveSchedule/application.types";
import type { RoundEvaluationResponse } from "../../../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import { tokenstore } from "../../../auth/tokenstore";
import { Box, Card, Typography, CircularProgress, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import BackButton from "../../Common/BackButton";
import Round1 from "./Scores/Round1";
import "../../../css/TA_Recruiter/DriveProcess/DriveCandidates.css";

const ROUND_NO_MAP: Record<string, number> = {
  APTITUDE: 1,
  COMMUNICATION: 2,
  TECHNICAL: 3,
};

const DriveCandidates: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driveName, setDriveName] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [selectedRound, setSelectedRound] = useState<string>("ALL");
  const [batchMap, setBatchMap] = useState<BatchCandidatesMap>({});
  const [roundEvaluation, setRoundEvaluation] = useState<RoundEvaluationResponse | null>(null);
  const [evaluationsLoading, setEvaluationsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (driveId) {
      const id = parseInt(driveId);
      fetchApplications(id);
      fetchBatchCandidates(id);
    }
  }, [driveId]);

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

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear()).slice(2);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${day}/${month}/${year}-${hours}:${minutes}${ampm}`;
  };

  const formatUserDate = (name?: string, dateIso?: string) => {
    if (!name) return "-";
    if (!dateIso) return name;
    return `${name} (${formatDateTime(dateIso)})`;
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

  const filteredApplications = applications.filter((app) => {
    if (selectedBatch === "ALL") return true;
    const appIds = batchMap[selectedBatch];
    return appIds ? appIds.includes(app.applicationId) : false;
  });

  const hasInDrive = filteredApplications.some((app) => app.applicationStatus === "IN_DRIVE");

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
            onChange={(e) => setSelectedBatch(e.target.value as string)}
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
            onChange={(e) => setSelectedRound(e.target.value as string)}
            className="dc-select"
            size="small"
          >
            <MenuItem value="ALL">All Rounds</MenuItem>
            <MenuItem value="APTITUDE">Aptitude</MenuItem>
            <MenuItem value="COMMUNICATION">Communication</MenuItem>
            <MenuItem value="TECHNICAL">Technical</MenuItem>
          </Select>

          {evaluationsLoading && <CircularProgress size={20} />}
 <Button variant="outlined" className="dc-btn-action" onClick={handleStart}>Start</Button>
          <Button variant="outlined" className="dc-btn-action" disabled={!hasInDrive}>Allocate Panel</Button>
          <Button variant="outlined" className="dc-btn-action" disabled={!hasInDrive} onClick={() => navigate(`/drive-process/add-scores/${driveId}`)}>Add Score</Button>
        </Box>
      </Card>

      {/* Content area: Round scores view OR candidates table */}
      {roundEvaluation && selectedRound !== "ALL" && selectedBatch !== "ALL" ? (
        <Round1 data={roundEvaluation} />
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
              
                <TableCell className="dc-th">Status</TableCell>
                <TableCell className="dc-th">Created By</TableCell>
                <TableCell className="dc-th">Updated By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((app, index) => (
                <TableRow key={app.applicationId} className="dc-table-row">
                  <TableCell className="dc-td">{index + 1}</TableCell>
                  <TableCell className="dc-td dc-td-name">{app.candidateName}</TableCell>
                  <TableCell className="dc-td">{app.candidateEmail}</TableCell>
                 
                  <TableCell className="dc-td">
                    <span className={getStatusClass(app.applicationStatus)}>
                      {app.applicationStatus.replace("_", " ")}
                    </span>
                  </TableCell>

                  <TableCell className="dc-td">
                    {formatUserDate(app.createdByName, app.createdAt)}
                  </TableCell>
                  <TableCell className="dc-td">
                    {formatUserDate(app.updatedByName, app.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default DriveCandidates;
