import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, IconButton,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Loop as CycleIcon,
  ArrowBack as ArrowBackIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { hiringCycleApi, hiringDemandApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { HiringDemandResponse } from '../../../types/TA_Recruiter/Hiring/hiringDemand.types';
import { showToast } from '../../../utils/toast';
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
  const [uploading, setUploading] = useState(false);

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
        // TA Recruiter sees only APPROVED demands
        setDemands(demandsRes.data.filter(d => d.approvalStatus === 'APPROVED'));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cycle details.');
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

  const handleUploadJd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await hiringCycleApi.updateCycle(id, { jd: file });
      if (res.success) {
        showToast('JD uploaded successfully.', 'success');
        await load();
      } else {
        showToast(res.message || 'Failed to upload JD.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload JD.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalPositions = demands.reduce((sum, d) => sum + d.demandCount, 0);

  return (
    <Box className="tar-hcd-page">
      <Card className="tar-hcd-card">

        {/* Header */}
        <Box className="tar-hcd-header">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconButton
                size="small"
                className="tar-hcd-back-btn"
                onClick={() => navigate('/ta-recruiter/hiring-cycles')}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box className="tar-hcd-icon-box">
                <CycleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
              </Box>
              <Stack>
                <Typography className="tar-hcd-title">
                  {loading ? 'Cycle Details' : (cycle?.cycleName ?? 'Cycle Details')}
                </Typography>
                <Typography className="tar-hcd-subtitle">Approved demands ready for execution</Typography>
              </Stack>
            </Stack>

            {!loading && cycle && (
              <Stack direction="row" gap={1} alignItems="center">
                <Chip
                  label={cycle.status}
                  size="small"
                  className={cycle.status === 'OPEN' ? 'tar-hcd-cycle-status--open' : 'tar-hcd-cycle-status--closed'}
                />
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                    className="tar-hcd-upload-btn"
                    onClick={() => navigate(`/ta-recruiter/drive-schedules/add?cycleId=${id}`)}
                  >
                    Create Drive
                  </Button>
                {cycle.hasJd && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />}
                    className="tar-hcd-download-btn"
                    onClick={handleDownloadJd}
                  >
                    Download JD
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleUploadJd}
                />
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<UploadIcon sx={{ fontSize: '16px !important' }} />}
                  className="tar-hcd-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : (cycle.hasJd ? 'Update JD' : 'Upload JD')}
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>

        <Box className="tar-hcd-separator" />

        {loading ? (
          <Box className="tar-hcd-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="tar-hcd-loading-text">Loading...</Typography>
          </Box>
        ) : error ? (
          <Box className="tar-hcd-alert-wrap"><Alert severity="error">{error}</Alert></Box>
        ) : cycle && (
          <Box className="tar-hcd-body">

            {/* Cycle Info */}
            <Box className="tar-hcd-section">
              <Box className="tar-hcd-section-header">
                <Typography className="tar-hcd-section-label">Cycle Information</Typography>
                <Box className="tar-hcd-section-rule" />
              </Box>
              <Box className="tar-hcd-info-grid">
                <Box className="tar-hcd-info-field">
                  <Typography className="tar-hcd-info-label">Cycle Name</Typography>
                  <Typography className="tar-hcd-info-value">{cycle.cycleName}</Typography>
                </Box>
                <Box className="tar-hcd-info-field">
                  <Typography className="tar-hcd-info-label">Year</Typography>
                  <Typography className="tar-hcd-info-value">{cycle.cycleYear}</Typography>
                </Box>
                <Box className="tar-hcd-info-field">
                  <Typography className="tar-hcd-info-label">Budget</Typography>
                  <Typography className="tar-hcd-info-value">
                    {cycle.budget ? `₹ ${cycle.budget.toLocaleString('en-IN')}` : '—'}
                  </Typography>
                </Box>
                <Box className="tar-hcd-info-field">
                  <Typography className="tar-hcd-info-label">Total Approved Positions</Typography>
                  <Typography className="tar-hcd-info-value">{totalPositions}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Approved Demands Table */}
            <Box className="tar-hcd-section" sx={{ mt: '24px' }}>
              <Box className="tar-hcd-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="tar-hcd-section-label">Approved Demands</Typography>
                  {demands.length > 0 && (
                    <Chip label={demands.length} size="small" className="tar-hcd-count-chip" />
                  )}
                </Stack>
                <Box className="tar-hcd-section-rule" />
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
                      <TableRow className="tar-hcd-head-row">
                        <TableCell className="tar-hcd-head-cell">Business Unit</TableCell>
                        <TableCell className="tar-hcd-head-cell">Positions</TableCell>
                        <TableCell className="tar-hcd-head-cell">Compensation Band</TableCell>
                        <TableCell className="tar-hcd-head-cell">Required Skills</TableCell>
                        <TableCell className="tar-hcd-head-cell">Raised By</TableCell>
                        <TableCell className="tar-hcd-head-cell">Created On</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demands.map((demand, idx) => (
                        <TableRow
                          key={demand.demandId}
                          className={`tar-hcd-row ${idx % 2 === 0 ? 'tar-hcd-row--even' : 'tar-hcd-row--odd'}`}
                        >
                          <TableCell className="tar-hcd-cell">
                            <Typography className="tar-hcd-cell-primary">
                              {buLabelMap[demand.businessUnit] ?? demand.businessUnit}
                            </Typography>
                          </TableCell>
                          <TableCell className="tar-hcd-cell">
                            <Typography className="tar-hcd-cell-secondary">{demand.demandCount}</Typography>
                          </TableCell>
                          <TableCell className="tar-hcd-cell">
                            <Typography className="tar-hcd-cell-secondary">{demand.compensationBand}</Typography>
                          </TableCell>
                          <TableCell className="tar-hcd-cell">
                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                              {demand.skills.slice(0, 3).map(s => (
                                <Chip key={s.skillId} label={s.skillName} size="small" className="tar-hcd-skill-chip" />
                              ))}
                              {demand.skills.length > 3 && (
                                <Chip label={`+${demand.skills.length - 3}`} size="small" className="tar-hcd-skill-chip" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell className="tar-hcd-cell">
                            <Typography className="tar-hcd-cell-secondary">{demand.createdByUsername}</Typography>
                          </TableCell>
                          <TableCell className="tar-hcd-cell">
                            <Typography className="tar-hcd-cell-secondary">
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

export default TARHiringCycleDetails;
