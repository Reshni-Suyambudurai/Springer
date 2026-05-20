import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Stack, Chip,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
  CircularProgress, Alert, IconButton,
} from '@mui/material';
import {
  Loop as CycleIcon,
 
  FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { hiringCycleApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import '../../../css/HiringManager/HiringCycle/HiringCycleList.css';

const statusClassMap: Record<string, string> = {
  OPEN: 'hcl-status-chip hcl-status--open',
  CLOSED: 'hcl-status-chip hcl-status--closed',
};

const HiringCycleList = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await hiringCycleApi.getAllCycles();
      if (res.success && res.data) {
        setCycles(res.data);
      } else {
        setError(res.message || 'Failed to load hiring cycles.');
      }
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to load hiring cycles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDownloadJd = async (e: React.MouseEvent, cycleId: number) => {
    e.stopPropagation();
    try {
      const blob = await hiringCycleApi.downloadJd(cycleId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hiring-cycle-${cycleId}-jd.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent fail
    }
  };



  return (
    <Box className="hcl-page">
      <Card className="hcl-card">

        {/* Table */}
        <Box className="hcl-table-section">
          {loading ? (
            <Box className="hcl-loading">
              <CircularProgress size={28} className="t-spinner" />
              <Typography className="hcl-loading-text">Loading hiring cycles...</Typography>
            </Box>
          ) : error ? (
            <Box className="hcl-alert-wrap">
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
            <>
              <TableContainer className="hcl-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="hcl-head-row">
                      <TableCell className="hcl-head-cell">Cycle Name</TableCell>
                      <TableCell className="hcl-head-cell">Year</TableCell>
                      <TableCell className="hcl-head-cell">Budget</TableCell>
                      <TableCell className="hcl-head-cell">Compensation Band</TableCell>
                      <TableCell className="hcl-head-cell">JD</TableCell>
                      <TableCell className="hcl-head-cell">Status</TableCell>
                      <TableCell className="hcl-head-cell">Created On</TableCell>
                     
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cycles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" className="hcl-empty-cell">
                          <CycleIcon className="hcl-empty-icon" />
                          <Typography className="hcl-empty-text">No hiring cycles found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cycles.map((cycle, idx) => (
                        <TableRow
                          key={cycle.cycleId}
                          hover
                          onClick={() => navigate(`/hiring-manager/hiring-cycles/${cycle.cycleId}`)}
                          className={`hcl-row ${idx % 2 === 0 ? 'hcl-row--even' : 'hcl-row--odd'}`}
                        >
                          <TableCell className="hcl-cell">
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Box className="hcl-name-icon-box">
                                <CycleIcon className="hcl-row-icon" />
                              </Box>
                              <Typography className="hcl-cell-primary">{cycle.cycleName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell className="hcl-cell">
                            <Typography className="hcl-cell-secondary">{cycle.cycleYear}</Typography>
                          </TableCell>
                          <TableCell className="hcl-cell">
                            <Typography className="hcl-cell-secondary">
                              {cycle.budget ? `₹ ${cycle.budget.toLocaleString('en-IN')}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="hcl-cell">
                            <Typography className="hcl-cell-secondary">
                              {cycle.compensationBand ? `Band ${cycle.compensationBand}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="hcl-cell">
                            {cycle.hasJd ? (
                              <IconButton
                                size="small"
                                className="hcl-action-btn"
                                title="Download JD"
                                onClick={(e) => handleDownloadJd(e, cycle.cycleId)}
                              >
                                <DownloadIcon className="hcl-action-icon" />
                              </IconButton>
                            ) : (
                              <Typography className="hcl-cell-muted">No JD</Typography>
                            )}
                          </TableCell>
                          <TableCell className="hcl-cell">
                            <Chip
                              label={cycle.status}
                              size="small"
                              className={statusClassMap[cycle.status] ?? 'hcl-status-chip'}
                            />
                          </TableCell>
                          <TableCell className="hcl-cell">
                            <Typography className="hcl-cell-secondary">
                              {new Date(cycle.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </Typography>
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
    </Box>
  );
};

export default HiringCycleList;
