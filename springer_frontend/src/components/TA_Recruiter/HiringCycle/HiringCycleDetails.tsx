import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  DateRange as CycleIcon,
  FileUpload as UploadIcon,
  FileDownload as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../../Common/BackButton';
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
                startIcon={<UploadIcon />}
                className="t-btn-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : (cycle.hasJd ? 'Update JD' : 'Upload JD')}
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
    </Box>
  );
};

export default TARHiringCycleDetails;
