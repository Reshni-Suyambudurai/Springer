import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { driveScheduleApi } from "../../../services/driveschedule.api";
import { hiringCycleApi } from "../../../services/hiring.api";
import type { DriveResponse } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import type { HiringCycleSummaryResponse } from "../../../types/TA_Recruiter/Hiring/hiringCycle.types";
import { showToast } from "../../../utils/toast";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { FigmaAddIcon as AddIcon } from '../../Common/FigmaIcons';
import EditDriveModal from "./EditDriveModal";
import "../../../css/TA_Recruiter/DriveSchedule/DriveCalendar.css";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarDrive extends DriveResponse {
  startDateObj: Date;
  endDateObj: Date;
}

function buildCalendarDays(currentDate: Date): (Date | null)[] {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startingDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  return days;
}

const DriveCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState<CalendarDrive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedDrive, setSelectedDrive] = useState<DriveResponse | null>(null);
  const [loadingDriveDetails, setLoadingDriveDetails] = useState<boolean>(false);

  const selectedCycleData = useMemo(
    () => cycles.find((c) => c.cycleId === selectedCycle) ?? null,
    [cycles, selectedCycle]
  );

  const isSelectedCycleOpen = selectedCycleData?.status === "OPEN";

  const calendarDays = useMemo(() => buildCalendarDays(currentDate), [currentDate]);

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle !== null) {
      fetchDrives(selectedCycle);
    }
  }, [selectedCycle]);

  const fetchCycles = async () => {
    try {
      const response = await hiringCycleApi.getAllCycleSummaries();
      if (response.data) {
        const sortedCycles = response.data.sort(
          (a: HiringCycleSummaryResponse, b: HiringCycleSummaryResponse) =>
            b.cycleYear - a.cycleYear
        );
        setCycles(sortedCycles);
        if (sortedCycles.length > 0) {
          setSelectedCycle(sortedCycles[0].cycleId);
        } else {
          setLoading(false);
        }
      }
    } catch {
      showToast("Failed to fetch hiring cycles", "error");
      setLoading(false);
    }
  };

  const fetchDrives = async (cycleId: number) => {
    setLoading(true);
    try {
      const response = await driveScheduleApi.getDrivesByCycleId({ cycleId });
      if (response.data?.data) {
        const drivesWithDates = response.data.data.map((drive: DriveResponse) => ({
          ...drive,
          startDateObj: new Date(drive.startDate),
          endDateObj: new Date(drive.endDate),
        }));
        setDrives(drivesWithDates);
      } else {
        setDrives([]);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to fetch drive schedules";
      showToast(errorMessage, "error");
      console.error("Error fetching drives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrive = useCallback(() => {
    if (!isSelectedCycleOpen || selectedCycle === null || !selectedCycleData) return;
    navigate("/ta-recruiter/drive-schedules/add", {
      state: {
        cycleId: selectedCycle,
        cycleName: `${selectedCycleData.cycleName} (${selectedCycleData.cycleYear})`,
      },
    });
  }, [isSelectedCycleOpen, selectedCycle, selectedCycleData, navigate]);

  const handleEventClick = async (driveId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingDriveDetails(true);

    try {
      const response = await driveScheduleApi.getDriveById(driveId);
      if (response.data?.data) {
        setSelectedDrive(response.data.data);
        setEditModalOpen(true);
      } else {
        showToast("Failed to load drive details", "error");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load drive details";
      showToast(errorMessage, "error");
      console.error("Error fetching drive details:", error);
    } finally {
      setLoadingDriveDetails(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedDrive(null);
  };

  const handleEditSuccess = () => {
    if (selectedCycle !== null) {
      fetchDrives(selectedCycle);
    }
  };

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const getDrivesForDate = useCallback(
    (date: Date | null): CalendarDrive[] => {
      if (!date) return [];

      const checkTime = new Date(date);
      checkTime.setHours(0, 0, 0, 0);

      return drives.filter((drive) => {
        const driveStart = new Date(drive.startDateObj);
        driveStart.setHours(0, 0, 0, 0);
        return checkTime.getTime() === driveStart.getTime();
      });
    },
    [drives]
  );

  const getDriveModeClass = (driveMode: string): string =>
    driveMode === "ON_CAMPUS" ? "drive-event-oncampus" : "drive-event-offcampus";

  const isToday = useCallback((date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const addDriveDisabled = selectedCycle === null || !isSelectedCycleOpen;

  const addDriveTooltip =
    addDriveDisabled && selectedCycle !== null
      ? "Cannot add drives to a closed hiring cycle"
      : "";

  return (
    <Box className="drive-calendar-container">
      <Card className="drive-calendar-header">
        <Box className="drive-calendar-header-left">
          <FormControl size="small" className="drive-calendar-cycle-select">
            <InputLabel>Hiring Cycle</InputLabel>
            <Select
              value={selectedCycle ?? ""}
              label="Hiring Cycle"
              onChange={(e) => setSelectedCycle(Number(e.target.value))}
            >
              {cycles.map((cycle) => (
                <MenuItem
                  key={cycle.cycleId}
                  value={cycle.cycleId}
                  className={
                    cycle.status === "OPEN"
                      ? "drive-cycle-status-open"
                      : "drive-cycle-status-closed"
                  }
                >
                  {cycle.cycleName} - {cycle.cycleYear}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box className="drive-calendar-nav-controls">
            <Box className="drive-calendar-nav-buttons">
              <IconButton onClick={handlePreviousMonth} className="drive-calendar-nav-btn">
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={handleNextMonth} className="drive-calendar-nav-btn">
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Button variant="outlined" onClick={handleToday} className="t-btn-small">
              Today
            </Button>

            <Typography variant="h6" className="drive-calendar-month-year">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
          </Box>
        </Box>

        <Box className="drive-calendar-header-right">
          <Typography variant="body2" className="drive-calendar-count">
            Drives: {drives.length}
          </Typography>

          <Box className="drive-calendar-legend">
            <Box className="drive-calendar-legend-item">
              <span className="drive-calendar-legend-color drive-legend-oncampus" />
              <Typography variant="body2">On-Campus</Typography>
            </Box>
            <Box className="drive-calendar-legend-item">
              <span className="drive-calendar-legend-color drive-legend-offcampus" />
              <Typography variant="body2">Off-Campus</Typography>
            </Box>
          </Box>

          <Tooltip
            title={addDriveTooltip}
            arrow
            disableHoverListener={!addDriveTooltip}
            disableFocusListener={!addDriveTooltip}
            classes={{ tooltip: "g-tooltip", arrow: "g-tooltip-arrow" }}
          >
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddDrive}
                disabled={addDriveDisabled}
                className="t-btn-primary"
              >
                Add Drive
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Card>

      {loading ? (
        <Box className="drive-calendar-loading">
          <CircularProgress />
          <Typography className="t-loading-text">Loading drive schedules...</Typography>
        </Box>
      ) : (
        <Card className="drive-calendar-grid-container">
          <Box className="drive-calendar-weekday-header">
            {DAYS_OF_WEEK.map((day) => (
              <Box key={day} className="drive-calendar-weekday-cell">
                <Typography variant="subtitle2">{day}</Typography>
              </Box>
            ))}
          </Box>

          <Box className="drive-calendar-grid">
            {calendarDays.map((date, index) => {
              const drivesForDay = getDrivesForDate(date);
              const isCurrentDay = isToday(date);

              return (
                <Box
                  key={index}
                  className={`drive-calendar-day-cell ${
                    !date ? "drive-calendar-empty-cell" : ""
                  } ${isCurrentDay ? "drive-calendar-today-cell" : ""}`}
                >
                  {date && (
                    <>
                      <Typography variant="body2" className="drive-calendar-day-number">
                        {date.getDate()}
                      </Typography>
                      <Box className="drive-calendar-events">
                        {drivesForDay.slice(0, 3).map((drive) => (
                          <Box
                            key={drive.driveId}
                            className={`drive-calendar-event ${getDriveModeClass(drive.driveMode)}${
                              loadingDriveDetails ? " drive-calendar-event--loading" : ""
                            }`}
                            onClick={(e) => handleEventClick(drive.driveId, e)}
                          >
                            <Typography variant="caption" className="drive-event-name">
                              {drive.driveName}
                            </Typography>
                            {drivesForDay.length === 1 && (
                              <Typography variant="caption" className="drive-event-status">
                                {drive.status}
                              </Typography>
                            )}
                          </Box>
                        ))}
                        {drivesForDay.length > 3 && (
                          <Typography variant="caption" className="drive-calendar-more">
                            +{drivesForDay.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>
      )}

      <EditDriveModal
        open={editModalOpen}
        drive={selectedDrive}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </Box>
  );
};

export default DriveCalendar;
