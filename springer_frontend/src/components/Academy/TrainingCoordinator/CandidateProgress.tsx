import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  CircularProgress, Chip, TextField, InputAdornment, IconButton, MenuItem,
} from '@mui/material';
import { Person as PersonIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  batchAllocationApi, trainingScoreApi, batchCourseApi,
  trainingCourseApi, attendanceApi, batchScheduleApi,
  trainingProgramApi,
} from '../../../services/academy.api';
import { internApi } from '../../../services/intern.api';
import { leaveApi } from '../../../services/leave.api';
import { warningApi } from '../../../services/warning.api';
import type { InternWarningResponse } from '../../../services/warning.api';
import { tokenstore } from '../../../auth/tokenstore';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import FilterSelect from '../../Common/FilterSelect';
import { downloadIndividualReport, downloadBatchReport } from '../../../utils/scorecardPdf';
import type { IndividualReportData, BatchReportData } from '../../../utils/scorecardPdf';
import type {
  BatchAllocationResponse, TrainingScoreResponse,
  BatchCourseResponse, TrainingCourseResponse,
  AttendanceStatsResponse, BatchScheduleResponse,
  AcademyContextProps, TrainingProgramResponse,
} from '../../../types/Academy/academy.types';
import type { InternCertificateResponse, InternProfileResponse } from '../../../types/Academy/intern.types';
import '../../../css/Academy/TrainingCoordinator/CandidateProgress.css';
import '../../../css/Academy/Intern/InternWarnings.css';

// ── Status logic ─────────────────────────────────────────────────────────────
const getStatus = (a: BatchAllocationResponse): string => {
  if (a.performance === 'PROJECT_READY') return 'PROJECT_READY';
  if (a.performance === 'DROPPED')       return 'DROPPED';
  const pct = Number(a.attendancePercentage ?? 0);
  if (pct > 0 && pct < 75)              return 'AT_RISK';
  return 'IN_TRAINING';
};

const STATUS_LABEL: Record<string, string> = {
  PROJECT_READY: '✅ Project Ready',
  IN_TRAINING:   '🎓 In Training',
  AT_RISK:       '⚠ At Risk',
  DROPPED:       '❌ Dropped',
};

const STATUS_CLASS: Record<string, string> = {
  PROJECT_READY: 'cp-status-chip cp-status--ready',
  IN_TRAINING:   'cp-status-chip cp-status--training',
  AT_RISK:       'cp-status-chip cp-status--risk',
  DROPPED:       'cp-status-chip cp-status--risk',
};

const PERF_CLASS: Record<string, string> = {
  EXCELLENT:     'cp-perf-chip cp-perf--excellent',
  GOOD:          'cp-perf-chip cp-perf--good',
  NEED_LEARNING: 'cp-perf-chip cp-perf--need',
  PROJECT_READY: 'cp-perf-chip cp-perf--excellent',
  DROPPED:       'cp-perf-chip cp-perf--dropped',
};

const attBarClass = (pct: number) =>
  pct < 50 ? 'cp-att-bar-fill cp-att-bar-fill--low'
  : pct < 75 ? 'cp-att-bar-fill cp-att-bar-fill--mid'
  : 'cp-att-bar-fill';

const attColor = (pct: number) =>
  pct < 50 ? 'var(--color-error)'
  : pct < 75 ? 'var(--color-warning)'
  : 'var(--color-success)';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Component ─────────────────────────────────────────────────────────────────
const CandidateProgress = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, programs: yearPrograms } = context;

  const [allocations, setAllocations]   = useState<BatchAllocationResponse[]>([]);
  const [loading, setLoading]           = useState(true);

  const [search, setSearch]               = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch]     = useState('all');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [page, setPage]                   = useState(0);
  const [rowsPerPage, setRowsPerPage]     = useState(10);
  const [selected, setSelected]           = useState<BatchAllocationResponse | null>(null);

  // ── Panel-specific state (fetched fresh on click) ──
  const [panelLoading, setPanelLoading]   = useState(false);
  const [panelScores, setPanelScores]     = useState<TrainingScoreResponse[]>([]);
  const [panelBatchCourses, setPanelBatchCourses] = useState<BatchCourseResponse[]>([]);
  const [panelAllCourses, setPanelAllCourses]     = useState<TrainingCourseResponse[]>([]);
  const [panelSchedule, setPanelSchedule] = useState<BatchScheduleResponse | null>(null);
  const [panelStats, setPanelStats]       = useState<AttendanceStatsResponse | null>(null);
  const [panelProgram, setPanelProgram]   = useState<TrainingProgramResponse | null>(null);
  const [panelCertificates, setPanelCertificates] = useState<InternCertificateResponse[]>([]);
  const [panelProfile, setPanelProfile]   = useState<InternProfileResponse | null>(null);
  const [panelApprovedLeaveDays, setPanelApprovedLeaveDays] = useState<number>(0);
  const [panelWarnings, setPanelWarnings]   = useState<InternWarningResponse[]>([]);
  const [showWarnForm, setShowWarnForm]     = useState(false);
  const [warnType, setWarnType]             = useState('BEHAVIOUR');
  const [warnSeverity, setWarnSeverity]     = useState('MINOR');
  const [warnMessage, setWarnMessage]       = useState('');
  const [issuingWarn, setIssuingWarn]       = useState(false);

  useEffect(() => {
    fetchData();
    setFilterProgram('all'); setFilterBatch('all');
    setFilterStatus('all'); setSearch(''); setPage(0); setSelected(null);
  }, [programYear, yearPrograms.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch only allocations for the scoped programs — not all allocations
      const progIds = yearPrograms.map(p => p.programId);
      if (progIds.length === 0) { setAllocations([]); return; }
      const results = await Promise.allSettled(
        progIds.map(id => batchAllocationApi.getAllocationsByProgram(id))
      );
      const allocs: BatchAllocationResponse[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data)
          allocs.push(...r.value.data);
      });
      setAllocations(allocs);
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const yearProgramIds = new Set(yearPrograms.map(p => p.programId));

  const scopedAllocations = allocations.filter(a =>
    (programYear === 0 || yearProgramIds.has(a.programId)) && a.isActive
  );

  const batchesInData = Array.from(new Set(
    scopedAllocations
      .filter(a => filterProgram === 'all' || String(a.programId) === filterProgram)
      .map(a => a.batchNumber)
  )).sort((x, y) => x - y);

  const filtered = scopedAllocations.filter(a => {
    const matchSearch  = !search.trim() ||
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.candidateEmail.toLowerCase().includes(search.toLowerCase());
    const matchProgram = filterProgram === 'all' || String(a.programId) === filterProgram;
    const matchBatch   = filterBatch === 'all' || String(a.batchNumber) === filterBatch;
    const matchStatus  = filterStatus === 'all' || getStatus(a) === filterStatus;
    return matchSearch && matchProgram && matchBatch && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Stat counts
  const countAll     = scopedAllocations.length;
  const countTraining = scopedAllocations.filter(a => getStatus(a) === 'IN_TRAINING').length;
  const countReady    = scopedAllocations.filter(a => getStatus(a) === 'PROJECT_READY').length;
  const countRisk     = scopedAllocations.filter(a => getStatus(a) === 'AT_RISK').length;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getProgramName = (id: number) =>
    yearPrograms.find(p => p.programId === id)?.programName ?? `Program ${id}`;

  const getWeightedScore = (a: BatchAllocationResponse) => {
    if (a.overallWeightedScore == null) return null;
    return Math.round(Number(a.overallWeightedScore) * 10) / 10;
  };

  // ── Fresh fetch when candidate clicked ───────────────────────────────────
  const handleSelectCandidate = async (a: BatchAllocationResponse) => {
    setSelected(a);
    setPanelLoading(true);
    setPanelScores([]); setPanelBatchCourses([]); setPanelAllCourses([]);
    setPanelSchedule(null); setPanelStats(null); setPanelProgram(null);
    setPanelCertificates([]); setPanelProfile(null); setPanelApprovedLeaveDays(0);
    setPanelWarnings([]); setShowWarnForm(false); setWarnMessage('');
    try {
      const [scoreRes, bcRes, crsRes, schedRes, statsRes, progRes, certRes, profRes, leaveRes, warnRes] = await Promise.all([
        trainingScoreApi.getScoresByStudent(a.studentId),
        batchCourseApi.getCoursesByBatch(a.programId, a.batchNumber),
        trainingCourseApi.getAllCourses(),
        batchScheduleApi.getByProgramAndBatch(a.programId, a.batchNumber),
        attendanceApi.getAttendanceSummary(a.studentId),
        trainingProgramApi.getProgramById(a.programId),
        internApi.getCertificates(a.studentId).catch(() => ({ success: false, data: [] })),
        internApi.getProfileByStudent(a.studentId).catch(() => ({ success: false, data: null })),
        leaveApi.getLeavesByStudent(a.studentId).catch(() => ({ success: false, data: [] })),
        warningApi.getWarningsByStudent(a.studentId).catch(() => ({ success: false, data: [] })),
      ]);
      if (scoreRes.success && scoreRes.data) setPanelScores(scoreRes.data);
      if (bcRes.success && bcRes.data)       setPanelBatchCourses(bcRes.data);
      if (crsRes.success && crsRes.data)     setPanelAllCourses(crsRes.data);
      if (schedRes.success && schedRes.data) setPanelSchedule(schedRes.data);
      if (statsRes.success && statsRes.data) setPanelStats(statsRes.data);
      if (progRes.success && progRes.data)   setPanelProgram(progRes.data);
      if (certRes.success && certRes.data)   setPanelCertificates(certRes.data as InternCertificateResponse[]);
      if (profRes.success && profRes.data)   setPanelProfile(profRes.data as InternProfileResponse);
      if (leaveRes.success && leaveRes.data) {
        const approvedDays = leaveRes.data
          .filter(l => l.status === 'APPROVED')
          .reduce((sum, l) => sum + (l.totalDays ?? 0), 0);
        setPanelApprovedLeaveDays(approvedDays);
      }
      if (warnRes.success && warnRes.data) setPanelWarnings(warnRes.data as InternWarningResponse[]);
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to load candidate details', 'error');
    } finally {
      setPanelLoading(false);
    }
  };

  // ── Panel derived ─────────────────────────────────────────────────────────
  const panelCourses = panelBatchCourses
    .map(bc => ({ bc, course: panelAllCourses.find(c => c.courseId === bc.courseId) }))
    .filter(x => x.course);

  const panelWeighted = selected?.overallWeightedScore != null
    ? Math.round(Number(selected.overallWeightedScore) * 10) / 10
    : null;

  const panelStatus = selected ? getStatus(selected) : '';
  const panelPct    = Number(selected?.attendancePercentage ?? 0);

  const finalCardStyle = {
    borderColor: panelStatus === 'PROJECT_READY' ? 'var(--color-success-border)'
      : panelStatus === 'AT_RISK' ? 'var(--color-error-border)'
      : 'var(--color-border)',
    background: panelStatus === 'PROJECT_READY' ? 'var(--color-success-light)'
      : panelStatus === 'AT_RISK' ? 'var(--color-error-light)'
      : 'var(--color-bg-secondary)',
  };

  return (
    <Box className="cp-page">
      <Card className="cp-card">

        {/* ── Stats Row ── */}
        <Box className="cp-stats-row">
          {[
            { key: 'all',           label: 'All Candidates', count: countAll,      cls: 'cp-stat-card--all' },
            { key: 'IN_TRAINING',   label: 'In Training',    count: countTraining, cls: 'cp-stat-card--training' },
            { key: 'PROJECT_READY', label: 'Project Ready',  count: countReady,    cls: 'cp-stat-card--ready' },
            { key: 'AT_RISK',       label: 'At Risk',        count: countRisk,     cls: 'cp-stat-card--risk' },
          ].map(s => (
            <Box key={s.key}
              className={`cp-stat-card ${s.cls} ${filterStatus === s.key || (s.key === 'all' && filterStatus === 'all') ? 'cp-stat-card--active' : ''}`}
              onClick={() => { setFilterStatus(s.key === 'all' ? 'all' : s.key); setPage(0); }}>
              <Typography className="cp-stat-label">{s.label}</Typography>
              <Typography className="cp-stat-value">{s.count}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── Filters ── */}
        <Box className="cp-filter-section">
          <Box className="cp-filter-row">
            <TextField size="small" placeholder="Search by name or email..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="cp-search-field"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className="cp-search-icon" /></InputAdornment> }}
            />
            <FilterSelect label="Program" value={filterProgram}
              onChange={v => { setFilterProgram(v); setFilterBatch('all'); setPage(0); }}>
              <MenuItem value="all">All Programs</MenuItem>
              {yearPrograms.map(p => (
                <MenuItem key={p.programId} value={String(p.programId)}>{p.programName}</MenuItem>
              ))}
            </FilterSelect>
            <FilterSelect label="Batch" value={filterBatch}
              onChange={v => { setFilterBatch(v); setPage(0); }}>
              <MenuItem value="all">All Batches</MenuItem>
              {batchesInData.map(b => (
                <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>
              ))}
            </FilterSelect>
            <Box className="cp-filter-spacer" />
            <Typography className="cp-count-badge">{filtered.length} candidate(s)</Typography>
            {filterProgram !== 'all' && filterBatch !== 'all' && (
              <button className="cp-action-btn"
                onClick={async () => {
                  try {
                    const [bcRes, crsRes] = await Promise.all([
                      batchCourseApi.getCoursesByBatch(Number(filterProgram), Number(filterBatch)),
                      trainingCourseApi.getAllCourses(),
                    ]);
                    const batchCourseList = (bcRes.success && bcRes.data) ? bcRes.data : [];
                    const allCourseList   = (crsRes.success && crsRes.data) ? crsRes.data : [];
                    const scoreResults = await Promise.allSettled(
                      batchCourseList.map(bc =>
                        trainingScoreApi.getScoresByBatchAndCourse(Number(filterProgram), Number(filterBatch), bc.courseId)
                      )
                    );
                    const batchScores: TrainingScoreResponse[] = [];
                    scoreResults.forEach(r => {
                      if (r.status === 'fulfilled' && r.value.success && r.value.data)
                        batchScores.push(...r.value.data);
                    });
                    const batchAllocs = scopedAllocations.filter(
                      a => String(a.programId) === filterProgram && String(a.batchNumber) === filterBatch
                    );
                    const reportData: BatchReportData = {
                      allocations: batchAllocs,
                      batchCourses: batchCourseList,
                      allCourses: allCourseList,
                      allScores: batchScores,
                      programName: yearPrograms.find(p => String(p.programId) === filterProgram)?.programName ?? `Program ${filterProgram}`,
                      batchNumber: Number(filterBatch),
                      programYear: yearPrograms.find(p => String(p.programId) === filterProgram)?.programYear ?? 0,
                    };
                    downloadBatchReport(reportData);
                  } catch (error) {
                    const err = handleAxiosError(error);
                    showToast(err.message || 'Failed to generate batch report', 'error');
                  }
                }}>
                ⬇ Batch Report
              </button>
            )}
          </Box>
        </Box>

        <Box className="cp-separator" />

        {/* ── Table ── */}
        <Box className="cp-table-section">
          {loading ? (
            <Box className="cp-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="cp-empty-text">Loading candidate progress...</Typography>
            </Box>
          ) : scopedAllocations.length === 0 ? (
            <Box className="cp-empty-state">
              <PersonIcon className="cp-empty-icon" />
              <Typography className="cp-empty-text">
                No candidates allocated yet{programYear !== 0 ? ` for ${programYear}` : ''}.
              </Typography>
              <Typography className="cp-row-secondary">
                Allocate candidates from the Batch Allocations tab first.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="cp-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="cp-table-head-row">
                      <TableCell className="cp-table-head-cell">Candidate</TableCell>
                      <TableCell className="cp-table-head-cell">Program</TableCell>
                      <TableCell className="cp-table-head-cell">Batch</TableCell>
                      <TableCell className="cp-table-head-cell">Attendance</TableCell>
                      <TableCell className="cp-table-head-cell">Weighted Score</TableCell>
                      <TableCell className="cp-table-head-cell">Performance</TableCell>
                      <TableCell className="cp-table-head-cell">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="cp-empty-cell">
                          <PersonIcon className="cp-empty-icon" />
                          <Typography className="cp-empty-text">No candidates match the filter</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((a, idx) => {
                      const pct    = Number(a.attendancePercentage ?? 0);
                      const weighted = getWeightedScore(a);
                      const status = getStatus(a);
                      return (
                        <TableRow key={a.studentId} hover
                          className={`cp-table-row ${idx % 2 === 0 ? 'cp-table-row--even' : 'cp-table-row--odd'}`}
                          onClick={() => handleSelectCandidate(a)}>
                          <TableCell className="cp-table-cell">
                            <Box className="cp-name-cell">
                              <Box className="cp-name-icon-box">
                                <PersonIcon className="cp-name-icon" />
                              </Box>
                              <Box>
                                <Typography className="cp-row-primary">{a.candidateName}</Typography>
                                <Typography className="cp-row-secondary">{a.candidateEmail}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell className="cp-table-cell">
                            <Typography className="cp-row-secondary">{getProgramName(a.programId)}</Typography>
                          </TableCell>
                          <TableCell className="cp-table-cell">
                            <Typography className="cp-row-secondary">Batch {a.batchNumber}</Typography>
                          </TableCell>
                          <TableCell className="cp-table-cell">
                            <Box className="cp-att-wrap">
                              <Box className="cp-att-bar-bg">
                                <Box className={attBarClass(pct)} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </Box>
                              <Typography className="cp-row-secondary"
                                style={{ color: attColor(pct), fontWeight: 600 }}>
                                {pct.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell className="cp-table-cell">
                            <Typography className="cp-row-primary">
                              {weighted !== null ? `${weighted} / 100` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="cp-table-cell">
                            {a.performance ? (
                              <Chip label={a.performance.replace('_', ' ')} size="small" variant="outlined"
                                className={PERF_CLASS[a.performance] ?? 'cp-perf-chip'} />
                            ) : <Typography className="cp-row-secondary">—</Typography>}
                          </TableCell>
                          <TableCell className="cp-table-cell">
                            <Chip label={STATUS_LABEL[status]} size="small" variant="outlined"
                              className={STATUS_CLASS[status]} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination component="div" count={filtered.length} page={page}
                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]} className="cp-pagination" />
            </>
          )}
        </Box>
      </Card>

      {/* ── Side Panel ── */}
      {selected && (
        <Box className="cp-panel-overlay" onClick={() => setSelected(null)}>
          <Box className="cp-panel" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <Box className="cp-panel-header">
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Box className="cp-panel-avatar">
                  {selected.candidateName.charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography className="cp-panel-name">{selected.candidateName}</Typography>
                  <Typography className="cp-panel-meta">{selected.candidateEmail}</Typography>
                  {selected.department && (
                    <Typography className="cp-panel-meta">{selected.department}</Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <button className="cp-action-btn"
                  onClick={() => {
                    if (!selected || panelLoading) return;
                    const reportData: IndividualReportData = {
                      allocation: selected,
                      scores: panelScores,
                      batchCourses: panelBatchCourses,
                      allCourses: panelAllCourses,
                      stats: panelStats,
                      program: panelProgram,
                      programName: panelProgram?.programName ?? getProgramName(selected.programId),
                      totalInBatch: scopedAllocations.filter(a => a.batchNumber === selected.batchNumber && a.programId === selected.programId).length,
                      rank: (() => {
                        const batchAllocs = scopedAllocations.filter(a => a.batchNumber === selected.batchNumber && a.programId === selected.programId);
                        const myScore = Number(selected.overallWeightedScore ?? 0);
                        return batchAllocs.filter(a => Number(a.overallWeightedScore ?? 0) > myScore).length + 1;
                      })(),
                    };
                    downloadIndividualReport(reportData);
                  }}
                  disabled={panelLoading}
                  className="cp-action-btn"
                  style={{ opacity: panelLoading ? 0.5 : 1, cursor: panelLoading ? 'not-allowed' : 'pointer' }}>
                  ⬇ Report
                </button>
                <IconButton size="small" onClick={() => setSelected(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box className="cp-panel-body">

              {panelLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                  <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
                </Box>
              ) : (
              <>
              {/* Transfer History */}
              {selected.transferredFromStudentId && (
                <Box className="cp-section">
                  <Typography className="cp-section-title">Transfer History</Typography>
                  <Box sx={{ p: '10px 14px', borderRadius: 1, background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)' }}>
                    <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)', fontWeight: 600 }}>
                      🔄 Transferred from a previous batch
                    </Typography>
                    <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)', mt: 0.5 }}>
                      Previous Student ID: #{selected.transferredFromStudentId} · Attendance restarted from zero in current batch.
                      Overall score uses best performance per course across all batches.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Program Details */}
              <Box className="cp-section">
                <Typography className="cp-section-title">Program Details</Typography>
                <Box className="cp-info-grid">
                  <Box className="cp-info-item">
                    <Typography className="cp-info-label">Program</Typography>
                    <Typography className="cp-info-value">{panelProgram?.programName ?? getProgramName(selected.programId)}</Typography>
                  </Box>
                  <Box className="cp-info-item">
                    <Typography className="cp-info-label">Batch</Typography>
                    <Typography className="cp-info-value">Batch {selected.batchNumber}</Typography>
                  </Box>
                  <Box className="cp-info-item">
                    <Typography className="cp-info-label">Location</Typography>
                    <Typography className="cp-info-value">{panelProgram?.location ?? '—'}</Typography>
                  </Box>
                  <Box className="cp-info-item">
                    <Typography className="cp-info-label">Program Year</Typography>
                    <Typography className="cp-info-value">{panelProgram?.programYear ?? '—'}</Typography>
                  </Box>
                  <Box className="cp-info-item">
                    <Typography className="cp-info-label">Batch Start Date</Typography>
                    <Typography className="cp-info-value">{fmt(panelSchedule?.startDate)}</Typography>
                  </Box>
                  <Box className="cp-info-item">
                    <Typography className="cp-info-label">Batch End Date</Typography>
                    <Typography className="cp-info-value">{fmt(panelSchedule?.endDate)}</Typography>
                  </Box>
                </Box>
              </Box>

              <Box className="cp-section">
                <Typography className="cp-section-title">Attendance</Typography>
                <Box className="cp-att-panel">
                  <Box className="cp-att-panel-header">
                    <Typography className="cp-att-pct" style={{ color: attColor(panelPct) }}>
                      {panelPct.toFixed(1)}%
                    </Typography>
                    <Typography className={`cp-att-threshold ${panelPct < 75 ? 'cp-att-threshold--bad' : 'cp-att-threshold--ok'}`}>
                      {panelPct < 75 ? '⚠ Below 75%' : '✓ Above 75%'}
                    </Typography>
                  </Box>
                  <Box className="cp-att-panel-bar-bg">
                    <Box className="cp-att-panel-bar-fill"
                      style={{ width: `${Math.min(panelPct, 100)}%`, background: attColor(panelPct) }} />
                  </Box>
                  <Box className="cp-att-stats-row">
                    <Box className="cp-att-stat">
                      <Typography className="cp-att-stat-val" style={{ color: 'var(--color-success-dark)' }}>
                        {panelStats?.presentDays ?? 0}
                      </Typography>
                      <Typography className="cp-att-stat-label">Present</Typography>
                    </Box>
                    <Box className="cp-att-stat">
                      <Typography className="cp-att-stat-val" style={{ color: 'var(--color-error)' }}>
                        {panelStats?.absentDays ?? 0}
                      </Typography>
                      <Typography className="cp-att-stat-label">Absent</Typography>
                    </Box>
                    <Box className="cp-att-stat">
                      <Typography className="cp-att-stat-val">
                        {panelStats?.totalDays ?? 0}
                      </Typography>
                      <Typography className="cp-att-stat-label">Total</Typography>
                    </Box>
                    <Box className="cp-att-stat">
                      <Typography className="cp-att-stat-val" style={{ color: 'var(--color-warning)' }}>
                        {panelApprovedLeaveDays}
                      </Typography>
                      <Typography className="cp-att-stat-label">Leave Days</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Scores */}
              <Box className="cp-section">
                <Typography className="cp-section-title">Course Scores</Typography>
                {panelCourses.length === 0 ? (
                  <Typography className="cp-score-empty">No courses linked to this batch yet</Typography>
                ) : (
                  <Box className="cp-score-list">
                    {panelCourses.map(({ bc, course }) => {
                      const scoreEntry = panelScores.find(s => s.courseId === bc.courseId);
                      const isCommunication = course!.isCommunication === true || !!course!.communicationTemplate;
                      return (
                        <Box key={bc.batchCourseId} className="cp-score-row">
                          <Box>
                            <Typography className="cp-score-course">{course!.courseName}</Typography>
                            <Typography className="cp-score-meta">
                              Min: {course!.minScore}{isCommunication ? ' · Communication' : ` · Weight: ${course!.weightage}%`}
                            </Typography>
                          </Box>
                          <Box className="cp-score-right">
                            {scoreEntry ? (
                              <>
                                <Typography className="cp-score-val">
                                  {isCommunication && scoreEntry.maxScore
                                    ? `${Math.round((scoreEntry.score / scoreEntry.maxScore) * 100)} / 100`
                                    : `${scoreEntry.score} / 100`}
                                </Typography>
                                <Chip label={scoreEntry.status.replace('_', ' ')} size="small" variant="outlined"
                                  className={`cp-perf-chip cp-perf--${scoreEntry.status === 'EXCELLENT' ? 'excellent' : scoreEntry.status === 'GOOD' ? 'good' : 'need'}`} />
                                {isCommunication && scoreEntry.communicationBreakdown && (() => {
                                  try {
                                    const fields: { name: string; score: number; maxScore: number }[] =
                                      JSON.parse(scoreEntry.communicationBreakdown);
                                    return (
                                      <Box sx={{ mt: 0.5 }}>
                                        {fields.map(f => (
                                          <Typography key={f.name} sx={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                            {f.name}: {f.score}/{f.maxScore}
                                          </Typography>
                                        ))}
                                      </Box>
                                    );
                                  } catch { return null; }
                                })()}
                              </>
                            ) : (
                              <Typography className="cp-score-empty">Not scored</Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                    {panelWeighted !== null && (
                      <Box className="cp-avg-row">
                        <Typography className="cp-avg-label">Weighted Score (Technical only)</Typography>
                        <Typography className="cp-avg-val">{panelWeighted} / 100</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Final Status */}
              <Box className="cp-final-card" style={finalCardStyle}>
                <Box>
                  <Typography className="cp-info-label">Performance</Typography>
                  <Typography className="cp-info-value" style={{ marginTop: 4 }}>
                    {selected.performance ? selected.performance.replace('_', ' ') : '—'}
                  </Typography>
                </Box>
                <Chip label={STATUS_LABEL[panelStatus]} size="small" variant="outlined"
                  className={STATUS_CLASS[panelStatus]} />
              </Box>

              {/* Profile Links */}
              {panelProfile && panelProfile.profileLinks && panelProfile.profileLinks.length > 0 && (
                <Box className="cp-section">
                  <Typography className="cp-section-title">Profile Links</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {panelProfile.bio && (
                      <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic', mb: 1 }}>
                        {panelProfile.bio}
                      </Typography>
                    )}
                    {panelProfile.profileLinks.map((link, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: 80 }}>
                          {link.platform}
                        </Typography>
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                          {link.url}
                        </a>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Certificates */}
              {panelCertificates.length > 0 && (
                <Box className="cp-section">
                  <Typography className="cp-section-title">Certificates ({panelCertificates.length})</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {panelCertificates.map(cert => (
                      <Box key={cert.certificateId} className="cp-score-row">
                        <Box>
                          <Typography className="cp-score-course">{cert.certificateName}</Typography>
                          <Typography className="cp-score-meta">
                            {cert.issuer}{cert.issueDate ? ` · ${new Date(cert.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                          </Typography>
                        </Box>
                        <Box className="cp-score-right">
                          <Typography
                            sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                            onClick={async () => {
                              try { await internApi.openCertificate(cert.certificateId); }
                              catch { showToast('Failed to open certificate', 'error'); }
                            }}>
                            View
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {/* Warnings */}
              <Box className="cp-section">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography className="cp-section-title">
                    Warnings {panelWarnings.filter(w => w.status === 'ACTIVE').length > 0 &&
                      `(${panelWarnings.filter(w => w.status === 'ACTIVE').length} active)`}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setShowWarnForm(v => !v)}>
                    {showWarnForm ? 'Cancel' : '+ Issue Warning'}
                  </Typography>
                </Box>

                {/* Issue warning form */}
                {showWarnForm && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 8, mb: 10,
                    padding: '12px', background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type</Typography>
                        <select style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)',
                          fontSize: 'var(--text-xs)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                          value={warnType} onChange={e => setWarnType(e.target.value)}>
                          {['ATTENDANCE','PERFORMANCE','BEHAVIOUR','PUNCTUALITY','OTHER'].map(t =>
                            <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 100, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Severity</Typography>
                        <select style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)',
                          fontSize: 'var(--text-xs)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                          value={warnSeverity} onChange={e => setWarnSeverity(e.target.value)}>
                          {['MINOR','MODERATE','SEVERE'].map(s =>
                            <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Message *</Typography>
                      <textarea rows={3}
                        style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                          fontSize: 'var(--text-xs)', resize: 'vertical', fontFamily: 'inherit',
                          background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        placeholder="Describe the reason for this warning..."
                        value={warnMessage} onChange={e => setWarnMessage(e.target.value)} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="cp-action-btn"
                        disabled={issuingWarn || !warnMessage.trim()}
                        style={{ opacity: issuingWarn ? 0.6 : 1, cursor: issuingWarn || !warnMessage.trim() ? 'not-allowed' : 'pointer' }}
                        onClick={async () => {
                          if (!selected || !warnMessage.trim()) return;
                          try {
                            setIssuingWarn(true);
                            const res = await warningApi.issueWarning({
                              studentId: selected.studentId,
                              issuedBy: tokenstore.getUser()?.userId ?? 0,
                              warningType: warnType,
                              severity: warnSeverity,
                              message: warnMessage.trim(),
                            });
                            if (res.success && res.data) {
                              setPanelWarnings(prev => [res.data!, ...prev]);
                              setWarnMessage('');
                              setShowWarnForm(false);
                              showToast('Warning issued successfully', 'success');
                            }
                          } catch (error) {
                            const err = handleAxiosError(error);
                            showToast(err.message || 'Failed to issue warning', 'error');
                          } finally { setIssuingWarn(false); }
                        }}>
                        {issuingWarn ? 'Issuing...' : 'Issue Warning'}
                      </button>
                    </Box>
                  </Box>
                )}

                {/* Warning list */}
                {panelWarnings.length === 0 ? (
                  <Typography className="cp-score-empty">No warnings issued for this intern</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {panelWarnings.map(w => (
                      <Box key={w.warningId} className={`iwarn-item iwarn-item--${w.severity.toLowerCase()}`}
                        sx={{ borderRadius: '6px !important' }}>
                        <Box className="iwarn-item-left">
                          <Box className="iwarn-item-top">
                            <span className="iwarn-item-type">{w.warningType.replace('_',' ')}</span>
                            <span className={`iwarn-severity iwarn-severity--${w.severity.toLowerCase()}`}>{w.severity}</span>
                            <span className={`iwarn-status iwarn-status--${w.status.toLowerCase()}`}>{w.status}</span>
                          </Box>
                          <Typography className="iwarn-item-message" sx={{ fontSize: 'var(--text-xs) !important' }}>{w.message}</Typography>
                          <Typography className="iwarn-item-meta">
                            {new Date(w.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                          {w.acknowledgementComment && (
                            <Typography sx={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--color-success-dark)', mt: 0.5 }}>
                              ✓ "{w.acknowledgementComment}"
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              </>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CandidateProgress;
