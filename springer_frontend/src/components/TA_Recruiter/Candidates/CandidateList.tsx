import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { candidateApi } from "../../../services/drive.api";
import { hiringCycleApi } from "../../../services/hiring.api";
import type { HiringCycleSummaryResponse } from "../../../types/TA_Recruiter/Hiring/hiringCycle.types";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import { useCandidateFilters } from "../../../hooks/useCandidateFilters";
import { useCandidatesPagination } from "../../../hooks/useCandidatesPagination";
import { useFilterOptions } from "../../../contexts/FilterOptionsContext";
import CandidateFilter from "./CandidateFilter";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SchoolIcon from "@mui/icons-material/School";
import EmailIcon from "@mui/icons-material/Email";
import UpdateIcon from "@mui/icons-material/Update";
import MenuIcon from "@mui/icons-material/Menu";
import "../../../css/TA_Recruiter/Candidates/CandidateList.css";

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState<string>("");
  const [updatingBulkStatus, setUpdatingBulkStatus] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => tokenstore.getSidebarOpen());
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  
  // Use custom pagination hook for ACTIVE candidates
  const {
    allCandidates,
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
  } = useCandidateFilters(allCandidates);

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
      const response = await hiringCycleApi.getAllCycleSummaries();
      if (response.data) {
        // Sort by year descending (largest year first)
        const sortedCycles = response.data.sort((a, b) => b.cycleYear - a.cycleYear);
        setCycles(sortedCycles);
        // Auto-select first cycle
        if (sortedCycles.length > 0) {
          setSelectedCycle(sortedCycles[0].cycleId);
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

  // Fetch candidates when cycle OR filters change (always resets to page 0)
  useEffect(() => {
    if (selectedCycle !== null) {
      fetchCandidates(selectedCycle, filters, false); // false = reset pagination
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle, filters.candidateName, filters.instituteName, filters.state, 
      filters.cities, filters.degrees, filters.departments, filters.eligibility,
      filters.applicationTypes, filters.applicationStages, filters.skills,
      filters.sortBy, filters.sortDirection]);
  // Note: fetchCandidates and filters object are intentionally excluded from deps
  // to prevent infinite re-renders. We track individual filter properties instead.

  // Infinite scroll handler
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    handleScrollHook(event, selectedCycle, filters);
  };

  const handleCandidateView = (candidateId: number) => {
    navigate(`/ta-recruiter/candidates/${candidateId}`);
  };

  const handleAddCandidate = () => {
    const selectedCycleData = cycles.find(c => c.cycleId === selectedCycle);
    navigate("/ta-recruiter/candidates/add", { 
      state: { 
        cycleId: selectedCycle,
        cycleYear: selectedCycleData?.cycleYear,
        cycleName: selectedCycleData?.cycleName
      } 
    });
  };

  const handleSendInvite = () => {
    if (!selectedCycle) return;
    showToast("Invite sent to all candidates in this cycle", "success");
    // TODO: Implement actual invite logic
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
    // Determine which candidates to update based on select mode
    const candidateIdsToUpdate = selectMode 
      ? Array.from(selectedCandidates) 
      : allCandidates.map((c) => c.candidateId);

    if (!bulkStatusUpdate || candidateIdsToUpdate.length === 0) {
      showToast(
        selectMode 
          ? "Please select candidates and a status to update" 
          : "Please select a status and ensure candidates are displayed", 
        "error"
      );
      return;
    }

    setUpdatingBulkStatus(true);
    try {
      const response = await candidateApi.bulkUpdateCandidateStatus({
        candidateIds: candidateIdsToUpdate,
        status: bulkStatusUpdate,
        reason: `Bulk status update to ${bulkStatusUpdate}`,
        updatedBy: 1, // TODO: Replace with actual logged-in user ID
      });

      if (response.data) {
        showToast(
          `Updated ${response.data.successCount} candidates successfully. ${response.data.failureCount} failed.`,
          response.data.failureCount > 0 ? "error" : "success"
        );
        setBulkStatusUpdate("");
        
        // Clear selections and exit select mode if active
        if (selectMode) {
          setSelectedCandidates(new Set());
          setSelectMode(false);
        }
        
        // Refresh candidates
        if (selectedCycle) {
          await fetchCandidates(selectedCycle);
        }
      }
    } catch (error) {
      showToast("Failed to update candidate statuses", "error");
      console.error("Error updating bulk status:", error);
    } finally {
      setUpdatingBulkStatus(false);
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
          totalCount={allCandidates.length}
          filteredCount={allCandidates.length}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Main Content Area */}
        <Box className={`candidates-content ${sidebarOpen ? "sidebar-open" : ""}`}>
          {/* Single Unified Header */}
          <Card className="candidates-header">
            <Box className="candidates-header-left">
              <IconButton onClick={toggleSidebar} className="candidates-hamburger-btn">
                <MenuIcon />
              </IconButton>
              
              <FormControl size="small" className="cycle-dropdown">
                <InputLabel>Hiring Cycle</InputLabel>
                <Select
                  value={selectedCycle || ""}
                  label="Hiring Cycle"
                  onChange={(e) => setSelectedCycle(Number(e.target.value))}
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
                      <MenuItem value="SELECTED">SELECTED</MenuItem>
                      <MenuItem value="REJECTED">REJECTED</MenuItem>
                      <MenuItem value="OFFERED">OFFERED</MenuItem>
                      <MenuItem value="JOINED">JOINED</MenuItem>
                      <MenuItem value="DROPPED">DROPPED</MenuItem>
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
                    className="bulk-update-btn"
                  >
                    {updatingBulkStatus ? "Updating..." : selectMode ? `Update (${selectedCandidates.size})` : "Update"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleToggleSelectMode}
                    disabled={allCandidates.length === 0}
                    className={selectMode ? "select-all-btn active" : "select-all-btn"}
                  >
                    {selectMode ? "Deselect" : "Select"}
                  </Button>

                  <IconButton
                    onClick={handleSendInvite}
                    className="send-invite-btn"
                  >
                    <EmailIcon />
                  </IconButton>
                </>
              )}
            </Box>

            <Tooltip title={selectedCycle && cycles.find(c => c.cycleId === selectedCycle)?.status === "CLOSED" ? "Cannot add candidates to closed cycle" : "Add Candidate"}>
              <span>
                <IconButton
                  onClick={handleAddCandidate}
                  className="add-candidate-icon-btn"
                  disabled={selectedCycle ? cycles.find(c => c.cycleId === selectedCycle)?.status === "CLOSED" : false}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Card>

          {/* Table */}
          {selectedCycle && (
            <>
              {candidatesLoading ? (
                <Box className="candidates-loading">
                  <CircularProgress />
                  <Typography>Loading candidates...</Typography>
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
                  style={{ maxHeight: 'calc(100vh - 190px)', overflowY: 'auto' }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell className="table-header">College Name</TableCell>
                        <TableCell className="table-header">Candidate Name</TableCell>
                        <TableCell className="table-header">CGPA</TableCell>
                        <TableCell className="table-header">No.of Arrears</TableCell>
                        <TableCell className="table-header">Passout</TableCell>
                        <TableCell className="table-header">Status</TableCell>
                        <TableCell className="table-header">Category</TableCell>
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
                                style={{ cursor: selectMode ? 'pointer' : 'default' }}
                              />
                              <Typography>{candidate.instituteName || "N/A"}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              title={candidate.reason || "No additional information"}
                              arrow
                              placement="top"
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
                            <Typography className="status-text">{candidate.applicationStage}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography>{candidate.applicationType || "N/A"}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {loadingMore && (
                        <TableRow>
                          <TableCell colSpan={7} align="center" style={{ padding: '20px' }}>
                            <CircularProgress size={24} />
                            <Typography variant="body2" style={{ marginTop: '8px' }}>
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
    </Box>
  );
};

export default CandidateList;
