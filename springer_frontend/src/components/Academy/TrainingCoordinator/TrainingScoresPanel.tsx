import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, Button, Typography, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, MenuBook as MenuBookIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  trainingScoreApi, trainingCourseApi,
  batchAllocationApi, batchCourseApi, trainingProgramApi,
} from '../../../services/academy.api';
import { hiringCycleApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import FilterSelect from '../../Common/FilterSelect';
import type {
  TrainingScoreResponse, TrainingScoreRequest,
  TrainingCourseResponse, BatchAllocationResponse,
  BatchCourseResponse, AcademyContextProps, TrainingProgramResponse,
} from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import '../../../css/Academy/TrainingCoordinator/TrainingScoresPanel.css';

const STATUS_CLASS: Record<string, string> = {
  EXCELLENT:     'sc-status-chip sc-status-chip--excellent',
  GOOD:          'sc-status-chip sc-status-chip--good',
  AVERAGE:       'sc-status-chip sc-status-chip--average',
  BELOW_AVERAGE: 'sc-status-chip sc-status-chip--below',
};

const TrainingScoresPanel = ({ context, readOnly = false }: { context: AcademyContextProps; readOnly?: boolean }) => {
  const { programs: yearPrograms } = context;
  const loggedInUser = tokenstore.getUser();
  const userRole = loggedInUser?.roleName?.toUpperCase() ?? '';
  const isTrainer = userRole === 'TRAINING_COORDINATOR' || userRole === 'MEMBERS';
  const canEdit = !readOnly && isTrainer;

  // ── Base data ──
  const [allCourses, setAllCourses]     = useState<TrainingCourseResponse[]>([]);
  const [batchCourses, setBatchCourses] = useState<BatchCourseResponse[]>([]);
  const [allocations, setAllocations]   = useState<BatchAllocationResponse[]>([]);
  const [scores, setScores]             = useState<TrainingScoreResponse[]>([]);
  const [cycles, setCycles]             = useState<HiringCycleResponse[]>([]);
  const [allPrograms, setAllPrograms]   = useState<TrainingProgramResponse[]>([]);
  const [loading, setLoading]           = useState(true);

  // ── View filters ──
  const [filterCycleId, setFilterCycleId]     = useState(0);
  const [filterProgramId, setFilterProgramId] = useState(0);
  const [filterBatchNo, setFilterBatchNo]     = useState(0);
  const [filterCourseId, setFilterCourseId]   = useState(0);
  const [page, setPage]                       = useState(0);
  const [rowsPerPage, setRowsPerPage]         = useState(10);

  // ── Give Score dialog ──
  const [dlgOpen, setDlgOpen]           = useState(false);
  const [dlgProgramId, setDlgProgramId] = useState(0);
  const [dlgBatchNo, setDlgBatchNo]     = useState(0);
  const [dlgCourseId, setDlgCourseId]   = useState(0);
  // scoreMap: studentId -> { score, review }
  const [scoreMap, setScoreMap]         = useState<Record<number, { score: string; review: string }>>({});
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetchBase();
  }, [yearPrograms]);

  const fetchBase = async () => {
    try {
      setLoading(true);
      const [crsRes, bcRes, allocRes, scRes, cycleRes, progRes] = await Promise.all([
        trainingCourseApi.getAllCourses(),
        batchCourseApi.getAllBatchCourses(),
        batchAllocationApi.getAllAllocations(),
        trainingScoreApi.getAllScores(),
        hiringCycleApi.getAllCycles(),
        trainingProgramApi.getAllPrograms(),
      ]);
      if (crsRes.success && crsRes.data)    setAllCourses(crsRes.data);
      if (bcRes.success && bcRes.data)      setBatchCourses(bcRes.data);
      if (allocRes.success && allocRes.data) setAllocations(allocRes.data);
      if (scRes.success && scRes.data)      setScores(scRes.data);
      if (cycleRes.success && cycleRes.data) setCycles(cycleRes.data);
      if (progRes.success && progRes.data)  setAllPrograms(progRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshScores = async () => {
    const res = await trainingScoreApi.getAllScores();
    if (res.success && res.data) setScores(res.data);
  };

  // ── Auto-select current year defaults after data loads ──
  useEffect(() => {
    if (loading || allPrograms.length === 0 || cycles.length === 0) return;

    const currentYear = new Date().getFullYear();

    // Pick cycle for current year (prefer OPEN)
    const yearCycle = cycles.find(c => c.cycleYear === currentYear && c.status === 'OPEN')
      ?? cycles.find(c => c.cycleYear === currentYear)
      ?? cycles[0];
    if (!yearCycle || filterCycleId !== 0) return; // don't override if user already selected

    setFilterCycleId(yearCycle.cycleId);

    // Pick first active program in that cycle
    const prog = allPrograms.find(p => p.cycleId === yearCycle.cycleId && p.status === true)
      ?? allPrograms.find(p => p.cycleId === yearCycle.cycleId);
    if (!prog) return;
    setFilterProgramId(prog.programId);

    // Pick batch 1
    if (prog.numberOfBatches >= 1) {
      setFilterBatchNo(1);

      // Pick first linked course for this program + batch 1
      const linkedBC = batchCourses.find(bc => bc.programId === prog.programId && bc.batchNo === 1);
      if (linkedBC) {
        const course = allCourses.find(c => c.courseId === linkedBC.courseId);
        if (course) setFilterCourseId(course.courseId);
      }
    }
  }, [loading, allPrograms, cycles, batchCourses, allCourses]);

  // ── View filter derived ──

  // Programs filtered by selected cycle (for view filter) — uses ALL programs
  const programsForCycle = allPrograms.filter(p =>
    filterCycleId === 0 || p.cycleId === filterCycleId
  );

  // Batch numbers for selected program (view)
  const batchesForProgram = filterProgramId
    ? Array.from({ length: allPrograms.find(p => p.programId === filterProgramId)?.numberOfBatches ?? 0 }, (_, i) => i + 1)
    : [];

  // Courses linked to selected program+batch (view)
  const coursesForBatch = (filterProgramId && filterBatchNo)
    ? batchCourses
        .filter(bc => bc.programId === filterProgramId && bc.batchNo === filterBatchNo)
        .map(bc => allCourses.find(c => c.courseId === bc.courseId))
        .filter((c): c is TrainingCourseResponse => !!c)
    : [];

  // Students for selected program+batch (view)
  const studentsForView = (filterProgramId && filterBatchNo)
    ? allocations.filter(a => a.programId === filterProgramId && a.batchNumber === filterBatchNo && a.isActive)
    : [];

  // Filtered rows for table — students with score for selected course
  const tableRows = filterCourseId
    ? studentsForView.map(s => ({
        student: s,
        score: scores.find(sc => sc.courseId === filterCourseId && sc.studentId === s.studentId) ?? null,
      }))
    : [];

  const paginated = tableRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Dialog derived ──

  // Active programs only for give score dialog — uses ALL programs
  const dlgPrograms = allPrograms.filter(p => p.status === true);

  const dlgBatchOptions = dlgProgramId
    ? Array.from({ length: allPrograms.find(p => p.programId === dlgProgramId)?.numberOfBatches ?? 0 }, (_, i) => i + 1)
    : [];

  // ACTIVE courses linked to selected program+batch in dialog (trainer sees only their own)
  const dlgCourses = (dlgProgramId && dlgBatchNo)
    ? batchCourses
        .filter(bc => bc.programId === dlgProgramId && bc.batchNo === dlgBatchNo)
        .map(bc => allCourses.find(c => c.courseId === bc.courseId))
        .filter((c): c is TrainingCourseResponse => !!c)
        .filter(c => c.status === 'ACTIVE')
        .filter(c => !isTrainer || c.conductedBy === loggedInUser?.userId)
    : [];

  // Students for selected program+batch in dialog
  const dlgStudents = (dlgProgramId && dlgBatchNo)
    ? allocations.filter(a => a.programId === dlgProgramId && a.batchNumber === dlgBatchNo && a.isActive)
    : [];

  const openDlg = () => {
    setDlgProgramId(0); setDlgBatchNo(0); setDlgCourseId(0); setScoreMap({});
    setDlgOpen(true);
  };

  // When course selected in dialog — pre-fill existing scores
  const handleDlgCourseSelect = (courseId: number) => {
    setDlgCourseId(courseId);
    const map: Record<number, { score: string; review: string }> = {};
    dlgStudents.forEach(s => {
      const existing = scores.find(sc => sc.courseId === courseId && sc.studentId === s.studentId);
      map[s.studentId] = { score: existing ? String(existing.score) : '', review: existing?.review ?? '' };
    });
    setScoreMap(map);
  };

  const handleSaveAll = async () => {
    if (!dlgCourseId) { showToast('Select a course first', 'error'); return; }
    const entries = Object.entries(scoreMap).filter(([, v]) => v.score.trim() !== '');
    if (entries.length === 0) { showToast('Enter at least one score', 'error'); return; }

    // Validate all entered scores
    for (const [, v] of entries) {
      const n = Number(v.score);
      if (isNaN(n) || n < 0 || n > 100) { showToast('All scores must be between 0 and 100', 'error'); return; }
    }

    try {
      setSaving(true);
      let saved = 0;
      for (const [studentIdStr, v] of entries) {
        const studentId = Number(studentIdStr);
        const scoreNum = Number(v.score);
        const existing = scores.find(sc => sc.courseId === dlgCourseId && sc.studentId === studentId);
        const req: TrainingScoreRequest = {
          courseId: dlgCourseId, studentId, score: scoreNum,
          review: v.review, reviewedBy: loggedInUser?.userId ?? 0,
        };
        try {
          if (existing) {
            await trainingScoreApi.updateScore(existing.scoreId, req);
          } else {
            await trainingScoreApi.createScore(req);
          }
          saved++;
        } catch { /* skip individual failures */ }
      }
      showToast(`${saved} score(s) saved successfully`, 'success');
      setDlgOpen(false);
      await refreshScores();
    } catch (err: any) {
      showToast(err.message || 'Failed to save scores', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getExistingScore = (courseId: number, studentId: number) =>
    scores.find(s => s.courseId === courseId && s.studentId === studentId);

  const selectedCourse = allCourses.find(c => c.courseId === filterCourseId);

  if (loading) {
    return (
      <Box className="sc-loading-wrap">
        <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  return (
    <Box className="sc-page">
      <Card className="sc-card">

        {/* Filters */}
        <Box className="sc-filter-section">
          <Box className="sc-filter-row">

            {/* Hiring Cycle */}
            <FilterSelect label="Hiring Cycle" value={String(filterCycleId)}
              onChange={v => {
                setFilterCycleId(Number(v));
                setFilterProgramId(0); setFilterBatchNo(0); setFilterCourseId(0); setPage(0);
              }}>
              <MenuItem value="0">All Cycles</MenuItem>
              {cycles.map(c => (
                <MenuItem key={c.cycleId} value={String(c.cycleId)}>{c.cycleName} ({c.cycleYear})</MenuItem>
              ))}
            </FilterSelect>

            {/* Program */}
            <FilterSelect label="Program" value={String(filterProgramId)}
              onChange={v => {
                setFilterProgramId(Number(v));
                setFilterBatchNo(0); setFilterCourseId(0); setPage(0);
              }}>
              <MenuItem value="0">All Programs</MenuItem>
              {programsForCycle.map(p => (
                <MenuItem key={p.programId} value={String(p.programId)}>{p.programName}</MenuItem>
              ))}
            </FilterSelect>

            {/* Batch */}
            <FilterSelect label="Batch" value={String(filterBatchNo)}
              onChange={v => { setFilterBatchNo(Number(v)); setFilterCourseId(0); setPage(0); }}>
              <MenuItem value="0">All Batches</MenuItem>
              {batchesForProgram.map(b => (
                <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>
              ))}
            </FilterSelect>

            {/* Course */}
            <FilterSelect label="Course" value={String(filterCourseId)}
              onChange={v => { setFilterCourseId(Number(v)); setPage(0); }}>
              <MenuItem value="0">All Courses</MenuItem>
              {coursesForBatch.map(c => (
                <MenuItem key={c.courseId} value={String(c.courseId)}>{c.courseName}</MenuItem>
              ))}
            </FilterSelect>

            <Box className="sc-filter-spacer" />
            {canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openDlg} className="sc-add-button">
                Give Score
              </Button>
            )}

            {/* Course info pill */}
            {selectedCourse && (
              <Typography className="sc-course-pill">
                Min Score: {selectedCourse.minScore} · {selectedCourse.status}
              </Typography>
            )}
          </Box>
        </Box>

        <Box className="sc-separator" />

        {/* Table */}
        <Box className="sc-table-section">
          {!filterCourseId ? (
            <Box className="sc-empty-state">
              <MenuBookIcon className="sc-empty-icon" />
              <Typography className="sc-empty-text">
                {!filterProgramId ? 'Select a hiring cycle and program to get started'
                  : !filterBatchNo ? 'Now select a batch'
                  : 'Now select a course to view scores'}
              </Typography>
            </Box>
          ) : tableRows.length === 0 ? (
            <Box className="sc-empty-state">
              <Typography className="sc-empty-text">No active students in this batch</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="sc-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="sc-table-head-row">
                      <TableCell className="sc-table-head-cell">Student</TableCell>
                      <TableCell className="sc-table-head-cell">Score</TableCell>
                      <TableCell className="sc-table-head-cell">Status</TableCell>
                      <TableCell className="sc-table-head-cell">Review</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map(({ student, score }, idx) => (
                      <TableRow key={student.studentId} hover
                        className={`sc-table-row ${idx % 2 === 0 ? 'sc-table-row--even' : 'sc-table-row--odd'}`}>
                        <TableCell className="sc-table-cell">
                          <Typography className="sc-row-primary">
                            {student.candidateName || `Student #${student.studentId}`}
                          </Typography>
                          <Typography className="sc-row-secondary">{student.department || ''}</Typography>
                        </TableCell>
                        <TableCell className="sc-table-cell">
                          <Typography className={score ? 'sc-score-filled' : 'sc-score-empty'}>
                            {score ? score.score : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell className="sc-table-cell">
                          {score ? (
                            <Chip label={score.status.replace('_', ' ')} size="small" variant="outlined"
                              className={STATUS_CLASS[score.status] ?? 'sc-status-chip'} />
                          ) : <Typography className="sc-score-empty">—</Typography>}
                        </TableCell>
                        <TableCell className="sc-table-cell">
                          <Typography className="sc-review">{score?.review || '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={tableRows.length} page={page}
                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]} className="sc-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* Give Score Dialog */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="sc-dialog-title">Give Score</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>

            {/* Step 1: Program */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Program *" size="small" fullWidth
                value={dlgProgramId || ''}
                onChange={e => { setDlgProgramId(Number(e.target.value)); setDlgBatchNo(0); setDlgCourseId(0); setScoreMap({}); }}
                className="sc-dialog-field">
                <MenuItem value="">— Select Program —</MenuItem>
                {dlgPrograms.map(p => (
                  <MenuItem key={p.programId} value={p.programId}>{p.programName} ({p.programYear})</MenuItem>
                ))}
              </TextField>

              {/* Step 2: Batch */}
              <TextField select label="Batch *" size="small" fullWidth
                value={dlgBatchNo || ''}
                disabled={!dlgProgramId}
                onChange={e => { setDlgBatchNo(Number(e.target.value)); setDlgCourseId(0); setScoreMap({}); }}
                className="sc-dialog-field">
                <MenuItem value="">— Select Batch —</MenuItem>
                {dlgBatchOptions.map(b => (
                  <MenuItem key={b} value={b}>Batch {b}</MenuItem>
                ))}
              </TextField>

              {/* Step 3: Course */}
              <TextField select label="Course *" size="small" fullWidth
                value={dlgCourseId || ''}
                disabled={!dlgBatchNo}
                onChange={e => handleDlgCourseSelect(Number(e.target.value))}
                className="sc-dialog-field">
                <MenuItem value="">— Select Course —</MenuItem>
                {dlgCourses.length === 0 && dlgBatchNo
                  ? <MenuItem disabled value="">No ACTIVE courses for this batch</MenuItem>
                  : dlgCourses.map(c => (
                    <MenuItem key={c.courseId} value={c.courseId}>{c.courseName}</MenuItem>
                  ))}
              </TextField>
            </Stack>

            {/* Students table with inline score inputs */}
            {dlgCourseId > 0 && (
              dlgStudents.length === 0 ? (
                <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', py: 2 }}>
                  No active students in this batch
                </Typography>
              ) : (
                <Box className="sc-dlg-table-wrap">
                  {/* Header row */}
                  <Box className="sc-dlg-row sc-dlg-row--header">
                    <Typography className="sc-dlg-col-label sc-dlg-col--student">Student</Typography>
                    <Typography className="sc-dlg-col-label sc-dlg-col--score">Score (0–100) *</Typography>
                    <Typography className="sc-dlg-col-label sc-dlg-col--review">Review</Typography>
                    <Typography className="sc-dlg-col-label sc-dlg-col--status">Current Status</Typography>
                  </Box>

                  {dlgStudents.map(s => {
                    const existing = getExistingScore(dlgCourseId, s.studentId);
                    const val = scoreMap[s.studentId] ?? { score: '', review: '' };
                    return (
                      <Box key={s.studentId} className={`sc-dlg-row ${existing ? 'sc-dlg-row--scored' : ''}`}>
                        <Box className="sc-dlg-col--student">
                          <Typography className="sc-row-primary">
                            {s.candidateName || `Student #${s.studentId}`}
                          </Typography>
                          <Typography className="sc-row-secondary">{s.department || ''}</Typography>
                        </Box>
                        <Box className="sc-dlg-col--score">
                          <TextField
                            size="small" type="number"
                            value={val.score}
                            onChange={e => setScoreMap(prev => ({
                              ...prev,
                              [s.studentId]: { ...prev[s.studentId] ?? { score: '', review: '' }, score: e.target.value },
                            }))}
                            inputProps={{ min: 0, max: 100 }}
                            className="sc-score-input"
                            placeholder="0–100"
                          />
                        </Box>
                        <Box className="sc-dlg-col--review">
                          <TextField
                            size="small" fullWidth
                            value={val.review}
                            onChange={e => setScoreMap(prev => ({
                              ...prev,
                              [s.studentId]: { ...prev[s.studentId] ?? { score: '', review: '' }, review: e.target.value },
                            }))}
                            placeholder="Optional feedback"
                            className="sc-review-input"
                          />
                        </Box>
                        <Box className="sc-dlg-col--status">
                          {existing ? (
                            <Chip label={existing.status.replace('_', ' ')} size="small" variant="outlined"
                              className={STATUS_CLASS[existing.status] ?? 'sc-status-chip'} />
                          ) : (
                            <Typography className="sc-score-empty">Not scored</Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDlgOpen(false)} className="sc-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />}
            onClick={handleSaveAll}
            disabled={saving || !dlgCourseId || dlgStudents.length === 0}
            className="sc-dialog-submit-btn">
            {saving ? 'Saving...' : 'Save All Scores'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingScoresPanel;
