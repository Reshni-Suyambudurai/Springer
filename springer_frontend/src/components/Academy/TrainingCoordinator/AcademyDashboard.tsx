import { useState, useEffect } from 'react';
import { Box, Typography, MenuItem, TextField } from '@mui/material';
import type { TrainingProgramResponse, AcademyTab } from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import { trainingProgramApi, programYearsApi } from '../../../services/academy.api';
import { hiringCycleApi } from '../../../services/hiring.api';
import { getCachedAcademyConfig, invalidateConfigCache } from '../../../config/academyConfig';
import { tokenstore } from '../../../auth/tokenstore';
import { showToast } from '../../../utils/toast';
import ProgramsList from './ProgramsList';
import CoursesList from './CoursesList';
import BatchCoursesList from './BatchCoursesList';
import BatchAllocationsList from './BatchAllocationsList';
import TrainingScoresPanel from './TrainingScoresPanel';
import BatchAttendancePanel from './BatchAttendancePanel';
import JoiningTracker from './JoiningTracker';
import CandidateProgress from './CandidateProgress';
import AcademyCalendar from './AcademyCalendar';
import '../../../css/Academy/TrainingCoordinator/AcademyDashboard.css';

// Get current year dynamically
const getCurrentYear = (): number => new Date().getFullYear();

const AcademyDashboard = () => {
  const user = tokenstore.getUser();
  const userRole = user?.roleName?.toUpperCase() || '';
  
  const [visibleTabs, setVisibleTabs] = useState<AcademyTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [programYear, setProgramYear] = useState<number>(getCurrentYear()); // default current year
  const [programs, setPrograms] = useState<TrainingProgramResponse[]>([]);
  // Initialize with fallback to avoid MUI Select warnings
  const [availableYears, setAvailableYears] = useState<number[]>([getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1]);
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    setLoadingPrograms(true);
    trainingProgramApi.getAllPrograms()
      .then((res) => { if (res.success && res.data) setPrograms(res.data); })
      .catch((err) => showToast(err.message || 'Failed to load programs', 'error'))
      .finally(() => setLoadingPrograms(false));
    hiringCycleApi.getAllCycles()
      .then((res) => { if (res.success && res.data) setCycles(res.data); })
      .catch(() => {});
  }, []);

  // Callback for child tabs to notify when programs have changed
  const handleProgramsChanged = () => {
    trainingProgramApi.getAllPrograms()
      .then((res) => { if (res.success && res.data) setPrograms(res.data); })
      .catch(() => {});
    programYearsApi.getDistinctYears()
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableYears(res.data);
        }
      })
      .catch(() => {});
  };

  // Re-fetch distinct years whenever programs change
  useEffect(() => {
    if (programs.length === 0) return;
    programYearsApi.getDistinctYears()
      .then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableYears(res.data);
        }
      })
      .catch((err) => showToast(err.message || 'Failed to load program years', 'error'));
  }, [programs]);

  // Initial fetch of distinct years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await programYearsApi.getDistinctYears();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableYears(res.data);
        } else {
          setAvailableYears([getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1]);
        }
      } catch {
        setAvailableYears([getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1]);
      }
    };
    fetchYears();
  }, []);

  // Load configuration (tabs) from config service — invalidate once on mount only
  useEffect(() => {
    invalidateConfigCache();
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getCachedAcademyConfig(userRole);
        setVisibleTabs(config.tabs);
        setActiveTab(config.tabs[0]?.key || 'scores');
      } catch (error) {
        console.error('Failed to load academy config:', error);
        setActiveTab('joining-tracker');
      }
    };
    loadConfig();
  }, [userRole]);

  // Programs filtered by selected year — 0 means All Years
  const filteredPrograms = programYear === 0
    ? programs
    : programs.filter((p) => p.programYear === programYear);

  const renderContent = () => {
    // Attendance always needs a specific year — use current year if All Years selected
    const attendanceYear = programYear === 0 ? getCurrentYear() : programYear;
    // All other tabs receive programYear as-is (0 = All Years)
    const ctx = { programYear, programs: filteredPrograms, cycles, onProgramsChanged: handleProgramsChanged };
    const attendanceCtx = { programYear: attendanceYear, programs: filteredPrograms, cycles, onProgramsChanged: handleProgramsChanged };
    
    switch (activeTab) {
      case 'joining-tracker':   return <JoiningTracker context={ctx} />;
      case 'programs':          return <ProgramsList context={ctx} />;
      case 'courses':           return <CoursesList context={ctx} />;
      case 'batch-courses':     return <BatchCoursesList context={ctx} />;
      case 'batch-allocations': return <BatchAllocationsList context={ctx} />;
      case 'scores':            return <TrainingScoresPanel context={ctx} readOnly={userRole === 'TA_RECRUITER'} />;
      case 'attendance':         return <BatchAttendancePanel context={attendanceCtx} />;
      case 'candidate-progress':  return <CandidateProgress context={ctx} />;
      case 'calendar':             return <AcademyCalendar context={ctx} />;
      default:                  return <ProgramsList context={ctx} />;
    }
  };

  return (
    <Box className="acd-page">
      <Box className="acd-header">
        <Box className="acd-header-inner">
          <Box className="acd-header-text">
            <Typography className="acd-title">
              {visibleTabs.find(t => t.key === activeTab)?.label || 'Academy'}
            </Typography>
          </Box>

          {/* Global Year Filter — top-right, affects ALL tabs */}
          <Box className="acd-year-filter-group">
            <Typography className="acd-year-filter-label">Program Year</Typography>
            <TextField
              select
              size="small"
              value={programYear}
              onChange={(e) => {
                setProgramYear(Number(e.target.value));
              }}
              className="acd-year-select"
            >
              <MenuItem value={0}>All Years</MenuItem>
              {availableYears.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
            {!loadingPrograms && programYear !== 0 && (
              <Typography className="acd-program-count">
                {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>
        </Box>

        <Box className="acd-tab-bar">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              className={`acd-tab-btn ${activeTab === tab.key ? 'acd-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <span className="acd-tab-label">{tab.label}</span>
            </button>
          ))}
        </Box>
      </Box>

      <Box className="acd-content">
        {renderContent()}
      </Box>
    </Box>
  );
};

export default AcademyDashboard;
