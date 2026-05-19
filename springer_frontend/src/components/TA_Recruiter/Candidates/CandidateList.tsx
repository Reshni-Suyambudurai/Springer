import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { candidateApi } from "../../../services/drive.api";
import { hiringCycleApi } from "../../../services/hiring.api";
import { notificationApi } from "../../../services/notification.api";
import type { NotificationResponse } from "../../../types/notification.types";
import type { CycleWithDrivesResponse, DriveInfo } from "../../../types/TA_Recruiter/Hiring/hiringCycle.types";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import { useCandidateFilters } from "../../../hooks/useCandidateFilters";
import { useCandidatesPagination } from "../../../hooks/useCandidatesPagination";
import { useFilterOptions } from "../../../contexts/FilterOptionsContext";
import CandidateFilter from "./CandidateFilter";
import ScheduleDrive from "./ScheduleDrive";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Typography,
  MenuItem,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../../../css/TA_Recruiter/Candidates/CandidateList.css";

const STATUS_CLASS_MAP: Record<string, string> = {
  APPLIED: 'cl-status-applied',
  SHORTLISTED: 'cl-status-shortlisted',
  INVITED: 'cl-status-invited',
  SCHEDULED: 'cl-status-scheduled',
  SELECTED: 'cl-status-selected',
  OFFERED: 'cl-status-offered',
  JOINED: 'cl-status-joined',
  REJECTED: 'cl-status-rejected',
  ACCEPTED: 'cl-status-accepted',
  DROPPED: 'cl-status-dropped',
};

const TYPE_CLASS_MAP: Record<string, string> = {
  PREMIUM: 'cl-type-premium',
  STANDARD: 'cl-type-standard',
};

// Generate 2-letter initials from institute name for avatar
const getInitials = (name: string): string => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', right: 8, pointerEvents: 'none' }}>
    <path d="M4 6L8 10L12 6" stroke="var(--color-filter-arrow)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [cycles, setCycles] = useState<CycleWithDrivesResponse[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<number | "">("");
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<string>("");
  const [updatingBulkStatus, setUpdatingBulkStatus] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => tokenstore.getSidebarOpen());
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [bulkResultErrors, setBulkResultErrors] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const user = tokenstore.getUser();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadNotifications = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const res = await notificationApi.getNotifications(user.userId);
      if (res.success && res.data) setNotifications(res.data);
    } catch { /* silent */ }
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    loadNotifications();
    const ws = new WebSocket(`ws://localhost:8080/ws/notifications?userId=${user.userId}`);
    ws.onmessage = (event) => {
      try {
        const newNotif: NotificationResponse = JSON.parse(event.data);
        setNotifications(prev => [newNotif, ...prev]);
      } catch { /* ignore */ }
    };
    ws.onerror = () => { /* silent */ };
    return () => { ws.close(); };
  }, [user?.userId, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.allSettled(unread.map(n => notificationApi.markAsRead(n.notificationId)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };
  
  // Use custom pagination hook for ACTIVE candidates
  const {
    allCandidates,
    totalElements,
    candidatesLoading,
    loadingMore,
    fetchCandidates,
    handleScroll: handleScrollHook,
  } = useCandidatesPagination('ACTIVE');

  // Use filter options context
  const { filterOptions, fetchFilterOptions } = useFilterOptions();

  // Use custom hook for filter state management
  const {
    filters,
    handleFilterChange,
    handleCheckboxToggle,
    clearFilters: clearFiltersHook,
    setFilters,
    uniqueApplicationStages,
    uniqueApplicationTypes,
    hasActiveFilters,
  } = useCandidateFilters();

  // Calculate cities based on selected state from context data
  const citiesForSelectedState = React.useMemo(() => {
    if (!filters.state || !filterOptions?.stateToCitiesMap) {
      return [];
    }
    // Return cities for the selected state from the state-to-cities map
    return filterOptions.stateToCitiesMap[filters.state] || [];
  }, [filters.state, filterOptions?.stateToCitiesMap]);

  // Single search bar: match across all visible table fields
  const filteredCandidates = React.useMemo(() => {
    const searchTerm = (filters.candidateName || "").trim().toLowerCase();
    if (!searchTerm) return allCandidates;

    return allCandidates.filter((candidate) => {
      const fullName = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim();
      const searchableValues = [
        candidate.instituteName || "",
        fullName,
        candidate.cgpa != null ? candidate.cgpa.toFixed(2) : "",
        candidate.historyOfArrears != null ? String(candidate.historyOfArrears) : "",
        candidate.passoutYear != null ? String(candidate.passoutYear) : "",
        candidate.applicationStage || "",
        candidate.applicationType || "",
        candidate.isEligible ? "eligible" : "ineligible",
      ];

      return searchableValues.some((value) => value.toLowerCase().includes(searchTerm));
    });
  }, [allCandidates, filters.candidateName]);

  const visibleCandidateIds = React.useMemo(
    () => filteredCandidates.map((candidate) => candidate.candidateId),
    [filteredCandidates]
  );

  const allVisibleSelected =
    visibleCandidateIds.length > 0 &&
    visibleCandidateIds.every((id) => selectedCandidates.has(id));

  const someVisibleSelected =
    visibleCandidateIds.some((id) => selectedCandidates.has(id));

  const handleToggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates((prev) => {
        const next = new Set(prev);
        visibleCandidateIds.forEach((id) => next.add(id));
        return next;
      });
      setSelectMode(true);
      return;
    }

    let remainingSelectedCount = 0;
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      visibleCandidateIds.forEach((id) => next.delete(id));
      remainingSelectedCount = next.size;
      return next;
    });
    setSelectMode(remainingSelectedCount > 0);
  };

  const backendFiltersWithDrive = React.useMemo(
    () => ({
      ...filters,
      candidateName: undefined,
      driveId: selectedDrive || undefined,
    }),
    [filters, selectedDrive]
  );

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    tokenstore.setSidebarOpen(newState);
  };

  // Clear filters from both hook and sessionStorage
  const clearFilters = () => {
    clearFiltersHook(); // Clear filters in hook
    tokenstore.clearCandidateFilters(); // Clear from sessionStorage
    showToast('All filters cleared', 'success');
  };

  // Auto-restore filters from sessionStorage on mount
  useEffect(() => {
    const savedFilters = tokenstore.getCandidateFilters();
    if (savedFilters) {
      setFilters({
        ...savedFilters,
        sortBy: savedFilters.sortBy || "candidateId",
        sortDirection: savedFilters.sortDirection || "DESC",
      });
    }
  }, [setFilters]);

  // Sync filters with URL params
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.candidateName) params.set('candidateName', filters.candidateName);
    if (filters.instituteName) params.set('instituteName', filters.instituteName);
    if (filters.state) params.set('state', filters.state);
    if (filters.cities.length > 0) params.set('cities', filters.cities.join(','));
    if (filters.degrees.length > 0) params.set('degrees', filters.degrees.join(','));
    if (filters.departments.length > 0) params.set('departments', filters.departments.join(','));
    if (filters.eligibility.length > 0) params.set('eligibility', filters.eligibility.join(','));
    if (filters.applicationTypes.length > 0) params.set('applicationTypes', filters.applicationTypes.join(','));
    if (filters.applicationStages.length > 0) params.set('applicationStages', filters.applicationStages.join(','));
    if (filters.skills.length > 0) params.set('skills', filters.skills.join(','));
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Save filters to sessionStorage
  const saveFilters = () => {
    const filtersToSave = {
      candidateName: filters.candidateName,
      instituteName: filters.instituteName,
      state: filters.state,
      cities: filters.cities,
      degrees: filters.degrees,
      departments: filters.departments,
      eligibility: filters.eligibility,
      applicationTypes: filters.applicationTypes,
      applicationStages: filters.applicationStages,
      skills: filters.skills,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    };
    
    const success = tokenstore.saveCandidateFilters(filtersToSave);
    if (success) {
      showToast('Filters saved for this session', 'success');
    } else {
      showToast('Failed to save filters', 'error');
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  // Refresh candidates when navigating back to this page
  useEffect(() => {
    if (selectedCycle !== null) {
      fetchCandidates(selectedCycle, backendFiltersWithDrive, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const fetchCycles = async () => {
    try {
      const response = await hiringCycleApi.getAllCyclesWithDrives();
      if (response.data) {
        const cyclesWithDrives = response.data;

        setCycles(cyclesWithDrives);
        if (cyclesWithDrives.length > 0) {
          setSelectedCycle(cyclesWithDrives[0].cycleId);
          setDrives(cyclesWithDrives[0].drives);
        }
      }
    } catch (error) {
      showToast("Failed to fetch hiring cycles", "error");
      console.error("Error fetching cycles:", error);
    }
  };

  // Fetch initial data when cycle changes
  useEffect(() => {
    if (selectedCycle !== null) {
      fetchFilterOptions(selectedCycle);
    }
  }, [selectedCycle, fetchFilterOptions]);

  // Fetch candidates when cycle, drive OR filters change (always resets to page 0)
  useEffect(() => {
    if (selectedCycle !== null) {
      fetchCandidates(selectedCycle, backendFiltersWithDrive, false); // false = reset pagination
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle, selectedDrive, filters.instituteName, filters.state,
      filters.cities, filters.degrees, filters.departments, filters.eligibility,
      filters.applicationTypes, filters.applicationStages, filters.skills,
      filters.sortBy, filters.sortDirection]);
  // Note: fetchCandidates and filters object are intentionally excluded from deps
  // to prevent infinite re-renders. We track individual filter properties instead.

  // Infinite scroll handler
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    handleScrollHook(event, selectedCycle, backendFiltersWithDrive);
  };

  const handleCandidateView = (candidateId: number) => {
    navigate(`/ta-recruiter/candidates/${candidateId}`);
  };

  const handleAddCandidate = () => {
    const selectedCycleData = cycles.find(c => c.cycleId === selectedCycle);
    const selectedDriveData = drives.find(d => d.driveId === selectedDrive);
    navigate("/ta-recruiter/candidates/add", { 
      state: { 
        cycleId: selectedCycle,
        cycleYear: selectedCycleData?.cycleYear,
        cycleName: selectedCycleData?.cycleName,
        driveId: selectedDrive || undefined,
        driveName: selectedDriveData?.driveName || undefined,
        instituteName: selectedDriveData?.instituteName || undefined,
      } 
    });
  };

  const handleBackFromDriveView = () => {
    setSelectedDrive("");
    setBulkStatusUpdate("");
    setSelectMode(false);
    setSelectedCandidates(new Set());
  };

  

  const handleBulkStatusUpdate = async () => {
    const user = tokenstore.getUser();
    if (!user) {
      showToast("Unable to get user information", "error");
      return;
    }

    if (!bulkStatusUpdate) {
      showToast("Please select a status to update", "error");
      return;
    }

    setUpdatingBulkStatus(true);
    try {
      // If CLOSED → use lifecycle status endpoint
      if (bulkStatusUpdate === "CLOSED") {
        let lifecycleRequest: Parameters<typeof candidateApi.bulkUpdateCandidateLifecycleStatus>[0];

        if (selectMode) {
          const candidateIdsToUpdate = Array.from(selectedCandidates);
          if (candidateIdsToUpdate.length === 0) {
            showToast("Please select candidates to update", "error");
            setUpdatingBulkStatus(false);
            return;
          }
          lifecycleRequest = {
            candidateIds: candidateIdsToUpdate,
            lifecycleStatus: "CLOSED",
            updatedBy: user.userId,
          };
        } else {
          lifecycleRequest = {
            filterRequest: {
              cycleId: selectedCycle!,
              lifecycleStatus: 'ACTIVE',
              candidateName: undefined,
              instituteName: filters.instituteName || undefined,
              state: filters.state || undefined,
              cities: filters.cities.length > 0 ? filters.cities : undefined,
              degrees: filters.degrees.length > 0 ? filters.degrees : undefined,
              departments: filters.departments.length > 0 ? filters.departments : undefined,
              eligibility: filters.eligibility.length > 0 ? filters.eligibility : undefined,
              applicationTypes: filters.applicationTypes.length > 0 ? filters.applicationTypes : undefined,
              applicationStages: filters.applicationStages.length > 0 ? filters.applicationStages : undefined,
              skills: filters.skills.length > 0 ? filters.skills : undefined,
            },
            lifecycleStatus: "CLOSED",
            updatedBy: user.userId,
          };
        }

        const response = await candidateApi.bulkUpdateCandidateLifecycleStatus(lifecycleRequest);

        if (response.data) {
          showToast(
            `Moved ${response.data.successCount} candidates to history. ${response.data.failureCount} failed.`,
            response.data.failureCount > 0 ? "error" : "success"
          );

          if (response.data.errorMessages && response.data.errorMessages.length > 0) {
            setBulkResultErrors(response.data.errorMessages);
          }

          setBulkStatusUpdate("");
          if (selectMode) {
            setSelectedCandidates(new Set());
            setSelectMode(false);
          }
          if (selectedCycle) {
            await fetchCandidates(selectedCycle, backendFiltersWithDrive, false);
          }
        }
      } else {
        // Normal application stage update
        let bulkRequest: Parameters<typeof candidateApi.bulkUpdateCandidateStatus>[0];

        if (selectMode) {
          const candidateIdsToUpdate = Array.from(selectedCandidates);
          if (candidateIdsToUpdate.length === 0) {
            showToast("Please select candidates to update", "error");
            setUpdatingBulkStatus(false);
            return;
          }
          bulkRequest = {
            candidateIds: candidateIdsToUpdate,
            status: bulkStatusUpdate,
            reason: `Bulk status update to ${bulkStatusUpdate}`,
            updatedBy: user.userId,
          };
        } else {
          bulkRequest = {
            filterRequest: {
              cycleId: selectedCycle!,
              lifecycleStatus: 'ACTIVE',
              candidateName: undefined,
              instituteName: filters.instituteName || undefined,
              state: filters.state || undefined,
              cities: filters.cities.length > 0 ? filters.cities : undefined,
              degrees: filters.degrees.length > 0 ? filters.degrees : undefined,
              departments: filters.departments.length > 0 ? filters.departments : undefined,
              eligibility: filters.eligibility.length > 0 ? filters.eligibility : undefined,
              applicationTypes: filters.applicationTypes.length > 0 ? filters.applicationTypes : undefined,
              applicationStages: filters.applicationStages.length > 0 ? filters.applicationStages : undefined,
              skills: filters.skills.length > 0 ? filters.skills : undefined,
            },
            status: bulkStatusUpdate,
            reason: `Bulk status update to ${bulkStatusUpdate}`,
            updatedBy: user.userId,
          };
        }

        const response = await candidateApi.bulkUpdateCandidateStatus(bulkRequest);

        if (response.data) {
          showToast(
            `Updated ${response.data.successCount} candidates successfully. ${response.data.failureCount} failed.`,
            response.data.failureCount > 0 ? "error" : "success"
          );

          if (response.data.errorMessages && response.data.errorMessages.length > 0) {
            setBulkResultErrors(response.data.errorMessages);
          }

          setBulkStatusUpdate("");
          if (selectMode) {
            setSelectedCandidates(new Set());
            setSelectMode(false);
          }
          if (selectedCycle) {
            await fetchCandidates(selectedCycle, backendFiltersWithDrive, false);
          }
        }
      }
    } catch (error) {
      showToast("Failed to update candidate statuses", "error");
      console.error("Error updating bulk status:", error);
    } finally {
      setUpdatingBulkStatus(false);
    }
  };

  // Callback after successful scheduling
  const handleScheduleComplete = async () => {
    // Clear selections if in select mode
    if (selectMode) {
      setSelectedCandidates(new Set());
      setSelectMode(false);
    }
    
    // Refresh candidates with current filters
    if (selectedCycle) {
      await fetchCandidates(selectedCycle, backendFiltersWithDrive, false);
    }
  };

  return (
    <Box className="candidates-container">
      <Box className="candidates-main-layout">
        {/* Candidate Filter Sidebar */}
        <CandidateFilter
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            tokenstore.setSidebarOpen(false);
          }}
          filters={filters}
          onFilterChange={handleFilterChange}
          onCheckboxToggle={handleCheckboxToggle}
          onClearFilters={clearFilters}
          onSaveFilters={saveFilters}
          uniqueInstitutes={filterOptions?.institutes || []}
          uniqueStates={filterOptions?.states || []}
          citiesForSelectedState={citiesForSelectedState}
          uniqueDegrees={filterOptions?.degrees || []}
          uniqueDepartments={filterOptions?.departments || []}
          uniqueApplicationStages={uniqueApplicationStages}
          uniqueApplicationTypes={uniqueApplicationTypes}
          uniqueSkills={filterOptions?.skills || []}
          totalCount={totalElements}
          filteredCount={filteredCandidates.length}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Main Content Area */}
        <Box className={`candidates-content${sidebarOpen ? ' candidates-content--filter-open' : ''}`}>

          {/* Page Header — Title + Subtitle + Cycle Dropdown */}
          <Box className="cl-page-header">
            <Box className="cl-page-header-left">
              <Box className="cl-page-title-row">
                {selectedDrive !== "" && (
                  <button className="navbar-back-btn--candidate-match" onClick={handleBackFromDriveView} aria-label="Back to all candidates">
                    <ArrowBackIcon fontSize="small" />
                  </button>
                )}
                <Typography className="cl-page-title">Candidates Management</Typography>
              </Box>
              <Typography className="cl-page-subtitle">Manage and view all registered candidates</Typography>
            </Box>
            <Box className="cl-page-header-right">
              <FormControl size="small" className="cl-cycle-select">
                <Select
                  value={selectedCycle || ""}
                  displayEmpty
                  IconComponent={ChevronIcon}
                  MenuProps={{ classes: { paper: 'cl-dropdown-paper' } }}
                  onChange={(e) => {
                    const cycleId = Number(e.target.value);
                    setSelectedCycle(cycleId);
                    const cycle = cycles.find((c) => c.cycleId === cycleId);
                    setDrives(cycle?.drives || []);
                    setSelectedDrive("");
                    setSelectedCandidates(new Set());
                    setSelectMode(false);
                  }}
                >
                  <MenuItem value="" disabled>Select Cycle</MenuItem>
                  {cycles.map((cycle) => (
                    <MenuItem
                      key={cycle.cycleId}
                      value={cycle.cycleId}
                      className={cycle.status === "OPEN" ? "cycle-status-open" : "cycle-status-closed"}
                    >
                      {cycle.cycleName} - {cycle.cycleYear}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Notification Bell */}
              <div className="navbar-notif" ref={notifRef}>
                <button className="navbar-icon-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <span className="notif-dropdown-title">Notifications</span>
                      {unreadCount > 0 && (
                        <button className="notif-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                      )}
                    </div>
                    <div className="notif-dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">No notifications yet</div>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div
                            key={n.notificationId}
                            className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
                            onClick={() => handleMarkAsRead(n.notificationId)}
                          >
                            <div className="notif-item-icon">
                              {n.type === 'COURSE_ASSIGNMENT' ? '📚' : '🔔'}
                            </div>
                            <div className="notif-item-body">
                              <p className="notif-item-msg">{n.message}</p>
                              <span className="notif-item-time">{formatTime(n.createdAt)}</span>
                            </div>
                            {!n.isRead && <span className="notif-item-dot" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Box>
          </Box>

          {/* Toolbar — Filters | Search | Drive | Status | Update | History | Schedule | Add */}
          <Box className="cl-toolbar">
            <Box className="cl-toolbar-left">
              {/* Filters toggle button - hidden when sidebar is open */}
              {!sidebarOpen && (
                <Button
                  className="cl-filters-btn"
                  onClick={toggleSidebar}
                >
                  Filters <FilterListIcon style={{ fontSize: 18, marginLeft: 4, verticalAlign: 'middle' }} />
                </Button>
              )}

              {/* Search */}
              <Box className="cl-search-wrap">
                <span className="cl-search-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  className="cl-search-input"
                  placeholder="Search candidate..."
                  value={filters.candidateName}
                  onChange={(e) => handleFilterChange("candidateName", e.target.value)}
                />
              </Box>

              {/* Drive dropdown */}
              {selectedCycle && (
                <FormControl size="small" className="cl-drive-select">
                  <Select
                    value={selectedDrive}
                    displayEmpty
                    IconComponent={ChevronIcon}
                    MenuProps={{ classes: { paper: 'cl-dropdown-paper' } }}
                    onChange={(e) => setSelectedDrive(e.target.value as number | "")}
                  >
                    <MenuItem value="">All Drives</MenuItem>
                    {drives.map((drive) => (
                      <MenuItem key={drive.driveId} value={drive.driveId}>
                        <Box className="drive-option">
                          <span className={`drive-mode-dot ${drive.mode === "ON_CAMPUS" ? "oncampus" : "offcampus"}`} />
                          {drive.driveName}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

{/* Bulk status update */}
              {selectedCycle && (
                <>
                  <FormControl size="small" className="cl-status-select">
                    <Select
                      value={bulkStatusUpdate}
                      displayEmpty
                      IconComponent={ChevronIcon}
                      MenuProps={{ classes: { paper: 'cl-dropdown-paper' } }}
                      onChange={(e) => setBulkStatusUpdate(e.target.value)}
                      disabled={selectMode ? selectedCandidates.size === 0 : filteredCandidates.length === 0}
                    >
                      <MenuItem value="">Update Status</MenuItem>
                      <MenuItem value="SHORTLISTED">SHORTLISTED</MenuItem>
                      <MenuItem value="SELECTED">SELECTED</MenuItem>
                      <MenuItem value="REJECTED">REJECTED</MenuItem>
                      <MenuItem value="OFFERED">OFFERED</MenuItem>
                      <MenuItem value="JOINED">JOINED</MenuItem>
                      <MenuItem value="DROPPED">DROPPED</MenuItem>
                      <MenuItem value="CLOSED" sx={{ color: 'var(--color-error-delete)' }}>MOVE TO HISTORY</MenuItem>
                    </Select>
                  </FormControl>
                  <button
                    className={`cl-update-btn${selectedCandidates.size > 0 && bulkStatusUpdate ? ' active' : ''}`}
                    onClick={handleBulkStatusUpdate}
                    disabled={
                      !bulkStatusUpdate ||
                      (selectMode ? selectedCandidates.size === 0 : filteredCandidates.length === 0) ||
                      updatingBulkStatus
                    }
                  >
                    {updatingBulkStatus ? "Updating..." : selectMode ? `Update (${selectedCandidates.size})` : "Update"}
                  </button>
                </>
              )}
            </Box>

            <Box className="cl-toolbar-right">
              {selectedCycle && (
                <>
                  {/* History icon button */}
                  <Tooltip title="View History">
                    <IconButton
                      className="cl-icon-btn"
                      onClick={() => {
                        const selectedCycleData = cycles.find(c => c.cycleId === selectedCycle);
                        navigate(`/ta-recruiter/candidates/history?cycleId=${selectedCycle}&cycleName=${encodeURIComponent(selectedCycleData?.cycleName + ' - ' + selectedCycleData?.cycleYear || '')}`);
                      }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {/* Schedule Drive (renders its own calendar icon button internally) */}
                  <ScheduleDrive
                    cycleId={selectedCycle}
                    driveId={selectedDrive || null}
                    candidateIds={selectMode ? Array.from(selectedCandidates) : []}
                    selectMode={selectMode}
                    selectedCount={selectedCandidates.size}
                    totalElements={totalElements}
                    filterRequest={!selectMode && selectedCycle ? {
                      cycleId: selectedCycle,
                      driveId: selectedDrive || undefined,
                      lifecycleStatus: 'ACTIVE',
                      candidateName: undefined,
                      instituteName: filters.instituteName || undefined,
                      state: filters.state || undefined,
                      cities: filters.cities.length > 0 ? filters.cities : undefined,
                      degrees: filters.degrees.length > 0 ? filters.degrees : undefined,
                      departments: filters.departments.length > 0 ? filters.departments : undefined,
                      eligibility: filters.eligibility.length > 0 ? filters.eligibility : undefined,
                      applicationTypes: filters.applicationTypes.length > 0 ? filters.applicationTypes : undefined,
                      applicationStages: filters.applicationStages.length > 0 ? filters.applicationStages : undefined,
                      skills: filters.skills.length > 0 ? filters.skills : undefined,
                    } : undefined}
                    onScheduleComplete={handleScheduleComplete}
                  />
                </>
              )}

              {/* Add Candidate button */}
              <Tooltip title={
                selectedCycle && cycles.find(c => c.cycleId === selectedCycle)?.status === "CLOSED"
                  ? "Cannot add candidates to a closed cycle"
                  : !selectedDrive
                  ? "Please select a drive first"
                  : "Add Candidate"
              }>
                <span>
                  <Button
                    className="cl-add-btn"
                    startIcon={<AddIcon />}
                    onClick={handleAddCandidate}
                    disabled={!selectedDrive || (selectedCycle ? cycles.find(c => c.cycleId === selectedCycle)?.status === "CLOSED" : false)}
                  >
                    Add Candidate
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* Table */}
          {selectedCycle && (
            <>
              {candidatesLoading ? (
                <Box className="t-loading">
                  <CircularProgress />
                  <Typography className="t-loading-text">Loading candidates...</Typography>
                </Box>
              ) : filteredCandidates.length === 0 ? (
                <Card className="no-results-card">
                  <CardContent className="no-results-content">
                    <SchoolIcon className="no-results-icon" />
                    <Typography variant="h6" color="textSecondary">No candidates found</Typography>
                    <Typography variant="body2" color="textSecondary">Try adjusting your filters or add a new candidate</Typography>
                  </CardContent>
                </Card>
              ) : (
                <Box className="cl-table-wrapper">
                <TableContainer
                  component={Paper}
                  className="candidates-table-container"
                  onScroll={handleScroll}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell className="t-head-cell" padding="checkbox">
                          <Checkbox
                            className="cl-checkbox"
                            size="small"
                            checked={allVisibleSelected}
                            indeterminate={!allVisibleSelected && someVisibleSelected}
                            disabled={visibleCandidateIds.length === 0}
                            onChange={(e) => handleToggleSelectAllVisible(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell className="t-head-cell">College Name</TableCell>
                        <TableCell className="t-head-cell">Candidate Name</TableCell>
                        <TableCell className="t-head-cell">CGPA</TableCell>
                        <TableCell className="t-head-cell">No. of Arrears</TableCell>
                        <TableCell className="t-head-cell">Passout</TableCell>
                        <TableCell className="t-head-cell">Status</TableCell>
                        <TableCell className="t-head-cell">Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCandidates.map((candidate) => (
                        <TableRow
                          key={candidate.candidateId}
                          className="candidate-row clickable-row"
                          onClick={() => handleCandidateView(candidate.candidateId)}
                        >
                          {/* Checkbox — always visible */}
                          <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              className="cl-checkbox"
                              size="small"
                              checked={selectedCandidates.has(candidate.candidateId)}
                              onChange={() => {
                                setSelectedCandidates(prev => {
                                  const next = new Set(prev);
                                  if (next.has(candidate.candidateId)) {
                                    next.delete(candidate.candidateId);
                                  } else {
                                    next.add(candidate.candidateId);
                                  }
                                  return next;
                                });
                                if (!selectMode) setSelectMode(true);
                              }}
                            />
                          </TableCell>

                          {/* College Name with avatar */}
                          <TableCell>
                            <Tooltip
                              title={candidate.instituteName || "N/A"}
                              placement="top-start"
                              arrow
                              slotProps={{ tooltip: { className: 'g-tooltip' }, arrow: { className: 'g-tooltip-arrow' } }}
                            >
                              <Box className="institute-name-cell">
                                <Box className="cl-institute-avatar">
                                  {getInitials(candidate.instituteName || "")}
                                </Box>
                                <Typography className="cl-institute-name">{candidate.instituteName || "N/A"}</Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>

                          {/* Candidate Name */}
                          <TableCell>
                            <Tooltip
                              title={candidate.reason || "No additional information"}
                              arrow
                              placement="top"
                              slotProps={{ tooltip: { className: 'g-tooltip' }, arrow: { className: 'g-tooltip-arrow' } }}
                            >
                              <Typography
                                className={`cl-candidate-name${candidate.isEligible ? "" : " ineligible"}`}
                              >
                                {`${candidate.firstName} ${candidate.lastName}`}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          <TableCell><Typography>{candidate.cgpa?.toFixed(2) || "N/A"}</Typography></TableCell>
                          <TableCell><Typography>{candidate.historyOfArrears || 0}</Typography></TableCell>
                          <TableCell><Typography>{candidate.passoutYear || "N/A"}</Typography></TableCell>
                          <TableCell>
                            <Typography className={`cl-status-badge ${STATUS_CLASS_MAP[candidate.applicationStage] || ''}`}>
                              {candidate.applicationStage}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography className={`cl-status-badge ${TYPE_CLASS_MAP[candidate.applicationType] || ''}`}>
                              {candidate.applicationType || "N/A"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {loadingMore && (
                        <TableRow>
                          <TableCell colSpan={8} align="center" className="loading-more-cell">
                            <CircularProgress size={24} />
                            <Typography variant="body2" className="loading-more-text">Loading more candidates...</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Bulk Update Error Dialog */}
      <Dialog
        open={bulkResultErrors.length > 0}
        onClose={() => setBulkResultErrors([])}
        maxWidth="sm"
        fullWidth
        className="cl-error-dialog"
      >
        <DialogTitle className="cl-error-dialog-title">
          <Typography className="cl-error-dialog-heading">
            Update Errors ({bulkResultErrors.length})
          </Typography>
          <IconButton
            size="small"
            onClick={() => setBulkResultErrors([])}
            className="cl-error-dialog-close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="cl-error-dialog-content">
          {bulkResultErrors.map((error, index) => (
            <Box key={index} className="cl-error-dialog-item">
              <Typography className="cl-error-dialog-index">{index + 1}</Typography>
              <Typography className="cl-error-dialog-message">{error}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions className="cl-error-dialog-actions">
          <Button
            onClick={() => setBulkResultErrors([])}
            className="cl-error-dialog-close-btn"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateList;
