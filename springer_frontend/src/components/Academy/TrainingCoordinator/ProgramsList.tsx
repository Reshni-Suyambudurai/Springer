import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableSkeleton } from '../../Common/TableSkeleton';
import {
  Box, Card, TextField, InputAdornment, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Tooltip,
} from '@mui/material';
import {
  School as SchoolIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { FigmaEditIcon as EditIcon, FigmaDeleteIcon as DeleteIcon, FigmaAddIcon as AddIcon, FigmaSearchIcon as SearchIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { trainingProgramApi } from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import type { TrainingProgramResponse, TrainingProgramRequest, AcademyContextProps, TrainingLocation } from '../../../types/Academy/academy.types';
import FilterSelect from '../../Common/FilterSelect';
import '../../../css/Academy/TrainingCoordinator/ProgramsList.css';

const ProgramsList = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, programs: ctxPrograms, onProgramsChanged, cycles = [] } = context;
  
  // Form template - now inside component where programYear is available
  const EMPTY_FORM: TrainingProgramRequest = {
    programName: '',
    programYear: programYear === 0 ? new Date().getFullYear() : programYear,
    capacity: 0,
    numberOfBatches: 1,
    location: '',
    cycleId: 0,
  };

  const LOCATION_OPTIONS: { value: TrainingLocation; label: string }[] = [
    { value: 'CHENNAI',    label: 'Chennai' },
    { value: 'BANGALORE',  label: 'Bangalore' },
    { value: 'HYDERABAD',  label: 'Hyderabad' },
    { value: 'PUNE',       label: 'Pune' },
    { value: 'MUMBAI',     label: 'Mumbai' },
    { value: 'DELHI',      label: 'Delhi' },
    { value: 'COIMBATORE', label: 'Coimbatore' },
    { value: 'REMOTE',     label: 'Remote' },
  ];

  const [programs, setPrograms] = useState<TrainingProgramResponse[]>(ctxPrograms);
  const [loading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterStatus, setFilterStatus] = useState('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<TrainingProgramResponse | null>(null);
  const [form, setForm] = useState<TrainingProgramRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProgram, setDeleteProgram] = useState<TrainingProgramResponse | null>(null);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ programId: number | null; field: 'capacity' | 'numberOfBatches' | null }>({ programId: null, field: null });
  const [editValue, setEditValue] = useState<string>('');

  // Sync from context whenever parent re-fetches
  useEffect(() => { setPrograms(ctxPrograms); }, [ctxPrograms]);

  const filtered = programs.filter((p) => {
    const name = (p.programName ?? '').toLowerCase();
    const loc  = (p.location ?? '').toLowerCase();
    const matchYear   = programYear === 0 || p.programYear === programYear;
    const matchSearch = name.includes(debouncedSearch.toLowerCase()) || loc.includes(debouncedSearch.toLowerCase());
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? p.status : !p.status);
    return matchYear && matchSearch && matchStatus;
  });

  const openCreate = () => {
    setEditProgram(null);
    setForm({ ...EMPTY_FORM, programYear });
    setErrors({});
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
      location: (program.location as TrainingLocation) || '',
      cycleId: program.cycleId,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validateProgramName = () => {
    const name = form.programName.trim();
    if (!name) {
      setErrors(prev => ({ ...prev, programName: 'Program name is required' }));
      return false;
    }
    if (name.length < 3) {
      setErrors(prev => ({ ...prev, programName: 'Must be at least 3 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, programName: '' }));
    return true;
  };

  const validateProgramYear = () => {
    if (!form.programYear || form.programYear < 2020) {
      setErrors(prev => ({ ...prev, programYear: 'Must be 2020 or later' }));
      return false;
    }
    setErrors(prev => ({ ...prev, programYear: '' }));
    return true;
  };

  const validateCapacity = () => {
    if (!form.capacity || form.capacity < 1) {
      setErrors(prev => ({ ...prev, capacity: 'Must be at least 1' }));
      return false;
    }
    setErrors(prev => ({ ...prev, capacity: '' }));
    return true;
  };

  const validateBatches = () => {
    if (!form.numberOfBatches || form.numberOfBatches < 1) {
      setErrors(prev => ({ ...prev, numberOfBatches: 'Must be at least 1' }));
      return false;
    }
    setErrors(prev => ({ ...prev, numberOfBatches: '' }));
    return true;
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isNameValid = validateProgramName();
    const isYearValid = validateProgramYear();
    const isCapacityValid = validateCapacity();
    const isBatchesValid = validateBatches();

    if (!form.location || !form.cycleId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!isNameValid || !isYearValid || !isCapacityValid || !isBatchesValid) {
      showToast('Please fix validation errors', 'error');
      return;
    }
    try {
      setSubmitting(true);
      if (editProgram) {
        const res = await trainingProgramApi.updateProgram(editProgram.programId, form);
        if (res.success) {
          showToast('Program updated successfully', 'success');
          setDialogOpen(false);
          onProgramsChanged?.();
        }
      } else {
        const res = await trainingProgramApi.createProgram(form);
        if (res.success) {
          showToast('Program created successfully', 'success');
          setDialogOpen(false);
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
        onProgramsChanged?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate program', 'error');
    }
  };

  const handleInlineEdit = (program: TrainingProgramResponse, field: 'capacity' | 'numberOfBatches') => {
    setEditingCell({ programId: program.programId, field });
    setEditValue(String(field === 'capacity' ? program.capacity : program.numberOfBatches));
  };

  const handleInlineSave = async () => {
    if (!editingCell.programId || !editingCell.field) return;
    const program = programs.find(p => p.programId === editingCell.programId);
    if (!program) return;

    const val = Number(editValue.trim());
    if (isNaN(val) || val < 1) {
      showToast(`${editingCell.field === 'capacity' ? 'Capacity' : 'Number of batches'} must be at least 1`, 'error');
      return;
    }

    try {
      const payload: TrainingProgramRequest = {
        programName: program.programName,
        programYear: program.programYear,
        capacity: editingCell.field === 'capacity' ? val : program.capacity,
        numberOfBatches: editingCell.field === 'numberOfBatches' ? val : program.numberOfBatches,
        location: program.location as TrainingLocation,
        cycleId: program.cycleId,
      };
      const res = await trainingProgramApi.updateProgram(program.programId, payload);
      if (res.success) {
        showToast('Updated successfully', 'success');
        onProgramsChanged?.();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setEditingCell({ programId: null, field: null });
    }
  };

  const handleInlineCancel = () => {
    setEditingCell({ programId: null, field: null });
    setEditValue('');
  };

  return (
    <Box className="prog-page">
      <Card className="prog-card">

        {/* Filters */}
        <Box className="prog-filter-section">
          <Box className="prog-filter-row">
            <TextField
              placeholder="Search by name or location..."
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
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
              label="Status"
              value={filterStatus}
              onChange={(v) => setFilterStatus(v)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </FilterSelect>

            <Box className="prog-filter-spacer" />
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

        {/* Table */}
        <Box className="prog-table-section">
          {loading ? (
            <TableSkeleton rows={5} columns={7} />
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
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="prog-empty-cell">
                          <SchoolIcon className="prog-empty-icon" />
                          <Typography className="prog-empty-text">No programs found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((prog, idx) => (
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

                          <TableCell className="prog-table-cell" onDoubleClick={() => handleInlineEdit(prog, 'numberOfBatches')}>
                            {editingCell.programId === prog.programId && editingCell.field === 'numberOfBatches' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setEditValue(val);
                                }}
                                onBlur={handleInlineSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleInlineSave();
                                  if (e.key === 'Escape') handleInlineCancel();
                                }}
                                autoFocus
                                size="small"
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                sx={{ width: 80, '& .MuiInputBase-root': { fontSize: 'var(--text-sm)' } }}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover .edit-hint': { opacity: 0.5 } }}>
                                <Typography className="prog-row-secondary">{prog.numberOfBatches}</Typography>
                                <EditIcon className="edit-hint" style={{ fontSize: 14, marginLeft: 4, opacity: 0, transition: 'opacity 0.2s' }} />
                              </Box>
                            )}
                          </TableCell>

                          <TableCell className="prog-table-cell" onDoubleClick={() => handleInlineEdit(prog, 'capacity')}>
                            {editingCell.programId === prog.programId && editingCell.field === 'capacity' ? (
                              <TextField
                                value={editValue}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '');
                                  setEditValue(val);
                                }}
                                onBlur={handleInlineSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleInlineSave();
                                  if (e.key === 'Escape') handleInlineCancel();
                                }}
                                autoFocus
                                size="small"
                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                sx={{ width: 80, '& .MuiInputBase-root': { fontSize: 'var(--text-sm)' } }}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover .edit-hint': { opacity: 0.5 } }}>
                                <Typography className="prog-row-secondary">{prog.capacity}</Typography>
                                <EditIcon className="edit-hint" style={{ fontSize: 14, marginLeft: 4, opacity: 0, transition: 'opacity 0.2s' }} />
                              </Box>
                            )}
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
            </>
          )}
        </Box>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="prog-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editProgram ? 'Edit Program' : 'Create Training Program'}
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Program Name *"
              size="small"
              fullWidth
              value={form.programName}
              onChange={(e) => setForm({ ...form, programName: e.target.value })}
              onBlur={validateProgramName}
              error={!!errors.programName}
              helperText={errors.programName || 'Enter a descriptive program name'}
              inputProps={{ maxLength: 100 }}
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
              onBlur={validateProgramYear}
              error={!!errors.programYear}
              helperText={errors.programYear || 'Year when the program starts (e.g., 2024)'}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="prog-dialog-field"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography component="label" sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Location *
              </Typography>
              <Tooltip 
                title="Physical location where the training program will be conducted. Select 'Remote' for online programs."
                arrow
                placement="top"
              >
                <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
              </Tooltip>
            </Box>
            <TextField
              select
              size="small"
              fullWidth
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value as TrainingLocation })}
              className="prog-dialog-field"
            >
              {LOCATION_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography component="label" sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Capacity *
              </Typography>
              <Tooltip 
                title="Total number of interns that can be accommodated in this program across all batches."
                arrow
                placement="top"
              >
                <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
              </Tooltip>
            </Box>
            <TextField
              size="small"
              fullWidth
              value={form.capacity === 0 ? '' : String(form.capacity)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, capacity: val ? Number(val) : 0 });
              }}
              onBlur={validateCapacity}
              error={!!errors.capacity}
              helperText={errors.capacity || 'Total number of interns in this program'}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="prog-dialog-field"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography component="label" sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Number of Batches *
              </Typography>
              <Tooltip 
                title="Interns will be divided into this many batches. Each batch will have separate schedules and courses."
                arrow
                placement="top"
              >
                <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
              </Tooltip>
            </Box>
            <TextField
              size="small"
              fullWidth
              value={form.numberOfBatches === 0 ? '' : String(form.numberOfBatches)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm({ ...form, numberOfBatches: val ? Number(val) : 0 });
              }}
              onBlur={validateBatches}
              error={!!errors.numberOfBatches}
              helperText={errors.numberOfBatches || 'How many batches to divide interns into'}
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
              {cycles.filter(c => c.status === 'OPEN').map((c) => (
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
        <DialogTitle className="prog-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Deactivate Program
          <IconButton size="small" onClick={() => setDeleteDialogOpen(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
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
