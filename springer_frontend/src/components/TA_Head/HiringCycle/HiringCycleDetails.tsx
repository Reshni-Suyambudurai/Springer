import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, IconButton,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TextField,
} from '@mui/material';
import {
  Loop as CycleIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { hiringCycleApi, hiringDemandApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { HiringDemandResponse } from '../../../types/TA_Recruiter/Hiring/hiringDemand.types';
import { showToast } from '../../../utils/toast';
import '../../../css/TA_Head/HiringCycle/HiringCycleDetails.css';

const buLabelMap: Record<string, string> = {
  DATA_ANALYTICS_AND_AI: 'Data Analytics & AI',
  SERVICENOW:            'ServiceNow',
  PRODUCT_ENGINEERING:   'Product Engineering',
};

const approvalStatusClassMap: Record<string, string> = {
  DRAFT:     'tah-hcd-status--draft',
  SUBMITTED: 'tah-hcd-status--submitted',
  APPROVED:  'tah-hcd-status--approved',
  REJECTED:  'tah-hcd-status--rejected',
};

type ActionType = 'APPROVED' | 'REJECTED';

const TAHiringCycleDetails = () => {
  const navigate = useNavigate();
  const { cycleId } = useParams<{ cycleId: string }>();
  const id = Number(cycleId);

  const [cycle, setCycle] = useState<HiringCycleResponse | null>(null);
  const [demands, setDemands] = useState<HiringDemandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Approve/Reject dialog
  const [actionTarget, setActionTarget] = useState<{ demand: HiringDemandResponse; action: ActionType } | null>(null);
  const [actioning, setActioning] = useState(false);

  // Edit cycle dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ cycleYear: '', cycleName: '', compensationBand: '', budget: '' });
  const [editSaving, setEditSaving] = useState(false);

  const handleEditSave = async () => {
    if (!editForm.cycleName.trim()) return showToast('Cycle name is required', 'error');
    if (!editForm.cycleYear || isNaN(Number(editForm.cycleYear))) return showToast('Valid year is required', 'error');
    setEditSaving(true);
    try {
      const res = await hiringCycleApi.updateCycle(id, {
        cycleYear: Number(editForm.cycleYear),
        cycleName: editForm.cycleName,
        compensationBand: editForm.compensationBand ? Number(editForm.compensationBand) : undefined,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
      });
      if (res.success) {
        showToast('Cycle updated successfully', 'success');
        setEditOpen(false);
        await load();
      } else showToast(res.message || 'Failed to update', 'error');
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const [cycleRes, demandsRes] = await Promise.all([
        hiringCycleApi.getCycleById(id),
        hiringDemandApi.getAllDemands({ cycleId: id }),
      ]);
      if (cycleRes.success && cycleRes.data) setCycle(cycleRes.data);
      else setError(cycleRes.message || 'Failed to load cycle.');
      if (demandsRes.success && demandsRes.data) setDemands(demandsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cycle details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async () => {
    if (!actionTarget) return;
    setActioning(true);
    try {
      const res = await hiringDemandApi.updateDemand(actionTarget.demand.demandId, {
        approvalStatus: actionTarget.action as any,
      });
      if (res.success) {
        showToast(
          actionTarget.action === 'APPROVED'
            ? 'Demand approved successfully.'
            : 'Demand rejected.',
          'success'
        );
        setActionTarget(null);
        await load();
      } else {
        showToast(res.message || 'Action failed.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setActioning(false);
    }
  };

  // Summary counts
  const submittedCount = demands.filter(d => d.approvalStatus === 'SUBMITTED').length;
  const approvedCount  = demands.filter(d => d.approvalStatus === 'APPROVED').length;
  const rejectedCount  = demands.filter(d => d.approvalStatus === 'REJECTED').length;
  const draftCount     = demands.filter(d => d.approvalStatus === 'DRAFT').length;

  return (
    <Box className="tah-hcd-page">
      <Card className="tah-hcd-card">

        {/* Header */}
        <Box className="tah-hcd-header">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconButton
                size="small"
                className="tah-hcd-back-btn"
                onClick={() => navigate('/ta-head/hiring-cycles')}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box className="tah-hcd-icon-box">
                <CycleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
              </Box>
              <Stack>
                <Typography className="tah-hcd-title">
                  {loading ? 'Cycle Details' : (cycle?.cycleName ?? 'Cycle Details')}
                </Typography>
                <Typography className="tah-hcd-subtitle">Review and approve hiring demands</Typography>
              </Stack>
            </Stack>
            {!loading && cycle && (
              <Chip
                label={cycle.status}
                size="small"
                className={cycle.status === 'OPEN' ? 'tah-hcd-cycle-status--open' : 'tah-hcd-cycle-status--closed'}
              />
            )}
          </Stack>
        </Box>

        <Box className="tah-hcd-separator" />

        {loading ? (
          <Box className="tah-hcd-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="tah-hcd-loading-text">Loading...</Typography>
          </Box>
        ) : error ? (
          <Box className="tah-hcd-alert-wrap"><Alert severity="error">{error}</Alert></Box>
        ) : cycle && (
          <Box className="tah-hcd-body">

            {/* Cycle Info */}
            <Box className="tah-hcd-section">
              <Box className="tah-hcd-section-header">
                <Typography className="tah-hcd-section-label">Cycle Information</Typography>
                <Box className="tah-hcd-section-rule" />
              </Box>
              <Box className="tah-hcd-info-grid">
                <Box className="tah-hcd-info-field">
                  <Typography className="tah-hcd-info-label">Cycle Name</Typography>
                  <Typography className="tah-hcd-info-value">{cycle.cycleName}</Typography>
                </Box>
                <Box className="tah-hcd-info-field">
                  <Typography className="tah-hcd-info-label">Year</Typography>
                  <Typography className="tah-hcd-info-value">{cycle.cycleYear}</Typography>
                </Box>
                <Box className="tah-hcd-info-field">
                  <Typography className="tah-hcd-info-label">Budget</Typography>
                  <Typography className="tah-hcd-info-value">
                    {cycle.budget ? `₹ ${cycle.budget.toLocaleString('en-IN')}` : '—'}
                  </Typography>
                </Box>
                <Box className="tah-hcd-info-field">
                  <Typography className="tah-hcd-info-label">Compensation Band</Typography>
                  <Typography className="tah-hcd-info-value">
                    {cycle.compensationBand ? `Band ${cycle.compensationBand}` : '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Demand Summary Strip */}
            {demands.length > 0 && (
              <Box className="tah-hcd-summary-strip">
                <Box className="tah-hcd-summary-item">
                  <Typography className="tah-hcd-summary-count">{demands.length}</Typography>
                  <Typography className="tah-hcd-summary-label">Total</Typography>
                </Box>
                <Box className="tah-hcd-summary-divider" />
                <Box className="tah-hcd-summary-item">
                  <Typography className="tah-hcd-summary-count tah-hcd-summary-count--submitted">{submittedCount}</Typography>
                  <Typography className="tah-hcd-summary-label">Pending Review</Typography>
                </Box>
                <Box className="tah-hcd-summary-divider" />
                <Box className="tah-hcd-summary-item">
                  <Typography className="tah-hcd-summary-count tah-hcd-summary-count--approved">{approvedCount}</Typography>
                  <Typography className="tah-hcd-summary-label">Approved</Typography>
                </Box>
                <Box className="tah-hcd-summary-divider" />
                <Box className="tah-hcd-summary-item">
                  <Typography className="tah-hcd-summary-count tah-hcd-summary-count--rejected">{rejectedCount}</Typography>
                  <Typography className="tah-hcd-summary-label">Rejected</Typography>
                </Box>
                <Box className="tah-hcd-summary-divider" />
                <Box className="tah-hcd-summary-item">
                  <Typography className="tah-hcd-summary-count tah-hcd-summary-count--draft">{draftCount}</Typography>
                  <Typography className="tah-hcd-summary-label">Draft</Typography>
                </Box>
              </Box>
            )}

            {/* Demands Table */}
            <Box className="tah-hcd-section" sx={{ mt: '24px' }}>
              <Box className="tah-hcd-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="tah-hcd-section-label">Hiring Demands</Typography>
                  {demands.length > 0 && (
                    <Chip label={demands.length} size="small" className="tah-hcd-count-chip" />
                  )}
                </Stack>
                <Box className="tah-hcd-section-rule" />
              </Box>

              {demands.length === 0 ? (
                <Box className="tah-hcd-empty">
                  <Typography className="tah-hcd-empty-text">No demands raised for this cycle yet.</Typography>
                </Box>
              ) : (
                <TableContainer className="tah-hcd-table-container">
                  <Table>
                    <TableHead>
                      <TableRow className="tah-hcd-head-row">
                        <TableCell className="tah-hcd-head-cell">Business Unit</TableCell>
                        <TableCell className="tah-hcd-head-cell">Count</TableCell>
                        <TableCell className="tah-hcd-head-cell">Compensation Band</TableCell>
                        <TableCell className="tah-hcd-head-cell">Skills</TableCell>
                        <TableCell className="tah-hcd-head-cell">Raised By</TableCell>
                        <TableCell className="tah-hcd-head-cell">Status</TableCell>
                        <TableCell className="tah-hcd-head-cell tah-hcd-head-cell--actions">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demands.map((demand, idx) => (
                        <TableRow
                          key={demand.demandId}
                          className={`tah-hcd-row ${idx % 2 === 0 ? 'tah-hcd-row--even' : 'tah-hcd-row--odd'}`}
                        >
                          <TableCell className="tah-hcd-cell">
                            <Typography className="tah-hcd-cell-primary">
                              {buLabelMap[demand.businessUnit] ?? demand.businessUnit}
                            </Typography>
                          </TableCell>
                          <TableCell className="tah-hcd-cell">
                            <Typography className="tah-hcd-cell-secondary">{demand.demandCount}</Typography>
                          </TableCell>
                          <TableCell className="tah-hcd-cell">
                            <Typography className="tah-hcd-cell-secondary">{demand.compensationBand}</Typography>
                          </TableCell>
                          <TableCell className="tah-hcd-cell">
                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                              {demand.skills.slice(0, 3).map(s => (
                                <Chip key={s.skillId} label={s.skillName} size="small" className="tah-hcd-skill-chip" />
                              ))}
                              {demand.skills.length > 3 && (
                                <Chip label={`+${demand.skills.length - 3}`} size="small" className="tah-hcd-skill-chip" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell className="tah-hcd-cell">
                            <Typography className="tah-hcd-cell-secondary">{demand.createdByUsername}</Typography>
                          </TableCell>
                          <TableCell className="tah-hcd-cell">
                            <Chip
                              label={demand.approvalStatus}
                              size="small"
                              className={`tah-hcd-status-chip ${approvalStatusClassMap[demand.approvalStatus] ?? ''}`}
                            />
                          </TableCell>
                          <TableCell className="tah-hcd-cell tah-hcd-cell--actions">
                            <Stack direction="row" justifyContent="flex-end" gap={0.5}>
                              <IconButton
                                size="small"
                                title="View Demand"
                                className="tah-hcd-view-btn"
                                onClick={() => navigate(`/ta-head/hiring-demands/${demand.demandId}`)}
                              >
                                <OpenInNewIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                              {demand.approvalStatus === 'SUBMITTED' && (
                                <>
                                  <IconButton
                                    size="small"
                                    title="Approve"
                                    className="tah-hcd-approve-btn"
                                    onClick={() => setActionTarget({ demand, action: 'APPROVED' })}
                                  >
                                    <ApproveIcon sx={{ fontSize: 19 }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    title="Reject"
                                    className="tah-hcd-reject-btn"
                                    onClick={() => setActionTarget({ demand, action: 'REJECTED' })}
                                  >
                                    <RejectIcon sx={{ fontSize: 19 }} />
                                  </IconButton>
                                </>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        )}
      </Card>

      {/* Edit Cycle Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Edit Hiring Cycle
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} sx={{ mt: 1 }}>
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
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setEditOpen(false)}
            sx={{ textTransform: 'none', color: 'var(--color-grey-550)', borderColor: 'var(--color-grey-350)' }}>
            Cancel
          </Button>
          <Button variant="contained" size="small" onClick={handleEditSave} disabled={editSaving}
            sx={{ textTransform: 'none', backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-dark)' } }}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve / Reject Confirm Dialog */}
      <Dialog open={!!actionTarget} onClose={() => setActionTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {actionTarget?.action === 'APPROVED' ? 'Approve Demand?' : 'Reject Demand?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            {actionTarget?.action === 'APPROVED'
              ? `Approve the demand for "${buLabelMap[actionTarget?.demand.businessUnit ?? '']}" with ${actionTarget?.demand.demandCount} positions?`
              : `Reject the demand for "${buLabelMap[actionTarget?.demand.businessUnit ?? '']}"? The Hiring Manager will need to revise and resubmit.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            className="tah-hcd-dialog-cancel-btn"
            onClick={() => setActionTarget(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            className={actionTarget?.action === 'APPROVED' ? 'tah-hcd-dialog-approve-btn' : 'tah-hcd-dialog-reject-btn'}
            onClick={handleAction}
            disabled={actioning}
          >
            {actioning ? 'Processing...' : (actionTarget?.action === 'APPROVED' ? 'Yes, Approve' : 'Yes, Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TAHiringCycleDetails;
