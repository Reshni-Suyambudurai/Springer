import { useState, useEffect } from 'react';
import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import type { TrainingProgramResponse } from '../../../types/Academy/academy.types';
import type { AcademyTabGroup } from '../../../config/academyConfig';
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
import LeaveManagementPanel from './LeaveManagementPanel';
import WarningsPanel from './WarningsPanel';
import '../../../css/Academy/TrainingCoordinator/AcademyDashboard.css';

const getCurrentYear = (): number => new Date().getFullYear();

const AcademyDashboard = () => {
  const user = tokenstore.getUser();
  const userRole = user?.roleName?.toUpperCase() || '';
  const location = useLocation();
  const stateTab = (location.state as { tab?: string } | null)?.tab;

  const [tabGroups, setTabGroups]     = useState<AcademyTabGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('');
  const [activeTab, setActiveTab]     = useState<string>('');
  const [programYear, setProgramYear] = useState<number>(getCurrentYear());
  const [programs, setPrograms]       = useState<TrainingProgramResponse[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([
    getCurrentYear() - 1, getCurrentYear(), getCurrentYear() + 1,
  ]);
  const [cycles, setCycles]               = useState<HiringCycleResponse[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  useEffect(() => {
    setLoadingPrograms(true);
    trainingProgramApi.getAllPrograms()
      .then(res => { if (res.success && res.data) setPrograms(res.data); })
      .catch(err => showToast(err.message || 'Failed to load programs', 'error'))
      .finally(() => setLoadingPrograms(false));
    hiringCycleApi.getAllCycles()
      .then(res => { if (res.success && res.data) setCycles(res.data); })
      .catch(() => {});
  }, []);

  const handleProgramsChanged = () => {
    trainingProgramApi.getAllPrograms()
      .then(res => { if (res.success && res.data) setPrograms(res.data); })
      .catch(() => {});
    programYearsApi.getDistinctYears()
      .then(res => { if (res.success && Array.isArray(res.data) && res.data.length > 0) setAvailableYears(res.data); })
      .catch(() => {});
  };

  useEffect(() => {
    if (programs.length === 0) return;
    programYearsApi.getDistinctYears()
      .then(res => { if (res.success && Array.isArray(res.data) && res.data.length > 0) setAvailableYears(res.data); })
      .catch(() => {});
  }, [programs]);

  useEffect(() => {
    if (availableYears.length === 0) return;
    const cur = getCurrentYear();
    if (availableYears.includes(programYear)) return;
    if (availableYears.includes(cur)) { setProgramYear(cur); return; }
    const nearest = availableYears.reduce((p, c) => Math.abs(c - cur) < Math.abs(p - cur) ? c : p);
    setProgramYear(nearest);
  }, [availableYears]);

  useEffect(() => { invalidateConfigCache(); }, []);

  useEffect(() => {
    getCachedAcademyConfig(userRole).then(config => {
      const groups = config?.tabGroups ?? [];
      setTabGroups(groups);
      const allTabs = config?.tabs ?? [];
      const targetTab = stateTab && allTabs.find(t => t.key === stateTab)
        ? stateTab
        : allTabs[0]?.key ?? 'attendance';
      const targetGroup = groups.find(g => g.tabs.some(t => t.key === targetTab))?.key ?? groups[0]?.key ?? '';
      setActiveGroup(targetGroup);
      setActiveTab(targetTab);
    }).catch(() => { setActiveTab('attendance'); });
  }, [userRole]);

  const filteredPrograms = programYear === 0
    ? programs
    : programs.filter(p => p.programYear === programYear);

  const activeGroupTabs = tabGroups.find(g => g.key === activeGroup)?.tabs ?? [];

  const handleGroupClick = (groupKey: string) => {
    if (activeGroup === groupKey) return;
    setActiveGroup(groupKey);
    const first = tabGroups.find(g => g.key === groupKey)?.tabs[0]?.key;
    if (first) setActiveTab(first);
  };

  const renderContent = () => {
    const attendanceYear = programYear === 0 ? getCurrentYear() : programYear;
    const ctx = { programYear, programs: filteredPrograms, cycles, onProgramsChanged: handleProgramsChanged };
    const attCtx = { ...ctx, programYear: attendanceYear };
    switch (activeTab) {
      case 'programs':           return <ProgramsList context={ctx} />;
      case 'courses':            return <CoursesList context={ctx} />;
      case 'batch-courses':      return <BatchCoursesList context={ctx} />;
      case 'batch-allocations':  return <BatchAllocationsList context={ctx} />;
      case 'attendance':         return <BatchAttendancePanel context={attCtx} />;
      case 'scores':             return <TrainingScoresPanel context={ctx} readOnly={userRole === 'TA_MANAGER'} />;
      case 'candidate-progress': return <CandidateProgress context={ctx} />;
      case 'joining-tracker':    return <JoiningTracker context={ctx} />;
      case 'calendar':           return <AcademyCalendar context={ctx} />;
      case 'leaves':             return <LeaveManagementPanel context={ctx} />;
      case 'warnings':           return <WarningsPanel context={ctx} />;
      default:                   return <BatchAttendancePanel context={attCtx} />;
    }
  };

  return (
    <Box className="acd-page">
      <Box className="acd-header">

        {/* ── Single row: group pills (left) + year filter (right) ── */}
        <Box className="acd-top-row">
          <Box className="acd-group-bar">
            {tabGroups.map(group => (
              <button
                key={group.key}
                type="button"
                className={`acd-group-btn ${activeGroup === group.key ? 'acd-group-btn--active' : ''}`}
                onClick={() => handleGroupClick(group.key)}
              >
                {group.label}
              </button>
            ))}
          </Box>

          <Box className="acd-year-filter-group">
            <Typography className="acd-year-label">Year</Typography>
            <TextField
              select size="small" value={programYear}
              onChange={e => setProgramYear(Number(e.target.value))}
              className="acd-year-select"
            >
              <MenuItem value={0}>All</MenuItem>
              {availableYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
            {!loadingPrograms && programYear !== 0 && (
              <span className="acd-program-badge">
                {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''}
              </span>
            )}
          </Box>
        </Box>

        {/* ── Tab bar: only tabs of active group ── */}
        <Box className="acd-tab-bar">
          {activeGroupTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`acd-tab-btn ${activeTab === tab.key ? 'acd-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
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
