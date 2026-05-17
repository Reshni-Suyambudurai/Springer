import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Typography,
  FormHelperText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import { driveScheduleApi } from "../../../services/driveschedule.api";
import { tokenstore } from "../../../auth/tokenstore";
import { showToast } from "../../../utils/toast";
import type {
  DriveResponse,
  DriveUpdateRequest,
  DriveStatus,
  DriveLocation,
} from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import { DriveLocation as DriveLocationEnum } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import "../../../css/TA_Recruiter/DriveSchedule/EditDriveModal.css";

interface EditDriveModalProps {
  open: boolean;
  drive: DriveResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditDriveModal: React.FC<EditDriveModalProps> = ({
  open,
  drive,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<DriveUpdateRequest>({
    driveName: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    driveStatus: "PLANNED",
    updatedBy: 0,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPastDrive, setIsPastDrive] = useState<boolean>(false);

  // Populate form when drive data is loaded
  useEffect(() => {
    if (drive && open) {
      setFormData({
        driveName: drive.driveName,
        description: drive.description || "",
        startDate: drive.startDate,
        endDate: drive.endDate,
        location: drive.location,
        driveStatus: drive.status,
        updatedBy: 0, // Will be set on submit
      });

      // Check if drive is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const driveEndDate = new Date(drive.endDate);
      driveEndDate.setHours(0, 0, 0, 0);
      setIsPastDrive(driveEndDate < today);
    }
  }, [drive, open]);

  const handleChange = (field: keyof DriveUpdateRequest, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.driveName?.trim()) {
      newErrors.driveName = "Drive name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (!formData.location) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!drive) return;

    if (!validateForm()) {
      showToast("Please fix validation errors", "error");
      return;
    }

    // Get userId from token
    const user = tokenstore.getUser();
    if (!user?.userId) {
      showToast("User not authenticated", "error");
      return;
    }

    setLoading(true);

    try {
      const updateRequest: DriveUpdateRequest = {
        ...formData,
        updatedBy: user.userId,
      };

      const response = await driveScheduleApi.updateDrive(drive.driveId, updateRequest);

      if (response.data?.success) {
        showToast("Drive updated successfully", "success");
        onSuccess(); // Refresh calendar data
        onClose(); // Close modal
      } else {
        showToast(response.data?.message || "Failed to update drive", "error");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update drive";
      showToast(errorMessage, "error");
      console.error("Error updating drive:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      onClose();
    }
  };

  const driveStatusOptions: DriveStatus[] = [
    "PLANNED",
    "SCHEDULED",
    
    "CANCELLED",
  ];

  const locationOptions: DriveLocation[] = [
    DriveLocationEnum.COIMBATORE,
    DriveLocationEnum.BANGALORE,
    DriveLocationEnum.CHENNAI,
    DriveLocationEnum.PUNE,
  ];

  if (!drive) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      className="edit-drive-modal"
      disableEscapeKeyDown={loading}
    >
      <DialogTitle className="edit-drive-modal-title">
        <Typography variant="h6">Edit Drive Schedule</Typography>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          className="edit-drive-modal-close-btn"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="edit-drive-modal-content">
        {isPastDrive && (
          <Box className="edit-drive-warning">
            <Typography variant="body2" color="error">
              ⚠ This drive has ended. Editing past drives may affect historical records.
            </Typography>
          </Box>
        )}

        <form onSubmit={handleSubmit} className="edit-drive-form">
          <Box className="edit-drive-form-grid">
            {/* Drive Name */}
            <TextField
              label="Drive Name"
              value={formData.driveName || ""}
              onChange={(e) => handleChange("driveName", e.target.value)}
              error={!!errors.driveName}
              helperText={errors.driveName}
              required
              fullWidth
              className="edit-drive-input"
              disabled={loading || isPastDrive}
            />

            {/* Drive Status */}
            <FormControl
              fullWidth
              className="edit-drive-input"
              error={!!errors.driveStatus}
              disabled={loading}
            >
              <InputLabel>Drive Status</InputLabel>
              <Select
                value={formData.driveStatus || "PLANNED"}
                onChange={(e) => handleChange("driveStatus", e.target.value as DriveStatus)}
                label="Drive Status"
              >
                {driveStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
              {errors.driveStatus && (
                <FormHelperText>{errors.driveStatus}</FormHelperText>
              )}
            </FormControl>

            {/* Location */}
            <FormControl
              fullWidth
              className="edit-drive-input"
              error={!!errors.location}
              disabled={loading || isPastDrive}
              required
            >
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                label="Location"
              >
                {locationOptions.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
              {errors.location && <FormHelperText>{errors.location}</FormHelperText>}
            </FormControl>

            {/* Cycle Name (Read-only) */}
            <TextField
              label="Hiring Cycle"
              value={drive.cycleName}
              fullWidth
              className="edit-drive-input"
              disabled
              InputProps={{
                readOnly: true,
              }}
            />

            {/* Start Date */}
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
              error={!!errors.startDate}
              helperText={errors.startDate}
              required
              fullWidth
              className="edit-drive-input"
              InputLabelProps={{ shrink: true }}
              disabled={loading || isPastDrive}
            />

            {/* End Date */}
            <TextField
              label="End Date"
              type="date"
              value={formData.endDate || ""}
              onChange={(e) => handleChange("endDate", e.target.value)}
              error={!!errors.endDate}
              helperText={errors.endDate}
              required
              fullWidth
              className="edit-drive-input"
              InputLabelProps={{ shrink: true }}
              disabled={loading || isPastDrive}
            />

            {/* Description (Full Width) */}
            <TextField
              label="Description (Optional)"
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              rows={3}
              className="edit-drive-input edit-drive-input-full"
              disabled={loading}
            />
          </Box>
        </form>
      </DialogContent>

      <DialogActions className="edit-drive-modal-actions">
        <Button
          onClick={handleClose}
          disabled={loading}
          className="edit-drive-cancel-btn"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || isPastDrive}
          className="edit-drive-submit-btn"
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Update Drive"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDriveModal;
