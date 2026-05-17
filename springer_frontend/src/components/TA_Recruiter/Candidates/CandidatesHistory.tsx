import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import FilterListIcon from "@mui/icons-material/FilterList";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../../../css/TA_Recruiter/Candidates/CandidateList.css";

const STATUS_CLASS_MAP: Record<string, string> = {
  APPLIED: "cl-status-applied",
  SHORTLISTED: "cl-status-shortlisted",
  INVITED: "cl-status-invited",
  SCHEDULED: "cl-status-scheduled",
  SELECTED: "cl-status-selected",
  OFFERED: "cl-status-offered",
  JOINED: "cl-status-joined",
  REJECTED: "cl-status-rejected",
  ACCEPTED: "cl-status-accepted",
  DROPPED: "cl-status-dropped",
};

const TYPE_CLASS_MAP: Record<string, string> = {
  PREMIUM: "cl-type-premium",
  STANDARD: "cl-type-standard",
};

const getInitials = (name: string): string => {
  if (!name) return "??";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const CandidatesHistory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cycleId = Number(searchParams.get("cycleId"));
  const cycleName = searchParams.get("cycleName") || "";

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() =>
    tokenstore.getSidebarOpen()
  );

  // Use custom pagination hook for CLOSED candidates
  const {
    allCandidates,
    totalElements,
    candidatesLoading,
    loadingMore,
    fetchCandidates,
    handleScroll: handleScrollHook,
  } = useCandidatesPagination("CLOSED");

  // Use filter options context
  const { filterOptions, fetchFilterOptions } = useFilterOptions();

  // Use custom hook for filter state management
  const {
    filters,
    handleFilterChange,
    handleCheckboxToggle,
    clearFilters: clearFiltersHook,
    uniqueApplicationStages,
    uniqueApplicationTypes,
    hasActiveFilters,
  } = useCandidateFilters();

  // Calculate cities based on selected state from context data
  const citiesForSelectedState = React.useMemo(() => {
    if (!filters.state || !filterOptions?.stateToCitiesMap) {
      return [];
    }
    return filterOptions.stateToCitiesMap[filters.state] || [];
  }, [filters.state, filterOptions?.stateToCitiesMap]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    tokenstore.setSidebarOpen(newState);
  };

  const clearFilters = () => {
    clearFiltersHook();
    showToast("All filters cleared", "success");
  };

  // Fetch filter options when component mounts
  useEffect(() => {
    if (cycleId) {
      fetchFilterOptions(cycleId);
    }
  }, [cycleId, fetchFilterOptions]);

  // Fetch candidates when cycle OR filters change
  useEffect(() => {
    if (cycleId) {
      fetchCandidates(cycleId, filters, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cycleId,
    filters.candidateName,
    filters.instituteName,
    filters.state,
    filters.cities,
    filters.degrees,
    filters.departments,
    filters.eligibility,
    filters.applicationTypes,
    filters.applicationStages,
    filters.skills,
    filters.sortBy,
    filters.sortDirection,
  ]);

  // Infinite scroll handler
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    handleScrollHook(event, cycleId, filters);
  };

  const handleCandidateView = (candidateId: number) => {
    navigate(`/ta-recruiter/candidates/${candidateId}`);
  };

  const handleBack = () => {
    navigate("/ta-recruiter/candidates");
  };

  if (!cycleId) {
    return (
      <Box className="candidates-container">
        <Typography variant="h6" color="textSecondary" sx={{ p: 3 }}>
          No cycle selected. Please go back and select a cycle.
        </Typography>
      </Box>
    );
  }

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
          onSaveFilters={() => {}}
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
        <Box
          className={`candidates-content${sidebarOpen ? " candidates-content--filter-open" : ""}`}
        >
          {/* Header */}
          <Box className="cl-page-header">
            <Box className="ch-page-header-left">
              <button className="navbar-back-btn--candidate-match" onClick={handleBack} aria-label="Go back">
                <ArrowBackIcon fontSize="small" />
              </button>
              <Box className="ch-page-title-wrap">
                <Typography className="cl-page-title">
                  History of {cycleName}
                </Typography>
                <Typography className="cl-page-subtitle">
                  Closed candidates for the selected hiring cycle
                </Typography>
              </Box>
            </Box>
            <Box className="cl-page-header-right">
              {!sidebarOpen && (
                <Button className="cl-filters-btn" onClick={toggleSidebar}>
                  Filters <FilterListIcon style={{ fontSize: 18, marginLeft: 4, verticalAlign: 'middle' }} />
                </Button>
              )}
            </Box>
          </Box>

          {/* Table */}
          {candidatesLoading ? (
            <Box className="t-loading">
              <CircularProgress />
              <Typography className="t-loading-text">Loading closed candidates...</Typography>
            </Box>
          ) : allCandidates.length === 0 ? (
            <Card className="no-results-card">
              <CardContent className="no-results-content">
                <SchoolIcon className="no-results-icon" />
                <Typography variant="h6" color="textSecondary">
                  No closed candidates found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Try adjusting your filters
                </Typography>
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
                      <TableCell className="t-head-cell">College Name</TableCell>
                      <TableCell className="t-head-cell">
                        Candidate Name
                      </TableCell>
                      <TableCell className="t-head-cell">CGPA</TableCell>
                      <TableCell className="t-head-cell">
                        No.of Arrears
                      </TableCell>
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
                        onClick={() => handleCandidateView(candidate.candidateId)}
                      >
                        <TableCell>
                          <Tooltip
                            title={candidate.instituteName || "N/A"}
                            placement="top-start"
                            arrow
                            slotProps={{
                              tooltip: { className: "g-tooltip" },
                              arrow: { className: "g-tooltip-arrow" },
                            }}
                          >
                            <Box className="institute-name-cell">
                              <Box className="cl-institute-avatar">
                                {getInitials(candidate.instituteName || "")}
                              </Box>
                              <Typography className="cl-institute-name">
                                {candidate.instituteName || "N/A"}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title={
                              candidate.reason || "No additional information"
                            }
                            arrow
                            placement="top"
                            slotProps={{
                              tooltip: { className: "g-tooltip" },
                              arrow: { className: "g-tooltip-arrow" },
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
                          <Typography>
                            {candidate.cgpa?.toFixed(2) || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {candidate.historyOfArrears || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {candidate.passoutYear || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            className={`cl-status-badge ${STATUS_CLASS_MAP[candidate.applicationStage] || ""}`}
                          >
                            {candidate.applicationStage}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            className={`cl-status-badge ${TYPE_CLASS_MAP[candidate.applicationType] || ""}`}
                          >
                            {candidate.applicationType || "N/A"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {loadingMore && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          className="loading-more-cell"
                        >
                          <CircularProgress size={24} />
                          <Typography
                            variant="body2"
                            className="loading-more-text"
                          >
                            Loading more candidates...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CandidatesHistory;
