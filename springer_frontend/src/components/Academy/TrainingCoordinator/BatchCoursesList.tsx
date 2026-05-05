import React, { useState, useEffect } from 'react';
import {
  Box, Card, TextField, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Link as LinkIcon,
  LinkOff as LinkOffIcon, MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon, PlayArrow as PlayArrowIcon,
  EditCalendar as EditCalendarIcon,
} from '@mui/icons-material';
import { batchCourseApi, trainingCourseApi, userApi } from '../../../services/academy.api';
import { hiringCycleApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import type {
  BatchCourseResponse, BatchCourseRequest, TrainingCourseResponse,
  AcademyContextProps, UserSummary,
} from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import FilterSelect from '../../Common/FilterSelect';
import '../../../css/Academy/TrainingCoordinator/BatchCoursesList.css';

const STATUS_CLASS: Record<string, string> = {
  PLANNED:   'bc-status-chip bc-status-chip--planned',
  ACTIVE:    'bc-status-chip bc-status-chip--active',
  COMPLETED: 'bc-status-chip bc-status-chip--completed',
  CANCELLED: 'bc-status-chip bc-status-chip--cancelled',
};

const NEXT_STATUS: Record<string, string> = {
  PLANNED: 'ACTIVE',
  ACTIVE:  'COMPLETED',
};

const EMPTY_LINK_FORM = {
  startDate: '', endDate: '', conductedBy: 0,
};

const BatchCoursesList = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, programs: yearPrograms } = context;

  const [batchCourses, setBatchCourses] = useState<BatchCourseResponse[]>([]);
  const [allCourses, setAllCourses] = useState<TrainingCourseResponse[]>([]);
  const [trainers, setTrainers] = useState<UserSummary[]>([]);
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Table filters
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Main link dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dlgProgramId, setDlgProgramId] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourseResponse | null>(null);

  // Tile popup form state
  const [tilePopup, setTilePopup] = useState<{
    open: boolean; programId: number; batchNo: number; programName: string;
  }>({ open: false, programId: 0, batchNo: 0, programName: '' });
  const [linkForm, setLinkForm] = useState(EMPTY_LINK_FORM);
  const [linking, setLinking] = useState(false);

  // Status update dialog
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; bc: BatchCourseResponse | null }>({ open: false, bc: null });
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Unlink confirmation dialog
  const [unlinkDialog, setUnlinkDialog] = useState<{ open: boolean; batchCourseId: number | null; courseName: string }>({ open: false, batchCourseId: null, courseName: '' });

  // Reschedule dialog
  const [rescheduleDialog, setRescheduleDialog] = useState<{ open: boolean; bc: BatchCourseResponse | null }>({ open: false, bc: null });
  const [rescheduleForm, setRescheduleForm] = useState({ startDate: '', endDate: '' });
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    fetchData();
    setFilterProgram('all'); setFilterBatch('all'); setFilterStatus('all'); setPage(0);
  }, [programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bcRes, crsRes, cycleRes, tcRes, memRes, tarRes] = await Promise.all([
        batchCourseApi.getAllBatchCourses(),
        trainingCourseApi.getAllCourses(),
        hiringCycleApi.getAllCycles(),
        userApi.getUsersByRole('TRAINING_COORDINATOR'),
        userApi.getUsersByRole('MEMBERS'),
        userApi.getUsersByRole('TA_MANAGER'),
      ]);
      if (bcRes.success && bcRes.data) setBatchCourses(bcRes.data);
      if (crsRes.success && crsRes.data) setAllCourses(crsRes.data);
      if (cycleRes.success && cycleRes.data) setCycles(cycleRes.data);
      const combined: UserSummary[] = [];
      if (tcRes.success && tcRes.data) combined.push(...tcRes.data);
      if (memRes.success && memRes.data) combined.push(...memRes.data);
      if (tarRes.success && tarRes.data) combined.push(...tarRes.data);
      setTrainers(combined);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCycleName = (id: number | null) =>
    id ? (cycles.find(c => c.cycleId === id)?.cycleName ?? `Cycle ${id}`) : '—';

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const isLinked = (courseId: number, programId: number, batchNo: number) =>
    batchCourses.some(bc => bc.courseId === courseId && bc.programId === programId && bc.batchNo === batchNo);

  const getBatchCourse = (courseId: number, programId: number, batchNo: number) =>
    batchCourses.find(bc => bc.courseId === courseId && bc.programId === programId && bc.batchNo === batchNo);

  // ── Tile click handler ──
  const handleTileClick = (programId: number, batchNo: number, programName: string) => {
    if (!selectedCourse) return;
    const existing = getBatchCourse(selectedCourse.courseId, programId, batchNo);
    if (existing) {
      setStatusDialog({ open: true, bc: existing });
    } else {
      setLinkForm(EMPTY_LINK_FORM);
      setTilePopup({ open: true, programId, batchNo, programName });
    }
  };

  // ── Save link ──
  const handleSaveLink = async () => {
    if (!selectedCourse) return;
    if (!linkForm.startDate || !linkForm.endDate) { showToast('Start date and end date are required', 'error'); return; }
    if (!linkForm.conductedBy) { showToast('Trainer is required', 'error'); return; }
    if (linkForm.endDate < linkForm.startDate) { showToast('End date cannot be before start date', 'error'); return; }

    try {
      setLinking(true);
      const req: BatchCourseRequest = {
        courseId: selectedCourse.courseId,
        programId: tilePopup.programId,
        batchNo: tilePopup.batchNo,
        startDate: linkForm.startDate,
        endDate: linkForm.endDate,
        conductedBy: linkForm.conductedBy,
      };
      const res = await batchCourseApi.linkCourseToBatch(req);
      if (res.success) {
        showToast(`"${selectedCourse.courseName}" linked to Batch ${tilePopup.batchNo} successfully`, 'success');
        setTilePopup({ open: false, programId: 0, batchNo: 0, programName: '' });
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to link course', 'error');
    } finally {
      setLinking(false);
    }
  };

  // ── Unlink ──
  const handleUnlink = async (batchCourseId: number) => {
    try {
      const res = await batchCourseApi.removeCourseFromBatch(batchCourseId);
      if (res.success) { showToast('Course unlinked from batch', 'success'); fetchData(); }
    } catch (err: any) {
      showToast(err.message || 'Failed to unlink', 'error');
    }
    setUnlinkDialog({ open: false, batchCourseId: null, courseName: '' });
  };

  const handleRemove = async (batchCourseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const bc = batchCourses.find(c => c.batchCourseId === batchCourseId);
    setUnlinkDialog({ open: true, batchCourseId, courseName: bc?.courseName || 'this course' });
  };

  // ── Status update ──
  const handleStatusUpdate = async () => {
    if (!statusDialog.bc) return;
    const next = NEXT_STATUS[statusDialog.bc.status];
    if (!next) return;
    try {
      setStatusUpdating(true);
      const res = await batchCourseApi.updateBatchCourseStatus(statusDialog.bc.batchCourseId, next);
      if (res.success) {
        showToast(`Status updated to ${next}`, 'success');
        setStatusDialog({ open: false, bc: null });
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ── Reschedule ──
  const openReschedule = (bc: BatchCourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setRescheduleForm({
      startDate: bc.startDate ? bc.startDate.split('T')[0] : '',
      endDate: bc.endDate ? bc.endDate.split('T')[0] : '',
    });
    setRescheduleDialog({ open: true, bc });
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog.bc) return;
    if (!rescheduleForm.startDate || !rescheduleForm.endDate) { showToast('Both dates are required', 'error'); return; }
    if (rescheduleForm.endDate < rescheduleForm.startDate) { showToast('End date cannot be before start date', 'error'); return; }
    try {
      setRescheduling(true);
      const res = await batchCourseApi.rescheduleBatchCourse(
        rescheduleDialog.bc.batchCourseId, rescheduleForm.startDate, rescheduleForm.endDate
      );
      if (res.success) {
        showToast('Course rescheduled successfully', 'success');
        setRescheduleDialog({ open: false, bc: null });
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reschedule', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  // ── Table filter derived data ──
  const yearProgramIds = new Set(
    yearPrograms.filter(p => programYear === 0 || p.programYear === programYear).map(p => p.programId)
  );

  const filtered = batchCourses.filter(bc => {
    const matchYear    = programYear === 0 || yearProgramIds.has(bc.programId);
    const matchProgram = filterProgram === 'all' || String(bc.programId) === filterProgram;
    const matchBatch   = filterBatch === 'all' || String(bc.batchNo) === filterBatch;
    const matchStatus  = filterStatus === 'all' || bc.status === filterStatus;
    return matchYear && matchProgram && matchBatch && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const programsInData = yearPrograms.filter(p =>
    batchCourses.some(bc => bc.programId === p.programId) &&
    (programYear === 0 || p.programYear === programYear)
  );
  const batchesInData = Array.from(new Set(
    batchCourses
      .filter(bc => (programYear === 0 || yearProgramIds.has(bc.programId)) &&
        (filterProgram === 'all' || String(bc.programId) === filterProgram))
      .map(bc => bc.batchNo)
  )).sort((a, b) => a - b);

  const dlgCourses = allCourses;
  const dlgFilteredPrograms = yearPrograms.filter(p =>
    p.status === true && (programYear === 0 || p.programYear === programYear)
  );

  return (
    <Box className="bc-page">
      <Card className="bc-card">

        {/* Filters */}
        <Box className="bc-filter-section">
          <Box className="bc-filter-row">
            <FilterSelect label="Program" value={filterProgram}
              onChange={v => { setFilterProgram(v); setFilterBatch('all'); setPage(0); }}>
              <MenuItem value="all">All Programs</MenuItem>
              {programsInData.map(p => (
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
            <FilterSelect label="Status" value={filterStatus}
              onChange={v => { setFilterStatus(v); setPage(0); }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="PLANNED">Planned</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </FilterSelect>
            <Box className="bc-filter-spacer" />
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => { setDlgProgramId(0); setSelectedCourse(null); setDialogOpen(true); }}
              className="bc-add-button">
              Link Course to Batch
            </Button>
          </Box>
        </Box>

        <Box className="bc-separator" />

        {/* Table */}
        <Box className="bc-table-section">
          {loading ? (
            <Box className="bc-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="bc-empty-text">Loading...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="bc-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="bc-table-head-row">
                      <TableCell className="bc-table-head-cell">Course</TableCell>
                      <TableCell className="bc-table-head-cell">Program</TableCell>
                      <TableCell className="bc-table-head-cell">Batch</TableCell>
                      <TableCell className="bc-table-head-cell">Trainer</TableCell>
                      <TableCell className="bc-table-head-cell">Start Date</TableCell>
                      <TableCell className="bc-table-head-cell">End Date</TableCell>
                      <TableCell className="bc-table-head-cell">Status</TableCell>
                      <TableCell className="bc-table-head-cell bc-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="bc-empty-cell">
                          <LinkIcon className="bc-empty-icon" />
                          <Typography className="bc-empty-text">
                            No batch-course links found{programYear === 0 ? '' : ` for ${programYear}`}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((bc, idx) => (
                        <TableRow key={bc.batchCourseId} hover
                          className={`bc-table-row ${idx % 2 === 0 ? 'bc-table-row--even' : 'bc-table-row--odd'}`}>
                          <TableCell className="bc-table-cell">
                            <Box className="bc-name-cell">
                              <Box className="bc-name-icon-box"><MenuBookIcon className="bc-name-icon" /></Box>
                              <Box>
                                <Typography className="bc-row-primary">{bc.courseName ?? `Course ${bc.courseId}`}</Typography>
                                <Typography className="bc-row-secondary">{getCycleName(bc.cycleId)}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Typography className="bc-row-secondary">
                              {yearPrograms.find(p => p.programId === bc.programId)?.programName ?? `Program ${bc.programId}`}
                            </Typography>
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Chip label={`Batch ${bc.batchNo}`} size="small" variant="outlined" className="bc-batch-chip" />
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Typography className="bc-row-secondary">{bc.trainerName ?? '—'}</Typography>
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Typography className="bc-row-secondary">{formatDate(bc.startDate)}</Typography>
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Typography className="bc-row-secondary">{formatDate(bc.endDate)}</Typography>
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Chip label={bc.status} size="small" variant="outlined"
                              className={STATUS_CLASS[bc.status] ?? 'bc-status-chip'} />
                          </TableCell>
                          <TableCell className="bc-table-cell bc-table-cell--actions">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {NEXT_STATUS[bc.status] && (() => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const startDate = bc.startDate ? new Date(bc.startDate) : null;
                                const endDate   = bc.endDate   ? new Date(bc.endDate)   : null;
                                const tooEarlyForActive    = bc.status === 'PLANNED' && startDate !== null && today < startDate;
                                const tooEarlyForCompleted = bc.status === 'ACTIVE'  && endDate   !== null && today < endDate;
                                const isDisabled = tooEarlyForActive || tooEarlyForCompleted;
                                const tooltip = tooEarlyForActive
                                  ? `Cannot activate before start date (${formatDate(bc.startDate)})`
                                  : tooEarlyForCompleted
                                  ? `Cannot complete before end date (${formatDate(bc.endDate)})`
                                  : `Move to ${NEXT_STATUS[bc.status]}`;
                                return (
                                  <IconButton size="small"
                                    className={`bc-action-button ${isDisabled ? 'bc-action-button--disabled' : ''}`}
                                    title={tooltip} disabled={isDisabled}
                                    onClick={() => !isDisabled && setStatusDialog({ open: true, bc })}>
                                    {bc.status === 'PLANNED'
                                      ? <PlayArrowIcon className="bc-action-icon" />
                                      : <CheckCircleIcon className="bc-action-icon" />}
                                  </IconButton>
                                );
                              })()}
                              <IconButton size="small" className="bc-action-button"
                                title="Reschedule Dates" onClick={e => openReschedule(bc, e)}
                                disabled={bc.status === 'COMPLETED'}>
                                <EditCalendarIcon className="bc-action-icon" />
                              </IconButton>
                              <IconButton size="small" className="bc-action-button bc-action-button--remove"
                                title="Remove Link" onClick={e => handleRemove(bc.batchCourseId, e)}>
                                <LinkOffIcon className="bc-action-icon--remove" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={filtered.length} page={page}
                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]} className="bc-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* ── Main Link Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="bc-dialog-title">Link Course to Batch</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box className="bc-dlg-filters">
            <TextField select label="Filter by Program" size="small"
              value={dlgProgramId || ''}
              onChange={e => { setDlgProgramId(Number(e.target.value)); setSelectedCourse(null); }}
              className="bc-dlg-filter-field" sx={{ minWidth: 280 }}>
              <MenuItem value="">All Programs</MenuItem>
              {dlgFilteredPrograms.map(p => (
                <MenuItem key={p.programId} value={p.programId}>{p.programName} ({p.programYear})</MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="bc-separator" />

          <Box className="bc-dlg-panels">
            {/* Left — Course list */}
            <Box className="bc-dlg-panel bc-dlg-panel--left">
              <Typography className="bc-dlg-panel-title">Course Templates</Typography>
              <Typography className="bc-dlg-panel-sub">Click a course to select it</Typography>
              <Box className="bc-separator" sx={{ my: 1 }} />
              {dlgCourses.length === 0 ? (
                <Box className="bc-panel-empty">
                  <MenuBookIcon className="bc-empty-icon" />
                  <Typography className="bc-empty-text">No courses found. Create courses first.</Typography>
                </Box>
              ) : (
                <Box className="bc-dlg-course-list">
                  {dlgCourses.map(course => {
                    const linkedCount = batchCourses.filter(bc => bc.courseId === course.courseId).length;
                    const isSelected  = selectedCourse?.courseId === course.courseId;
                    return (
                      <Box key={course.courseId}
                        className={`bc-course-card ${isSelected ? 'bc-course-card--selected' : ''}`}
                        onClick={() => setSelectedCourse(isSelected ? null : course)}>
                        <Box className="bc-course-card-icon-box">
                          <MenuBookIcon className="bc-course-card-icon" />
                        </Box>
                        <Box className="bc-course-card-info">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography className="bc-course-card-name">{course.courseName}</Typography>
                            {course.isCommunication && (
                              <Chip label="Communication" size="small" variant="outlined"
                                sx={{ fontSize: '10px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                            )}
                          </Box>
                          <Typography className="bc-course-card-meta">
                            Min: {course.minScore}
                            {!course.isCommunication && ` · Weight: ${course.weightage}%`}
                            {' · '}{linkedCount > 0 ? `${linkedCount} batch(es) linked` : 'Not linked yet'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Right — Batch tiles */}
            <Box className="bc-dlg-panel bc-dlg-panel--right">
              <Typography className="bc-dlg-panel-title">
                {selectedCourse ? `Link "${selectedCourse.courseName}" to batches` : 'Select a course first'}
              </Typography>
              <Typography className="bc-dlg-panel-sub">
                {selectedCourse ? 'Click an unlinked batch to set dates & trainer' : 'Choose a course from the left'}
              </Typography>
              <Box className="bc-separator" sx={{ my: 1 }} />
              {!selectedCourse ? (
                <Box className="bc-panel-empty">
                  <LinkIcon className="bc-empty-icon" />
                  <Typography className="bc-empty-text">Select a course to see batches</Typography>
                </Box>
              ) : (
                <Box className="bc-dlg-batch-scroll">
                  {yearPrograms
                    .filter(p => p.status && (dlgProgramId === 0 || p.programId === dlgProgramId))
                    .map(prog => (
                      <Box key={prog.programId} className="bc-program-group">
                        <Typography className="bc-program-group-name">{prog.programName}</Typography>
                        <Box className="bc-batch-row">
                          {Array.from({ length: prog.numberOfBatches }, (_, i) => i + 1).map(batchNo => {
                            const linked = isLinked(selectedCourse.courseId, prog.programId, batchNo);
                            const bc     = getBatchCourse(selectedCourse.courseId, prog.programId, batchNo);
                            return (
                              <Box key={batchNo}
                                className={`bc-batch-tile ${linked ? 'bc-batch-tile--linked' : 'bc-batch-tile--unlinked'}`}
                                onClick={() => handleTileClick(prog.programId, batchNo, prog.programName)}>
                                {linked
                                  ? <CheckCircleIcon className="bc-batch-tile-icon bc-batch-tile-icon--linked" />
                                  : <LinkIcon className="bc-batch-tile-icon" />}
                                <Typography className="bc-batch-tile-label">Batch {batchNo}</Typography>
                                {linked && (
                                  <Typography className="bc-batch-tile-status">
                                    {bc?.status ?? 'Linked'}
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} className="bc-dialog-cancel-btn">Done</Button>
        </DialogActions>
      </Dialog>

      {/* ── Tile Popup Form ── */}
      <Dialog open={tilePopup.open}
        onClose={() => setTilePopup({ open: false, programId: 0, batchNo: 0, programName: '' })}
        maxWidth="xs" fullWidth>
        <DialogTitle className="bc-dialog-title">
          Link "{selectedCourse?.courseName}" → Batch {tilePopup.batchNo}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Program: <strong>{tilePopup.programName}</strong>
            </Typography>
            <TextField
              label="Start Date *" type="date" size="small" fullWidth
              value={linkForm.startDate}
              onChange={e => setLinkForm(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              className="bc-dialog-field"
            />
            <TextField
              label="End Date *" type="date" size="small" fullWidth
              value={linkForm.endDate}
              onChange={e => setLinkForm(prev => ({ ...prev, endDate: e.target.value }))}
              inputProps={{ min: linkForm.startDate }}
              InputLabelProps={{ shrink: true }}
              className="bc-dialog-field"
            />
            <TextField
              select label="Trainer *" size="small" fullWidth
              value={linkForm.conductedBy || ''}
              onChange={e => setLinkForm(prev => ({ ...prev, conductedBy: Number(e.target.value) }))}
              className="bc-dialog-field">
              <MenuItem value="">— Select Trainer —</MenuItem>
              {trainers.map(t => (
                <MenuItem key={t.userId} value={t.userId}>{t.username} — {t.email}</MenuItem>
              ))}
            </TextField>

          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTilePopup({ open: false, programId: 0, batchNo: 0, programName: '' })}
            className="bc-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleSaveLink} disabled={linking}
            className="bc-dialog-submit-btn">
            {linking ? 'Linking...' : 'Link Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Status Update Dialog ── */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, bc: null })} maxWidth="xs" fullWidth>
        <DialogTitle className="bc-dialog-title">Update Course Status</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Move <strong>{statusDialog.bc?.courseName}</strong> in Batch {statusDialog.bc?.batchNo} from{' '}
            <strong>{statusDialog.bc?.status}</strong> to{' '}
            <strong>{statusDialog.bc ? NEXT_STATUS[statusDialog.bc.status] : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog({ open: false, bc: null })} className="bc-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate} disabled={statusUpdating}
            className="bc-dialog-submit-btn">
            {statusUpdating ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Unlink Confirmation Dialog ── */}
      <Dialog open={unlinkDialog.open} onClose={() => setUnlinkDialog({ open: false, batchCourseId: null, courseName: '' })} maxWidth="xs" fullWidth>
        <DialogTitle className="bc-dialog-title">Confirm Unlink</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to unlink <strong>{unlinkDialog.courseName}</strong> from this batch?
            This action cannot be undone if the course has no scores.
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>
            Note: If students already have scores for this course, the unlink will be blocked by the server.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUnlinkDialog({ open: false, batchCourseId: null, courseName: '' })} className="bc-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" color="error" onClick={() => unlinkDialog.batchCourseId && handleUnlink(unlinkDialog.batchCourseId)}
            className="bc-dialog-submit-btn">
            Unlink
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reschedule Dialog ── */}
      <Dialog open={rescheduleDialog.open} onClose={() => setRescheduleDialog({ open: false, bc: null })} maxWidth="xs" fullWidth>
        <DialogTitle className="bc-dialog-title">Reschedule Course</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, mb: 2, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Change dates for <strong>{rescheduleDialog.bc?.courseName}</strong>
          </Typography>
          <Stack spacing={2}>
            <TextField label="Start Date" type="date" size="small" fullWidth
              value={rescheduleForm.startDate}
              onChange={e => setRescheduleForm(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" type="date" size="small" fullWidth
              value={rescheduleForm.endDate}
              onChange={e => setRescheduleForm(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: rescheduleForm.startDate }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRescheduleDialog({ open: false, bc: null })} className="bc-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleReschedule} disabled={rescheduling}
            className="bc-dialog-submit-btn">
            {rescheduling ? 'Saving...' : 'Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchCoursesList;
