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
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { batchCourseApi, trainingCourseApi } from '../../../services/academy.api';
import { hiringCycleApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import type {
  BatchCourseResponse, TrainingCourseResponse, AcademyContextProps,
} from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import FilterSelect from '../../Common/FilterSelect';
import '../../../css/Academy/TrainingCoordinator/BatchCoursesList.css';

const BatchCoursesList = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, programs: yearPrograms } = context;

  const [batchCourses, setBatchCourses] = useState<BatchCourseResponse[]>([]);
  const [allCourses, setAllCourses] = useState<TrainingCourseResponse[]>([]);
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Table filters
  const [filterCycle, setFilterCycle] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dlgProgramId, setDlgProgramId] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourseResponse | null>(null);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    setFilterCycle('all'); setFilterProgram('all'); setFilterBatch('all'); setPage(0);
  }, [programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bcRes, crsRes, cycleRes] = await Promise.all([
        batchCourseApi.getAllBatchCourses(),
        trainingCourseApi.getAllCourses(),
        hiringCycleApi.getAllCycles(),
      ]);
      if (bcRes.success && bcRes.data) setBatchCourses(bcRes.data);
      if (crsRes.success && crsRes.data) setAllCourses(crsRes.data);
      if (cycleRes.success && cycleRes.data) setCycles(cycleRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──
  const getCourseName = (id: number) =>
    allCourses.find(c => c.courseId === id)?.courseName ?? `Course ${id}`;

  const getCycleName = (id: number | null) =>
    id ? (cycles.find(c => c.cycleId === id)?.cycleName ?? `Cycle ${id}`) : '—';

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const isLinked = (courseId: number, programId: number, batchNo: number) =>
    batchCourses.some(bc => bc.courseId === courseId && bc.programId === programId && bc.batchNo === batchNo);

  const getBatchCourseId = (courseId: number, programId: number, batchNo: number) =>
    batchCourses.find(bc => bc.courseId === courseId && bc.programId === programId && bc.batchNo === batchNo)?.batchCourseId;

  // ── Dialog derived data ──
  const dlgCourses = allCourses.filter(c =>
    c.status === 'PLANNED' &&
    (programYear === 0 || !c.startDate || new Date(c.startDate).getFullYear() === programYear)
  );

  const dlgFilteredPrograms = yearPrograms.filter(p =>
    p.status === true &&
    (programYear === 0 || p.programYear === programYear)
  );

  // ── Dialog open ──
  const openDialog = () => {
    setDlgProgramId(0); setSelectedCourse(null);
    setDialogOpen(true);
  };

  // ── Link / Unlink tile ──
  const handleLinkTile = async (programId: number, batchNo: number) => {
    if (!selectedCourse) return;
    const key = `${programId}-${batchNo}`;
    const linked = isLinked(selectedCourse.courseId, programId, batchNo);
    try {
      setLinking(key);
      if (linked) {
        const bcId = getBatchCourseId(selectedCourse.courseId, programId, batchNo);
        if (!bcId) return;
        const res = await batchCourseApi.removeCourseFromBatch(bcId);
        if (res.success) { showToast(`Unlinked from Batch ${batchNo}`, 'success'); fetchData(); }
      } else {
        const res = await batchCourseApi.linkCourseToBatch({
          courseId: selectedCourse.courseId, programId, batchNo,
        });
        if (res.success) { showToast(`Linked to Batch ${batchNo}`, 'success'); fetchData(); }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setLinking(null);
    }
  };

  // ── Remove from table ──
  const handleRemove = async (batchCourseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await batchCourseApi.removeCourseFromBatch(batchCourseId);
      if (res.success) { showToast('Link removed', 'success'); fetchData(); }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    }
  };

  // ── Table filter derived data ──
  const yearProgramIds = new Set(
    yearPrograms
      .filter(p => programYear === 0 || p.programYear === programYear)
      .map(p => p.programId)
  );

  const filtered = batchCourses.filter(bc => {
    const matchYear    = programYear === 0 || yearProgramIds.has(bc.programId);
    const matchCycle   = filterCycle === 'all' || String(bc.cycleId) === filterCycle;
    const matchProgram = filterProgram === 'all' || String(bc.programId) === filterProgram;
    const matchBatch   = filterBatch === 'all' || String(bc.batchNo) === filterBatch;
    return matchYear && matchCycle && matchProgram && matchBatch;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const cyclesInData = cycles.filter(c =>
    batchCourses.some(bc => bc.cycleId === c.cycleId && (programYear === 0 || yearProgramIds.has(bc.programId)))
  );

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

  return (
    <Box className="bc-page">
      <Card className="bc-card">

        {/* Filters */}
        <Box className="bc-filter-section">
          <Box className="bc-filter-row">
            <FilterSelect label="Hiring Cycle" value={filterCycle}
              onChange={v => { setFilterCycle(v); setFilterProgram('all'); setFilterBatch('all'); setPage(0); }}>
              <MenuItem value="all">All Cycles</MenuItem>
              {cyclesInData.map(c => (
                <MenuItem key={c.cycleId} value={String(c.cycleId)}>{c.cycleName}</MenuItem>
              ))}
            </FilterSelect>
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
            <Box className="bc-filter-spacer" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog} className="bc-add-button">
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
                      <TableCell className="bc-table-head-cell">Hiring Cycle</TableCell>
                      <TableCell className="bc-table-head-cell">Linked On</TableCell>
                      <TableCell className="bc-table-head-cell bc-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="bc-empty-cell">
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
                              <Typography className="bc-row-primary">{getCourseName(bc.courseId)}</Typography>
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
                            <Typography className="bc-row-secondary">{getCycleName(bc.cycleId)}</Typography>
                          </TableCell>
                          <TableCell className="bc-table-cell">
                            <Typography className="bc-row-secondary">{formatDate(bc.createdAt)}</Typography>
                          </TableCell>
                          <TableCell className="bc-table-cell bc-table-cell--actions">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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

      {/* Link Course to Batch Dialog — two-panel UI */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="bc-dialog-title">Link Course to Batch</DialogTitle>
        <DialogContent sx={{ p: 0 }}>

          {/* Program filter */}
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

          {/* Two panels */}
          <Box className="bc-dlg-panels">

            {/* Left — Course Cards */}
            <Box className="bc-dlg-panel bc-dlg-panel--left">
              <Typography className="bc-dlg-panel-title">PLANNED Courses</Typography>
              <Typography className="bc-dlg-panel-sub">Click a course to select it</Typography>
              <Box className="bc-separator" sx={{ my: 1 }} />
              {dlgCourses.length === 0 ? (
                <Box className="bc-panel-empty">
                  <MenuBookIcon className="bc-empty-icon" />
                  <Typography className="bc-empty-text">No PLANNED courses{programYear === 0 ? '' : ` for ${programYear}`}</Typography>
                </Box>
              ) : (
                <Box className="bc-dlg-course-list">
                  {dlgCourses.map(course => {
                    const linkedCount = batchCourses.filter(bc => bc.courseId === course.courseId).length;
                    const isSelected = selectedCourse?.courseId === course.courseId;
                    return (
                      <Box key={course.courseId}
                        className={`bc-course-card ${isSelected ? 'bc-course-card--selected' : ''}`}
                        onClick={() => setSelectedCourse(isSelected ? null : course)}>
                        <Box className="bc-course-card-icon-box">
                          <MenuBookIcon className="bc-course-card-icon" />
                        </Box>
                        <Box className="bc-course-card-info">
                          <Typography className="bc-course-card-name">{course.courseName}</Typography>
                          <Typography className="bc-course-card-meta">
                            {linkedCount > 0 ? `Linked to ${linkedCount} batch(es)` : 'Not linked yet'}
                          </Typography>
                        </Box>
                        <Chip label={course.status} size="small" variant="outlined"
                          className={`bc-status-chip bc-status-chip--${course.status.toLowerCase()}`} />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Right — Batch Tiles */}
            <Box className="bc-dlg-panel bc-dlg-panel--right">
              <Typography className="bc-dlg-panel-title">
                {selectedCourse ? `Link "${selectedCourse.courseName}" to batches` : 'Select a course first'}
              </Typography>
              <Typography className="bc-dlg-panel-sub">
                {selectedCourse ? 'Click a batch tile to link or unlink' : 'Choose a course from the left'}
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
                    .filter(p =>
                      p.status &&
                      (dlgProgramId === 0 || p.programId === dlgProgramId)
                    )
                    .map(prog => (
                      <Box key={prog.programId} className="bc-program-group">
                        <Typography className="bc-program-group-name">{prog.programName}</Typography>
                        <Box className="bc-batch-row">
                          {Array.from({ length: prog.numberOfBatches }, (_, i) => i + 1).map(batchNo => {
                            const linked = isLinked(selectedCourse.courseId, prog.programId, batchNo);
                            const key = `${prog.programId}-${batchNo}`;
                            const isLinking = linking === key;
                            return (
                              <Box key={batchNo}
                                className={`bc-batch-tile ${linked ? 'bc-batch-tile--linked' : 'bc-batch-tile--unlinked'} ${isLinking ? 'bc-batch-tile--loading' : ''}`}
                                onClick={() => !isLinking && handleLinkTile(prog.programId, batchNo)}>
                                {isLinking ? (
                                  <CircularProgress size={16} sx={{ color: 'var(--color-primary)' }} />
                                ) : linked ? (
                                  <CheckCircleIcon className="bc-batch-tile-icon bc-batch-tile-icon--linked" />
                                ) : (
                                  <LinkIcon className="bc-batch-tile-icon" />
                                )}
                                <Typography className="bc-batch-tile-label">Batch {batchNo}</Typography>
                                {linked && <Typography className="bc-batch-tile-status">Linked</Typography>}
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
    </Box>
  );
};

export default BatchCoursesList;
