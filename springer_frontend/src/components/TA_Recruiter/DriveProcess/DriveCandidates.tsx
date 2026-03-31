import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationApi } from "../../../services/driveschedule.api";
import type { ApplicationResponse } from "../../../types/TA_Recruiter/DriveSchedule/application.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import { Box, Card, Typography, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../../../css/TA_Recruiter/DriveProcess/DriveCandidates.css";

const DriveCandidates: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [driveName, setDriveName] = useState<string>("");

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

  const handleBackClick = () => {
    navigate(-1);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "IN_DRIVE":     return "dc-status-badge dc-status-in-drive";
      case "PASSED":       return "dc-status-badge dc-status-passed";
      case "SELECTED":     return "dc-status-badge dc-status-selected";
      case "FAILED":       return "dc-status-badge dc-status-failed";
      case "DROPPED":      return "dc-status-badge dc-status-dropped";
      case "ON_HOLD":      return "dc-status-badge dc-status-on-hold";
      default:             return "dc-status-badge";
    }
  };

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
        <IconButton className="dc-back-btn" onClick={handleBackClick}>
          <ArrowBackIcon />
        </IconButton>

        <Box className="dc-header-center">
          <Typography variant="h6" className="dc-title">
            {driveName ? `${driveName} — Candidates` : "Drive Candidates"}
          </Typography>
          <Typography variant="body2" className="dc-subtitle">
            {applications.length} candidate{applications.length !== 1 ? "s" : ""} applied
          </Typography>
        </Box>

        {/* Spacer to balance back button */}
        <Box className="dc-header-spacer" />
      </Card>

      {/* Empty state */}
      {applications.length === 0 ? (
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
              {applications.map((app, index) => (
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
