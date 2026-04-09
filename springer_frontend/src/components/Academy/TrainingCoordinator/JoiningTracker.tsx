import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  CircularProgress, Chip, MenuItem, TextField, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
} from '@mui/material';
import { Person as PersonIcon, Search as SearchIcon } from '@mui/icons-material';
import { joiningTrackerApi } from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import type { JoiningTrackerCandidate, AcademyContextProps } from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import '../../../css/Academy/TrainingCoordinator/JoiningTracker.css';

const JoiningTracker = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, cycles: ctxCycles = [] } = context;
  const user = tokenstore.getUser();
  const userId = user?.userId ?? 0;

  const cycles: HiringCycleResponse[] = ctxCycles;
  const [selectedCycleId, setSelectedCycleId] = useState<number>(0);
  const [allCycleCandidates, setAllCycleCandidates] = useState<JoiningTrackerCandidate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [instituteFilter, setInstituteFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [degreeFilter, setDegreeFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ACCEPTED');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [dropConfirm, setDropConfirm] = useState<{ open: boolean; candidateId: number | null; candidateName: string }>({ open: false, candidateId: null, candidateName: '' });
  const [dropReason, setDropReason] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Auto-select cycle when programYear or cycles change
  useEffect(() => {
    if (programYear === 0 || cycles.length === 0) return;
    const matched = cycles.find(c => c.cycleYear === programYear);
    if (matched) setSelectedCycleId(matched.cycleId);
    else setSelectedCycleId(0);
  }, [programYear, cycles]);

  useEffect(() => {
    if (!selectedCycleId) {
      setAllCycleCandidates([]);
      return;
    }
    setLoading(true);
    joiningTrackerApi.getCandidatesByCycleAndStages({
      cycleId: selectedCycleId,
      applicationStages: ['ACCEPTED', 'JOINED', 'DROPPED'],
    })
      .then(res => {
        const all = (res.success && res.data) ? res.data : [];
        const normalized: JoiningTrackerCandidate[] = all.map(c => ({
          candidateId: c.candidateId,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          instituteName: c.instituteName,
          mobile: c.mobile,
          department: c.department,
          degree: c.degree,
          cycleId: c.cycleId,
          applicationStage: c.applicationStage,
          updatedAt: c.updatedAt,
        }));
        setAllCycleCandidates(normalized);
      })
      .catch(() => showToast('Failed to load candidates', 'error'))
      .finally(() => setLoading(false));
  }, [selectedCycleId]);

  const handleStatusUpdate = async (candidateId: number, status: 'JOINED' | 'DROPPED', reason?: string) => {
    setUpdatingId(candidateId);
    try {
      const payload = reason && reason.trim().length > 0
        ? { status, updatedBy: userId, reason: reason.trim() }
        : { status, updatedBy: userId };
      const res = await joiningTrackerApi.updateJoiningStatus(candidateId, payload);
      if (res.success) {
        showToast(`Candidate successfully marked as ${status}`, 'success');
        setAllCycleCandidates(prev => prev.map(c =>
          c.candidateId === candidateId
            ? { ...c, applicationStage: status, updatedAt: new Date().toISOString() }
            : c
        ));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDropConfirmed = async () => {
    if (!dropConfirm.candidateId) return;
    if (!dropReason.trim()) {
      showToast('Drop reason is required', 'error');
      return;
    }
    setDropConfirm({ open: false, candidateId: null, candidateName: '' });
    await handleStatusUpdate(dropConfirm.candidateId, 'DROPPED', dropReason);
    setDropReason('');
  };

  const lowerSearch = searchText.trim().toLowerCase();

  // Source depends on stage filter
  const stageSource = stageFilter === 'ALL'
    ? allCycleCandidates
    : allCycleCandidates.filter(c => c.applicationStage === stageFilter);

  const filteredCandidates = stageSource.filter(c => {
    const bySearch = !lowerSearch
      || `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerSearch)
      || c.email.toLowerCase().includes(lowerSearch);
    const byInstitute = instituteFilter === 'ALL' || c.instituteName === instituteFilter;
    const byDepartment = departmentFilter === 'ALL' || c.department === departmentFilter;
    const byDegree = degreeFilter === 'ALL' || c.degree === degreeFilter;
    return bySearch && byInstitute && byDepartment && byDegree;
  });

  // Derive filter options from ALL candidates in cycle
  const institutes = Array.from(new Set(allCycleCandidates.map(c => c.instituteName).filter(Boolean))).sort();
  const departments = Array.from(new Set(allCycleCandidates.map(c => c.department).filter(Boolean))).sort();
  const degrees = Array.from(new Set(allCycleCandidates.map(c => c.degree).filter(Boolean))).sort();

  const acceptedCount = allCycleCandidates.filter(c => c.applicationStage === 'ACCEPTED').length;
  const joinedCount   = allCycleCandidates.filter(c => c.applicationStage === 'JOINED').length;
  const droppedCount  = allCycleCandidates.filter(c => c.applicationStage === 'DROPPED').length;

  const paginated = filteredCandidates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className="jt-page">
      <Card className="jt-card">
        <Box className="jt-stats-row">
          <Box
            className={`jt-stat-card jt-stat-card--accepted ${stageFilter === 'ACCEPTED' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('ACCEPTED'); setPage(0); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">Offer Accepted</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? acceptedCount : '—'}</Typography>
          </Box>
          <Box
            className={`jt-stat-card jt-stat-card--joined ${stageFilter === 'JOINED' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('JOINED'); setPage(0); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">Joined</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? joinedCount : '—'}</Typography>
          </Box>
          <Box
            className={`jt-stat-card jt-stat-card--dropped ${stageFilter === 'DROPPED' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('DROPPED'); setPage(0); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">Dropped</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? droppedCount : '—'}</Typography>
          </Box>
          <Box
            className={`jt-stat-card jt-stat-card--pending ${stageFilter === 'ALL' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('ALL'); setPage(0); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">All Candidates</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? allCycleCandidates.length : '—'}</Typography>
          </Box>
        </Box>

        <Box className="jt-filter-section">
          <Box className="jt-filter-row">
          <TextField
            size="small"
            placeholder="Search name or email"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
            className="jt-search-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField select size="small" label="Institute" value={instituteFilter} onChange={(e) => { setInstituteFilter(e.target.value); setPage(0); }} className="jt-filter-select">
            <MenuItem value="ALL">All Institutes</MenuItem>
            {institutes.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Department" value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }} className="jt-filter-select">
            <MenuItem value="ALL">All Departments</MenuItem>
            {departments.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Degree" value={degreeFilter} onChange={(e) => { setDegreeFilter(e.target.value); setPage(0); }} className="jt-filter-select">
            <MenuItem value="ALL">All Degrees</MenuItem>
            {degrees.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <Box className="jt-filter-spacer" />
          </Box>
        </Box>

        <Box className="jt-separator" />

        <Box className="jt-table-section">
          {!selectedCycleId ? (
            <Box className="jt-empty-state">
              <PersonIcon className="jt-empty-icon" />
              <Typography className="jt-empty-text">Select a program year above to view candidates</Typography>
            </Box>
          ) : loading ? (
            <Box className="jt-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="jt-empty-text">Loading candidates...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="jt-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="jt-table-head-row">
                      <TableCell className="jt-table-head-cell">Candidate</TableCell>
                      <TableCell className="jt-table-head-cell">Institute</TableCell>
                      <TableCell className="jt-table-head-cell">Department</TableCell>
                      <TableCell className="jt-table-head-cell">Degree</TableCell>
                      <TableCell className="jt-table-head-cell">Stage</TableCell>
                      <TableCell className="jt-table-head-cell jt-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="jt-empty-cell">
                          <PersonIcon className="jt-empty-icon" />
                          <Typography className="jt-empty-text">No offer-accepted candidates pending joining confirmation for this cycle</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((c, idx) => (
                      <TableRow
                        key={c.candidateId}
                        className={`jt-table-row ${idx % 2 === 0 ? 'jt-table-row--even' : 'jt-table-row--odd'}`}
                      >
                        <TableCell className="jt-table-cell">
                          <Box className="jt-name-cell">
                            <Box className="jt-name-icon-box">
                              <PersonIcon className="jt-name-icon" />
                            </Box>
                            <Box>
                              <Typography className="jt-row-primary">{c.firstName} {c.lastName}</Typography>
                              <Typography className="jt-row-secondary">{c.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell className="jt-table-cell">
                          <Typography className="jt-row-secondary">{c.instituteName || '—'}</Typography>
                        </TableCell>
                        <TableCell className="jt-table-cell">
                          <Typography className="jt-row-secondary">{c.department || '—'}</Typography>
                        </TableCell>
                        <TableCell className="jt-table-cell">
                          <Typography className="jt-row-secondary">{c.degree || '—'}</Typography>
                        </TableCell>
                        <TableCell className="jt-table-cell">
                          <Chip label={c.applicationStage} size="small" className="jt-stage-chip" />
                        </TableCell>
                        <TableCell className="jt-table-cell jt-table-cell--actions">
                          <Stack direction="row" spacing={1}>
                            {c.applicationStage === 'ACCEPTED' && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  className="jt-btn-join"
                                  disabled={updatingId === c.candidateId}
                                  onClick={() => handleStatusUpdate(c.candidateId, 'JOINED')}
                                >
                                  {updatingId === c.candidateId ? 'Updating...' : 'Mark as Joined'}
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  className="jt-btn-dropped"
                                  disabled={updatingId === c.candidateId}
                                  onClick={() => {
                                    setDropConfirm({ open: true, candidateId: c.candidateId, candidateName: `${c.firstName} ${c.lastName}` });
                                    setDropReason('');
                                  }}
                                >
                                  Mark as Dropped
                                </Button>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredCandidates.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="jt-pagination"
              />
            </>
          )}
        </Box>
      </Card>
      {/* Drop Confirmation Dialog */}
      <Dialog open={dropConfirm.open} onClose={() => setDropConfirm({ open: false, candidateId: null, candidateName: '' })} maxWidth="sm" fullWidth>
        <DialogTitle className="jt-dialog-title">Confirm — Mark as Dropped</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to mark <strong>{dropConfirm.candidateName}</strong> as <strong>Dropped</strong>?
            This means the candidate has permanently withdrawn and will no longer appear in the joining list.
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            label="Drop Reason *"
            placeholder="Enter why this candidate is marked dropped"
            value={dropReason}
            onChange={(e) => setDropReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDropConfirm({ open: false, candidateId: null, candidateName: '' })} className="jt-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleDropConfirmed} className="jt-dialog-confirm-drop-btn" disabled={!dropReason.trim()}>
            Yes, Mark as Dropped
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JoiningTracker;
