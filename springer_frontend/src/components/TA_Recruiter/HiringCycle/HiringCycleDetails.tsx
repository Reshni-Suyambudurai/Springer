import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton,
} from '@mui/material';
import {
  DateRange as CycleIcon,
  FileDownload as DownloadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../Common/BackButton';
import { hiringCycleApi, hiringDemandApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { HiringDemandResponse } from '../../../types/TA_Recruiter/Hiring/hiringDemand.types';
import { showToast } from '../../../utils/toast';
import type { AppError } from '../../../services/api.error';
import '../../../css/TA_Recruiter/HiringCycle/HiringCycleDetails.css';

const buLabelMap: Record<string, string> = {
  DATA_ANALYTICS_AND_AI: 'Data Analytics & AI',
  SERVICENOW:            'ServiceNow',
  PRODUCT_ENGINEERING:   'Product Engineering',
};

const TARHiringCycleDetails = () => {
  const navigate = useNavigate();
  const { cycleId } = useParams<{ cycleId: string }>();
  const id = Number(cycleId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cycle, setCycle] = useState<HiringCycleResponse | null>(null);
  const [demands, setDemands] = useState<HiringDemandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    cycleName: '',
    cycleYear: '',
    compensationBand: '',
    budget: '',
    totalIntake: '',
    jd: null as File | null,
  });

  const load = async () => {
    try {
      setLoading(true);
      const [cycleRes, demandsRes] = await Promise.all([
        hiringCycleApi.getCycleById(id),
        hiringDemandApi.getAllDemands({ cycleId: id }),
      ]);
      if (cycleRes.success && cycleRes.data) setCycle(cycleRes.data);
      else setError(cycleRes.message || 'Failed to load cycle.');
      if (demandsRes.success && demandsRes.data) {
        setDemands(demandsRes.data.filter(d => d.approvalStatus === 'APPROVED'));
      }
    } catch (err: unknown) {
      const error = err as AppError;
      setError(error.message || 'Failed to load cycle details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDownloadJd = async () => {
    try {
      const blob = await hiringCycleApi.downloadJd(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiring-cycle-${id}-jd.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { showToast('Failed to download JD.', 'error'); }
  };

  const handleEditOpen = () => {
    if (!cycle) return;
    setEditForm({
      cycleName: cycle.cycleName,
      cycleYear: String(cycle.cycleYear),
      compensationBand: cycle.compensationBand ? String(cycle.compensationBand) : '',
      budget: cycle.budget ? String(cycle.budget) : '',
      totalIntake: cycle.totalIntake ? String(cycle.totalIntake) : '',
      jd: null,
    });
    setEditOpen(true);
  };

  const handleEditClose = () => setEditOpen(false);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditJdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEditForm(prev => ({ ...prev, jd: file }));
  };

  const handleEditSubmit = async () => {
    setEditSubmitting(true);
    try {
      const res = await hiringCycleApi.updateCycle(id, {
        cycleName: editForm.cycleName || undefined,
        cycleYear: editForm.cycleYear ? Number(editForm.cycleYear) : undefined,
        compensationBand: editForm.compensationBand ? Number(editForm.compensationBand) : undefined,
        budget: editForm.budget ? Number(editForm.budget) : undefined,
        totalIntake: editForm.totalIntake ? Number(editForm.totalIntake) : undefined,
        jd: editForm.jd ?? undefined,
      });
      if (res.success) {
        showToast('Cycle updated successfully.', 'success');
        setEditOpen(false);
        await load();
      } else {
        showToast(res.message || 'Failed to update cycle.', 'error');
      }
    } catch (err: unknown) {
      const error = err as AppError;
      showToast(error.message || 'Failed to update cycle.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const totalPositions = demands.reduce((sum, d) => sum + d.demandCount, 0);

  return (
    <Box className="t-page">
      <Card className="t-card">

        {/* Header */}
        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BackButton onClick={() => navigate('/ta-recruiter/hiring-cycles')} variant="header" />
            <Box className="t-icon-box">
              <CycleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack>
              <Typography className="t-page-title">
                {loading ? 'Cycle Details' : (cycle?.cycleName ?? 'Cycle Details')}
              </Typography>
              <Typography className="t-page-subtitle">Approved demands ready for execution</Typography>
            </Stack>
          </Stack>

          {!loading && cycle && (
            <Stack direction="row" gap={1} alignItems="center">
              <Chip
                label={cycle.status}
                size="small"
                className={cycle.status === 'OPEN' ? 't-chip-success' : 't-chip-neutral'}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                className="t-btn-primary"
                onClick={() => navigate(`/ta-recruiter/drive-schedules/add?cycleId=${id}`)}
              >
                Create Drive
              </Button>
              {cycle.hasJd && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  className="t-btn-small"
                  onClick={handleDownloadJd}
                >
                  Download JD
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                startIcon={<EditIcon />}
                className="t-btn-primary"
                onClick={handleEditOpen}
              >
                Edit
              </Button>
            </Stack>
          )}
        </Box>

        <Box className="t-separator" />

        {loading ? (
          <Box className="t-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="t-loading-text">Loading...</Typography>
          </Box>
        ) : error ? (
          <Box className="tar-hcd-alert-wrap"><Alert severity="error">{error}</Alert></Box>
        ) : cycle && (
          <Box className="t-body">

            {/* Cycle Info */}
            <Box className="t-section-header">
              <Typography className="t-section-label">Cycle Information</Typography>
              <Box className="t-section-rule" />
            </Box>
            <Box className="t-info-grid">
              <Box className="t-info-field">
                <Typography className="t-info-label">Cycle Name</Typography>
                <Typography className="t-info-value">{cycle.cycleName}</Typography>
              </Box>
              <Box className="t-info-field">
                <Typography className="t-info-label">Year</Typography>
                <Typography className="t-info-value">{cycle.cycleYear}</Typography>
              </Box>
              <Box className="t-info-field">
                <Typography className="t-info-label">Budget</Typography>
                <Typography className="t-info-value">
                  {cycle.budget ? `₹ ${cycle.budget.toLocaleString('en-IN')}` : '—'}
                </Typography>
              </Box>
              <Box className="t-info-field">
                <Typography className="t-info-label">Total Intake</Typography>
                <Typography className="t-info-value">{cycle.totalIntake ?? '—'}</Typography>
              </Box>
              <Box className="t-info-field">
                <Typography className="t-info-label">Total Approved Positions</Typography>
                <Typography className="t-info-value">{totalPositions}</Typography>
              </Box>
            </Box>

            {/* Approved Demands Table */}
            <Box>
              <Box className="t-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="t-section-label">Approved Demands</Typography>
                  {demands.length > 0 && (
                    <Chip label={demands.length} size="small" className="t-chip-count" />
                  )}
                </Stack>
                <Box className="t-section-rule" />
              </Box>

              {demands.length === 0 ? (
                <Box className="tar-hcd-empty">
                  <Typography className="tar-hcd-empty-text">No approved demands for this cycle yet.</Typography>
                  <Typography className="tar-hcd-empty-hint">Demands need to be approved by TA Head before appearing here.</Typography>
                </Box>
              ) : (
                <TableContainer className="tar-hcd-table-container">
                  <Table>
                    <TableHead>
                      <TableRow className="t-head-row">
                        <TableCell className="t-head-cell">Business Unit</TableCell>
                        <TableCell className="t-head-cell">Positions</TableCell>
                        <TableCell className="t-head-cell">Compensation Band</TableCell>
                        <TableCell className="t-head-cell">Required Skills</TableCell>
                        <TableCell className="t-head-cell">Raised By</TableCell>
                        <TableCell className="t-head-cell">Created On</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demands.map((demand, idx) => (
                        <TableRow
                          key={demand.demandId}
                          className={`t-row ${idx % 2 === 0 ? 't-row--even' : 't-row--odd'}`}
                        >
                          <TableCell className="t-cell">
                            <Typography className="t-row-primary">
                              {buLabelMap[demand.businessUnit] ?? demand.businessUnit}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{demand.demandCount}</Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{demand.compensationBand}</Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                              {demand.skills.slice(0, 3).map(s => (
                                <Chip key={s.skillId} label={s.skillName} size="small" className="t-skill-chip" />
                              ))}
                              {demand.skills.length > 3 && (
                                <Chip label={`+${demand.skills.length - 3}`} size="small" className="t-skill-chip" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{demand.createdByUsername}</Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {new Date(demand.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </Typography>
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
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth classes={{ paper: 'tar-hcd-dialog' }}>
        <DialogTitle className="tar-hcd-dialog-title" component="div">
          <span>Edit Cycle Information</span>
          <IconButton className="tar-hcd-dialog-close" onClick={handleEditClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="tar-hcd-dialog-content">
          <TextField
            label="Cycle Name"
            name="cycleName"
            value={editForm.cycleName}
            onChange={handleEditChange}
            fullWidth
            size="small"
            className="tar-hcd-field"
          />
          <TextField
            label="Cycle Year"
            name="cycleYear"
            type="number"
            value={editForm.cycleYear}
            onChange={handleEditChange}
            fullWidth
            size="small"
            className="tar-hcd-field"
          />
          <TextField
            label="Compensation Band (₹)"
            name="compensationBand"
            type="number"
            value={editForm.compensationBand}
            onChange={handleEditChange}
            fullWidth
            size="small"
            className="tar-hcd-field"
          />
          <TextField
            label="Budget (₹)"
            name="budget"
            type="number"
            value={editForm.budget}
            onChange={handleEditChange}
            fullWidth
            size="small"
            className="tar-hcd-field"
          />
          <TextField
            label="Total Intake"
            name="totalIntake"
            type="number"
            value={editForm.totalIntake}
            onChange={handleEditChange}
            fullWidth
            size="small"
            className="tar-hcd-field"
          />
          <Box className="tar-hcd-jd-upload">
            <Typography className="tar-hcd-jd-label">Job Description (PDF)</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="tar-hcd-jd-input"
              onChange={handleEditJdChange}
            />
            {editForm.jd && (
              <Typography className="tar-hcd-jd-name">{editForm.jd.name}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="tar-hcd-dialog-actions">
          <Button variant="outlined" className="t-btn-outlined-primary" onClick={handleEditClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            className="t-btn-primary"
            onClick={handleEditSubmit}
            disabled={editSubmitting}
          >
            {editSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TARHiringCycleDetails;
