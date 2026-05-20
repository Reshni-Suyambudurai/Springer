import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TextField,
} from '@mui/material';
import {
  Loop as CycleIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
} from '@mui/icons-material';
import { FigmaEditIcon as EditIcon, FigmaAddIcon as AddIcon } from '../../Common/FigmaIcons';
import { useNavigate } from 'react-router-dom';
import { hiringCycleApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import { showToast } from '../../../utils/toast';
import type { AppError } from '../../../services/api.error';
import { useNavbarAction } from '../../../contexts/NavbarActionContext';
import '../../../css/TA_Head/HiringCycle/HiringCycleList.css';

const TAHiringCycleList = () => {
  const navigate = useNavigate();
  const { setAction } = useNavbarAction();

  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toggle state
  const [toggleTarget, setToggleTarget] = useState<HiringCycleResponse | null>(null);
  const [toggling, setToggling] = useState(false);

  // Edit state
  const [editTarget, setEditTarget] = useState<HiringCycleResponse | null>(null);
  const [editForm, setEditForm] = useState({ cycleYear: '', cycleName: '', compensationBand: '', budget: '' });
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (cycle: HiringCycleResponse) => {
    setEditForm({
      cycleYear: String(cycle.cycleYear),
      cycleName: cycle.cycleName,
      compensationBand: cycle.compensationBand ? String(cycle.compensationBand) : '',
      budget: cycle.budget ? String(cycle.budget) : '',
    });
    setEditTarget(cycle);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    if (!editForm.cycleName.trim()) return showToast('Cycle name is required', 'error');
    if (!editForm.cycleYear || isNaN(Number(editForm.cycleYear))) return showToast('Valid year is required', 'error');
    setEditSaving(true);
    try {
      const res = await hiringCycleApi.updateCycle(editTarget.cycleId, {
        cycleYear: Number(editForm.cycleYear),
        cycleName: editForm.cycleName,
        compensationBand: editForm.compensationBand ? Number(editForm.compensationBand) : undefined,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
      });
      if (res.success) {
        showToast('Cycle updated successfully', 'success');
        setEditTarget(null);
        await load();
      } else showToast(res.message || 'Failed to update', 'error');
    } catch (err: unknown) {
      showToast((err as AppError).message || 'Failed to update', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // Create cycle dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ cycleYear: '', cycleName: '', compensationBand: '', budget: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hiringCycleApi.getAllCycles();
      if (res.success && res.data) setCycles(res.data);
      else setError(res.message || 'Failed to load hiring cycles.');
    } catch (err: unknown) {
      setError((err as AppError).message || 'Failed to load hiring cycles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setAction({ label: 'New Cycle', onClick: () => setCreateOpen(true), icon: <AddIcon /> });
    return () => setAction(null);
  }, [setAction]);

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const res = await hiringCycleApi.toggleCycleStatus(toggleTarget.cycleId);
      if (res.success) {
        showToast(`Cycle ${res.data?.status === 'OPEN' ? 'activated' : 'closed'} successfully.`, 'success');
        await load();
      } else {
        showToast(res.message || 'Failed to toggle status.', 'error');
      }
    } catch (err: unknown) {
      showToast((err as AppError).message || 'Failed to toggle status.', 'error');
    } finally {
      setToggling(false);
      setToggleTarget(null);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!form.cycleYear || isNaN(Number(form.cycleYear))) errors.cycleYear = 'Valid year is required.';
    if (!form.cycleName.trim()) errors.cycleName = 'Cycle name is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setCreating(true);
    try {
      const res = await hiringCycleApi.createCycle({
        cycleYear: Number(form.cycleYear),
        cycleName: form.cycleName,
        compensationBand: form.compensationBand ? Number(form.compensationBand) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
      });
      if (res.success) {
        showToast('Hiring cycle created successfully.', 'success');
        setCreateOpen(false);
        setForm({ cycleYear: '', cycleName: '', compensationBand: '', budget: '' });
        await load();
      } else {
        showToast(res.message || 'Failed to create cycle.', 'error');
      }
    } catch (err: unknown) {
      showToast((err as AppError).message || 'Failed to create cycle.', 'error');
    } finally {
      setCreating(false);
    }
  };



  return (
    <Box className="tah-hcl-page">
      <Card className="tah-hcl-card">

        {/* Table */}
        <Box className="tah-hcl-table-section">
          {loading ? (
            <Box className="tah-hcl-loading">
              <CircularProgress size={28} className="t-spinner" />
              <Typography className="tah-hcl-loading-text">Loading hiring cycles...</Typography>
            </Box>
          ) : error ? (
            <Box className="tah-hcl-alert-wrap"><Alert severity="error">{error}</Alert></Box>
          ) : (
            <>
              <TableContainer className="tah-hcl-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="tah-hcl-head-row">
                      <TableCell className="tah-hcl-head-cell">Cycle Name</TableCell>
                      <TableCell className="tah-hcl-head-cell">Year</TableCell>
                      <TableCell className="tah-hcl-head-cell">Budget</TableCell>
                      <TableCell className="tah-hcl-head-cell">Compensation Band</TableCell>
                      <TableCell className="tah-hcl-head-cell">Status</TableCell>
                      <TableCell className="tah-hcl-head-cell">Created On</TableCell>
                      <TableCell className="tah-hcl-head-cell tah-hcl-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cycles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" className="tah-hcl-empty-cell">
                          <CycleIcon className="tah-hcl-empty-icon" />
                          <Typography className="tah-hcl-empty-text">No hiring cycles found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cycles.map((cycle, idx) => (
                        <TableRow
                          key={cycle.cycleId}
                          hover
                          onClick={() => navigate(`/ta-head/hiring-cycles/${cycle.cycleId}`)}
                          className={`tah-hcl-row ${idx % 2 === 0 ? 'tah-hcl-row--even' : 'tah-hcl-row--odd'}`}
                        >
                          <TableCell className="tah-hcl-cell">
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Box className="tah-hcl-name-icon-box">
                                <CycleIcon className="tah-hcl-row-icon" />
                              </Box>
                              <Typography className="tah-hcl-cell-primary">{cycle.cycleName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell className="tah-hcl-cell">
                            <Typography className="tah-hcl-cell-secondary">{cycle.cycleYear}</Typography>
                          </TableCell>
                          <TableCell className="tah-hcl-cell">
                            <Typography className="tah-hcl-cell-secondary">
                              {cycle.budget ? `₹ ${cycle.budget.toLocaleString('en-IN')}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="tah-hcl-cell">
                            <Typography className="tah-hcl-cell-secondary">
                              {cycle.compensationBand ? `Band ${cycle.compensationBand}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="tah-hcl-cell">
                            <Chip
                              label={cycle.status}
                              size="small"
                              className={cycle.status === 'OPEN' ? 'tah-hcl-status--open' : 'tah-hcl-status--closed'}
                            />
                          </TableCell>
                          <TableCell className="tah-hcl-cell">
                            <Typography className="tah-hcl-cell-secondary">
                              {new Date(cycle.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell className="tah-hcl-cell tah-hcl-cell--actions">
                            <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                            
                              <IconButton
                                size="small"
                                className="tah-hcl-action-btn"
                                title="Edit Cycle"
                                onClick={(e) => { e.stopPropagation(); openEdit(cycle); }}
                              >
                                <EditIcon className="tah-hcl-action-icon" />
                              </IconButton>
                              <IconButton
                                size="small"
                                className={cycle.status === 'OPEN' ? 'tah-hcl-deactivate-btn' : 'tah-hcl-activate-btn'}
                                title={cycle.status === 'OPEN' ? 'Close Cycle' : 'Open Cycle'}
                                onClick={(e) => { e.stopPropagation(); setToggleTarget(cycle); }}
                              >
                                {cycle.status === 'OPEN'
                                  ? <DeactivateIcon className="tah-hcl-action-icon" />
                                  : <ActivateIcon className="tah-hcl-action-icon" />}
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

      {/* Edit Cycle Dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="tah-dialog-title">Edit Hiring Cycle</DialogTitle>
        <DialogContent>
          <Stack gap={2} className="tah-dialog-form">
            <TextField label="Cycle Year *" size="small" fullWidth type="number"
              value={editForm.cycleYear} onChange={(e) => setEditForm(p => ({ ...p, cycleYear: e.target.value }))} />
            <TextField label="Cycle Name *" size="small" fullWidth
              value={editForm.cycleName} onChange={(e) => setEditForm(p => ({ ...p, cycleName: e.target.value }))} />
            <TextField label="Compensation Band" size="small" fullWidth type="number"
              value={editForm.compensationBand} onChange={(e) => setEditForm(p => ({ ...p, compensationBand: e.target.value }))} />
            <TextField label="Budget (₹)" size="small" fullWidth type="number"
              value={editForm.budget} onChange={(e) => setEditForm(p => ({ ...p, budget: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions className="tah-dialog-actions">
          <Button variant="outlined" size="small" className="tah-hcl-cancel-btn" onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" size="small" className="tah-hcl-add-btn" onClick={handleEditSave} disabled={editSaving}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toggle Confirm Dialog */}
      <Dialog open={!!toggleTarget} onClose={() => setToggleTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="tah-dialog-title">
          {toggleTarget?.status === 'OPEN' ? 'Close Cycle?' : 'Open Cycle?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="tah-dialog-text">
            {toggleTarget?.status === 'OPEN'
              ? `"${toggleTarget?.cycleName}" will be closed. No new demands can be raised.`
              : `"${toggleTarget?.cycleName}" will be reopened for new demands.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions className="tah-dialog-actions">
          <Button variant="outlined" size="small" className="tah-hcl-cancel-btn" onClick={() => setToggleTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            className={toggleTarget?.status === 'OPEN' ? 'tah-hcl-close-btn' : 'tah-hcl-open-btn'}
            onClick={handleToggle}
            disabled={toggling}
          >
            {toggling ? 'Updating...' : (toggleTarget?.status === 'OPEN' ? 'Yes, Close' : 'Yes, Open')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Cycle Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="tah-dialog-title">New Hiring Cycle</DialogTitle>
        <DialogContent>
          <Stack gap={2} className="tah-dialog-form">
            <TextField
              label="Cycle Year *"
              size="small"
              fullWidth
              type="number"
              value={form.cycleYear}
              onChange={(e) => setForm(p => ({ ...p, cycleYear: e.target.value }))}
              error={!!formErrors.cycleYear}
              helperText={formErrors.cycleYear}
            />
            <TextField
              label="Cycle Name *"
              size="small"
              fullWidth
              value={form.cycleName}
              onChange={(e) => setForm(p => ({ ...p, cycleName: e.target.value }))}
              error={!!formErrors.cycleName}
              helperText={formErrors.cycleName}
            />
            <TextField
              label="Compensation Band"
              size="small"
              fullWidth
              type="number"
              value={form.compensationBand}
              onChange={(e) => setForm(p => ({ ...p, compensationBand: e.target.value }))}
            />
            <TextField
              label="Budget (₹)"
              size="small"
              fullWidth
              type="number"
              value={form.budget}
              onChange={(e) => setForm(p => ({ ...p, budget: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions className="tah-dialog-actions">
          <Button variant="outlined" size="small" className="tah-hcl-cancel-btn" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" size="small" className="tah-hcl-add-btn" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Cycle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TAHiringCycleList;
