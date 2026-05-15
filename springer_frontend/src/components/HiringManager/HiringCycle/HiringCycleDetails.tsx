import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Chip,
  CircularProgress, Alert, Button, IconButton,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import {
  Loop as CycleIcon,
  ArrowBack as ArrowBackIcon,
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { FigmaAddIcon as AddIcon } from '../../Common/FigmaIcons';
import { useNavigate, useParams } from 'react-router-dom';
import { hiringCycleApi } from '../../../services/hiring.api';
import { hiringDemandApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { HiringDemandResponse } from '../../../types/TA_Recruiter/Hiring/hiringDemand.types';
import '../../../css/HiringManager/HiringCycle/HiringCycleDetails.css';

const approvalStatusClassMap: Record<string, string> = {
  DRAFT:     'hcd-status-chip hcd-status--draft',
  SUBMITTED: 'hcd-status-chip hcd-status--submitted',
  APPROVED:  'hcd-status-chip hcd-status--approved',
  REJECTED:  'hcd-status-chip hcd-status--rejected',
};

const buLabelMap: Record<string, string> = {
  DATA_ANALYTICS_AND_AI: 'Data Analytics & AI',
  SERVICENOW:            'ServiceNow',
  PRODUCT_ENGINEERING:   'Product Engineering',
};

const HiringCycleDetails = () => {
  const navigate = useNavigate();
  const { cycleId } = useParams<{ cycleId: string }>();
  const id = Number(cycleId);

  const [cycle, setCycle] = useState<HiringCycleResponse | null>(null);
  const [demands, setDemands] = useState<HiringDemandResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, [id]);

  const handleDownloadJd = async () => {
    try {
      const blob = await hiringCycleApi.downloadJd(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiring-cycle-${id}-jd.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { }
  };

  return (
    <Box className="hcd-page">
      <Card className="hcd-card">

        {/* Header */}
        <Box className="hcd-header">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconButton
                size="small"
                className="hcd-back-btn"
                onClick={() => navigate('/hiring-manager/hiring-cycles')}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box className="hcd-icon-box">
                <CycleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
              </Box>
              <Stack>
                <Typography className="hcd-title">
                  {loading ? 'Cycle Details' : (cycle?.cycleName ?? 'Cycle Details')}
                </Typography>
                <Typography className="hcd-subtitle">Hiring cycle details and demands</Typography>
              </Stack>
            </Stack>

            {!loading && !error && cycle && (
              <Stack direction="row" gap={1}>
                {cycle.hasJd && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
                    className="hcd-download-btn"
                    onClick={handleDownloadJd}
                  >
                    Download JD
                  </Button>
                )}
                {cycle.status === 'OPEN' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon style={{ fontSize: '16px' }} />}
                    className="hcd-add-btn"
                    onClick={() => navigate(`/hiring-manager/hiring-demands/add?cycleId=${id}`)}
                  >
                    Add Demand
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box className="hcd-separator" />

        {loading ? (
          <Box className="hcd-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="hcd-loading-text">Loading...</Typography>
          </Box>
        ) : error ? (
          <Box className="hcd-alert-wrap"><Alert severity="error">{error}</Alert></Box>
        ) : cycle && (
          <Box className="hcd-body">

            {/* Cycle Info Section */}
            <Box className="hcd-section">
              <Box className="hcd-section-header">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography className="hcd-section-label">Cycle Information</Typography>
                  <Chip
                    label={cycle.status}
                    size="small"
                    className={cycle.status === 'OPEN' ? 'hcd-cycle-status--open' : 'hcd-cycle-status--closed'}
                  />
                </Stack>
                <Box className="hcd-section-rule" />
              </Box>

              <Box className="hcd-info-grid">
                <Box className="hcd-info-field">
                  <Typography className="hcd-info-label">Cycle Name</Typography>
                  <Typography className="hcd-info-value">{cycle.cycleName}</Typography>
                </Box>
                <Box className="hcd-info-field">
                  <Typography className="hcd-info-label">Year</Typography>
                  <Typography className="hcd-info-value">{cycle.cycleYear}</Typography>
                </Box>
                <Box className="hcd-info-field">
                  <Typography className="hcd-info-label">Budget</Typography>
                  <Typography className="hcd-info-value">
                    {cycle.budget ? `â‚¹ ${cycle.budget.toLocaleString('en-IN')}` : 'â€”'}
                  </Typography>
                </Box>
                <Box className="hcd-info-field">
                  <Typography className="hcd-info-label">Compensation Band</Typography>
                  <Typography className="hcd-info-value">
                    {cycle.compensationBand ? `Band ${cycle.compensationBand}` : 'â€”'}
                  </Typography>
                </Box>
                <Box className="hcd-info-field">
                  <Typography className="hcd-info-label">Created On</Typography>
                  <Typography className="hcd-info-value">
                    {new Date(cycle.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Box className="hcd-info-field">
                  <Typography className="hcd-info-label">JD</Typography>
                  <Typography className="hcd-info-value">{cycle.hasJd ? 'Available' : 'Not uploaded'}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Demands Section */}
            <Box className="hcd-section" sx={{ mt: '24px' }}>
              <Box className="hcd-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="hcd-section-label">Hiring Demands</Typography>
                  {demands.length > 0 && (
                    <Chip label={demands.length} size="small" className="hcd-count-chip" />
                  )}
                </Stack>
                <Box className="hcd-section-rule" />
              </Box>

              {demands.length === 0 ? (
                <Box className="hcd-empty">
                  <Typography className="hcd-empty-text">No demands raised for this cycle yet.</Typography>
                  {cycle.status === 'OPEN' && (
                    <Typography className="hcd-empty-hint">
                      Click "Add Demand" to raise a hiring demand.
                    </Typography>
                  )}
                </Box>
              ) : (
                <TableContainer className="hcd-table-container">
                  <Table>
                    <TableHead>
                      <TableRow className="hcd-head-row">
                        <TableCell className="hcd-head-cell">Business Unit</TableCell>
                        <TableCell className="hcd-head-cell">Demand Count</TableCell>
                        <TableCell className="hcd-head-cell">Compensation Band</TableCell>
                        <TableCell className="hcd-head-cell">Skills</TableCell>
                        <TableCell className="hcd-head-cell">Status</TableCell>
                        <TableCell className="hcd-head-cell">Raised By</TableCell>
                        <TableCell className="hcd-head-cell">Created On</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demands.map((demand, idx) => (
                        <TableRow
                          key={demand.demandId}
                          hover
                          onClick={() => navigate(`/hiring-manager/hiring-demands/${demand.demandId}`)}
                          className={`hcd-row ${idx % 2 === 0 ? 'hcd-row--even' : 'hcd-row--odd'}`}
                        >
                          <TableCell className="hcd-cell">
                            <Typography className="hcd-cell-primary">
                              {buLabelMap[demand.businessUnit] ?? demand.businessUnit}
                            </Typography>
                          </TableCell>
                          <TableCell className="hcd-cell">
                            <Typography className="hcd-cell-secondary">{demand.demandCount}</Typography>
                          </TableCell>
                          <TableCell className="hcd-cell">
                            <Typography className="hcd-cell-secondary">{demand.compensationBand}</Typography>
                          </TableCell>
                          <TableCell className="hcd-cell">
                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                              {demand.skills.slice(0, 3).map(s => (
                                <Chip key={s.skillId} label={s.skillName} size="small" className="hcd-skill-chip" />
                              ))}
                              {demand.skills.length > 3 && (
                                <Chip label={`+${demand.skills.length - 3}`} size="small" className="hcd-skill-chip" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell className="hcd-cell">
                            <Chip
                              label={demand.approvalStatus}
                              size="small"
                              className={approvalStatusClassMap[demand.approvalStatus] ?? 'hcd-status-chip'}
                            />
                          </TableCell>
                          <TableCell className="hcd-cell">
                            <Typography className="hcd-cell-secondary">{demand.createdByUsername}</Typography>
                          </TableCell>
                          <TableCell className="hcd-cell">
                            <Typography className="hcd-cell-secondary">
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
    </Box>
  );
};

export default HiringCycleDetails;
