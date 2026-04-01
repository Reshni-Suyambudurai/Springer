import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, IconButton,
  CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as DemandIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { hiringDemandApi } from '../../../services/hiring.api';
import type { HiringDemandResponse } from '../../../types/TA_Recruiter/Hiring/hiringDemand.types';
import { showToast } from '../../../utils/toast';
import '../../../css/TA_Head/HiringCycle/HiringDemandDetails.css';

const buLabelMap: Record<string, string> = {
  DATA_ANALYTICS_AND_AI: 'Data Analytics & AI',
  SERVICENOW:            'ServiceNow',
  PRODUCT_ENGINEERING:   'Product Engineering',
};

const approvalStatusClassMap: Record<string, string> = {
  DRAFT:     'tah-hdd-status--draft',
  SUBMITTED: 'tah-hdd-status--submitted',
  APPROVED:  'tah-hdd-status--approved',
  REJECTED:  'tah-hdd-status--rejected',
};

type ActionType = 'APPROVED' | 'REJECTED';

const TAHiringDemandDetails = () => {
  const navigate = useNavigate();
  const { demandId } = useParams<{ demandId: string }>();
  const id = Number(demandId);

  const [demand, setDemand] = useState<HiringDemandResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionTarget, setActionTarget] = useState<ActionType | null>(null);
  const [actioning, setActioning] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await hiringDemandApi.getDemandById(id);
      if (res.success && res.data) setDemand(res.data);
      else setError(res.message || 'Failed to load demand.');
    } catch (err: any) {
      setError(err.message || 'Failed to load demand.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleAction = async () => {
    if (!actionTarget) return;
    setActioning(true);
    try {
      const res = await hiringDemandApi.updateDemand(id, {
        approvalStatus: actionTarget as any,
      });
      if (res.success) {
        showToast(
          actionTarget === 'APPROVED' ? 'Demand approved successfully.' : 'Demand rejected.',
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

  const canAction = demand?.approvalStatus === 'SUBMITTED';

  return (
    <Box className="tah-hdd-page">
      <Card className="tah-hdd-card">

        {/* Header */}
        <Box className="tah-hdd-header">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconButton
                size="small"
                className="tah-hdd-back-btn"
                onClick={() => navigate(`/ta-head/hiring-cycles/${demand?.cycleId}`)}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box className="tah-hdd-icon-box">
                <DemandIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
              </Box>
              <Stack>
                <Typography className="tah-hdd-title">
                  {loading ? 'Demand Details' : `${buLabelMap[demand?.businessUnit ?? ''] ?? demand?.businessUnit}`}
                </Typography>
                <Typography className="tah-hdd-subtitle">{demand?.cycleName ?? 'Hiring demand details'}</Typography>
              </Stack>
            </Stack>

            {!loading && !error && canAction && (
              <Stack direction="row" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RejectIcon sx={{ fontSize: '16px !important' }} />}
                  className="tah-hdd-reject-btn"
                  onClick={() => setActionTarget('REJECTED')}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ApproveIcon sx={{ fontSize: '16px !important' }} />}
                  className="tah-hdd-approve-btn"
                  onClick={() => setActionTarget('APPROVED')}
                >
                  Approve
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>

        <Box className="tah-hdd-separator" />

        {loading ? (
          <Box className="tah-hdd-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="tah-hdd-loading-text">Loading...</Typography>
          </Box>
        ) : error ? (
          <Box className="tah-hdd-alert-wrap"><Alert severity="error">{error}</Alert></Box>
        ) : demand && (
          <Box className="tah-hdd-body">

            {/* Demand Details */}
            <Box className="tah-hdd-section">
              <Box className="tah-hdd-section-header">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography className="tah-hdd-section-label">Demand Details</Typography>
                  <Chip
                    label={demand.approvalStatus}
                    size="small"
                    className={`tah-hdd-status-chip ${approvalStatusClassMap[demand.approvalStatus] ?? ''}`}
                  />
                </Stack>
                <Box className="tah-hdd-section-rule" />
              </Box>

              <Box className="tah-hdd-info-grid">
                <Box className="tah-hdd-info-field">
                  <Typography className="tah-hdd-info-label">Hiring Cycle</Typography>
                  <Typography className="tah-hdd-info-value">{demand.cycleName}</Typography>
                </Box>
                <Box className="tah-hdd-info-field">
                  <Typography className="tah-hdd-info-label">Business Unit</Typography>
                  <Typography className="tah-hdd-info-value">{buLabelMap[demand.businessUnit] ?? demand.businessUnit}</Typography>
                </Box>
                <Box className="tah-hdd-info-field">
                  <Typography className="tah-hdd-info-label">Demand Count</Typography>
                  <Typography className="tah-hdd-info-value">{demand.demandCount} positions</Typography>
                </Box>
                <Box className="tah-hdd-info-field">
                  <Typography className="tah-hdd-info-label">Compensation Band</Typography>
                  <Typography className="tah-hdd-info-value">{demand.compensationBand}</Typography>
                </Box>
                <Box className="tah-hdd-info-field">
                  <Typography className="tah-hdd-info-label">Raised By</Typography>
                  <Typography className="tah-hdd-info-value">{demand.createdByUsername}</Typography>
                </Box>
                <Box className="tah-hdd-info-field">
                  <Typography className="tah-hdd-info-label">Created On</Typography>
                  <Typography className="tah-hdd-info-value">
                    {new Date(demand.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Skills */}
            <Box className="tah-hdd-section" sx={{ mt: '24px' }}>
              <Box className="tah-hdd-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="tah-hdd-section-label">Required Skills</Typography>
                  <Chip label={demand.skills.length} size="small" className="tah-hdd-count-chip" />
                </Stack>
                <Box className="tah-hdd-section-rule" />
              </Box>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {demand.skills.length === 0 ? (
                  <Typography className="tah-hdd-empty-text">No skills added.</Typography>
                ) : demand.skills.map(s => (
                  <Chip key={s.skillId} label={s.skillName} size="small" className="tah-hdd-skill-chip" />
                ))}
              </Stack>
            </Box>

          </Box>
        )}
      </Card>

      {/* Approve / Reject Confirm Dialog */}
      <Dialog open={!!actionTarget} onClose={() => setActionTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {actionTarget === 'APPROVED' ? 'Approve Demand?' : 'Reject Demand?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            {actionTarget === 'APPROVED'
              ? `Approve the demand for "${buLabelMap[demand?.businessUnit ?? '']}" with ${demand?.demandCount} positions?`
              : `Reject the demand for "${buLabelMap[demand?.businessUnit ?? '']}"? The Hiring Manager will need to revise and resubmit.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" size="small" className="tah-hdd-dialog-cancel-btn" onClick={() => setActionTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            className={actionTarget === 'APPROVED' ? 'tah-hdd-dialog-approve-btn' : 'tah-hdd-dialog-reject-btn'}
            onClick={handleAction}
            disabled={actioning}
          >
            {actioning ? 'Processing...' : (actionTarget === 'APPROVED' ? 'Yes, Approve' : 'Yes, Reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TAHiringDemandDetails;
