import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { candidateApi } from "../../../services/drive.api";
import { hiringCycleApi } from "../../../services/hiring.api";
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
  CircularProgress,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
import SchoolIcon from "@mui/icons-material/School";
import UpdateIcon from "@mui/icons-material/Update";
import HistoryIcon from "@mui/icons-material/History";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
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

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
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
  // NOTE: Filtering is done by backend, not client-side!
  // The 'filters' object is passed to fetchCandidates() → backend /filter endpoint
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
      const filtersWithDrive = {
        ...filters,
        driveId: selectedDrive || undefined,
      };
      fetchCandidates(selectedCycle, filtersWithDrive, false); // false = reset pagination
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle, selectedDrive, filters.candidateName, filters.instituteName, filters.state, 
      filters.cities, filters.degrees, filters.departments, filters.eligibility,
      filters.applicationTypes, filters.applicationStages, filters.skills,
      filters.sortBy, filters.sortDirection]);
  // Note: fetchCandidates and filters object are intentionally excluded from deps
  // to prevent infinite re-renders. We track individual filter properties instead.

  // Infinite scroll handler
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const filtersWithDrive = { ...filters, driveId: selectedDrive || undefined };
    handleScrollHook(event, selectedCycle, filtersWithDrive);
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

  

  // Toggle select mode
  const handleToggleSelectMode = () => {
    if (selectMode) {
      // Exiting select mode - clear all selections
      setSelectedCandidates(new Set());
      setSelectMode(false);
    } else {
      // Entering select mode - DO NOT auto-select candidates
      setSelectMode(true);
    }
  };

  // Toggle individual candidate selection
  const handleToggleCandidateSelection = (candidateId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
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
              candidateName: filters.candidateName || undefined,
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
            await fetchCandidates(selectedCycle, { ...filters, driveId: selectedDrive || undefined }, false);
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
              candidateName: filters.candidateName || undefined,
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
            await fetchCandidates(selectedCycle, { ...filters, driveId: selectedDrive || undefined }, false);
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
      await fetchCandidates(selectedCycle, { ...filters, driveId: selectedDrive || undefined }, false);
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
          filteredCount={allCandidates.length}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Main Content Area */}
        <Box className={`candidates-content ${sidebarOpen ? "sidebar-open" : ""}`}>
          {/* Single Unified Header */}
          <Card className="candidates-header">
            <Box className="candidates-header-left">
              <IconButton
                onClick={toggleSidebar}
                className="candidates-hamburger-btn"
                size="small"
              >
                <MenuIcon />
              </IconButton>

              <FormControl size="small" className="cycle-dropdown">
                <InputLabel>Hiring Cycle</InputLabel>
                <Select
                  value={selectedCycle || ""}
                  label="Hiring Cycle"
                  onChange={(e) => {
                    const cycleId = Number(e.target.value);
                    setSelectedCycle(cycleId);
                    const cycle = cycles.find((c) => c.cycleId === cycleId);
                    setDrives(cycle?.drives || []);
                    setSelectedDrive("");
                  }}
                >
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

              <FormControl size="small" className="drive-dropdown">
                <InputLabel>Drive</InputLabel>
                <Select
                  value={selectedDrive}
                  label="Drive"
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

              {selectedCycle && (
                <>
                  <FormControl size="small" className="bulk-status-dropdown">
                    <InputLabel>Update Status To</InputLabel>
                    <Select
                      value={bulkStatusUpdate}
                      label="Update Status To"
                      onChange={(e) => setBulkStatusUpdate(e.target.value)}
                      disabled={selectMode ? selectedCandidates.size === 0 : allCandidates.length === 0}
                    >
                      <MenuItem value="">Select Status</MenuItem>                 
                      <MenuItem value="SHORTLISTED">SHORTLISTED</MenuItem>   
                                  
                     
                      <MenuItem value="CLOSED" sx={{ color: 'var(--color-error-delete)' }}>MOVE TO HISTORY</MenuItem>
                    </Select>
                  </FormControl>

                  <Button
                    variant="contained"
                    startIcon={<UpdateIcon />}
                    onClick={handleBulkStatusUpdate}
                    disabled={
                      !bulkStatusUpdate ||
                      (selectMode ? selectedCandidates.size === 0 : allCandidates.length === 0) ||
                      updatingBulkStatus
                    }
                  className="t-btn-success"
                  >
                    {updatingBulkStatus ? "Updating..." : selectMode ? `Update (${selectedCandidates.size})` : "Update"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleToggleSelectMode}
                    disabled={allCandidates.length === 0}
                    className={selectMode ? "select-all-btn t-btn-small active" : "select-all-btn t-btn-small"}
                  >
                    {selectMode ? "Deselect" : "Select"}
                  </Button>

                 
                </>
              )}
            </Box>

            <Box className="candidates-header-right">
              {selectedCycle && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => {
                      const selectedCycleData = cycles.find(c => c.cycleId === selectedCycle);
                      navigate(`/ta-recruiter/candidates/history?cycleId=${selectedCycle}&cycleName=${encodeURIComponent(selectedCycleData?.cycleName + ' - ' + selectedCycleData?.cycleYear || '')}`);
                    }}
                    className="select-all-btn t-btn-small"
                  >
                    History
                  </Button>

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
                      candidateName: filters.candidateName || undefined,
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

              <Tooltip title={selectedCycle && cycles.find(c => c.cycleId === selectedCycle)?.status === "CLOSED" ? "Cannot add candidates to closed cycle" : "Add Candidate"}>
                <span>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddCandidate}
                    className="t-btn-primary"
                    disabled={!selectedDrive || (selectedCycle ? cycles.find(c => c.cycleId === selectedCycle)?.status === "CLOSED" : false)}
                  >
                    Add Candidate
                  </Button>
              </span>
            </Tooltip>
            </Box>
          </Card>

          {/* Table */}
          {selectedCycle && (
            <>
              {candidatesLoading ? (
                <Box className="t-loading">
                  <CircularProgress />
                  <Typography className="t-loading-text">Loading candidates...</Typography>
                </Box>
              ) : allCandidates.length === 0 ? (
                <Card className="no-results-card">
                  <CardContent className="no-results-content">
                    <SchoolIcon className="no-results-icon" />
                    <Typography variant="h6" color="textSecondary">
                      No candidates found
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Try adjusting your filters or add a new candidate
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <TableContainer 
                  component={Paper} 
                  className="candidates-table-container"
                  onScroll={handleScroll}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell className="t-head-cell">College Name</TableCell>
                        <TableCell className="t-head-cell">Candidate Name</TableCell>
                        <TableCell className="t-head-cell">CGPA</TableCell>
                        <TableCell className="t-head-cell">No.of Arrears</TableCell>
                        <TableCell className="t-head-cell">Passout</TableCell>
                        <TableCell className="t-head-cell">Status</TableCell>
                        <TableCell className="t-head-cell">Category</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allCandidates.map((candidate) => (
                        <TableRow 
                          key={candidate.candidateId} 
                          className="candidate-row clickable-row"
                          onClick={() => !selectMode && handleCandidateView(candidate.candidateId)}
                        >
                          <TableCell>
                            <Tooltip
                              title={candidate.instituteName || "N/A"}
                              placement="top-start"
                              arrow
                              slotProps={{
                                tooltip: { className: 'g-tooltip' },
                                arrow: { className: 'g-tooltip-arrow' },
                              }}
                            >
                              <Box className="institute-name-cell">
                                <SchoolIcon 
                                  className={
                                    selectMode
                                      ? selectedCandidates.has(candidate.candidateId)
                                        ? "institute-icon-small selectable selected"
                                        : "institute-icon-small selectable"
                                      : "institute-icon-small"
                                  }
                                  onClick={(e) => selectMode && handleToggleCandidateSelection(candidate.candidateId, e)}
                                />
                                <Typography className="t-row-primary">{candidate.instituteName || "N/A"}</Typography>
                              </Box>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              title={candidate.reason || "No additional information"}
                              arrow
                              placement="top"
                              slotProps={{
                                tooltip: { className: 'g-tooltip' },
                                arrow: { className: 'g-tooltip-arrow' },
                              }}
                            >
                              <Typography
                                className={
                                  candidate.isEligible
                                    ? "candidate-name-eligible"
                                    : "candidate-name-ineligible"
                                }
                              >
                                {`${candidate.firstName} ${candidate.lastName}`}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography>{candidate.cgpa?.toFixed(2) || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography>{candidate.historyOfArrears || 0}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography>{candidate.passoutYear || "N/A"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography className={`cl-status-badge ${STATUS_CLASS_MAP[candidate.applicationStage] || ''}`}>{candidate.applicationStage}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography className={`cl-status-badge ${TYPE_CLASS_MAP[candidate.applicationType] || ''}`}>{candidate.applicationType || "N/A"}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {loadingMore && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" className="loading-more-cell">
                            <CircularProgress size={24} />
                            <Typography variant="body2" className="loading-more-text">
                              Loading more candidates...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
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
