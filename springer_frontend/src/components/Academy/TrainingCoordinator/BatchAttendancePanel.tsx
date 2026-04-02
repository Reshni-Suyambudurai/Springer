import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import { Add as AddIcon, Person as PersonIcon } from '@mui/icons-material';
import { attendanceApi, batchAllocationApi, trainingProgramApi } from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import FilterSelect from '../../Common/FilterSelect';
import type {
  BatchAllocationResponse, TrainingProgramResponse, AcademyContextProps,
} from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/BatchAttendancePanel.css';

const BatchAttendancePanel = ({ context, readOnly = false }: { context: AcademyContextProps; readOnly?: boolean }) => {
  const { programYear, programs: yearPrograms } = context;

  // ── Base data ──
  const [allPrograms, setAllPrograms] = useState<TrainingProgramResponse[]>([]);
  const [allocations, setAllocations] = useState<BatchAllocationResponse[]>([]);
  const [statsMap, setStatsMap]       = useState<Record<number, { presentDays: number; absentDays: number }>>({});
  const [loading, setLoading]         = useState(true);

  // ── View filters ──
  const [filterProgramId, setFilterProgramId] = useState(0);
  const [filterBatchNo, setFilterBatchNo]     = useState(0);
  const [sortOrder, setSortOrder]             = useState<'high' | 'low'>('high');
  const [page, setPage]                       = useState(0);
  const [rowsPerPage, setRowsPerPage]         = useState(10);

  // ── Mark Attendance dialog ──
  const [dlgOpen, setDlgOpen]             = useState(false);
  const [dlgProgramId, setDlgProgramId]   = useState(0);
  const [dlgBatchNo, setDlgBatchNo]       = useState(0);
  const [dlgDate, setDlgDate]             = useState(new Date().toISOString().split('T')[0]);
  // attendanceMap: studentId -> true=present, false=absent
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => { fetchBase(); }, []);

  const fetchBase = async () => {
    try {
      setLoading(true);
      const [allocRes, progRes] = await Promise.all([
        batchAllocationApi.getAllAllocations(),
        trainingProgramApi.getAllPrograms(),
      ]);
      if (allocRes.success && allocRes.data) {
        const allocs = allocRes.data;
        setAllocations(allocs);
        // Fetch stats for all active students in parallel
        const activeStudents = allocs.filter(a => a.isActive);
        const statsResults = await Promise.allSettled(
          activeStudents.map(s => attendanceApi.getAttendanceSummary(s.studentId))
        );
        const map: Record<number, { presentDays: number; absentDays: number }> = {};
        statsResults.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.data) {
            map[activeStudents[idx].studentId] = {
              presentDays: Number(result.value.data.presentDays),
              absentDays:  Number(result.value.data.absentDays),
            };
          }
        });
        setStatsMap(map);
      }
      if (progRes.success && progRes.data)  setAllPrograms(progRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── View derived — use yearPrograms for scoping ──
  const yearProgramIds = new Set(yearPrograms.map(p => p.programId));

  const batchesForProgram = filterProgramId
    ? Array.from({ length: (yearPrograms.find(p => p.programId === filterProgramId) ?? allPrograms.find(p => p.programId === filterProgramId))?.numberOfBatches ?? 0 }, (_, i) => i + 1)
    : [];

  const filteredAllocations = allocations.filter(a =>
    a.isActive &&
    (programYear === 0 || yearProgramIds.has(a.programId)) &&
    (filterProgramId === 0 || a.programId === filterProgramId) &&
    (filterBatchNo === 0 || a.batchNumber === filterBatchNo)
  );

  const sortedAllocations = [...filteredAllocations].sort((a, b) => {
    const pctA = Number(a.attendancePercentage ?? 0);
    const pctB = Number(b.attendancePercentage ?? 0);
    return sortOrder === 'high' ? pctB - pctA : pctA - pctB;
  });

  const paginated = sortedAllocations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getProgramName = (id: number) =>
    allPrograms.find(p => p.programId === id)?.programName ?? `Program ${id}`;

  const getPctClass = (pct: number) => {
    if (pct >= 85) return 'excellent';
    if (pct >= 75) return 'acceptable';
    return 'low';
  };

  // ── Dialog derived ──
  const dlgPrograms = allPrograms.filter(p => p.status === true);

  const dlgBatchOptions = dlgProgramId
    ? Array.from({ length: allPrograms.find(p => p.programId === dlgProgramId)?.numberOfBatches ?? 0 }, (_, i) => i + 1)
    : [];

  const dlgStudents = (dlgProgramId && dlgBatchNo)
    ? allocations.filter(a => a.programId === dlgProgramId && a.batchNumber === dlgBatchNo && a.isActive)
    : [];

  const openDlg = () => {
    setDlgProgramId(0); setDlgBatchNo(0);
    setDlgDate(new Date().toISOString().split('T')[0]);
    setAttendanceMap({});
    setDlgOpen(true);
  };

  const handleBatchSelect = (batchNo: number) => {
    setDlgBatchNo(batchNo);
    const students = allocations.filter(a => a.programId === dlgProgramId && a.batchNumber === batchNo && a.isActive);
    const map: Record<number, boolean> = {};
    students.forEach(s => { map[s.studentId] = true; }); // default all present
    setAttendanceMap(map);
  };

  const toggleStudent = (studentId: number) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const markAll = (present: boolean) => {
    const map: Record<number, boolean> = {};
    dlgStudents.forEach(s => { map[s.studentId] = present; });
    setAttendanceMap(map);
  };

  const presentCount = dlgStudents.filter(s => attendanceMap[s.studentId] !== false).length;
  const absentCount  = dlgStudents.length - presentCount;
  const todayPct     = dlgStudents.length > 0 ? Math.round((presentCount / dlgStudents.length) * 100) : 0;

  const handleSubmit = async () => {
    if (!dlgProgramId || !dlgBatchNo || !dlgDate) {
      showToast('Select program, batch and date', 'error'); return;
    }
    if (dlgStudents.length === 0) {
      showToast('No active students in this batch', 'error'); return;
    }
    try {
      setSubmitting(true);
      let successCount = 0;
      let skippedCount = 0;
      for (const student of dlgStudents) {
        try {
          const res = await attendanceApi.markAttendance({
            studentId: student.studentId,
            attendanceDate: dlgDate,
            isPresent: attendanceMap[student.studentId] !== false,
          });
          if (res.success) successCount++;
        } catch {
          skippedCount++; // already marked for this date — skip silently
        }
      }
      if (skippedCount > 0) {
        showToast(`${successCount} marked, ${skippedCount} already marked for this date`, 'success');
      } else {
        showToast(`Attendance marked for ${successCount}/${dlgStudents.length} students`, 'success');
      }
      setDlgOpen(false);
      fetchBase(); // refresh allocations to get updated attendancePercentage
    } catch (err: any) {
      showToast(err.message || 'Failed to mark attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box className="atp-loading-wrap">
        <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  return (
    <Box className="atp-page">
      <Card className="atp-card">

        {/* Filters */}
        <Box className="atp-filter-section">
          <Box className="atp-filter-row">
            <FilterSelect label="Program" value={String(filterProgramId)}
              onChange={v => { setFilterProgramId(Number(v)); setFilterBatchNo(0); setPage(0); }}>
              <MenuItem value="0">All Programs</MenuItem>
              {yearPrograms.map(p => (
                <MenuItem key={p.programId} value={String(p.programId)}>{p.programName}</MenuItem>
              ))}
            </FilterSelect>

            <FilterSelect label="Batch" value={String(filterBatchNo)}
              onChange={v => { setFilterBatchNo(Number(v)); setPage(0); }}>
              <MenuItem value="0">All Batches</MenuItem>
              {batchesForProgram.map(b => (
                <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>
              ))}
            </FilterSelect>

            <FilterSelect label="Sort" value={sortOrder}
              onChange={v => { setSortOrder(v as 'high' | 'low'); setPage(0); }}>
              <MenuItem value="high">Attendance: High → Low</MenuItem>
              <MenuItem value="low">Attendance: Low → High</MenuItem>
            </FilterSelect>

            <Box className="atp-filter-spacer" />
            <Typography className="atp-filter-count">{filteredAllocations.length} student(s)</Typography>
            {!readOnly && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openDlg} className="atp-add-button">
                Mark Attendance
              </Button>
            )}
          </Box>
        </Box>

        <Box className="atp-separator" />

        {/* Table */}
        <Box className="atp-table-section">
          {sortedAllocations.length === 0 ? (
            <Box className="atp-empty-state">
              <PersonIcon className="atp-empty-icon" />
              <Typography className="atp-empty-title">No students found</Typography>
              <Typography className="atp-empty-subtitle">Allocate candidates to batches first</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="atp-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="atp-table-head-row">
                      <TableCell className="atp-table-head-cell">Student</TableCell>
                      <TableCell className="atp-table-head-cell">Program</TableCell>
                      <TableCell className="atp-table-head-cell">Batch</TableCell>
                      <TableCell className="atp-table-head-cell">Present Days</TableCell>
                      <TableCell className="atp-table-head-cell">Absent Days</TableCell>
                      <TableCell className="atp-table-head-cell">Attendance %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.map((alloc, idx) => {
                      const pct = Number(alloc.attendancePercentage ?? 0);
                      const cls = getPctClass(pct);
                      return (
                        <TableRow key={alloc.studentId} hover
                          className={`atp-table-row ${idx % 2 === 0 ? 'atp-table-row--even' : 'atp-table-row--odd'}`}>
                          <TableCell className="atp-table-cell">
                            <Box className="atp-name-cell">
                              <Box className="atp-name-icon-box">
                                <PersonIcon className="atp-name-icon" />
                              </Box>
                              <Box>
                                <Typography className="atp-row-primary">
                                  {alloc.candidateName || `Student #${alloc.studentId}`}
                                </Typography>
                                <Typography className="atp-row-secondary">
                                  {alloc.department || alloc.candidateEmail || ''}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell className="atp-table-cell">
                            <Typography className="atp-row-primary">{getProgramName(alloc.programId)}</Typography>
                          </TableCell>
                          <TableCell className="atp-table-cell">
                            <Chip label={`Batch ${alloc.batchNumber}`} size="small" variant="outlined" className="atp-batch-chip" />
                          </TableCell>
                          <TableCell className="atp-table-cell">
                            <Typography className="atp-present-days">
                              {statsMap[alloc.studentId]?.presentDays ?? 0}
                            </Typography>
                          </TableCell>
                          <TableCell className="atp-table-cell">
                            <Typography className="atp-absent-days">
                              {statsMap[alloc.studentId]?.absentDays ?? 0}
                            </Typography>
                          </TableCell>
                          <TableCell className="atp-table-cell">
                            <Box className="atp-pct-cell">
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(pct, 100)}
                                className={`atp-progress-bar atp-progress-bar--${cls}`}
                              />
                              <Typography className={`atp-pct-text atp-pct-text--${cls}`}>
                                {pct.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div" count={sortedAllocations.length} page={page}
                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]} className="atp-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* Mark Attendance Dialog */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="atp-dialog-title">Mark Attendance</DialogTitle>
        <DialogContent sx={{ p: 0 }}>

          {/* Selectors */}
          <Box className="atp-dlg-selectors">
            <TextField select label="Program *" size="small"
              value={dlgProgramId || ''}
              onChange={e => { setDlgProgramId(Number(e.target.value)); setDlgBatchNo(0); setAttendanceMap({}); }}
              className="atp-dlg-field">
              <MenuItem value="">— Select Program —</MenuItem>
              {dlgPrograms.map(p => (
                <MenuItem key={p.programId} value={p.programId}>{p.programName} ({p.programYear})</MenuItem>
              ))}
            </TextField>

            <TextField select label="Batch *" size="small"
              value={dlgBatchNo || ''}
              disabled={!dlgProgramId}
              onChange={e => handleBatchSelect(Number(e.target.value))}
              className="atp-dlg-field">
              <MenuItem value="">— Select Batch —</MenuItem>
              {dlgBatchOptions.map(b => (
                <MenuItem key={b} value={b}>Batch {b}</MenuItem>
              ))}
            </TextField>

            <TextField label="Date *" type="date" size="small"
              value={dlgDate}
              onChange={e => setDlgDate(e.target.value)}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              InputLabelProps={{ shrink: true }}
              className="atp-dlg-field" />
          </Box>

          {dlgBatchNo > 0 && dlgStudents.length > 0 && (
            <>
              <Box className="atp-separator" />

              {/* Stats + Bulk actions */}
              <Box className="atp-dlg-stats-row">
                <Box className="atp-dlg-stat">
                  <Typography className="atp-dlg-stat-value atp-dlg-stat-value--present">{presentCount}</Typography>
                  <Typography className="atp-dlg-stat-label">Present</Typography>
                </Box>
                <Box className="atp-dlg-stat">
                  <Typography className="atp-dlg-stat-value atp-dlg-stat-value--absent">{absentCount}</Typography>
                  <Typography className="atp-dlg-stat-label">Absent</Typography>
                </Box>
                <Box className="atp-dlg-stat">
                  <Typography className="atp-dlg-stat-value">{dlgStudents.length}</Typography>
                  <Typography className="atp-dlg-stat-label">Total</Typography>
                </Box>
                <Box className="atp-dlg-stat">
                  <Typography className={`atp-dlg-stat-value atp-pct-text--${getPctClass(todayPct)}`}>{todayPct}%</Typography>
                  <Typography className="atp-dlg-stat-label">Today's %</Typography>
                </Box>
                <Box className="atp-dlg-bulk-actions">
                  <Button variant="contained" size="small" onClick={() => markAll(true)} className="atp-bulk-present-btn">
                    Mark All Present
                  </Button>
                  <Button variant="outlined" size="small" onClick={() => markAll(false)} className="atp-bulk-absent-btn">
                    Mark All Absent
                  </Button>
                </Box>
              </Box>

              <Box className="atp-separator" />

              {/* Student list */}
              <Box className="atp-dlg-student-list">
                {dlgStudents.map(s => {
                  const isPresent = attendanceMap[s.studentId] !== false;
                  return (
                    <Box key={s.studentId}
                      className={`atp-dlg-student-row ${isPresent ? 'atp-dlg-student-row--present' : 'atp-dlg-student-row--absent'}`}
                      onClick={() => toggleStudent(s.studentId)}>
                      <input
                        type="checkbox"
                        checked={isPresent}
                        onChange={() => toggleStudent(s.studentId)}
                        onClick={e => e.stopPropagation()}
                        className="atp-student-checkbox"
                      />
                      <Box className="atp-dlg-student-info">
                        <Typography className="atp-row-primary">
                          {s.candidateName || `Student #${s.studentId}`}
                        </Typography>
                        <Typography className="atp-row-secondary">
                          {s.department || ''} · Overall: {Number(s.attendancePercentage ?? 0).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Chip
                        label={isPresent ? 'Present' : 'Absent'}
                        size="small" variant="outlined"
                        className={isPresent ? 'atp-attendance-chip atp-attendance-chip--present' : 'atp-attendance-chip atp-attendance-chip--absent'}
                      />
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {dlgBatchNo > 0 && dlgStudents.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                No active students in this batch
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDlgOpen(false)} className="atp-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !dlgBatchNo || dlgStudents.length === 0}
            className="atp-dialog-submit-btn">
            {submitting ? 'Saving...' : `Save Attendance (${dlgStudents.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchAttendancePanel;
