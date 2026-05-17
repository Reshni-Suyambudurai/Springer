import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, Typography, CircularProgress } from "@mui/material";
import BackButton from "../../Common/BackButton";
import { driveScheduleApi } from "../../../services/driveschedule.api";
import type { DriveAnalyticsResponse } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import { showToast } from "../../../utils/toast";
import { handleAxiosError } from "../../../services/api.error";
import "../../../css/TA_Recruiter/DriveProcess/DriveDetails.css";

const DriveDetails: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<DriveAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (driveId) {
      fetchAnalytics(parseInt(driveId));
    }
  }, [driveId]);

  const fetchAnalytics = async (id: number) => {
    try {
      setLoading(true);
      const response = await driveScheduleApi.getDriveAnalytics({ driveId: id });
      if (response.data.success && response.data.data) {
        setAnalytics(response.data.data);
      } else {
        showToast(response.data.message || "Failed to fetch drive details", "error");
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  const formatBatchTime = (key: string) => {
    if (key === "unscheduled") return "Unscheduled";
    return new Date(key).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  if (loading) {
    return (
      <Box className="dd-container">
        <Box className="dd-loading">
          <CircularProgress size={40} className="dd-loading-spinner" />
          <Typography className="dd-loading-text">Loading drive details...</Typography>
        </Box>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box className="dd-container">
        <Typography className="dd-not-found">Drive not found.</Typography>
      </Box>
    );
  }

  const { 
    driveSchedule: drive, 
    totalApplications, 
    distinctBatchTimeCount, 
    applicationsPerBatchTime,
    applicationStatusCounts,
    round1Analytics,
    round2Analytics,
    round3Analytics
  } = analytics;

  const calculatePercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  const getStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      'ALLOTED': 'alloted',
      'IN_DRIVE': 'in-drive',
      'DROPPED': 'dropped',
      'FAILED': 'failed',
      'SELECTED': 'selected'
    };
    return statusMap[status] || 'default';
  };

  const getEvaluationStatusColor = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PASS': 'pass',
      'FAIL': 'fail',
      'ABSENT': 'absent',
      'PENDING': 'pending',
      'HOLD': 'hold',
      'SKIP': 'skip'
    };
    return statusMap[status] || 'default';
  };

  const formatStatusLabel = (status: string): string => {
    return status.replace(/_/g, ' ');
  };

  return (
    <Box className="dd-container">

      {/* ═══ Header — fixed, flex-shrink: 0 ═══ */}
      <Card className="dd-header">
        <BackButton onClick={handleBackClick} variant="header" />
        <Box className="dd-header-center">
          <Typography variant="h5" className="dd-header-title">{drive.driveName}</Typography>
          <Typography className="dd-header-sub">{drive.cycleName}</Typography>
        </Box>
        <Box className="dd-header-spacer" />
      </Card>

      {/* ═══ Scrollable content area ═══ */}
      <Box className="dd-content">

        {/* Row 0: Drive Analytics — Top Section */}
        <Card className="dd-card dd-analytics-card">
          <Typography className="dd-card-heading">Drive Analytics Overview</Typography>
          
          <Box className="dd-analytics-container">
            {/* Left Section: Application Status Progress Bars */}
            <Box className="dd-analytics-left">
              <Typography className="dd-analytics-section-title">Application Status</Typography>
              <Box className="dd-status-list">
                {Object.entries(applicationStatusCounts || {}).map(([status, count]) => {
                  const percentage = calculatePercentage(count, totalApplications);
                  return (
                    <Box key={status} className="dd-status-item">
                      <Box className="dd-status-header">
                        <Typography className="dd-status-label">{formatStatusLabel(status)}</Typography>
                        <Typography className="dd-status-count">{count}</Typography>
                      </Box>
                      <Box className="dd-progress-row">
                        <Box className="dd-progress-container">
                          <Box 
                            className={`dd-progress-bar dd-progress-${getStatusColor(status)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </Box>
                        <Typography className="dd-status-percentage">{percentage}%</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Right Section: Round Evaluations */}
            <Box className="dd-analytics-right">
              <Typography className="dd-analytics-section-title">Round-wise Evaluation Analytics</Typography>
              <Box className="dd-rounds-container">
                {[round1Analytics, round2Analytics, round3Analytics].map((roundData, index) => {
                  if (!roundData) {
                    return (
                      <Box key={index} className="dd-round-card dd-round-empty">
                        <Box className="dd-round-card-inner">
                          <Typography className="dd-round-name">Round {index + 1}</Typography>
                          <Typography className="dd-round-empty-text">No evaluations yet</Typography>
                        </Box>
                      </Box>
                    );
                  }

                  return (
                    <Box key={roundData.roundConfigId} className="dd-round-card">
                      <Box className="dd-round-card-inner">
                        <Box className="dd-round-header">
                          <Typography className="dd-round-name">{roundData.roundName}</Typography>
                          <Box className="dd-round-attended">
                            <Typography className="dd-round-attended-count">{roundData.totalAttended}</Typography>
                            <Typography className="dd-round-attended-label">Attended</Typography>
                          </Box>
                        </Box>
                        <Box className="dd-round-status-list">
                          {Object.entries(roundData.statusCounts).map(([status, count]) => {
                            const percentage = calculatePercentage(count, roundData.totalAttended);
                            return (
                              <Box key={status} className="dd-round-status-item">
                                <Box className="dd-round-progress-wrapper">
                                  <Box 
                                    className={`dd-round-progress-fill dd-eval-bar-${getEvaluationStatusColor(status)}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                  <Box className="dd-round-progress-content">
                                    <Typography className="dd-round-progress-label">
                                      {formatStatusLabel(status)}
                                    </Typography>
                                    <Typography className="dd-round-progress-percent">
                                      {percentage}%
                                    </Typography>
                                    <Typography className="dd-round-progress-count">
                                      {count}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Row 1: Left card (location, institute, description) + Right card (dates) */}
        <Box className="dd-cards-row">

          {/* Left — Drive Info */}
          <Card className="dd-card dd-card-left">
            <Box className="dd-card-top">
              <Typography className="dd-card-heading">Drive Info</Typography>
              <Box className="dd-badges">
                <span className={`dd-badge dd-mode-${drive.driveMode.toLowerCase().replace("_", "-")}`}>
                  {drive.driveMode.replace("_", " ")}
                </span>
                <span className={`dd-badge dd-status-${drive.status.toLowerCase()}`}>
                  {drive.status}
                </span>
              </Box>
            </Box>

            <Box className="dd-field">
              <Typography className="dd-field-label">Location</Typography>
              <Typography className="dd-field-value">{drive.location}</Typography>
            </Box>

            <Box className="dd-field">
              <Typography className="dd-field-label">Institute</Typography>
              <Typography className="dd-field-value">{drive.instituteName || "Off Campus"}</Typography>
            </Box>

            {drive.description && (
              <Box className="dd-field">
                <Typography className="dd-field-label">Description</Typography>
                <Typography className="dd-field-value">{drive.description}</Typography>
              </Box>
            )}
          </Card>

          {/* Right — Date Card */}
          <Card className="dd-card dd-card-right">
            <Typography className="dd-card-heading">Schedule Dates</Typography>

            <Box className="dd-date-block">
              <Typography className="dd-date-label">Start Date</Typography>
              <Typography className="dd-date-value">{formatDate(drive.startDate)}</Typography>
            </Box>

            <Box className="dd-date-divider" />

            <Box className="dd-date-block">
              <Typography className="dd-date-label">End Date</Typography>
              <Typography className="dd-date-value">{formatDate(drive.endDate)}</Typography>
            </Box>
          </Card>
        </Box>

        {/* Row 2: Created / Updated by */}
        <Card className="dd-card">
          <Box className="dd-meta-footer">
            <Box className="dd-meta-item">
              <Typography className="dd-meta-label">Created by</Typography>
              <Typography className="dd-meta-name">{drive.createdByName}</Typography>
              <Typography className="dd-meta-time">{formatDateTime(drive.createdAt)}</Typography>
            </Box>
            {drive.updatedByName && (
              <Box className="dd-meta-item dd-meta-item--right">
                <Typography className="dd-meta-label">Updated by</Typography>
                <Typography className="dd-meta-name">{drive.updatedByName}</Typography>
                <Typography className="dd-meta-time">{formatDateTime(drive.updatedAt)}</Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* Row 3: Batch Time Distribution */}
        <Card className="dd-card">
          <Typography className="dd-card-heading">Batch Time Distribution</Typography>

          <Box className="dd-stats-row">
            <Box className="dd-stat-box">
              <Typography className="dd-stat-value">{totalApplications}</Typography>
              <Typography className="dd-stat-label">Total Applications</Typography>
            </Box>
            <Box className="dd-stat-box">
              <Typography className="dd-stat-value">{distinctBatchTimeCount}</Typography>
              <Typography className="dd-stat-label">Distinct Batch Times</Typography>
            </Box>
          </Box>

          {Object.keys(applicationsPerBatchTime).length > 0 && (
            <Box className="dd-batch-table">
              <Box className="dd-batch-table-head">
                <Typography className="dd-batch-th">Batch Time</Typography>
                <Typography className="dd-batch-th dd-batch-th--right">Applications</Typography>
              </Box>
              {Object.entries(applicationsPerBatchTime).map(([key, count]) => (
                <Box key={key} className="dd-batch-row">
                  <Typography className="dd-batch-td">{formatBatchTime(key)}</Typography>
                  <Typography className="dd-batch-td dd-batch-td--right">
                    <span className="dd-count-badge">{count}</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>

      </Box>
    </Box>
  );
};

export default DriveDetails;

