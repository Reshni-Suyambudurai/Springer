import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, InputAdornment, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon,
  School as SchoolIcon, Edit as EditIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { trainingProgramApi } from '../../../services/academy.api';
import { hiringCycleApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import type { TrainingProgramResponse, TrainingProgramRequest, AcademyContextProps } from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import FilterSelect from '../../Common/FilterSelect';
import '../../../css/Academy/TrainingCoordinator/ProgramsList.css';

const ProgramsList = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, onProgramsChanged } = context;
  
  // Form template - now inside component where programYear is available
  const EMPTY_FORM: TrainingProgramRequest = {
    programName: '',
    programYear: programYear === 0 ? new Date().getFullYear() : programYear,
    capacity: 0,
    numberOfBatches: 1,
    location: '',
    cycleId: 0,
  };

  const [programs, setPrograms] = useState<TrainingProgramResponse[]>([]);
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCycle, setFilterCycle] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<TrainingProgramResponse | null>(null);
  const [form, setForm] = useState<TrainingProgramRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProgram, setDeleteProgram] = useState<TrainingProgramResponse | null>(null);

  useEffect(() => {
    fetchData();
  }, [programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, cycleRes] = await Promise.all([
        trainingProgramApi.getAllPrograms(),
        hiringCycleApi.getAllCycles(),
      ]);
      if (progRes.success && progRes.data) setPrograms(progRes.data);
      if (cycleRes.success && cycleRes.data) setCycles(cycleRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load programs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = programs.filter((p) => {
    const name = (p.programName ?? '').toLowerCase();
    const loc  = (p.location ?? '').toLowerCase();
    const matchYear   = programYear === 0 || p.programYear === programYear;
    const matchSearch = name.includes(search.toLowerCase()) || loc.includes(search.toLowerCase());
    const matchCycle  = filterCycle === 'all' || String(p.cycleId) === filterCycle;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? p.status : !p.status);
    return matchYear && matchSearch && matchCycle && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openCreate = () => {
    setEditProgram(null);
    setForm({ ...EMPTY_FORM, programYear });
    setDialogOpen(true);
  };

  const openEdit = (program: TrainingProgramResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditProgram(program);
    setForm({
      programName: program.programName,
      programYear: program.programYear,
      capacity: program.capacity,
      numberOfBatches: program.numberOfBatches,
      location: program.location,
      cycleId: program.cycleId,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.programName.trim() || !form.cycleId || !form.location.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!form.programYear || form.programYear < 2020) {
      showToast('Please enter a valid program year (2020 or later)', 'error');
      return;
    }
    if (!form.capacity || form.capacity < 1) {
      showToast('Capacity must be at least 1', 'error');
      return;
    }
    if (!form.numberOfBatches || form.numberOfBatches < 1) {
      showToast('Number of batches must be at least 1', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editProgram) {
        const res = await trainingProgramApi.updateProgram(editProgram.programId, form);
        if (res.success) {
          showToast('Program updated successfully', 'success');
          setDialogOpen(false);
          fetchData();
          onProgramsChanged?.();
        }
      } else {
        const res = await trainingProgramApi.createProgram(form);
        if (res.success) {
          showToast('Program created successfully', 'success');
          setDialogOpen(false);
          fetchData();
          onProgramsChanged?.();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (program: TrainingProgramResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteProgram(program);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteProgram) return;
    try {
      const res = await trainingProgramApi.deleteProgram(deleteProgram.programId);
      if (res.success) {
        showToast('Program deactivated successfully', 'success');
        setDeleteDialogOpen(false);
        fetchData();
        onProgramsChanged?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate program', 'error');
    }
  };

  return (
    <Box className="prog-page">
      <Card className="prog-card">

        {/* Header */}
        <Box className="prog-header">
          <Box className="prog-header-row">
            <Box>
              <Typography className="prog-title">Training Programs</Typography>
              <Typography className="prog-subtitle">
                Manage training programs linked to hiring cycles
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
              className="prog-add-button"
            >
              Add Program
            </Button>
          </Box>
        </Box>

        <Box className="prog-separator" />

        {/* Filters */}
        <Box className="prog-filter-section">
          <Box className="prog-filter-row">
            <TextField
              placeholder="Search by name or location..."
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="prog-search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" className="prog-search-icon" />
                  </InputAdornment>
                ),
              }}
            />

            <FilterSelect
              label="Cycle"
              value={filterCycle}
              onChange={(v) => { setFilterCycle(v); setPage(0); }}
            >
              <MenuItem value="all">All Cycles</MenuItem>
              {cycles.map((c) => (
                <MenuItem key={c.cycleId} value={String(c.cycleId)}>
                  {c.cycleName}
                </MenuItem>
              ))}
            </FilterSelect>

            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setPage(0); }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </FilterSelect>

            <Box className="prog-filter-spacer" />
          </Box>
        </Box>

        <Box className="prog-separator" />

        {/* Table */}
        <Box className="prog-table-section">
          {loading ? (
            <Box className="prog-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="prog-empty-text">Loading programs...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="prog-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="prog-table-head-row">
                      <TableCell className="prog-table-head-cell">Program</TableCell>
                      <TableCell className="prog-table-head-cell">Year</TableCell>
                      <TableCell className="prog-table-head-cell">Location</TableCell>
                      <TableCell className="prog-table-head-cell">Batches</TableCell>
                      <TableCell className="prog-table-head-cell">Capacity</TableCell>
                      <TableCell className="prog-table-head-cell">Status</TableCell>
                      <TableCell className="prog-table-head-cell prog-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="prog-empty-cell">
                          <SchoolIcon className="prog-empty-icon" />
                          <Typography className="prog-empty-text">No programs found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((prog, idx) => (
                        <TableRow
                          key={prog.programId}
                          hover
                          className={`prog-table-row ${idx % 2 === 0 ? 'prog-table-row--even' : 'prog-table-row--odd'}`}
                        >
                          <TableCell className="prog-table-cell">
                            <Box className="prog-name-cell">
                              <Box className="prog-name-icon-box">
                                <SchoolIcon className="prog-name-icon" />
                              </Box>
                              <Box>
                                <Typography className="prog-row-primary">{prog.programName}</Typography>
                                <Typography className="prog-row-secondary">
                                  {cycles.find(c => c.cycleId === prog.cycleId)?.cycleName ?? `Cycle ${prog.cycleId}`}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell className="prog-table-cell">
                            <Typography className="prog-row-secondary">{prog.programYear}</Typography>
                          </TableCell>

                          <TableCell className="prog-table-cell">
                            <Typography className="prog-row-secondary">{prog.location}</Typography>
                          </TableCell>

                          <TableCell className="prog-table-cell">
                            <Typography className="prog-row-secondary">{prog.numberOfBatches}</Typography>
                          </TableCell>

                          <TableCell className="prog-table-cell">
                            <Typography className="prog-row-secondary">{prog.capacity}</Typography>
                          </TableCell>

                          <TableCell className="prog-table-cell">
                            <Chip
                              label={prog.status ? 'Active' : 'Inactive'}
                              size="small"
                              variant="outlined"
                              className={prog.status ? 'prog-status-chip--active' : 'prog-status-chip--inactive'}
                            />
                          </TableCell>

                          <TableCell className="prog-table-cell prog-table-cell--actions">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <IconButton
                                size="small"
                                className="prog-action-button"
                                title="Edit Program"
                                onClick={(e) => openEdit(prog, e)}
                              >
                                <EditIcon className="prog-action-icon" />
                              </IconButton>
                              <IconButton
                                size="small"
                                className="prog-action-button"
                                title="Deactivate Program"
                                onClick={(e) => handleDelete(prog, e)}
                              >
                                <DeleteIcon className="prog-action-icon" />
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
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="prog-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="prog-dialog-title">
          {editProgram ? 'Edit Program' : 'Create Training Program'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Program Name *"
              size="small"
              fullWidth
              value={form.programName}
              onChange={(e) => setForm({ ...form, programName: e.target.value })}
              className="prog-dialog-field"
            />
            <TextField
              label="Program Year *"
              size="small"
              fullWidth
              inputMode="numeric"
              value={form.programYear === 0 ? '' : String(form.programYear)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, programYear: val ? Number(val) : 0 });
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="prog-dialog-field"
            />
            <TextField
              label="Location *"
              size="small"
              fullWidth
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              className="prog-dialog-field"
            />
            <TextField
              label="Capacity *"
              size="small"
              fullWidth
              value={form.capacity === 0 ? '' : String(form.capacity)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, capacity: val ? Number(val) : 0 });
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="prog-dialog-field"
            />
            <TextField
              label="Number of Batches *"
              size="small"
              fullWidth
              value={form.numberOfBatches === 0 ? '' : String(form.numberOfBatches)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, numberOfBatches: val ? Number(val) : 0 });
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="prog-dialog-field"
            />
            <TextField
              select
              label="Hiring Cycle *"
              size="small"
              fullWidth
              value={form.cycleId || ''}
              onChange={(e) => setForm({ ...form, cycleId: Number(e.target.value) })}
              className="prog-dialog-field"
            >
              {cycles.map((c) => (
                <MenuItem key={c.cycleId} value={c.cycleId}>
                  {c.cycleName} ({c.cycleYear})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} className="prog-dialog-cancel-btn">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            className="prog-dialog-submit-btn"
          >
            {submitting ? 'Saving...' : editProgram ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="prog-dialog-title">Deactivate Program</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to deactivate <strong>{deleteProgram?.programName}</strong>? This will mark it as inactive.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} className="prog-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={confirmDelete}
            sx={{ background: 'var(--color-error) !important', textTransform: 'none', fontWeight: 600 }}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProgramsList;
