import { useState, useEffect } from 'react';
import {
  Box, Card, Button, Typography, Stack, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, TextField, Checkbox,
} from '@mui/material';
import {
  Person as PersonIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  GroupAdd as GroupAddIcon,
  CalendarMonth as CalendarIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { batchAllocationApi, trainingProgramApi, batchScheduleApi, batchCandidateApi } from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import type {
  BatchAllocationResponse, BatchAllocationRequest, BatchTransferRequest,
  TrainingProgramResponse, AcademyContextProps,
  BatchScheduleResponse, BatchCandidateResponse,
} from '../../../types/Academy/academy.types';
import FilterSelect from '../../Common/FilterSelect';
import '../../../css/Academy/TrainingCoordinator/BatchAllocationsList.css';

const PERFORMANCE_CLASS: Record<string, string> = {
  EXCELLENT:     'ba-performance-chip ba-performance-chip--excellent',
  GOOD:          'ba-performance-chip ba-performance-chip--good',
  NEED_LEARNING: 'ba-performance-chip ba-performance-chip--need',
  PROJECT_READY: 'ba-performance-chip ba-performance-chip--ready',
  DROPPED:       'ba-performance-chip ba-performance-chip--need',
};

const BatchAllocationsList = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, programs: yearPrograms } = context;

  const [allocations, setAllocations] = useState<BatchAllocationResponse[]>([]);
  const [allPrograms, setAllPrograms] = useState<TrainingProgramResponse[]>([]);
  const [batchSchedules, setBatchSchedules] = useState<BatchScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Bulk allocation dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(0);
  const [candidates, setCandidates] = useState<BatchCandidateResponse[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  // Per-candidate batch selection: candidateId -> batchNumber
  const [candidateBatchMap, setCandidateBatchMap] = useState<Record<number, number>>({});
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAlloc, setEditAlloc] = useState<BatchAllocationResponse | null>(null);
  const [editBatchNumber, setEditBatchNumber] = useState(1);
  const [editPerformance, setEditPerformance] = useState('');
  const [editBatchOptions, setEditBatchOptions] = useState<number[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Deactivate confirmation
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateStudentId, setDeactivateStudentId] = useState<number | null>(null);

  // Transfer dialog
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferAlloc, setTransferAlloc] = useState<BatchAllocationResponse | null>(null);
  const [transferProgramId, setTransferProgramId] = useState(0);
  const [transferBatchNumber, setTransferBatchNumber] = useState(1);
  const [transferReason, setTransferReason] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Batch schedule dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleProgramId, setScheduleProgramId] = useState(0);
  const [scheduleBatchNo, setScheduleBatchNo] = useState(0);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleEndDate, setScheduleEndDate] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => { fetchData(); }, [programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const progRes = await trainingProgramApi.getAllPrograms();
      if (progRes.success && progRes.data) {
        setAllPrograms(progRes.data);
        // Fetch allocations only for year-scoped programs — not all allocations
        const scopedIds = programYear === 0
          ? progRes.data.map(p => p.programId)
          : progRes.data.filter(p => p.programYear === programYear).map(p => p.programId);
        const allocResults = await Promise.allSettled(
          scopedIds.map(id => batchAllocationApi.getAllocationsByProgram(id))
        );
        const allAllocs: BatchAllocationResponse[] = [];
        allocResults.forEach(r => {
          if (r.status === 'fulfilled' && r.value.success && r.value.data)
            allAllocs.push(...r.value.data);
        });
        setAllocations(allAllocs);
        // Fetch batch schedules for scoped programs only
        const scheduleResults = await Promise.allSettled(
          scopedIds.map(id => batchScheduleApi.getByProgram(id))
        );
        const allSchedules: BatchScheduleResponse[] = [];
        scheduleResults.forEach(r => {
          if (r.status === 'fulfilled' && r.value.success && r.value.data)
            allSchedules.push(...r.value.data);
        });
        setBatchSchedules(allSchedules);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // When program selected in dialog — fetch JOINED/OFFERED candidates from that program's cycle
  const handleProgramSelect = async (programId: number) => {
    setSelectedProgramId(programId);
    setCandidates([]);
    setCandidateBatchMap({});
    setSelectedCandidateIds(new Set());
    setCandidateSearch('');
    if (!programId) return;

    const prog = allPrograms.find(p => p.programId === programId);
    if (!prog?.cycleId) {
      showToast('This program has no linked hiring cycle', 'error');
      return;
    }

    try {
      setLoadingCandidates(true);
      // Fetch only JOINED candidates directly from backend — no frontend filtering needed
      const res = await candidateApi.getCandidatesByCycleIdAndStage(prog.cycleId, 'JOINED');
      if (res.success && res.data) {
        const allocatedIds = new Set(
          allocations.filter(a => a.programId === programId).map(a => a.candidateId)
        );
        const eligible = res.data.filter(c => !allocatedIds.has(c.candidateId));
        setCandidates(eligible);
        const defaultMap: Record<number, number> = {};
        eligible.forEach(c => { defaultMap[c.candidateId] = 1; });
        setCandidateBatchMap(defaultMap);
      }
    } catch {
      showToast('Failed to load candidates for this program', 'error');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const getBatchOptions = (programId: number): number[] => {
    const prog = allPrograms.find(p => p.programId === programId);
    return prog ? Array.from({ length: prog.numberOfBatches }, (_, i) => i + 1) : [1];
  };

  const toggleCandidate = (candidateId: number) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      next.has(candidateId) ? next.delete(candidateId) : next.add(candidateId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCandidateIds.size === filteredCandidates.length) {
      setSelectedCandidateIds(new Set());
    } else {
      setSelectedCandidateIds(new Set(filteredCandidates.map(c => c.candidateId)));
    }
  };

  const filteredCandidates = candidates.filter(c =>
    candidateSearch.trim() === '' ||
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    (c.department || '').toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const handleBulkSubmit = async () => {
    if (!selectedProgramId) { showToast('Select a program', 'error'); return; }
    if (selectedCandidateIds.size === 0) { showToast('Select at least one candidate', 'error'); return; }

    try {
      setBulkSubmitting(true);
      const requests: BatchAllocationRequest[] = Array.from(selectedCandidateIds).map(id => ({
        programId: selectedProgramId,
        candidateId: id,
        batchNumber: candidateBatchMap[id] || 1,
        isActive: true,
      }));

      let successCount = 0;
      for (const req of requests) {
        try {
          const res = await batchAllocationApi.createAllocation(req);
          if (res.success) successCount++;
        } catch { /* skip duplicates */ }
      }
      showToast(`${successCount} candidate(s) allocated successfully`, 'success');
      setBulkDialogOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Bulk allocation failed', 'error');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openBulkDialog = () => {
    setSelectedProgramId(0);
    setCandidates([]);
    setCandidateBatchMap({});
    setSelectedCandidateIds(new Set());
    setCandidateSearch('');
    setBulkDialogOpen(true);
  };

  const openScheduleManager = () => {
    const nextProgramId = filterProgram !== 'all' ? Number(filterProgram) : 0;
    const nextBatchNo = filterBatch !== 'all' ? Number(filterBatch) : 0;
    setScheduleProgramId(nextProgramId);
    setScheduleBatchNo(nextBatchNo);

    if (nextProgramId > 0 && nextBatchNo > 0) {
      const existing = getBatchSchedule(nextProgramId, nextBatchNo);
      setScheduleStartDate(existing?.startDate ?? '');
      setScheduleEndDate(existing?.endDate ?? '');
    } else {
      setScheduleStartDate('');
      setScheduleEndDate('');
    }

    setScheduleDialogOpen(true);
  };

  // Table filters — scope allocations to year-filtered programs
  const yearProgramIds = new Set(yearPrograms.map(p => p.programId));

  const batchNumbersForFilter = filterProgram === 'all'
    ? Array.from(new Set(allocations.filter(a => programYear === 0 || yearProgramIds.has(a.programId)).map(a => a.batchNumber))).sort((a, b) => a - b)
    : Array.from(new Set(
        allocations.filter(a => String(a.programId) === filterProgram).map(a => a.batchNumber)
      )).sort((a, b) => a - b);

  const filtered = allocations.filter(a => {
    const matchYear    = programYear === 0 || yearProgramIds.has(a.programId);
    const matchProgram = filterProgram === 'all' || String(a.programId) === filterProgram;
    const matchBatch   = filterBatch === 'all' || String(a.batchNumber) === filterBatch;
    const matchStatus  = filterStatus === 'all' || (filterStatus === 'active' ? a.isActive : !a.isActive);
    return matchYear && matchProgram && matchBatch && matchStatus;
  });
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openEditAlloc = (alloc: BatchAllocationResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    const prog = allPrograms.find(p => p.programId === alloc.programId);
    setEditBatchOptions(prog ? Array.from({ length: prog.numberOfBatches }, (_, i) => i + 1) : []);
    setEditAlloc(alloc);
    setEditBatchNumber(alloc.batchNumber);
    setEditPerformance(alloc.performance ?? '');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editAlloc) return;
    try {
      setEditSubmitting(true);
      const res = await batchAllocationApi.updateAllocation(editAlloc.studentId, {
        batchNumber: editBatchNumber,
        performance: editPerformance || undefined,
      });
      if (res.success) {
        showToast('Allocation updated successfully', 'success');
        setEditDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update allocation', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeactivate = async (studentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeactivateStudentId(studentId);
    setDeactivateDialogOpen(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateStudentId) return;
    try {
      const res = await batchAllocationApi.deleteAllocation(deactivateStudentId);
      if (res.success) {
        showToast('Allocation deactivated', 'success');
        setDeactivateDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate', 'error');
    }
  };

  const handleMarkReady = async (studentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await batchAllocationApi.markProjectReady(studentId);
      if (res.success) { showToast('Student marked as Project Ready', 'success'); fetchData(); }
    } catch (err: any) {
      showToast(err.message || 'Failed — attendance may be below 75%', 'error');
    }
  };

  const openTransferDialog = (alloc: BatchAllocationResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransferAlloc(alloc);
    setTransferProgramId(alloc.programId);
    setTransferBatchNumber(alloc.batchNumber);
    setTransferReason('');
    setTransferDialogOpen(true);
  };

  const handleTransferSubmit = async () => {
    if (!transferAlloc) return;
    if (!transferReason.trim()) { showToast('Transfer reason is required', 'error'); return; }
    if (transferProgramId === transferAlloc.programId && transferBatchNumber === transferAlloc.batchNumber) {
      showToast('Please select a different batch', 'error'); return;
    }
    try {
      setTransferSubmitting(true);
      const req: BatchTransferRequest = {
        targetProgramId: transferProgramId,
        targetBatchNumber: transferBatchNumber,
        transferReason: transferReason.trim(),
      };
      const res = await batchAllocationApi.transferStudent(transferAlloc.studentId, req);
      if (res.success) {
        showToast(`${transferAlloc.candidateName} transferred to Batch ${transferBatchNumber} successfully`, 'success');
        setTransferDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Transfer failed', 'error');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const getProgramName = (id: number) =>
    allPrograms.find(p => p.programId === id)?.programName ?? `Program ${id}`;

  const getBatchSchedule = (programId: number, batchNumber: number) =>
    batchSchedules.find(s => s.programId === programId && s.batchNumber === batchNumber);

  const handleScheduleProgramChange = (programId: number) => {
    setScheduleProgramId(programId);
    setScheduleBatchNo(0);
    setScheduleStartDate('');
    setScheduleEndDate('');
  };

  const handleScheduleBatchChange = (batchNo: number) => {
    setScheduleBatchNo(batchNo);
    if (!scheduleProgramId || !batchNo) {
      setScheduleStartDate('');
      setScheduleEndDate('');
      return;
    }

    const existing = getBatchSchedule(scheduleProgramId, batchNo);
    setScheduleStartDate(existing?.startDate ?? '');
    setScheduleEndDate(existing?.endDate ?? '');
  };

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const handleSaveSchedule = async () => {
    if (!scheduleProgramId || !scheduleBatchNo) { showToast('Select a program and batch', 'error'); return; }
    if (!scheduleStartDate || !scheduleEndDate) { showToast('Start date and end date are required', 'error'); return; }
    if (scheduleEndDate < scheduleStartDate) { showToast('End date cannot be before start date', 'error'); return; }
    try {
      setScheduleSaving(true);
      const res = await batchScheduleApi.saveOrUpdate({
        programId: scheduleProgramId,
        batchNumber: scheduleBatchNo,
        startDate: scheduleStartDate,
        endDate: scheduleEndDate,
      });
      if (res.success) {
        showToast(`Batch ${scheduleBatchNo} schedule saved successfully`, 'success');
        setScheduleDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save batch schedule', 'error');
    } finally {
      setScheduleSaving(false);
    }
  };

  const getAttendanceFillClass = (pct: number) => {
    if (pct < 50) return 'ba-attendance-bar-fill ba-attendance-bar-fill--low';
    if (pct < 75) return 'ba-attendance-bar-fill ba-attendance-bar-fill--mid';
    return 'ba-attendance-bar-fill';
  };

  const selectedProgram = allPrograms.find(p => p.programId === selectedProgramId);
  const batchOptions = getBatchOptions(selectedProgramId);
  const scheduleBatchOptions = getBatchOptions(scheduleProgramId);

  return (
    <Box className="ba-page">
      <Card className="ba-card">

        <Box className="ba-filter-section">
          <Box className="ba-filter-row">
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
              {batchNumbersForFilter.map(b => (
                <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>
              ))}
            </FilterSelect>
            <FilterSelect label="Status" value={filterStatus}
              onChange={v => { setFilterStatus(v); setPage(0); }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </FilterSelect>
            <Box className="ba-filter-spacer" />
            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              onClick={openScheduleManager}
              className="ba-secondary-button"
            >
              Manage Batch Dates
            </Button>
            <Button
              variant="contained"
              startIcon={<GroupAddIcon />}
              onClick={openBulkDialog}
              className="ba-add-button"
            >
              Allocate Candidates
            </Button>
          </Box>
        </Box>

        <Box className="ba-separator" />

        <Box className="ba-table-section">
          {loading ? (
            <Box className="ba-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="ba-empty-text">Loading allocations...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="ba-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="ba-table-head-row">
                      <TableCell className="ba-table-head-cell">Candidate</TableCell>
                      <TableCell className="ba-table-head-cell">Program</TableCell>
                      <TableCell className="ba-table-head-cell">Batch</TableCell>
                      <TableCell className="ba-table-head-cell">Batch Dates</TableCell>
                      <TableCell className="ba-table-head-cell">Attendance</TableCell>
                      <TableCell className="ba-table-head-cell">Performance</TableCell>
                      <TableCell className="ba-table-head-cell">Status</TableCell>
                      <TableCell className="ba-table-head-cell ba-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="ba-empty-cell">
                          <PersonIcon className="ba-empty-icon" />
                          <Typography className="ba-empty-text">No allocations found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((alloc, idx) => (
                      <TableRow
                        key={alloc.studentId}
                        hover
                        className={`ba-table-row ${idx % 2 === 0 ? 'ba-table-row--even' : 'ba-table-row--odd'}`}
                      >
                        <TableCell className="ba-table-cell">
                          <Box className="ba-name-cell">
                            <Box className="ba-name-icon-box">
                              <PersonIcon className="ba-name-icon" />
                            </Box>
                            <Box>
                              <Typography className="ba-row-primary">
                                {alloc.candidateName || `Candidate #${alloc.candidateId}`}
                              </Typography>
                              <Typography className="ba-row-secondary">
                                {alloc.department || alloc.candidateEmail || `Student #${alloc.studentId}`}
                              </Typography>
                              {alloc.transferredFromStudentId && (
                                <Chip label="Transferred" size="small" variant="outlined"
                                  sx={{ fontSize: '10px', height: 18, mt: 0.3, borderColor: 'var(--color-warning)', color: 'var(--color-warning)', fontWeight: 600 }} />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell className="ba-table-cell">
                          <Typography className="ba-row-secondary">{getProgramName(alloc.programId)}</Typography>
                        </TableCell>
                        <TableCell className="ba-table-cell">
                          <Chip label={`Batch ${alloc.batchNumber}`} size="small" variant="outlined" className="ba-batch-chip" />
                        </TableCell>
                        <TableCell className="ba-table-cell">
                          {(() => {
                            const sched = getBatchSchedule(alloc.programId, alloc.batchNumber);
                            return sched ? (
                              <Box>
                                <Typography className="ba-row-secondary">{formatDate(sched.startDate)}</Typography>
                                <Typography className="ba-row-secondary">{formatDate(sched.endDate)}</Typography>
                              </Box>
                            ) : (
                              <Typography className="ba-row-secondary" sx={{ color: 'var(--color-warning) !important' }}>Not set</Typography>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="ba-table-cell">
                          <Box className="ba-attendance-wrap">
                            <Box className="ba-attendance-bar-bg">
                              <Box
                                className={getAttendanceFillClass(Number(alloc.attendancePercentage))}
                                style={{ width: `${Math.min(Number(alloc.attendancePercentage), 100)}%` }}
                              />
                            </Box>
                            <Typography className="ba-row-secondary">
                              {Number(alloc.attendancePercentage).toFixed(1)}%
                            </Typography>
                          </Box>
                          {alloc.overallWeightedScore != null && (
                            <Typography className="ba-row-secondary" sx={{ fontSize: 'var(--text-xs)', mt: 0.5, color:
                              Number(alloc.overallWeightedScore) >= 70 ? 'var(--color-success)' :
                              Number(alloc.overallWeightedScore) >= 50 ? 'var(--color-warning)' : 'var(--color-error)'
                            }}>
                              Score: {Number(alloc.overallWeightedScore).toFixed(1)}%
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell className="ba-table-cell">
                          {alloc.performance ? (
                            <Chip
                              label={alloc.performance.replace('_', ' ')}
                              size="small"
                              variant="outlined"
                              className={PERFORMANCE_CLASS[alloc.performance] ?? 'ba-performance-chip'}
                            />
                          ) : (
                            <Typography className="ba-row-secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell className="ba-table-cell">
                          <Chip
                            label={alloc.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            variant="outlined"
                            className={alloc.isActive ? 'ba-status-chip--active' : 'ba-status-chip--inactive'}
                          />
                        </TableCell>
                        <TableCell className="ba-table-cell ba-table-cell--actions">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" className="ba-action-button" title="Edit Allocation"
                              onClick={e => openEditAlloc(alloc, e)}>
                              <EditIcon className="ba-action-icon" />
                            </IconButton>
                            {alloc.isActive && (
                              <IconButton size="small" className="ba-action-button" title="Transfer to Another Batch"
                                onClick={e => openTransferDialog(alloc, e)}>
                                <TransferIcon className="ba-action-icon" />
                              </IconButton>
                            )}
                            <IconButton size="small" className="ba-action-button" title="Mark Project Ready"
                              onClick={e => handleMarkReady(alloc.studentId, e)}>
                              <CheckCircleIcon className="ba-action-icon" />
                            </IconButton>
                            <IconButton size="small" className="ba-action-button" title="Deactivate"
                              onClick={e => handleDeactivate(alloc.studentId, e)}>
                              <DeleteIcon className="ba-action-icon" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="ba-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* ── Allocate Candidates Dialog ── */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="ba-dialog-title">
          Allocate Candidates to Batch
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>

            {/* Step 1 — Select Program */}
            <TextField
              select
              label="Select Program *"
              size="small"
              fullWidth
              value={selectedProgramId || ''}
              onChange={e => handleProgramSelect(Number(e.target.value))}
              className="ba-dialog-field"
            >
              {yearPrograms.length === 0 && <MenuItem disabled value="">No programs found</MenuItem>}
              {yearPrograms.filter(p => p.status === true).map(p => (
                <MenuItem key={p.programId} value={p.programId}>
                  {p.programName} ({p.programYear})
                </MenuItem>
              ))}
            </TextField>

            {/* Step 2 — Candidates with per-candidate batch selection */}
            {selectedProgramId > 0 && (
              <Box className="ba-candidate-section">
                <Box className="ba-candidate-section-header">
                  <Typography className="ba-candidate-section-title">
                    JOINED Candidates — {selectedProgram?.programName}
                    {selectedCandidateIds.size > 0 && (
                      <span className="ba-selected-count"> — {selectedCandidateIds.size} selected</span>
                    )}
                  </Typography>
                  <TextField
                    placeholder="Search by name, email, department..."
                    size="small"
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="ba-candidate-search"
                  />
                </Box>

                {loadingCandidates ? (
                  <Box className="ba-loading-candidates">
                    <CircularProgress size={24} sx={{ color: 'var(--color-primary)' }} />
                    <Typography className="ba-empty-text">Loading candidates...</Typography>
                  </Box>
                ) : candidates.length === 0 ? (
                  <Box className="ba-no-candidates">
                    <Typography className="ba-empty-text">
                      No JOINED candidates found for this program's hiring cycle.
                    </Typography>
                    <Typography className="ba-empty-text" sx={{ fontSize: 'var(--text-xs)', mt: 0.5 }}>
                      Go to the Joining Tracker tab and mark accepted candidates as Joined first.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Select All row */}
                    <Box className="ba-select-all-row">
                      <Checkbox
                        checked={filteredCandidates.length > 0 && selectedCandidateIds.size === filteredCandidates.length}
                        indeterminate={selectedCandidateIds.size > 0 && selectedCandidateIds.size < filteredCandidates.length}
                        onChange={toggleSelectAll}
                        size="small"
                        sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' } }}
                      />
                      <Typography className="ba-select-all-label">
                        Select All ({filteredCandidates.length})
                      </Typography>
                      {/* Bulk batch assign */}
                      {selectedCandidateIds.size > 0 && batchOptions.length > 1 && (
                        <Box className="ba-bulk-batch">
                          <Typography className="ba-bulk-batch-label">Assign all selected to:</Typography>
                          <TextField
                            select size="small"
                            className="ba-bulk-batch-select"
                            defaultValue=""
                            onChange={e => {
                              const batch = Number(e.target.value);
                              if (!batch) return;
                              setCandidateBatchMap(prev => {
                                const next = { ...prev };
                                selectedCandidateIds.forEach(id => { next[id] = batch; });
                                return next;
                              });
                            }}
                          >
                            <MenuItem value="">— Batch —</MenuItem>
                            {batchOptions.map(b => (
                              <MenuItem key={b} value={b}>Batch {b}</MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      )}
                    </Box>

                    {/* Candidate rows with per-candidate batch dropdown */}
                    <Box className="ba-candidate-table">
                      {filteredCandidates.map(c => (
                        <Box
                          key={c.candidateId}
                          className={`ba-candidate-row ${selectedCandidateIds.has(c.candidateId) ? 'ba-candidate-row--selected' : ''}`}
                          onClick={() => toggleCandidate(c.candidateId)}
                        >
                          <Checkbox
                            checked={selectedCandidateIds.has(c.candidateId)}
                            size="small"
                            onClick={e => e.stopPropagation()}
                            onChange={() => toggleCandidate(c.candidateId)}
                            sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' }, p: 0.5 }}
                          />
                          <Box className="ba-candidate-info">
                            <Typography className="ba-candidate-name">{c.firstName} {c.lastName}</Typography>
                            <Typography className="ba-candidate-meta">
                              {c.department || '—'} · CGPA {c.cgpa}
                            </Typography>
                          </Box>
                          <Chip
                            label={c.applicationStage}
                            size="small"
                            className={c.applicationStage === 'JOINED' ? 'ba-stage-chip--joined' : 'ba-stage-chip--offered'}
                          />
                          {/* Per-candidate batch dropdown */}
                          <TextField
                            select
                            size="small"
                            value={candidateBatchMap[c.candidateId] || 1}
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              e.stopPropagation();
                              setCandidateBatchMap(prev => ({
                                ...prev,
                                [c.candidateId]: Number(e.target.value),
                              }));
                            }}
                            className="ba-batch-select"
                          >
                            {batchOptions.map(b => (
                              <MenuItem key={b} value={b}>Batch {b}</MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDialogOpen(false)} className="ba-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkSubmit}
            disabled={bulkSubmitting || selectedCandidateIds.size === 0 || !selectedProgramId}
            className="ba-dialog-submit-btn"
          >
            {bulkSubmitting
              ? 'Allocating...'
              : `Allocate ${selectedCandidateIds.size > 0 ? `(${selectedCandidateIds.size})` : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Allocation Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="ba-dialog-title">Edit Allocation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Batch reassignment is allowed only before attendance or training scores are recorded. This prevents mixing batch history in a live project.
            </Typography>
            <TextField
              select label="Batch Number *" size="small" fullWidth
              value={editBatchNumber}
              onChange={e => setEditBatchNumber(Number(e.target.value))}
              className="ba-dialog-field"
              disabled={editBatchOptions.length === 0}
            >
              {editBatchOptions.map(b => (
                <MenuItem key={b} value={b}>Batch {b}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Performance" size="small" fullWidth
              value={editPerformance}
              onChange={e => setEditPerformance(e.target.value)}
              className="ba-dialog-field"
            >
              <MenuItem value="">— None —</MenuItem>
              <MenuItem value="EXCELLENT">Excellent</MenuItem>
              <MenuItem value="GOOD">Good</MenuItem>
              <MenuItem value="NEED_LEARNING">Need Learning</MenuItem>
              <MenuItem value="DROPPED">Dropped</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} className="ba-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={editSubmitting} className="ba-dialog-submit-btn">
            {editSubmitting ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Deactivate Confirmation Dialog */}
      <Dialog open={deactivateDialogOpen} onClose={() => setDeactivateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="ba-dialog-title">Deactivate Allocation</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to deactivate this student's allocation? They will no longer appear in attendance and scores.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeactivateDialogOpen(false)} className="ba-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={confirmDeactivate}
            sx={{ background: 'var(--color-error) !important', textTransform: 'none', fontWeight: 600 }}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
      {/* Batch Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="ba-dialog-title">
          Manage Batch Dates
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Batch dates are maintained once per batch, not per candidate. Select a program and batch, then save the shared start and end dates.
            </Typography>
            <TextField
              select label="Program *" size="small" fullWidth
              value={scheduleProgramId || ''}
              onChange={e => handleScheduleProgramChange(Number(e.target.value))}
              className="ba-dialog-field"
            >
              <MenuItem value="">— Select Program —</MenuItem>
              {yearPrograms.filter(p => p.status === true).map(p => (
                <MenuItem key={p.programId} value={p.programId}>{p.programName}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Batch *" size="small" fullWidth
              value={scheduleBatchNo || ''}
              disabled={!scheduleProgramId}
              onChange={e => handleScheduleBatchChange(Number(e.target.value))}
              className="ba-dialog-field"
            >
              <MenuItem value="">— Select Batch —</MenuItem>
              {scheduleBatchOptions.map(b => (
                <MenuItem key={b} value={b}>Batch {b}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Batch Start Date *" type="date" size="small" fullWidth
              value={scheduleStartDate}
              onChange={e => setScheduleStartDate(e.target.value)}
              disabled={!scheduleProgramId || !scheduleBatchNo}
              InputLabelProps={{ shrink: true }}
              className="ba-dialog-field"
            />
            <TextField
              label="Batch End Date *" type="date" size="small" fullWidth
              value={scheduleEndDate}
              onChange={e => setScheduleEndDate(e.target.value)}
              disabled={!scheduleProgramId || !scheduleBatchNo}
              inputProps={{ min: scheduleStartDate }}
              InputLabelProps={{ shrink: true }}
              className="ba-dialog-field"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setScheduleDialogOpen(false)} className="ba-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleSaveSchedule} disabled={scheduleSaving} className="ba-dialog-submit-btn">
            {scheduleSaving ? 'Saving...' : 'Save Batch Dates'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="ba-dialog-title">
          Transfer Candidate — {transferAlloc?.candidateName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ p: 1.5, background: 'var(--color-warning-bg)', borderRadius: 1, border: '1px solid var(--color-warning-border)' }}>
              <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)', fontWeight: 600 }}>
                ⚠ Transfer Rules
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)', mt: 0.5 }}>
                • Old allocation will be marked inactive — history is preserved.
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)' }}>
                • Attendance starts fresh from zero in the new batch.
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)' }}>
                • Overall score uses best score per course across all batches.
              </Typography>
              <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning-text)' }}>
                • This action cannot be undone.
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Current: <strong>{allPrograms.find(p => p.programId === transferAlloc?.programId)?.programName}</strong> · Batch {transferAlloc?.batchNumber}
            </Typography>

            <TextField
              select label="Target Program *" size="small" fullWidth
              value={transferProgramId || ''}
              onChange={e => { setTransferProgramId(Number(e.target.value)); setTransferBatchNumber(1); }}
              className="ba-dialog-field"
            >
              {allPrograms.filter(p => p.status === true).map(p => (
                <MenuItem key={p.programId} value={p.programId}>{p.programName} ({p.programYear})</MenuItem>
              ))}
            </TextField>

            <TextField
              select label="Target Batch *" size="small" fullWidth
              value={transferBatchNumber}
              onChange={e => setTransferBatchNumber(Number(e.target.value))}
              className="ba-dialog-field"
              disabled={!transferProgramId}
            >
              {getBatchOptions(transferProgramId).map(b => (
                <MenuItem
                  key={b} value={b}
                  disabled={transferProgramId === transferAlloc?.programId && b === transferAlloc?.batchNumber}
                >
                  Batch {b}{transferProgramId === transferAlloc?.programId && b === transferAlloc?.batchNumber ? ' (current)' : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Reason for Transfer *" size="small" fullWidth multiline rows={2}
              placeholder="e.g. Low performance in Batch 1, needs additional time"
              value={transferReason}
              onChange={e => setTransferReason(e.target.value)}
              inputProps={{ maxLength: 300 }}
              helperText={`${transferReason.length}/300`}
              className="ba-dialog-field"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferDialogOpen(false)} className="ba-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleTransferSubmit}
            disabled={transferSubmitting || !transferReason.trim()}
            className="ba-dialog-submit-btn"
          >
            {transferSubmitting ? 'Transferring...' : 'Transfer Candidate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchAllocationsList;
