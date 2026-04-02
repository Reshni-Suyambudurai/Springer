import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, CircularProgress, Alert,
} from '@mui/material';
import {
  Loop as CycleIcon,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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

  const paginated = cycles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className="tar-hcl-page">
      <Card className="tar-hcl-card">

        <Box className="tar-hcl-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box className="tar-hcl-icon-box">
              <CycleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack>
              <Typography className="tar-hcl-title">Hiring Cycles</Typography>
              <Typography className="tar-hcl-subtitle">View cycles and approved demands for execution</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className="tar-hcl-separator" />

        <Box className="tar-hcl-table-section">
          {loading ? (
            <Box className="tar-hcl-loading">
              <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="tar-hcl-loading-text">Loading hiring cycles...</Typography>
            </Box>
          ) : error ? (
            <Box className="tar-hcl-alert-wrap"><Alert severity="error">{error}</Alert></Box>
          ) : (
            <>
              <TableContainer className="tar-hcl-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="tar-hcl-head-row">
                      <TableCell className="tar-hcl-head-cell">Cycle Name</TableCell>
                      <TableCell className="tar-hcl-head-cell">Year</TableCell>
                      <TableCell className="tar-hcl-head-cell">Budget</TableCell>
                      <TableCell className="tar-hcl-head-cell">Compensation Band</TableCell>
                      <TableCell className="tar-hcl-head-cell">Status</TableCell>
                      <TableCell className="tar-hcl-head-cell">Created On</TableCell>
                      <TableCell className="tar-hcl-head-cell tar-hcl-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" className="tar-hcl-empty-cell">
                          <CycleIcon className="tar-hcl-empty-icon" />
                          <Typography className="tar-hcl-empty-text">No hiring cycles found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((cycle, idx) => (
                        <TableRow
                          key={cycle.cycleId}
                          hover
                          onClick={() => navigate(`/ta-recruiter/hiring-cycles/${cycle.cycleId}`)}
                          className={`tar-hcl-row ${idx % 2 === 0 ? 'tar-hcl-row--even' : 'tar-hcl-row--odd'}`}
                        >
                          <TableCell className="tar-hcl-cell">
                            <Stack direction="row" alignItems="center" gap={1.5}>
                              <Box className="tar-hcl-name-icon-box">
                                <CycleIcon sx={{ fontSize: 16, color: 'var(--color-primary)' }} />
                              </Box>
                              <Typography className="tar-hcl-cell-primary">{cycle.cycleName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell className="tar-hcl-cell">
                            <Typography className="tar-hcl-cell-secondary">{cycle.cycleYear}</Typography>
                          </TableCell>
                          <TableCell className="tar-hcl-cell">
                            <Typography className="tar-hcl-cell-secondary">
                              {cycle.budget ? `₹ ${cycle.budget.toLocaleString('en-IN')}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="tar-hcl-cell">
                            <Typography className="tar-hcl-cell-secondary">
                              {cycle.compensationBand ? `Band ${cycle.compensationBand}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell className="tar-hcl-cell">
                            <Chip
                              label={cycle.status}
                              size="small"
                              className={cycle.status === 'OPEN' ? 'tar-hcl-status--open' : 'tar-hcl-status--closed'}
                            />
                          </TableCell>
                          <TableCell className="tar-hcl-cell">
                            <Typography className="tar-hcl-cell-secondary">
                              {new Date(cycle.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell className="tar-hcl-cell tar-hcl-cell--actions">
                            <IconButton
                              size="small"
                              className="tar-hcl-action-btn"
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
              <TablePagination
                component="div"
                count={cycles.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="tar-hcl-pagination"
              />
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default TARHiringCycleList;
