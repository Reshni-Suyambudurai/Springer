import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { driveScheduleApi } from "../../../services/driveschedule.api";
import type { DriveResponse } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import { Box, Card, Typography, IconButton, CircularProgress, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../../../css/TA_Recruiter/DriveProcess/DriveList.css";

const DriveList: React.FC = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const [drives, setDrives] = useState<DriveResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cycleName, setCycleName] = useState<string>("");

  useEffect(() => {
    if (cycleId) {
      fetchDrivesByCycle(parseInt(cycleId));
    }
  }, [cycleId]);

  const fetchDrivesByCycle = async (id: number) => {
    try {
      setLoading(true);
      const response = await driveScheduleApi.getDrivesByCycleId({ cycleId: id });

      if (response.data.success && response.data.data) {
        setDrives(response.data.data);
        if (response.data.data.length > 0) {
          setCycleName(response.data.data[0].cycleName);
        }
      } else {
        showToast(response.data.message || "Failed to fetch drives", "error");
      }
    } catch (error: unknown) {
      const appError = handleAxiosError(error);
      showToast(appError.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate("/drive-process/drive-cycle");
  };

  const handleDetails = (driveId: number) => {
    navigate(`/drive-process/drive-details/${driveId}`);
  };

  const handleCandidateScore = (driveId: number) => {
    navigate(`/drive-process/drive-candidates/${driveId}`);
  };

  if (loading) {
    return (
      <Box className="drive-list-container">
        <Box className="drive-list-loading">
          <CircularProgress size={40} className="drive-list-loading-spinner" />
          <Typography className="drive-list-loading-text">Loading drives...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="drive-list-container">
      {/* Header - matches InstitutesList pattern */}
      <Card className="drive-list-header">
        <IconButton className="drive-list-back-btn" onClick={handleBackClick}>
          <ArrowBackIcon />
        </IconButton>

        <Box className="drive-list-header-center">
          <Typography variant="h4" className="drive-list-title">
            {cycleName ? `${cycleName} — Drives` : "Drive Schedules"}
          </Typography>
          <Typography variant="body2" className="drive-list-subtitle">
            {drives.length} drive{drives.length !== 1 ? "s" : ""} found
          </Typography>
        </Box>

        {/* Spacer to balance back button */}
        <Box className="drive-list-header-spacer" />
      </Card>

      {/* Cards Grid */}
      {drives.length === 0 ? (
        <Card className="drive-list-empty-card">
          <Typography variant="h6" className="drive-list-empty-title">
            No drives found
          </Typography>
          <Typography variant="body2" className="drive-list-empty-subtitle">
            No drive schedules exist for this hiring cycle yet.
          </Typography>
        </Card>
      ) : (
        <Box className="drive-list-grid">
          {drives.map((drive) => (
            <Card key={drive.driveId} className="drive-list-card">
              {/* Card Header */}
              <Box className="drive-list-card-header">
                <Typography className="drive-list-card-title">{drive.driveName}</Typography>
                <Box className="drive-list-card-badges">
                  <span className={`drive-list-badge drive-list-mode-${drive.driveMode.toLowerCase().replace("_", "-")}`}>
                    {drive.driveMode.replace("_", " ")}
                  </span>
                  <span className={`drive-list-badge drive-list-status-${drive.status.toLowerCase()}`}>
                    {drive.status}
                  </span>
                </Box>
              </Box>

              {/* Card Info */}
              <Box className="drive-list-card-body">
                <Box className="drive-list-card-info-row">
                  <Typography className="drive-list-card-label">Location</Typography>
                  <Typography className="drive-list-card-value">{drive.location}</Typography>
                </Box>

                <Box className="drive-list-card-info-row">
                  <Typography className="drive-list-card-label">Created by</Typography>
                  <Typography className="drive-list-card-value">{drive.createdByName}</Typography>
                </Box>

                {drive.updatedByName && (
                  <Box className="drive-list-card-info-row">
                    <Typography className="drive-list-card-label">Updated by</Typography>
                    <Typography className="drive-list-card-value">{drive.updatedByName}</Typography>
                  </Box>
                )}
              </Box>

              {/* Card Actions */}
              <Box className="drive-list-card-actions">
                <Button
                  className="drive-list-btn drive-list-btn-details"
                  onClick={() => handleDetails(drive.driveId)}
                >
                  Details
                </Button>
                <Button
                  className="drive-list-btn drive-list-btn-score"
                  onClick={() => handleCandidateScore(drive.driveId)}
                >
                  Candidate Score
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DriveList;

