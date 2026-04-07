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
import { showToast } from '../../../utils/toast';
import FilterSelect from '../../Common/FilterSelect';
import type {
  BatchAllocationResponse, TrainingScoreResponse,
  BatchCourseResponse, TrainingCourseResponse,
  AttendanceStatsResponse, BatchScheduleResponse,
  AcademyContextProps, TrainingProgramResponse,
} from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/CandidateProgress.css';

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
  const [scores, setScores]             = useState<TrainingScoreResponse[]>([]);
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

  useEffect(() => {
    fetchData();
    setFilterProgram('all'); setFilterBatch('all');
    setFilterStatus('all'); setSearch(''); setPage(0); setSelected(null);
  }, [programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allocRes, scoreRes] = await Promise.all([
        batchAllocationApi.getAllAllocations(),
        trainingScoreApi.getAllScores(),
      ]);
      const allocs = (allocRes.success && allocRes.data) ? allocRes.data : [];
      setAllocations(allocs);
      if (scoreRes.success && scoreRes.data) setScores(scoreRes.data);
    } catch (err: any) {
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
    try {
      const [scoreRes, bcRes, crsRes, schedRes, statsRes, progRes] = await Promise.all([
        trainingScoreApi.getScoresByStudent(a.studentId),
        batchCourseApi.getCoursesByBatch(a.programId, a.batchNumber),
        trainingCourseApi.getAllCourses(),
        batchScheduleApi.getByProgramAndBatch(a.programId, a.batchNumber),
        attendanceApi.getAttendanceSummary(a.studentId),
        trainingProgramApi.getProgramById(a.programId),
      ]);
      if (scoreRes.success && scoreRes.data) setPanelScores(scoreRes.data);
      if (bcRes.success && bcRes.data)       setPanelBatchCourses(bcRes.data);
      if (crsRes.success && crsRes.data)     setPanelAllCourses(crsRes.data);
      if (schedRes.success && schedRes.data) setPanelSchedule(schedRes.data);
      if (statsRes.success && statsRes.data) setPanelStats(statsRes.data);
      if (progRes.success && progRes.data)   setPanelProgram(progRes.data);
    } catch (err: any) {
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
              <IconButton size="small" onClick={() => setSelected(null)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box className="cp-panel-body">

              {panelLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                  <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
                </Box>
              ) : (
              <>
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
                      return (
                        <Box key={bc.batchCourseId} className="cp-score-row">
                          <Box>
                            <Typography className="cp-score-course">{course!.courseName}</Typography>
                            <Typography className="cp-score-meta">
                              Min: {course!.minScore} · Weight: {course!.weightage}%
                            </Typography>
                          </Box>
                          <Box className="cp-score-right">
                            {scoreEntry ? (
                              <>
                                <Typography className="cp-score-val">{scoreEntry.score}/100</Typography>
                                <Chip label={scoreEntry.status.replace('_', ' ')} size="small" variant="outlined"
                                  className={`cp-perf-chip cp-perf--${scoreEntry.status === 'EXCELLENT' ? 'excellent' : scoreEntry.status === 'GOOD' ? 'good' : 'need'}`} />
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
                        <Typography className="cp-avg-label">Weighted Score</Typography>
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
