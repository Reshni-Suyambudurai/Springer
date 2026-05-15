import React, { useState } from "react";
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Tooltip,
  Chip,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import { driveScheduleApi, applicationApi } from "../../../services/driveschedule.api";
import type { UpcomingDriveSummaryResponse } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import "../../../css/TA_Recruiter/Candidates/ScheduleDrive.css";

import type { ApplicationRequest } from "../../../types/TA_Recruiter/DriveSchedule/application.types";

interface ScheduleDriveProps {
  cycleId: number | null;
  driveId: number | null;
  candidateIds: number[];
  selectMode: boolean;
  selectedCount: number;
  totalElements: number;
  filterRequest?: ApplicationRequest["filterRequest"];
  onScheduleComplete: () => void;
}

const ScheduleDrive: React.FC<ScheduleDriveProps> = ({
  cycleId,
  driveId,
  candidateIds,
  selectMode,
  selectedCount,
  totalElements,
  filterRequest,
  onScheduleComplete,
}) => {
  const [selectedDrive, setSelectedDrive] = useState<UpcomingDriveSummaryResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [loadingDrives, setLoadingDrives] = useState<boolean>(false);
  const [scheduling, setScheduling] = useState<boolean>(false);
  const [batchTimeInput, setBatchTimeInput] = useState<string>("");
  const [batchTimeError, setBatchTimeError] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false);

  const handleScheduleClick = async () => {
    if (!cycleId || !driveId) {
      showToast("Please select a hiring cycle and drive first", "error");
      return;
    }

    if (selectMode ? candidateIds.length === 0 : totalElements === 0) {
      showToast(
        selectMode ? "Please select candidates to schedule" : "No candidates available to schedule",
        "error"
      );
      return;
    }

    setLoadingDrives(true);

    try {
      const response = await driveScheduleApi.getUpcomingDrivesByCycle({ cycleId });
      if (response.data && response.data.data) {
        const upcomingDrives = response.data.data;
        const matchedDrive = upcomingDrives.find((d) => d.driveId === driveId);

        if (!matchedDrive) {
          showToast("The drive is in past can't schedule", "error");
        } else {
          setSelectedDrive(matchedDrive);
          setBatchTimeInput("");
          setBatchTimeError(false);
          setShowConfirmDialog(true);
        }
      }
    } catch (error) {
      showToast("Failed to fetch upcoming drives", "error");
      console.error("Error fetching upcoming drives:", error);
    } finally {
      setLoadingDrives(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDrive || !cycleId) return;

    if (!batchTimeInput) {
      setBatchTimeError(true);
      return;
    }

    const user = tokenstore.getUser();
    if (!user) {
      showToast("Unable to get user information", "error");
      return;
    }

    setScheduling(true);
    try {
      // Build batchTime ISO string from drive's startDate + picked time
      const batchTime =
        selectedDrive.startDate && batchTimeInput
          ? `${selectedDrive.startDate}T${batchTimeInput}:00`
          : undefined;

      const response = await applicationApi.createApplications(
        selectMode
          ? {
              driveId: selectedDrive.driveId,
              candidateIds: candidateIds,
              batchTime,
              createdBy: user.userId,
            }
          : {
              driveId: selectedDrive.driveId,
              filterRequest: filterRequest,
              batchTime,
              createdBy: user.userId,
            }
      );

      if (response.data && response.data.data) {
        const result = response.data.data;
        
        // Check if there are any errors
        if (result.errorMessages && result.errorMessages.length > 0) {
          setErrorMessages(result.errorMessages);
          setShowErrorDialog(true);
          
          // Show summary toast
          if (result.successCount > 0) {
            showToast(
              `Scheduled ${result.successCount} candidates successfully. ${result.failureCount} failed.`,
              "error"
            );
          } else {
            showToast(`Failed to schedule all candidates. View details for more information.`, "error");
          }
        } else {
          // All successful
          showToast(
            `Scheduled ${result.successCount} candidates successfully.`,
            "success"
          );
        }
        
        onScheduleComplete();
      }
    } catch (error) {
      showToast("Failed to schedule candidates to drive", "error");
      console.error("Error scheduling candidates:", error);
    } finally {
      setScheduling(false);
      setShowConfirmDialog(false);
      setSelectedDrive(null);
    }
  };

  const handleCloseDialog = () => {
    setShowConfirmDialog(false);
    setSelectedDrive(null);
    setBatchTimeInput("");
    setBatchTimeError(false);
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
    setErrorMessages([]);
  };

  return (
    <>
      <Tooltip title={!driveId ? "Select a drive first" : `Schedule ${selectMode ? selectedCount : totalElements} candidate(s) to drive`}>
        <span>
          <IconButton
            onClick={handleScheduleClick}
            disabled={!driveId || (selectMode ? candidateIds.length === 0 : totalElements === 0) || loadingDrives || scheduling}
            className="schedule-drive-btn"
          >
            <EventIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Dialog
        open={showConfirmDialog}
        onClose={handleCloseDialog}
        className="schedule-drive-dialog"
      >
        <DialogTitle className="schedule-drive-dialog-title">
          Confirm Schedule
        </DialogTitle>
        <DialogContent className="schedule-drive-dialog-content">
          <Typography>
            Are you sure you want to schedule the selected candidates to{" "}
            <strong>{selectedDrive?.driveName}</strong>?
          </Typography>
          <Typography className="schedule-drive-count">
            {selectMode ? selectedCount : totalElements} candidate(s) will be scheduled.
          </Typography>

          {/* Drive date display */}
          {selectedDrive?.startDate && (
            <Box className="schedule-drive-date-row">
              <Typography className="schedule-drive-field-label">Drive Date</Typography>
              <Typography className="schedule-drive-field-value">
                {new Date(selectedDrive.startDate).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </Typography>
            </Box>
          )}

          {/* Batch time picker */}
          <Box className="schedule-drive-time-row">
            <Typography className={`schedule-drive-field-label${batchTimeError ? " schedule-drive-field-label--error" : ""}`}>
              Batch Time <span className="schedule-drive-required">*</span>
            </Typography>
            <Box className="schedule-drive-time-input-wrap">
              {/* Existing batch times as selectable chips */}
              {selectedDrive?.applicationsPerBatchTime &&
                Object.keys(selectedDrive.applicationsPerBatchTime).length > 0 && (
                  <Box className="schedule-drive-batch-chips">
                    {Object.entries(selectedDrive.applicationsPerBatchTime).map(
                      ([batchTime, count]) => {
                        const time = batchTime.split("T")[1]?.substring(0, 5) || "";
                        const isSelected = batchTimeInput === time;
                        return (
                          <Chip
                            key={batchTime}
                            label={`${time}  ·  ${count} `}
                            size="small"
                            onClick={() => {
                              setBatchTimeInput(time);
                              setBatchTimeError(false);
                            }}
                            className={`schedule-drive-batch-chip${isSelected ? " schedule-drive-batch-chip--selected" : ""}`}
                          />
                        );
                      }
                    )}
                  </Box>
                )}
              <input
                type="time"
                value={batchTimeInput}
                onChange={(e) => { setBatchTimeInput(e.target.value); setBatchTimeError(false); }}
                className={`schedule-drive-time-input${batchTimeError ? " schedule-drive-time-input--error" : ""}`}
                disabled={scheduling}
              />
              {batchTimeError && (
                <Typography className="schedule-drive-time-error">Batch time is required</Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="schedule-drive-dialog-actions">
          <Button onClick={handleCloseDialog} disabled={scheduling} className="schedule-drive-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={scheduling}
            className="schedule-drive-confirm-btn"
          >
            {scheduling ? "Scheduling..." : "OK"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Messages Dialog */}
      <Dialog
        open={showErrorDialog}
        onClose={handleCloseErrorDialog}
        maxWidth="sm"
        fullWidth
        className="schedule-drive-error-dialog"
      >
        <DialogTitle className="schedule-drive-error-dialog-title">
          Scheduling Errors
        </DialogTitle>
        <DialogContent className="schedule-drive-error-dialog-content">
          <Typography className="schedule-drive-error-subtitle">
            The following candidates could not be scheduled:
          </Typography>
          <Box className="schedule-drive-error-list">
            {errorMessages.map((error, index) => (
              <Box key={index} className="schedule-drive-error-item">
                <Typography className="schedule-drive-error-text">
                  â€¢ {error}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions className="schedule-drive-error-dialog-actions">
          <Button onClick={handleCloseErrorDialog} className="schedule-drive-error-close-btn">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScheduleDrive;
