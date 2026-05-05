import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Card, TextField, Button, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import { Add as AddIcon, Person as PersonIcon, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { attendanceApi, batchAllocationApi, trainingProgramApi, excelUploadApi } from '../../../services/academy.api';
import { handleAxiosError } from '../../../services/api.error';
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
  const [batchStudents, setBatchStudents] = useState<BatchAllocationResponse[]>([]);
  const [statsMap, setStatsMap]       = useState<Record<number, { presentDays: number; absentDays: number }>>({});
  const [loading, setLoading]         = useState(true);

  // ── View filters ──
  const [filterProgramId, setFilterProgramId] = useState(0);
  const [filterBatchNo, setFilterBatchNo]     = useState(0);
  const [sortOrder, setSortOrder]             = useState<'high' | 'low'>('high');
  const [page, setPage]                       = useState(0);
  const [rowsPerPage, setRowsPerPage]         = useState(10);

  // ── Mark Attendance dialog ──
  const [dlgOpen, setDlgOpen]         = useState(false);
  const [dlgDate, setDlgDate]         = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const uploadRef                     = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchBase(); }, []);

  // Fetch batch stats whenever program+batch filter changes — single API call
  useEffect(() => {
    if (filterProgramId && filterBatchNo) {
      fetchBatchStats(filterProgramId, filterBatchNo);
      // Fetch only active students for this batch — used in dialog
      batchAllocationApi.getAllocationsByBatch(filterProgramId, filterBatchNo)
        .then(res => {
          if (res.success && res.data)
            setBatchStudents(res.data.filter(a => a.isActive));
        })
        .catch(() => {});
    } else {
      setBatchStudents([]);
    }
  }, [filterProgramId, filterBatchNo]);

  const fetchBase = async () => {
    try {
      setLoading(true);
      const progRes = await trainingProgramApi.getAllPrograms();
      if (progRes.success && progRes.data) setAllPrograms(progRes.data);

      // Fetch allocations only for year-scoped programs — not all allocations
      const scopedPrograms = (progRes.success && progRes.data)
        ? (programYear === 0 ? progRes.data : progRes.data.filter(p => p.programYear === programYear))
        : [];
      if (scopedPrograms.length > 0) {
        const allocResults = await Promise.allSettled(
          scopedPrograms.map(p => batchAllocationApi.getAllocationsByProgram(p.programId, true))
        );
        const allAllocs: BatchAllocationResponse[] = [];
        allocResults.forEach(r => {
          if (r.status === 'fulfilled' && r.value.success && r.value.data)
            allAllocs.push(...r.value.data);
        });
        setAllocations(allAllocs);
      } else {
        setAllocations([]);
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // After allocations load, fetch stats for all unique program+batch combos
  useEffect(() => {
    if (allocations.length === 0) return;
    const combos = Array.from(
      new Map(allocations.map(a => [`${a.programId}-${a.batchNumber}`, { programId: a.programId, batchNumber: a.batchNumber }])).values()
    );
    combos.forEach(({ programId, batchNumber }) => fetchBatchStats(programId, batchNumber));
  }, [allocations]);

  // Single call returns stats for ALL students in a batch — replaces N+1 calls
  const fetchBatchStats = async (programId: number, batchNumber: number) => {
    if (!programId || !batchNumber) return;
    try {
      const res = await attendanceApi.getAttendanceSummaryByBatch(programId, batchNumber);
      if (res.success && res.data) {
        const map: Record<number, { presentDays: number; absentDays: number }> = {};
        res.data.forEach(s => {
          map[s.studentId] = { presentDays: Number(s.presentDays), absentDays: Number(s.absentDays) };
        });
        setStatsMap(map);
      }
    } catch { /* silent — stats are supplementary */ }
  };

  // ── View derived ──
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

  const dlgStudents = batchStudents;

  const selectedProgramObj = allPrograms.find(p => p.programId === filterProgramId)
    ?? yearPrograms.find(p => p.programId === filterProgramId);
  const isSelectedProgramActive = selectedProgramObj?.status === true;
  const canMarkAttendance = !readOnly && filterProgramId !== 0 && filterBatchNo !== 0 && isSelectedProgramActive;

  const getMarkAttendanceTooltip = () => {
    if (readOnly) return '';
    if (filterProgramId === 0) return 'Select a specific program first';
    if (!isSelectedProgramActive) return 'Attendance can only be marked for active programs';
    if (filterBatchNo === 0) return 'Select a batch first';
    return '';
  };

  const openDlg = () => {
    setDlgDate(new Date().toISOString().split('T')[0]);
    const map: Record<number, boolean> = {};
    batchStudents.forEach(s => { map[s.studentId] = true; });
    setAttendanceMap(map);
    setDlgOpen(true);
  };

  // Pre-check if attendance already exists when user changes date in the dialog
  const handleDateChange = async (newDate: string) => {
    setDlgDate(newDate);
    if (!filterProgramId || !filterBatchNo || !newDate) return;
    try {
      const res = await attendanceApi.checkAttendanceExists(filterProgramId, Number(filterBatchNo), newDate);
      if (res.success && res.data === true) {
        showToast('⚠️ Attendance has already been marked for this batch on ' + newDate + '. Submitting again will skip already-marked students.', 'warning');
      }
    } catch { /* ignore check failure */ }
  };

  const downloadAttendanceTemplate = () => {
    if (!filterProgramId || !filterBatchNo) {
      showToast('Select Program and Batch before downloading template', 'error');
      return;
    }
    const sorted = [...batchStudents].sort((a, b) => a.candidateName.localeCompare(b.candidateName));
    if (sorted.length === 0) {
      showToast('No active students found for selected Program and Batch', 'error');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const rows = sorted.map(student => ({
      'Student ID': student.studentId,
      'Candidate Name': student.candidateName,
      'Candidate Email': student.candidateEmail,
      'Date': today,
      'Present': 'true',
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, `attendance_template_program_${filterProgramId}_batch_${filterBatchNo}.xlsx`);
  };

  const handleAttendanceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!file.name.endsWith('.xlsx')) { showToast('Only .xlsx files are supported', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('File size must be under 10MB', 'error'); return; }
    if (!filterProgramId || !filterBatchNo) {
      showToast('Select Program and Batch before uploading', 'error'); return;
    }
    try {
      setUploading(true);
      const res = await excelUploadApi.uploadAttendance(file, filterProgramId, filterBatchNo);
      if (res.success && res.data) {
        const d = res.data;
        if (d.failedCount === 0) {
          showToast(`✅ ${d.savedCount} attendance record(s) saved successfully`, 'success');
        } else if (d.savedCount === 0) {
          showToast(`❌ Upload failed — ${d.failedCount} error(s). Check details below.`, 'error');
        } else {
          showToast(`⚠ ${d.savedCount} saved, ${d.failedCount} failed — check details below`, 'error');
        }
        if (d.errors.length > 0) {
          d.errors.slice(0, 3).forEach(err => showToast(err, 'error'));
          if (d.errors.length > 3) showToast(`...and ${d.errors.length - 3} more errors`, 'error');
        }
        fetchBase();
        fetchBatchStats(filterProgramId, filterBatchNo);
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
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
    if (!filterProgramId || !filterBatchNo || !dlgDate) {
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
          skippedCount++;
        }
      }
      if (skippedCount > 0) {
        showToast(`${successCount} marked, ${skippedCount} already marked for this date`, 'success');
      } else {
        showToast(`Attendance marked for ${successCount}/${dlgStudents.length} students`, 'success');
      }
      setDlgOpen(false);
      fetchBase();
      fetchBatchStats(filterProgramId, filterBatchNo);
    } catch (error) {
      const err = handleAxiosError(error);
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
              onChange={v => {
                const progId = Number(v);
                setFilterProgramId(progId);
                setFilterBatchNo(0);
                setStatsMap({});
                setPage(0);
                if (progId) {
                  const prog = allPrograms.find(p => p.programId === progId)
                    ?? yearPrograms.find(p => p.programId === progId);
                  if (prog && prog.numberOfBatches === 1) setFilterBatchNo(1);
                }
              }}>
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
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                onClick={downloadAttendanceTemplate} className="atp-template-btn">
                Template
              </Button>
            )}
            {!readOnly && (
              <>
                <input ref={uploadRef} type="file" accept=".xlsx"
                  style={{ display: 'none' }} onChange={handleAttendanceUpload} />
                <Button variant="outlined" size="small"
                  startIcon={uploading ? <CircularProgress size={14} /> : <UploadIcon />}
                  onClick={() => {
                    if (!filterProgramId || !filterBatchNo) {
                      showToast('Select Program and Batch first', 'error'); return;
                    }
                    uploadRef.current?.click();
                  }}
                  disabled={uploading} className="atp-upload-btn">
                  {uploading ? 'Uploading...' : 'Upload Excel'}
                </Button>
              </>
            )}
            {!readOnly && (
              <Button variant="contained" startIcon={<AddIcon />}
                onClick={openDlg}
                disabled={!canMarkAttendance}
                title={getMarkAttendanceTooltip()}
                className="atp-add-button">
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
        <DialogTitle className="atp-dialog-title">
          Mark Attendance — {selectedProgramObj?.programName} · Batch {filterBatchNo}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box className="atp-dlg-selectors">
            <TextField label="Date *" type="date" size="small"
              value={dlgDate}
              onChange={e => handleDateChange(e.target.value)}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              InputLabelProps={{ shrink: true }}
              className="atp-dlg-field" />
          </Box>

          {filterBatchNo > 0 && dlgStudents.length > 0 && (
            <>
              <Box className="atp-separator" />
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

          {filterBatchNo > 0 && dlgStudents.length === 0 && (
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
            disabled={submitting || !filterBatchNo || dlgStudents.length === 0}
            className="atp-dialog-submit-btn">
            {submitting ? 'Saving...' : `Save Attendance (${dlgStudents.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchAttendancePanel;
