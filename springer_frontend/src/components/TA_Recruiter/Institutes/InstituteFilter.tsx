import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "../../../css/TA_Recruiter/Institutes/InstituteFilter.css";

interface InstituteFilters {
  instituteName: string;
  state: string;
  cities: string[];
  instituteTier: string;
  status: string;
  programs: string[];
}

interface InstituteFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: InstituteFilters;
  onFilterChange: (field: keyof InstituteFilters, value: string | string[]) => void;
  onCheckboxToggle: (field: keyof InstituteFilters, value: string) => void;
  onClearFilters: () => void;
  uniqueStates: string[];
  citiesForSelectedState: string[];
  uniqueTiers: string[];
  uniquePrograms: string[];
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}

const TIER_LABELS: Record<string, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

const InstituteFilter: React.FC<InstituteFilterProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onCheckboxToggle,
  onClearFilters,
  uniqueStates,
  citiesForSelectedState,
  uniqueTiers,
  uniquePrograms,
  totalCount,
  filteredCount,
  hasActiveFilters,
}) => {
  if (!isOpen) return null;

  return (
    <Box className="institute-filter-sidebar">
      {/* Header */}
      <Box className="institute-filter-header">
        <Typography variant="h6" className="institute-filter-title">
          Filters
        </Typography>
        <IconButton size="small" onClick={onClose} className="institute-filter-close-btn">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box className="institute-filter-content">

        {/* State */}
        <FormControl size="small" fullWidth className="institute-filter-field">
          <InputLabel>State</InputLabel>
          <Select
            value={filters.state}
            label="State"
            onChange={(e) => onFilterChange("state", e.target.value)}
          >
            <MenuItem value="">All States</MenuItem>
            {uniqueStates.map((state) => (
              <MenuItem key={state} value={state}>{state}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Cities — shown only when a state is selected */}
        {filters.state && citiesForSelectedState.length > 0 && (
          <Accordion className="institute-filter-accordion">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="institute-filter-accordion-summary">
              <Typography className="institute-filter-accordion-title">
                Cities {filters.cities.length > 0 && `(${filters.cities.length})`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="institute-filter-accordion-details">
              <FormGroup>
                {citiesForSelectedState.map((city) => (
                  <FormControlLabel
                    key={city}
                    control={
                      <Checkbox
                        checked={filters.cities.includes(city)}
                        onChange={() => onCheckboxToggle("cities", city)}
                        size="small"
                      />
                    }
                    label={city}
                    className="institute-filter-checkbox-label"
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Tier */}
        <FormControl size="small" fullWidth className="institute-filter-field">
          <InputLabel>Tier</InputLabel>
          <Select
            value={filters.instituteTier}
            label="Tier"
            onChange={(e) => onFilterChange("instituteTier", e.target.value)}
          >
            <MenuItem value="">All Tiers</MenuItem>
            {uniqueTiers.map((tier) => (
              <MenuItem key={tier} value={tier}>
                {TIER_LABELS[tier] ?? tier}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status */}
        <FormControl size="small" fullWidth className="institute-filter-field">
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>

        {/* Programs */}
        {uniquePrograms.length > 0 && (
          <Accordion className="institute-filter-accordion">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="institute-filter-accordion-summary">
              <Typography className="institute-filter-accordion-title">
                Programs {filters.programs.length > 0 && `(${filters.programs.length})`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="institute-filter-accordion-details">
              <FormGroup>
                {uniquePrograms.map((program) => (
                  <FormControlLabel
                    key={program}
                    control={
                      <Checkbox
                        checked={filters.programs.includes(program)}
                        onChange={() => onCheckboxToggle("programs", program)}
                        size="small"
                      />
                    }
                    label={program.replace(/_/g, " ")}
                    className="institute-filter-checkbox-label"
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>

      {/* Footer */}
      <Box className="institute-filter-footer">
        <Typography variant="body2" className="institute-filter-results-count">
          Showing {filteredCount} of {totalCount} institutes
        </Typography>
        {hasActiveFilters && (
          <Box className="institute-filter-actions">
            <Button
              variant="outlined"
              size="small"
              onClick={onClearFilters}
              className="institute-filter-clear-btn"
            >
              Clear All
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InstituteFilter;
