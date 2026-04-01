import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { driveScheduleApi } from "../../../services/driveschedule.api";
import type { DriveResponse } from "../../../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditDriveModal from "./EditDriveModal";
import "../../../css/TA_Recruiter/DriveSchedule/DriveCalendar.css";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarDrive extends DriveResponse {
  startDateObj: Date;
  endDateObj: Date;
}

const DriveCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState<CalendarDrive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [selectedDrive, setSelectedDrive] = useState<DriveResponse | null>(null);
  const [loadingDriveDetails, setLoadingDriveDetails] = useState<boolean>(false);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const response = await driveScheduleApi.getAllDrives();
      if (response.data && response.data.data) {
        const drivesWithDates = response.data.data.map((drive) => ({
          ...drive,
          startDateObj: new Date(drive.startDate),
          endDateObj: new Date(drive.endDate),
        }));
        setDrives(drivesWithDates);
      }
    } catch (error: unknown) {
      const errorMessage = 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        "Failed to fetch drive schedules";
      showToast(errorMessage, "error");
      console.error("Error fetching drives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDrive = () => {
    navigate("/ta-recruiter/drive-schedules/add");
  };

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
    fetchDrives(); // Refresh calendar after successful edit
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Get calendar grid data
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get drives for a specific date
  const getDrivesForDate = (date: Date | null): CalendarDrive[] => {
    if (!date) return [];
    
    return drives.filter((drive) => {
      const driveStart = new Date(drive.startDateObj);
      const driveEnd = new Date(drive.endDateObj);
      
      driveStart.setHours(0, 0, 0, 0);
      driveEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= driveStart && checkDate <= driveEnd;
    });
  };

  // Get color class based on drive mode
  const getDriveModeClass = (driveMode: string): string => {
    return driveMode === "ON_CAMPUS" ? "drive-event-oncampus" : "drive-event-offcampus";
  };

  // Check if date is today
  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const calendarDays = getCalendarDays();

  return (
    <Box className="drive-calendar-container">
      {/* Single Header */}
      <Card className="drive-calendar-header">
        <Box className="drive-calendar-header-left">
          <FormControl className="drive-calendar-year-select">
            <Select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value as number)}
              className="drive-calendar-year-dropdown"
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
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

            <Button
              variant="outlined"
              onClick={handleToday}
              className="drive-calendar-today-btn"
            >
              Today
            </Button>

            <Typography variant="h6" className="drive-calendar-month-year">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
          </Box>
        </Box>

        {/* Center Title (Absolutely Positioned) */}
        <Box className="drive-calendar-header-center">
          <Typography variant="h5" className="drive-calendar-title">
            Drive Calendar
          </Typography>
        </Box>

        {/* Right Side - Legend and Add Button */}
        <Box className="drive-calendar-header-right">
          <Box className="drive-calendar-legend">
            <Box className="drive-calendar-legend-item">
              <span className="drive-calendar-legend-color drive-legend-oncampus"></span>
              <Typography variant="body2">On-Campus</Typography>
            </Box>
            <Box className="drive-calendar-legend-item">
              <span className="drive-calendar-legend-color drive-legend-offcampus"></span>
              <Typography variant="body2">Off-Campus</Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleAddDrive}
            className="drive-calendar-add-btn"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Card>

      {/* Calendar Grid */}
      {loading ? (
        <Box className="drive-calendar-loading">
          <CircularProgress />
          <Typography>Loading drive schedules...</Typography>
        </Box>
      ) : (
        <Card className="drive-calendar-grid-container">
          {/* Weekday Headers */}
          <Box className="drive-calendar-weekday-header">
            {DAYS_OF_WEEK.map((day) => (
              <Box key={day} className="drive-calendar-weekday-cell">
                <Typography variant="subtitle2">{day}</Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar Days */}
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
                            className={`drive-calendar-event ${getDriveModeClass(
                              drive.driveMode
                            )}`}
                            onClick={(e) => handleEventClick(drive.driveId, e)}
                            style={{ cursor: loadingDriveDetails ? "wait" : "pointer" }}
                          >
                            <Typography variant="caption" className="drive-event-name">
                              {drive.driveName}
                            </Typography>
                            <Typography variant="caption" className="drive-event-status">
                              {drive.status}
                            </Typography>
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

      {/* Edit Drive Modal */}
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
