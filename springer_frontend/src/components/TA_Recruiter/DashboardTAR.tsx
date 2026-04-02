import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Chip, Button,
  MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  People as PeopleIcon,
  TrendingUp as InProgressIcon,
  CheckCircleOutline as SelectedIcon,
  LocalOffer as OfferIcon,
  EventAvailable as ActiveDriveIcon,
  PendingActions as PendingIcon,
  PersonAdd as PersonAddIcon,
  FormatListBulleted as ViewCandidatesIcon,
  AccountBalance as InstituteIcon,
  AddCircleOutline as AddInstituteIcon,
  Work as DemandIcon,
} from '@mui/icons-material';
import { candidateApi } from '../../services/drive.api';
import { driveScheduleApi } from '../../services/driveSchedule.api';
import { hiringCycleApi, instituteApi, hiringDemandApi } from '../../services/hiring.api';
import type { CandidateResponse } from '../../types/TA_Recruiter/Drive/candidate.types';
import type { DriveResponse } from '../../types/TA_Recruiter/Drive/driveSchedule.types';
import type { HiringCycleSummaryResponse } from '../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { HiringDemandResponse } from '../../types/TA_Recruiter/Hiring/hiringDemand.types';
import '../../css/TA_Recruiter/DashboardTAR.css';

const STAGES = [
  { key: 'APPLIED',     label: 'Applied',     fillClass: 'tar-fill--applied' },
  { key: 'SHORTLISTED', label: 'Shortlisted', fillClass: 'tar-fill--shortlisted' },
  { key: 'INVITED',     label: 'Invited',     fillClass: 'tar-fill--invited' },
  { key: 'SCHEDULED',   label: 'Scheduled',   fillClass: 'tar-fill--scheduled' },
  { key: 'SELECTED',    label: 'Selected',    fillClass: 'tar-fill--selected' },
  { key: 'OFFERED',     label: 'Offered',     fillClass: 'tar-fill--offered' },
  { key: 'ACCEPTED',    label: 'Accepted',    fillClass: 'tar-fill--accepted' },
  { key: 'JOINED',      label: 'Joined',      fillClass: 'tar-fill--joined' },
  { key: 'REJECTED',    label: 'Rejected',    fillClass: 'tar-fill--rejected' },
  { key: 'DROPPED',     label: 'Dropped',     fillClass: 'tar-fill--dropped' },
];

const IN_PROGRESS_STAGES = ['APPLIED', 'SHORTLISTED', 'INVITED', 'SCHEDULED'];

const DRIVE_CHIP_CLASS: Record<string, string> = {
  PLANNED: 'tar-chip--planned', CONFIRMED: 'tar-chip--confirmed',
  IN_PROGRESS: 'tar-chip--inprogress', COMPLETED: 'tar-chip--completed', CLOSED: 'tar-chip--closed',
};

const DEMAND_CHIP: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: 'var(--color-inactive-bg)',   color: 'var(--color-text-secondary)' },
  SUBMITTED: { bg: 'var(--color-info-light)',    color: 'var(--color-info-dark)' },
  APPROVED:  { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)' },
  REJECTED:  { bg: 'var(--color-error-light)',   color: 'var(--color-error-dark)' },
};

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} days ago`;
}

function DashboardTAR() {
  const navigate = useNavigate();

  const [cycles,          setCycles]          = useState<HiringCycleSummaryResponse[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [candidates,      setCandidates]      = useState<CandidateResponse[]>([]);
  const [drives,          setDrives]          = useState<DriveResponse[]>([]);
  const [demands,         setDemands]         = useState<HiringDemandResponse[]>([]);
  const [cyclesLoading,   setCyclesLoading]   = useState(true);
  const [dataLoading,     setDataLoading]     = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const cycleRes = await hiringCycleApi.getAllCycleSummaries();
        if (cycleRes.success && cycleRes.data) {
          setCycles(cycleRes.data);
          const open = cycleRes.data.find(c => c.status === 'OPEN') ?? cycleRes.data[0];
          if (open) setSelectedCycleId(open.cycleId);
        }
      } catch (_) {
      } finally {
        setCyclesLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedCycleId) return;
    const load = async () => {
      setDataLoading(true);
      try {
        const [candRes, driveRes, demandRes] = await Promise.all([
          candidateApi.getCandidatesByCycleId(selectedCycleId),
          driveScheduleApi.getAllDrives(),
          hiringDemandApi.getAllDemands({ cycleId: selectedCycleId }),
        ]);
        setCandidates(candRes.success && candRes.data ? candRes.data : []);
        setDrives(driveRes.success && driveRes.data ? driveRes.data.filter(d => d.cycleId === selectedCycleId) : []);
        setDemands(demandRes.success && demandRes.data ? demandRes.data : []);
      } catch (_) {
        setCandidates([]); setDrives([]); setDemands([]);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [selectedCycleId]);

  const selectedCycle   = cycles.find(c => c.cycleId === selectedCycleId);
  const totalCandidates = candidates.length;
  const inProgress      = candidates.filter(c => IN_PROGRESS_STAGES.includes(c.applicationStage)).length;
  const selected        = candidates.filter(c => c.applicationStage === 'SELECTED').length;
  const offersReleased  = candidates.filter(c => ['OFFERED','ACCEPTED','JOINED'].includes(c.applicationStage)).length;
  const conversionRate  = totalCandidates > 0 ? Math.round((selected / totalCandidates) * 100) : 0;
  const activeDrives    = drives.filter(d => ['PLANNED','CONFIRMED','IN_PROGRESS'].includes(d.status)).length;
  const pendingActions  = candidates.filter(c => c.applicationStage === 'SHORTLISTED').length;
  const recentDrives    = [...drives].sort((a, b) => b.driveId - a.driveId).slice(0, 5);

  const stageCounts = useMemo(() =>
    STAGES.map(s => ({ ...s, count: candidates.filter(c => c.applicationStage === s.key).length })),
    [candidates]
  );
  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);

  const recentUpdates = useMemo(() =>
    candidates
      .filter(c => c.updatedAt && c.applicationStage)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(c => ({
        text: `${c.firstName} ${c.lastName} — ${c.applicationStage}`,
        time: timeAgo(c.updatedAt),
        dot: ['SELECTED','OFFERED','ACCEPTED','JOINED'].includes(c.applicationStage) ? 'tar-activity-dot--offer'
           : ['REJECTED','DROPPED'].includes(c.applicationStage) ? 'tar-activity-dot--drive'
           : 'tar-activity-dot--candidate',
      })),
    [candidates]
  );

  const KPIs = [
    { label: 'Total Candidates', value: totalCandidates, icon: <PeopleIcon />,      color: 'blue',   sub: selectedCycle?.cycleName ?? '—' },
    { label: 'In Progress',      value: inProgress,      icon: <InProgressIcon />,  color: 'orange', sub: 'Applied → Scheduled' },
    { label: 'Selected',         value: selected,        icon: <SelectedIcon />,    color: 'green',  sub: conversionRate > 0 ? `${conversionRate}% conversion` : 'of total' },
    { label: 'Offers Released',  value: offersReleased,  icon: <OfferIcon />,       color: 'purple', sub: 'Offered + Accepted + Joined' },
    { label: 'Active Drives',    value: activeDrives,    icon: <ActiveDriveIcon />, color: 'teal',   sub: `${drives.length} total drives` },
    { label: 'Pending Actions',  value: pendingActions,  icon: <PendingIcon />,     color: 'red',    sub: 'Shortlisted, not invited' },
  ];

  if (cyclesLoading) {
    return <Box className="tar-page tar-loading"><CircularProgress size={36} /></Box>;
  }

  return (
    <Box className="tar-page">

      {/* ── SINGLE CARD wrapping everything — same as clist-card ── */}
      <Box className="tar-card">

        {/* HEADER */}
        <Box className="tar-header">
          <Box>
            <Typography className="tar-title">TA Recruiter Dashboard</Typography>
            <Typography className="tar-subtitle">Overview of hiring activity and candidate pipeline</Typography>
          </Box>
          <Box className="tar-header-right">
            <FormControl size="small" className="tar-cycle-select">
              <InputLabel sx={{ fontSize: '0.875rem' }}>Hiring Cycle</InputLabel>
              <Select
                label="Hiring Cycle"
                value={selectedCycleId?.toString() ?? ''}
                onChange={(e: SelectChangeEvent) => setSelectedCycleId(Number(e.target.value))}
              >
                {cycles.map(c => (
                  <MenuItem key={c.cycleId} value={c.cycleId.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {c.cycleName} ({c.cycleYear})
                      <Chip label={c.status} size="small" sx={{
                        fontSize: '0.65rem', height: '18px',
                        backgroundColor: c.status === 'OPEN' ? 'var(--color-success-light)' : 'var(--color-inactive-bg)',
                        color: c.status === 'OPEN' ? 'var(--color-success-dark)' : 'var(--color-text-secondary)',
                      }} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* SEPARATOR */}
        <Box className="tar-separator" />

        {dataLoading ? (
          <Box className="tar-loading" sx={{ minHeight: 200 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box className="tar-body">

            {/* KPI STRIP */}
            <Box className="tar-kpi-strip">
              {KPIs.map(({ label, value, icon, color, sub }) => (
                <Box key={label} className="tar-kpi-item">
                  <Box className={`tar-kpi-icon-box tar-kpi-icon-box--${color}`}>
                    <Box className={`tar-kpi-icon--${color}`} sx={{ display: 'flex' }}>{icon}</Box>
                  </Box>
                  <Box>
                    <Typography className="tar-kpi-value">{value}</Typography>
                    <Typography className="tar-kpi-label">{label}</Typography>
                    {label === 'Selected' && conversionRate > 0
                      ? <Typography className="tar-kpi-conversion">{conversionRate}% conversion</Typography>
                      : <Typography sx={{ fontSize: '0.7rem', color: 'var(--color-text-disabled)', mt: '1px' }}>{sub}</Typography>
                    }
                  </Box>
                </Box>
              ))}
            </Box>

            {/* MAIN GRID — pipeline left, actions+drives right */}
            <Box className="tar-main-grid">

              {/* LEFT — Pipeline */}
              <Box className="tar-section">
                <Box className="tar-section-header">
                  <Typography className="tar-section-title">Candidate Pipeline</Typography>
                  <Box component="button" className="tar-section-link"
                    onClick={() => navigate('/ta-recruiter/candidates')}>
                    View All →
                  </Box>
                </Box>
                <Box className="tar-pipeline-body">
                  {stageCounts.map(({ key, label, count, fillClass }) => (
                    <Box key={key} className="tar-pipeline-row"
                      onClick={() => navigate('/ta-recruiter/candidates')}>
                      <Typography className="tar-pipeline-stage">{label}</Typography>
                      <Box className="tar-pipeline-track">
                        <Box className={`tar-pipeline-fill ${fillClass}`}
                          sx={{ width: count === 0 ? '3px' : `${(count / maxCount) * 100}%` }} />
                      </Box>
                      <Typography className="tar-pipeline-count">{count}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* RIGHT — Actions + Drives */}
              <Box className="tar-right-col">

                {/* Quick Actions */}
                <Box className="tar-section">
                  <Box className="tar-section-header">
                    <Typography className="tar-section-title">Quick Actions</Typography>
                  </Box>
                  <Box className="tar-actions-grid">
                    {[
                      { label: 'Add Candidate',   sub: 'Register new candidate', icon: <PersonAddIcon fontSize="small" />,      path: '/ta-recruiter/candidates/add' },
                      { label: 'View Candidates', sub: 'Manage pipeline',        icon: <ViewCandidatesIcon fontSize="small" />, path: '/ta-recruiter/candidates' },
                      { label: 'Add Institute',   sub: 'Onboard new institute',  icon: <AddInstituteIcon fontSize="small" />,   path: '/ta-recruiter/institutes/add' },
                      { label: 'View Institutes', sub: 'Institutes & TPOs',      icon: <InstituteIcon fontSize="small" />,      path: '/ta-recruiter/institutes' },
                    ].map(({ label, sub, icon, path }) => (
                      <Box key={label} className="tar-action-item" onClick={() => navigate(path)}>
                        <Box className="tar-action-icon">{icon}</Box>
                        <Box>
                          <Typography className="tar-action-label">{label}</Typography>
                          <Typography className="tar-action-sub">{sub}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Recent Drives */}
                <Box className="tar-section tar-section--flex">
                  <Box className="tar-section-header">
                    <Typography className="tar-section-title">Recent Drives</Typography>
                  </Box>
                  {recentDrives.length === 0 ? (
                    <Box className="tar-empty">
                      <Typography className="tar-empty-text">NO DRIVES FOUND</Typography>
                    </Box>
                  ) : (
                    recentDrives.map(drive => (
                      <Box key={drive.driveId} className="tar-drive-item">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography className="tar-drive-name" noWrap>{drive.driveName}</Typography>
                          <Typography className="tar-drive-meta">{drive.instituteName} · {drive.startDate}</Typography>
                        </Box>
                        <Chip label={drive.status.replace('_', ' ')} size="small"
                          className={`tar-drive-chip ${DRIVE_CHIP_CLASS[drive.status] ?? 'tar-chip--planned'}`} />
                      </Box>
                    ))
                  )}
                </Box>

              </Box>
            </Box>

            {/* BOTTOM — Updates + Demands */}
            <Box className="tar-bottom-grid">

              {/* Recent Updates */}
              <Box className="tar-section">
                <Box className="tar-section-header">
                  <Typography className="tar-section-title">Recent Updates</Typography>
                </Box>
                {recentUpdates.length === 0 ? (
                  <Box className="tar-empty">
                    <Typography className="tar-empty-text">NO RECENT UPDATES</Typography>
                  </Box>
                ) : (
                  recentUpdates.map((item, i) => (
                    <Box key={i} className="tar-activity-item">
                      <Box className={`tar-activity-dot ${item.dot}`} />
                      <Box>
                        <Typography className="tar-activity-text">{item.text}</Typography>
                        <Typography className="tar-activity-time">{item.time}</Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              {/* Hiring Demands */}
              <Box className="tar-section">
                <Box className="tar-section-header">
                  <Typography className="tar-section-title">Hiring Demands</Typography>
                  <Chip label={`${demands.length} demands`} size="small" sx={{
                    fontSize: '0.7rem', height: '20px',
                    backgroundColor: 'var(--color-chip-count-bg)',
                    color: 'var(--color-chip-count-text)',
                  }} />
                </Box>
                {demands.length === 0 ? (
                  <Box className="tar-empty">
                    <Typography className="tar-empty-text">NO DEMANDS FOUND</Typography>
                  </Box>
                ) : (
                  demands.slice(0, 5).map(demand => (
                    <Box key={demand.demandId} className="tar-drive-item">
                      <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'var(--color-icon-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <DemandIcon sx={{ fontSize: 18, color: 'var(--color-primary)' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, ml: 1 }}>
                        <Typography className="tar-drive-name" noWrap>
                          {demand.businessUnit.replace(/_/g, ' ')}
                        </Typography>
                        <Typography className="tar-drive-meta">
                          {demand.demandCount} positions · {demand.createdByUsername}
                        </Typography>
                      </Box>
                      <Chip label={demand.approvalStatus} size="small" sx={{
                        fontSize: '0.75rem', height: '24px', borderWidth: '1.5px', flexShrink: 0,
                        backgroundColor: DEMAND_CHIP[demand.approvalStatus]?.bg ?? 'var(--color-inactive-bg)',
                        color: DEMAND_CHIP[demand.approvalStatus]?.color ?? 'var(--color-text-secondary)',
                      }} />
                    </Box>
                  ))
                )}
              </Box>

            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default DashboardTAR;
