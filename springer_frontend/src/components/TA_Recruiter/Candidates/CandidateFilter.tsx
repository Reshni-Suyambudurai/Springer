import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Menu,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import "../../../css/TA_Recruiter/Candidates/CandidateFilter.css";

interface Filters {
  candidateName: string;
  instituteName: string;
  state: string;
  cities: string[];
  degrees: string[];
  departments: string[];
  eligibility: string[];
  applicationTypes: string[];
  applicationStages: string[];
  skills: string[];
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

interface CandidateFilterProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFilterChange: (field: keyof Filters, value: string) => void;
  onCheckboxToggle: (field: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  onSaveFilters: () => void;
  uniqueInstitutes: string[];
  uniqueStates: string[];
  citiesForSelectedState: string[];
  uniqueDegrees: string[];
  uniqueDepartments: string[];
  uniqueApplicationStages: string[];
  uniqueApplicationTypes: string[];
  uniqueSkills: string[];
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
}

const CandidateFilter: React.FC<CandidateFilterProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onCheckboxToggle,
  onClearFilters,
  onSaveFilters,
  uniqueInstitutes,
  uniqueStates,
  citiesForSelectedState,
  uniqueDegrees,
  uniqueDepartments,
  uniqueApplicationStages,
  uniqueApplicationTypes,
  uniqueSkills,
  totalCount,
  filteredCount,
  hasActiveFilters,
}) => {
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const sortMenuOpen = Boolean(sortAnchorEl);

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (sortBy: string, sortDirection: 'ASC' | 'DESC') => {
    onFilterChange('sortBy', sortBy);
    onFilterChange('sortDirection', sortDirection);
    handleSortClose();
  };

  if (!isOpen) return null;

  return (
    <Box className="candidate-filter-sidebar">
      {/* Sidebar Header */}
      <Box className="candidate-filter-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" className="candidate-filter-title">
            Filters
          </Typography>
          <IconButton
            size="small"
            onClick={handleSortClick}
            className="sort-toggle-btn"
            sx={{ 
              color: filters.sortBy && filters.sortBy !== 'candidateId' ? 'var(--color-primary)' : 'inherit',
              padding: '4px',
            }}
          >
            <ArrowDropUpIcon />
          </IconButton>
          <Menu
            anchorEl={sortAnchorEl}
            open={sortMenuOpen}
            onClose={handleSortClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
          >
            <MenuItem onClick={() => handleSortSelect('cgpa', 'DESC')}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                CGPA <span style={{ color: 'var(--color-primary)' }}>↓ High to Low</span>
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('cgpa', 'ASC')}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                CGPA <span style={{ color: 'var(--color-primary)' }}>↑ Low to High</span>
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('passoutYear', 'DESC')}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Passout Year <span style={{ color: 'var(--color-primary)' }}>↓ Recent</span>
              </Typography>
            </MenuItem>
            <MenuItem onClick={() => handleSortSelect('passoutYear', 'ASC')}>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Passout Year <span style={{ color: 'var(--color-primary)' }}>↑ Oldest</span>
              </Typography>
            </MenuItem>
           
            <MenuItem onClick={() => handleSortSelect('candidateId', 'DESC')}>
              <Typography sx={{ color: 'var(--color-text-muted)' }}>
                Default (Latest First)
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          className="candidate-filter-close-btn"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Sidebar Content */}
      <Box className="candidate-filter-content">
        {/* Candidate Name - Text Field */}
        <TextField
          label="Candidate Name"
          variant="outlined"
          size="small"
          fullWidth
          value={filters.candidateName}
          onChange={(e) => onFilterChange("candidateName", e.target.value)}
          className="candidate-filter-field"
        />

        {/* Institute - Dropdown */}
        <FormControl size="small" fullWidth className="candidate-filter-field">
          <InputLabel>Institute</InputLabel>
          <Select
            value={filters.instituteName}
            label="Institute"
            onChange={(e) => onFilterChange("instituteName", e.target.value)}
          >
            <MenuItem value="">All Institutes</MenuItem>
            {uniqueInstitutes.map((institute) => (
              <MenuItem key={institute} value={institute}>
                {institute}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* State - Dropdown */}
        <FormControl size="small" fullWidth className="candidate-filter-field">
          <InputLabel>State</InputLabel>
          <Select
            value={filters.state}
            label="State"
            onChange={(e) => onFilterChange("state", e.target.value)}
          >
            <MenuItem value="">All States</MenuItem>
            {uniqueStates.map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* City - Accordion with Checkboxes */}
        {filters.state && citiesForSelectedState.length > 0 && (
          <Accordion className="candidate-filter-accordion">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
              <Typography className="candidate-filter-accordion-title">
                Cities {filters.cities.length > 0 && `(${filters.cities.length})`}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="candidate-filter-accordion-details">
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
                    className="candidate-filter-checkbox-label"
                  />
                ))}
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Degree - Accordion with Checkboxes */}
        <Accordion className="candidate-filter-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
            <Typography className="candidate-filter-accordion-title">
              Degree {filters.degrees.length > 0 && `(${filters.degrees.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="candidate-filter-accordion-details">
            <FormGroup>
              {uniqueDegrees.map((degree) => (
                <FormControlLabel
                  key={degree}
                  control={
                    <Checkbox
                      checked={filters.degrees.includes(degree)}
                      onChange={() => onCheckboxToggle("degrees", degree)}
                      size="small"
                    />
                  }
                  label={degree}
                  className="candidate-filter-checkbox-label"
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Department - Accordion with Checkboxes */}
        <Accordion className="candidate-filter-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
            <Typography className="candidate-filter-accordion-title">
              Department {filters.departments.length > 0 && `(${filters.departments.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="candidate-filter-accordion-details">
            <FormGroup>
              {uniqueDepartments.map((department) => (
                <FormControlLabel
                  key={department}
                  control={
                    <Checkbox
                      checked={filters.departments.includes(department)}
                      onChange={() => onCheckboxToggle("departments", department)}
                      size="small"
                    />
                  }
                  label={department}
                  className="candidate-filter-checkbox-label"
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Eligibility - Accordion with Checkboxes */}
        <Accordion className="candidate-filter-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
            <Typography className="candidate-filter-accordion-title">
              Eligibility Status {filters.eligibility.length > 0 && `(${filters.eligibility.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="candidate-filter-accordion-details">
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.eligibility.includes("eligible")}
                    onChange={() => onCheckboxToggle("eligibility", "eligible")}
                    size="small"
                  />
                }
                label="Eligible"
                className="candidate-filter-checkbox-label"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.eligibility.includes("ineligible")}
                    onChange={() => onCheckboxToggle("eligibility", "ineligible")}
                    size="small"
                  />
                }
                label="Ineligible"
                className="candidate-filter-checkbox-label"
              />
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Application Type - Accordion with Checkboxes */}
        <Accordion className="candidate-filter-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
            <Typography className="candidate-filter-accordion-title">
              Application Type {filters.applicationTypes.length > 0 && `(${filters.applicationTypes.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="candidate-filter-accordion-details">
            <FormGroup>
              {uniqueApplicationTypes.map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={filters.applicationTypes.includes(type)}
                      onChange={() => onCheckboxToggle("applicationTypes", type)}
                      size="small"
                    />
                  }
                  label={type}
                  className="candidate-filter-checkbox-label"
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Application Stage - Accordion with Checkboxes */}
        <Accordion className="candidate-filter-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
            <Typography className="candidate-filter-accordion-title">
              Application Stage {filters.applicationStages.length > 0 && `(${filters.applicationStages.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="candidate-filter-accordion-details">
            <FormGroup>
              {uniqueApplicationStages.map((stage) => (
                <FormControlLabel
                  key={stage}
                  control={
                    <Checkbox
                      checked={filters.applicationStages.includes(stage)}
                      onChange={() => onCheckboxToggle("applicationStages", stage)}
                      size="small"
                    />
                  }
                  label={stage}
                  className="candidate-filter-checkbox-label"
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Skills - Accordion with Checkboxes */}
        <Accordion className="candidate-filter-accordion">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} className="candidate-filter-accordion-summary">
            <Typography className="candidate-filter-accordion-title">
              Skills {filters.skills.length > 0 && `(${filters.skills.length})`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails className="candidate-filter-accordion-details">
            <FormGroup>
              {uniqueSkills.map((skill) => (
                <FormControlLabel
                  key={skill}
                  control={
                    <Checkbox
                      checked={filters.skills.includes(skill)}
                      onChange={() => onCheckboxToggle("skills", skill)}
                      size="small"
                    />
                  }
                  label={skill}
                  className="candidate-filter-checkbox-label"
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Sidebar Footer */}
      <Box className="candidate-filter-footer">
        <Typography variant="body2" className="candidate-filter-results-count">
          Showing {filteredCount} of {totalCount} candidates
        </Typography>
        <Box className="candidate-filter-actions">
          {hasActiveFilters && (
            <>
              <Button
                onClick={onSaveFilters}
                size="small"
                className="candidate-filter-save-btn"
              >
                Save
              </Button>
              <Button
                
                onClick={onClearFilters}
                size="small"
                className="candidate-filter-clear-btn"
              >
                Clear 
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CandidateFilter;
