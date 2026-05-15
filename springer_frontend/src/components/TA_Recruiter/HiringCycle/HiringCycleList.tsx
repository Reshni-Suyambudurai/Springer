import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert,
} from '@mui/material';
import {
  DateRange as CycleIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { hiringCycleApi } from '../../../services/hiring.api';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import '../../../css/TA_Recruiter/HiringCycle/HiringCycleList.css';

const TARHiringCycleList = () => {
  const navigate = useNavigate();
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await hiringCycleApi.getAllCycles();
        if (res.success && res.data) setCycles(res.data);
        else setError(res.message || 'Failed to load hiring cycles.');
      } catch (err: any) {
        setError(err.message || 'Failed to load hiring cycles.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);



  return (
    <Box className="t-page">
      <Card className="t-card">

        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box className="t-icon-box">
              <CycleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack>
              <Typography className="t-page-title">Hiring Cycles</Typography>
              <Typography className="t-page-subtitle">View cycles and approved demands for execution</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className="t-separator" />

        <Box className="t-table-section">
          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="t-loading-text">Loading hiring cycles...</Typography>
            </Box>
          ) : error ? (
            <Box className="tar-hcl-alert-wrap"><Alert severity="error">{error}</Alert></Box>
          ) : (
            <>
              <TableContainer className="t-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="t-head-row">
                      <TableCell className="t-head-cell">Cycle Name</TableCell>
                      <TableCell className="t-head-cell">Year</TableCell>
                      <TableCell className="t-head-cell">Budget</TableCell>
                      <TableCell className="t-head-cell">Compensation Band</TableCell>
                      <TableCell className="t-head-cell">Status</TableCell>
                      <TableCell className="t-head-cell">Created On</TableCell>
                      <TableCell className="t-head-cell t-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cycles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" className="t-empty-cell">
                          <CycleIcon className="t-empty-icon" />
                          <Typography className="t-empty-text">No hiring cycles found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cycles.map((cycle, idx) => (
                        <TableRow
                          key={cycle.cycleId}
                          hover
                          onClick={() => navigate(`/ta-recruiter/hiring-cycles/${cycle.cycleId}`)}
                          className={`t-row ${idx % 2 === 0 ? 't-row--even' : 't-row--odd'}`}
                        >
                          <TableCell className="t-cell">
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Box className="tar-hcl-name-icon-box">
                                <CycleIcon sx={{ fontSize: 16, color: 'var(--color-primary)' }} />
                              </Box>
                              <Typography className="t-row-primary">{cycle.cycleName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">{cycle.cycleYear}</Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {cycle.budget ? `â‚¹ ${cycle.budget.toLocaleString('en-IN')}` : 'â€”'}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {cycle.compensationBand ? `Band ${cycle.compensationBand}` : 'â€”'}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell">
                            <Chip
                              label={cycle.status}
                              size="small"
                              className={cycle.status === 'OPEN' ? 't-chip-success' : 't-chip-neutral'}
                            />
                          </TableCell>
                          <TableCell className="t-cell">
                            <Typography className="t-row-secondary">
                              {new Date(cycle.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell className="t-cell t-cell--actions">
                            <IconButton
                              size="small"
                              className="t-action-btn"
                              title="View Cycle"
                              onClick={(e) => { e.stopPropagation(); navigate(`/ta-recruiter/hiring-cycles/${cycle.cycleId}`); }}
                            >
                              <OpenInNewIcon className="tar-hcl-action-icon" />
                            </IconButton>
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

export default TARHiringCycleList;
