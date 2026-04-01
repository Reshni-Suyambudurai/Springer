import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { applicationApi } from "../../../services/driveschedule.api";
import type { ApplicationResponse } from "../../../types/TA_Recruiter/DriveSchedule/application.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import { Box, Card, Typography, CircularProgress, Select, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import BackButton from "../../Common/BackButton";
import "../../../css/TA_Recruiter/DriveProcess/DriveCandidates.css";

const DriveCandidates: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driveName, setDriveName] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [selectedRound, setSelectedRound] = useState<string>("ALL");

  useEffect(() => {
    if (driveId) {
      fetchApplications(parseInt(driveId));
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

  const batchOptions = Array.from(
    new Set(applications.map((a) => a.batchTime ?? "Unscheduled"))
  );

  const filteredApplications = applications.filter((app) =>
    selectedBatch === "ALL" || (app.batchTime ?? "Unscheduled") === selectedBatch
  );

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
          <BackButton inline />
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

          <Button variant="outlined" className="dc-btn-action">Panel Assignment</Button>
          <Button variant="outlined" className="dc-btn-action">Add Score</Button>
        </Box>
      </Card>

      {/* Empty state */}
      {filteredApplications.length === 0 ? (
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
                <TableCell className="dc-th">#</TableCell>
                <TableCell className="dc-th">Candidate Name</TableCell>
                <TableCell className="dc-th">Email</TableCell>
                <TableCell className="dc-th">Reg. Code</TableCell>
                <TableCell className="dc-th">Status</TableCell>
                <TableCell className="dc-th">Created By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((app, index) => (
                <TableRow key={app.applicationId} className="dc-table-row">
                  <TableCell className="dc-td">{index + 1}</TableCell>
                  <TableCell className="dc-td dc-td-name">{app.candidateName}</TableCell>
                  <TableCell className="dc-td">{app.candidateEmail}</TableCell>
                  <TableCell className="dc-td">{app.registrationCode}</TableCell>
                  <TableCell className="dc-td">
                    <span className={getStatusClass(app.applicationStatus)}>
                      {app.applicationStatus.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="dc-td">{app.createdByName}</TableCell>
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
