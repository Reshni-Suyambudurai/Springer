import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { driveScheduleApi } from "../../../services/driveschedule.api";
import { hiringCycleApi, instituteApi } from "../../../services/hiring.api";
import type { DriveRequest, DriveStatus } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import { DriveLocation } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import type { HiringCycleSummaryResponse } from "../../../types/TA_Recruiter/Hiring/hiringCycle.types";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import { showToast } from "../../../utils/toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Autocomplete,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../../../css/TA_Recruiter/DriveSchedule/AddSchedule.css";

const AddSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(true);
  const [institutes, setInstitutes] = useState<InstituteResponse[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(true);
  const [formData, setFormData] = useState<DriveRequest>({
    cycleId: 0,
    driveName: "",
    description: "",
    instituteId: undefined,
    startDate: "",
    endDate: "",
    location: "",
    eligibilityLocked: false,
    driveStatus: "PLANNED",
    createdBy: 1, // TODO: Get from auth context
    roundConfigIds: [],
  });

  const [errors, setErrors] = useState<{
    cycleId?: string;
    driveName?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
  }>({});

  useEffect(() => {
    fetchCycles();
    fetchInstitutes();
  }, []);

  const fetchCycles = async () => {
    try {
      const response = await hiringCycleApi.getAllCycleSummaries();
      if (response.data) {
        setCycles(response.data);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to fetch hiring cycles";
      showToast(errorMessage, "error");
      console.error("Error fetching cycles:", error);
    } finally {
      setLoadingCycles(false);
    }
  };

  const fetchInstitutes = async () => {
    try {
      const response = await instituteApi.getAllInstitutes();
      if (response.data) {
        setInstitutes(response.data);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to fetch institutes";
      showToast(errorMessage, "error");
      console.error("Error fetching institutes:", error);
    } finally {
      setLoadingInstitutes(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.cycleId || formData.cycleId === 0) {
      newErrors.cycleId = "Cycle ID is required";
    }

    if (!formData.driveName.trim()) {
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

  const handleChange = (field: keyof DriveRequest, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix validation errors", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await driveScheduleApi.createDrive(formData);
      if (response.data?.success) {
        showToast("Drive schedule created successfully", "success");
        navigate("/ta-recruiter/drive-calendar");
      } else {
        const errorMessage = response.data?.message || "Failed to create drive schedule";
        showToast(errorMessage, "error");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create drive schedule";
      showToast(errorMessage, "error");
      console.error("Error creating drive:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/ta-recruiter/drive-calendar");
  };

  return (
    <Box className="add-schedule-container">
      <Card className="add-schedule-card">
        <Box className="add-schedule-header">
          <IconButton onClick={handleCancel} className="add-schedule-back-btn">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" className="add-schedule-title">
            Schedule New Drive
          </Typography>
        </Box>

        <CardContent className="add-schedule-content">
          <form onSubmit={handleSubmit} className="add-schedule-form">
            <Box className="add-schedule-form-grid">
              {/* Cycle Dropdown */}
              <FormControl required error={!!errors.cycleId} className="add-schedule-input">
                <InputLabel>Hiring Cycle</InputLabel>
                <Select
                  value={formData.cycleId || ""}
                  onChange={(e) => handleChange("cycleId", e.target.value as number)}
                  label="Hiring Cycle"
                  disabled={loadingCycles}
                >
                  {loadingCycles ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} /> Loading cycles...
                    </MenuItem>
                  ) : cycles.length === 0 ? (
                    <MenuItem disabled>No cycles available</MenuItem>
                  ) : (
                    cycles.map((cycle) => (
                      <MenuItem
                        key={cycle.cycleId}
                        value={cycle.cycleId}
                        disabled={cycle.status === "CLOSED"}
                      >
                        {cycle.cycleName} ({cycle.cycleYear}) - {cycle.status}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.cycleId && <FormHelperText>{errors.cycleId}</FormHelperText>}
              </FormControl>

              {/* Drive Name */}
              <TextField
                label="Drive Name"
                required
                value={formData.driveName}
                onChange={(e) => handleChange("driveName", e.target.value)}
                error={!!errors.driveName}
                helperText={errors.driveName}
                className="add-schedule-input"
              />

              {/* Location */}
              <FormControl required error={!!errors.location} className="add-schedule-input">
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  label="Location"
                >
                  {Object.values(DriveLocation).map((location) => (
                    <MenuItem key={location} value={location}>
                      {location}
                    </MenuItem>
                  ))}
                </Select>
                {errors.location && <FormHelperText>{errors.location}</FormHelperText>}
              </FormControl>

              {/* Start Date */}
              <TextField
                label="Start Date"
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                error={!!errors.startDate}
                helperText={errors.startDate}
                className="add-schedule-input"
                InputLabelProps={{ shrink: true }}
              />

              {/* End Date */}
              <TextField
                label="End Date"
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                error={!!errors.endDate}
                helperText={errors.endDate}
                className="add-schedule-input"
                InputLabelProps={{ shrink: true }}
              />

              {/* Drive Status */}
              <FormControl className="add-schedule-input">
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.driveStatus}
                  onChange={(e) => handleChange("driveStatus", e.target.value as DriveStatus)}
                  label="Status"
                >
                  <MenuItem value="PLANNED">Planned</MenuItem>
                  <MenuItem value="SCHEDULED">Scheduled</MenuItem>
                
                </Select>
              </FormControl>

              {/* Institute (Optional - with OFFCAMPUS option) */}
              <Autocomplete
                options={[
                  { instituteId: 0, instituteName: "OFFCAMPUS", instituteCode: "", location: "", isActive: true },
                  ...institutes
                ]}
                getOptionLabel={(option) => option.instituteName}
                value={
                  formData.instituteId === undefined
                    ? null
                    : formData.instituteId === 0
                    ? { instituteId: 0, instituteName: "OFFCAMPUS", instituteCode: "", location: "", isActive: true }
                    : institutes.find((inst) => inst.instituteId === formData.instituteId) || null
                }
                onChange={(_, newValue) => {
                  handleChange("instituteId", newValue?.instituteId === 0 ? undefined : newValue?.instituteId);
                }}
                disabled={loadingInstitutes}
                className="add-schedule-input"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Institute (Optional)"
                    placeholder="Search institute or select OFFCAMPUS..."
                    helperText="Select OFFCAMPUS for off-campus drives"
                  />
                )}
              />

              {/* Description (Full Width) */}
              <TextField
                label="Description (Optional)"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="add-schedule-input add-schedule-input-full"
              />
            </Box>

            {/* Action Buttons */}
            <Box className="add-schedule-actions">
              <Button
                type="button"
                onClick={handleCancel}
                className="add-schedule-cancel-btn"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                className="add-schedule-submit-btn"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Create Drive Schedule"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddSchedule;
