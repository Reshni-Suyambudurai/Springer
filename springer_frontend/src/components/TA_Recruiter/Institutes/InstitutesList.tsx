import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { instituteApi } from "../../../services/hiring.api";
import type { InstituteResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import SchoolIcon from "@mui/icons-material/School";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import "../../../css/TA_Recruiter/Institutes/InstitutesList.css";

interface Filters {
  instituteName: string;
  state: string;
  cities: string[];
  instituteTier: string;
  status: string;
  programs: string[];
}

const InstitutesList: React.FC = () => {
  const navigate = useNavigate();
  const [allInstitutes, setAllInstitutes] = useState<InstituteResponse[]>([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState<InstituteResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => tokenstore.getSidebarOpen());
  const [filters, setFilters] = useState<Filters>({
    instituteName: "",
    state: "",
    cities: [],
    instituteTier: "",
    status: "",
    programs: [],
  });
  const [editDialog, setEditDialog] = useState(false);
  const [editInstitute, setEditInstitute] = useState<InstituteResponse | null>(null);
  const [editForm, setEditForm] = useState({
    instituteName: "",
    city: "",
    state: "",
    instituteTier: "",
    isActive: true,
  });

  // Extract unique values for filter dropdowns
  const uniqueStates = Array.from(new Set(allInstitutes.map((inst) => inst.state))).filter(Boolean);
  const uniqueTiers = Array.from(new Set(allInstitutes.map((inst) => inst.instituteTier))).filter(Boolean);
  
  // Extract unique programs from all institutes
  const uniquePrograms = useMemo(() => {
    const programSet = new Set<string>();
    allInstitutes.forEach((inst) => {
      if (inst.programs && inst.programs.length > 0) {
        inst.programs.forEach((program) => {
          if (program.programName) {
            programSet.add(program.programName);
          }
        });
      }
    });
    return Array.from(programSet).sort();
  }, [allInstitutes]);
  
  // Create state-to-cities mapping
  const stateToCitiesMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    allInstitutes.forEach((inst) => {
      if (inst.state && inst.city) {
        if (!map[inst.state]) {
          map[inst.state] = new Set();
        }
        map[inst.state].add(inst.city);
      }
    });
    return map;
  }, [allInstitutes]);

  // Get cities for selected state
  const citiesForSelectedState = useMemo(() => {
    if (!filters.state || !stateToCitiesMap[filters.state]) {
      return [];
    }
    return Array.from(stateToCitiesMap[filters.state]).sort();
  }, [filters.state, stateToCitiesMap]);

  useEffect(() => {
    fetchInstitutes();
    // Auto-restore filters from sessionStorage on mount
    const savedFilters = tokenstore.getInstituteFilters();
    if (savedFilters) {
      setFilters(savedFilters);
    }
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await instituteApi.getAllInstitutes();
      if (response.data) {
        setAllInstitutes(response.data);
        setFilteredInstitutes(response.data);
      }
    } catch (error) {
      showToast("Failed to fetch institutes", "error");
      console.error("Error fetching institutes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...allInstitutes];

    if (filters.instituteName) {
      filtered = filtered.filter((institute) =>
        institute.instituteName.toLowerCase().includes(filters.instituteName.toLowerCase())
      );
    }

    if (filters.state) {
      filtered = filtered.filter((institute) => institute.state === filters.state);
    }

    if (filters.cities.length > 0) {
      filtered = filtered.filter((institute) => filters.cities.includes(institute.city));
    }

    if (filters.instituteTier) {
      filtered = filtered.filter((institute) => institute.instituteTier === filters.instituteTier);
    }

    if (filters.status) {
      const isActive = filters.status === "active";
      filtered = filtered.filter((institute) => institute.isActive === isActive);
    }

    if (filters.programs.length > 0) {
      filtered = filtered.filter((institute) => {
        if (!institute.programs || institute.programs.length === 0) {
          return false;
        }
        return institute.programs.some((program) =>
          filters.programs.includes(program.programName)
        );
      });
    }

    setFilteredInstitutes(filtered);
  }, [filters, allInstitutes]);

  const handleFilterChange = (field: keyof Filters, value: string | string[]) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // If state changes, clear cities
      if (field === "state") {
        updated.cities = [];
      }
      
      return updated;
    });
  };

  const handleCityToggle = (city: string) => {
    setFilters((prev) => ({
      ...prev,
      cities: prev.cities.includes(city)
        ? prev.cities.filter((c) => c !== city)
        : [...prev.cities, city],
    }));
  };

  const handleProgramToggle = (program: string) => {
    setFilters((prev) => ({
      ...prev,
      programs: prev.programs.includes(program)
        ? prev.programs.filter((p) => p !== program)
        : [...prev.programs, program],
    }));
  };

  const clearFilters = () => {
    setFilters({
      instituteName: "",
      state: "",
      cities: [],
      instituteTier: "",
      status: "",
      programs: [],
    });
    tokenstore.clearInstituteFilters();
    showToast('All filters cleared', 'success');
  };

  const saveFilters = () => {
    const filtersToSave = {
      instituteName: filters.instituteName,
      state: filters.state,
      cities: filters.cities,
      instituteTier: filters.instituteTier,
      status: filters.status,
      programs: filters.programs,
    };
    
    const success = tokenstore.saveInstituteFilters(filtersToSave);
    if (success) {
      showToast('Filters saved for this session', 'success');
    } else {
      showToast('Failed to save filters', 'error');
    }
  };

  const handleInstituteClick = (instituteId: number) => {
    navigate(`/ta-recruiter/institutes/${instituteId}`);
  };

  const handleInvite = (instituteId: number, instituteName: string) => {
    // TODO: Implement invite functionality
    showToast(`Invite sent to ${instituteName}`, "success");
    console.log("Invite institute:", instituteId);
  };

  const handleAddInstitute = () => {
    navigate("/ta-recruiter/institutes/add");
  };

  const handleEditClick = (institute: InstituteResponse) => {
    setEditInstitute(institute);
    setEditForm({
      instituteName: institute.instituteName,
      city: institute.city,
      state: institute.state,
      instituteTier: institute.instituteTier,
      isActive: institute.isActive,
    });
    setEditDialog(true);
  };

  const toggleSidebar = (newState: boolean) => {
    setSidebarOpen(newState);
    tokenstore.setSidebarOpen(newState);
  };

  const handleEditSave = async () => {
    if (!editInstitute) return;
    try {
      await instituteApi.updateInstitute(editInstitute.instituteId, editForm);
      showToast("Institute updated successfully", "success");
      setEditDialog(false);
      fetchInstitutes();
    } catch (error) {
      console.error(error);
      showToast("Failed to update institute", "error");
    }
  };

  const handleToggleStatus = async (institute: InstituteResponse) => {
    try {
      await instituteApi.deleteInstitute(institute.instituteId);
      showToast(`Institute ${institute.isActive ? 'deactivated' : 'activated'} successfully`, "success");
      fetchInstitutes();
    } catch (error) {
      console.error(error);
      showToast("Failed to toggle institute status", "error");
    }
  };

  const getTierClassName = (tier: string): string => {
    switch (tier) {
      case "TIER_1":
        return "tier-chip-table tier-chip-tier1";
      case "TIER_2":
        return "tier-chip-table tier-chip-tier2";
      case "TIER_3":
        return "tier-chip-table tier-chip-tier3";
      default:
        return "tier-chip-table";
    }
  };

  const getStatusClassName = (isActive: boolean): string => {
    return isActive ? "status-chip-table status-chip-active" : "status-chip-table status-chip-inactive";
  };

  if (loading) {
    return (
      <Box className="institutes-loading">
        <CircularProgress />
        <Typography>Loading institutes...</Typography>
      </Box>
    );
  }

  return (
    <Box className="institutes-container">
      <Box className="institutes-main-layout">
        {/* Sidebar - slides in from left */}
        {sidebarOpen && (
          <Box className="institutes-sidebar">
            <Box className="institutes-sidebar-header">
              <Typography variant="h6" className="institutes-sidebar-title">
                Filters
              </Typography>
              <IconButton
                onClick={() => toggleSidebar(false)}
                className="institutes-sidebar-close-btn"
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box className="institutes-sidebar-content">
              {/* College Name Filter */}
              <TextField
                label="College Name"
                variant="outlined"
                size="small"
                fullWidth
                value={filters.instituteName}
                onChange={(e) => handleFilterChange("instituteName", e.target.value)}
                className="institutes-sidebar-field"
              />

              {/* Tier Filter */}
              <FormControl size="small" fullWidth className="institutes-sidebar-field">
                <InputLabel>Tier</InputLabel>
                <Select
                  value={filters.instituteTier}
                  label="Tier"
                  onChange={(e) => handleFilterChange("instituteTier", e.target.value)}
                >
                  <MenuItem value="">All Tiers</MenuItem>
                  {uniqueTiers.map((tier) => (
                    <MenuItem key={tier} value={tier}>
                      {tier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status Filter */}
              <FormControl size="small" fullWidth className="institutes-sidebar-field">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* State Dropdown */}
              <FormControl size="small" fullWidth className="institutes-sidebar-field">
                <InputLabel>State</InputLabel>
                <Select
                  value={filters.state}
                  label="State"
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                >
                  <MenuItem value="">All States</MenuItem>
                  {uniqueStates.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Cities Checkboxes - Show only when state is selected */}
              {filters.state && citiesForSelectedState.length > 0 && (
                <Box className="institutes-sidebar-cities">
                  <Typography variant="subtitle2" className="institutes-sidebar-cities-label">
                    Cities in {filters.state}
                  </Typography>
                  <FormGroup className="institutes-sidebar-cities-group">
                    {citiesForSelectedState.map((city) => (
                      <FormControlLabel
                        key={city}
                        control={
                          <Checkbox
                            checked={filters.cities.includes(city)}
                            onChange={() => handleCityToggle(city)}
                            size="small"
                          />
                        }
                        label={city}
                        className="institutes-sidebar-city-checkbox"
                      />
                    ))}
                  </FormGroup>
                </Box>
              )}

              {/* Programs Checkboxes */}
              {uniquePrograms.length > 0 && (
                <Box className="institutes-sidebar-cities">
                  <Typography variant="subtitle2" className="institutes-sidebar-cities-label">
                    Programs
                  </Typography>
                  <FormGroup className="institutes-sidebar-cities-group">
                    {uniquePrograms.map((program) => (
                      <FormControlLabel
                        key={program}
                        control={
                          <Checkbox
                            checked={filters.programs.includes(program)}
                            onChange={() => handleProgramToggle(program)}
                            size="small"
                          />
                        }
                        label={program.replace(/_/g, ' ')}
                        className="institutes-sidebar-city-checkbox"
                      />
                    ))}
                  </FormGroup>
                </Box>
              )}
            </Box>

            {/* Sidebar Footer - Fixed at bottom */}
            <Box className="institutes-sidebar-footer">
              {/* Results Count */}
              <Typography variant="body2" className="institutes-sidebar-results-count">
                Showing {filteredInstitutes.length} of {allInstitutes.length} institutes
              </Typography>

              {/* Action Buttons */}
              {(filters.instituteName ||
                filters.state ||
                filters.cities.length > 0 ||
                filters.instituteTier ||
                filters.status ||
                filters.programs.length > 0) && (
                <Box className="institutes-sidebar-actions">
                  <Button
                    onClick={saveFilters}
                    size="small"
                    className="institutes-sidebar-save-btn"
                  >
                    Save
                  </Button>
                  <Button
                    
                    onClick={clearFilters}
                    size="small"
                    className="institutes-sidebar-clear-btn"
                  >
                    Clear 
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Main Content Area */}
        <Box className={`institutes-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {/* Header */}
          <Card className="institutes-header">
            <IconButton
              onClick={() => toggleSidebar(!sidebarOpen)}
              className="institutes-hamburger-btn"
            >
              <MenuIcon />
            </IconButton>
            
            <Box className="institutes-header-center">
              <Box className="institutes-header-text">
                <Typography variant="h4" className="institutes-title">
                  Institutes Management
                </Typography>
                <Typography variant="body2" className="institutes-subtitle">
                  Manage and view all registered institutes
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={handleAddInstitute}
              className="add-institute-icon-btn"
            >
              <AddIcon />
            </IconButton>
          </Card>

          {/* Table */}
          {filteredInstitutes.length === 0 ? (
            <Card className="no-results-card">
              <Box className="no-results-content">
                <SchoolIcon className="no-results-icon" />
                <Typography variant="h6">
                  No institutes found
                </Typography>
                <Typography variant="body2">
                  Try adjusting your filters or add a new institute
                </Typography>
              </Box>
            </Card>
          ) : (
            <TableContainer component={Paper} className="institutes-table-container">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="table-header">Institute</TableCell>
                    <TableCell className="table-header">Tier</TableCell>
                    <TableCell className="table-header">Location</TableCell>
                    <TableCell className="table-header">Status</TableCell>
                    <TableCell className="table-header" align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInstitutes.map((institute) => (
                    <TableRow
                      key={institute.instituteId}
                      className="institute-row"
                      onClick={() => handleInstituteClick(institute.instituteId)}
                    >
                      <TableCell>
                        <Box className="institute-name-cell">
                          <SchoolIcon className="institute-table-icon" />
                          <Box>
                            <Typography className="institute-table-name">
                              {institute.instituteName}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={institute.instituteTier}
                          size="small"
                          className={getTierClassName(institute.instituteTier)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box className="location-cell">
                          <LocationOnIcon className="location-table-icon" />
                          <Typography variant="body2">
                            {institute.city}, {institute.state}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={institute.isActive ? "Active" : "Inactive"}
                          size="small"
                          className={getStatusClassName(institute.isActive)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(institute);
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box className="action-buttons">
                          <IconButton
                            size="small"
                            className="action-btn edit-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(institute);
                            }}
                            title="Edit Institute"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            className="action-btn invite-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvite(institute.instituteId, institute.instituteName);
                            }}
                            title="Send Invite"
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Institute</DialogTitle>
        <DialogContent>
          <Box className="institutes-edit-dialog-content">
            <TextField
              label="Institute Name"
              fullWidth
              value={editForm.instituteName}
              onChange={(e) => setEditForm({ ...editForm, instituteName: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select
                value={editForm.instituteTier}
                label="Tier"
                onChange={(e) => setEditForm({ ...editForm, instituteTier: e.target.value })}
              >
                <MenuItem value="TIER_1">TIER 1</MenuItem>
                <MenuItem value="TIER_2">TIER 2</MenuItem>
                <MenuItem value="TIER_3">TIER 3</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="City"
              fullWidth
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
            />
            <TextField
              label="State"
              fullWidth
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
              }
              label="Active Status"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InstitutesList;
