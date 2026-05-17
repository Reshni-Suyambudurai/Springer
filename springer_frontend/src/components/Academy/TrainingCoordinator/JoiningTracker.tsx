import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  CircularProgress, MenuItem, TextField, Button, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { FigmaSearchIcon as SearchIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { joiningTrackerApi } from '../../../services/academy.api';
import { internApi } from '../../../services/intern.api';
import { showToast } from '../../../utils/toast';
import { handleAxiosError } from '../../../services/api.error';
import { tokenstore } from '../../../auth/tokenstore';
import type { JoiningTrackerCandidate, AcademyContextProps } from '../../../types/Academy/academy.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import '../../../css/Academy/TrainingCoordinator/JoiningTracker.css';

const JoiningTracker = ({ context }: { context: AcademyContextProps }) => {
  const { programYear, programs: yearPrograms, cycles: ctxCycles = [] } = context;
  const user = tokenstore.getUser();
  const userId = user?.userId ?? 0;

  const cycles: HiringCycleResponse[] = ctxCycles;
  const [selectedCycleId, setSelectedCycleId] = useState<number>(0);
  const [allCycleCandidates, setAllCycleCandidates] = useState<JoiningTrackerCandidate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [instituteFilter, setInstituteFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [degreeFilter, setDegreeFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('OFFER_ACCEPTED');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    open: boolean;
    candidateId: number | null;
    candidateName: string;
  }>({ open: false, candidateId: null, candidateName: '' });
  const [statusReason, setStatusReason] = useState('');

  // Intern activation
  const [activateDialog, setActivateDialog] = useState<{ open: boolean; candidateId: number | null; candidateName: string; candidateEmail: string }>({
    open: false, candidateId: null, candidateName: '', candidateEmail: '',
  });
  const [outlookEmail, setOutlookEmail] = useState('');
  const [activating, setActivating] = useState(false);

  const handleActivateIntern = async () => {
    if (!activateDialog.candidateId) return;
    if (!outlookEmail.trim()) { showToast('Outlook email is required', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(outlookEmail.trim())) { showToast('Please enter a valid email address', 'error'); return; }
    setActivating(true);
    try {
      const res = await internApi.activateIntern(activateDialog.candidateId, { outlookEmail: outlookEmail.trim() });
      if (res.success) {
        showToast('✅ Intern account activated. Login credentials sent!', 'success');
        const activatedCandidateId = activateDialog.candidateId;
        const returnedUserId = res.data?.userId ?? -1;
        setAllCycleCandidates(prev =>
          prev.map(c =>
            c.candidateId === activatedCandidateId
              ? { ...c, userId: returnedUserId }
              : c
          )
        );
        setActivateDialog({ open: false, candidateId: null, candidateName: '', candidateEmail: '' });
        setOutlookEmail('');
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to activate intern', 'error');
    } finally {
      setActivating(false);
    }
  };

  // Auto-select cycle when programYear or cycles change
  // Derive cycle from programs (program.cycleId) — NOT from cycleYear matching
  // because programYear may differ from cycleYear (e.g., cycle 2024, program 2025)
  useEffect(() => {
    if (programYear === 0 || cycles.length === 0) return;
    const scopedPrograms = yearPrograms.filter(p => p.programYear === programYear);
    if (scopedPrograms.length > 0) {
      // Use the cycleId from the first program in this year
      const cycleId = scopedPrograms[0].cycleId;
      if (cycles.some(c => c.cycleId === cycleId)) {
        setSelectedCycleId(cycleId);
        return;
      }
    }
    // Fallback: try direct year match
    const matched = cycles.find(c => c.cycleYear === programYear);
    if (matched) setSelectedCycleId(matched.cycleId);
    else setSelectedCycleId(0);
  }, [programYear, cycles, yearPrograms]);

  useEffect(() => {
    if (!selectedCycleId) {
      setAllCycleCandidates([]);
      return;
    }
    setLoading(true);
    joiningTrackerApi.getCandidatesByCycleAndStages({
      cycleId: selectedCycleId,
      applicationStages: ['OFFER_ACCEPTED', 'JOINED', 'NOT_JOINED'],
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
          userId: c.userId,
        }));
        setAllCycleCandidates(normalized);
      })
      .catch(() => showToast('Failed to load candidates', 'error'))
      .finally(() => setLoading(false));
  }, [selectedCycleId]);

  const handleStatusUpdate = async (
    candidateId: number,
    status: 'JOINED' | 'NOT_JOINED',
    reason?: string
  ) => {
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
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusConfirmed = async () => {
    if (!statusConfirm.candidateId) return;
    if (!statusReason.trim()) { showToast('Reason is required', 'error'); return; }
    const { candidateId } = statusConfirm;
    setStatusConfirm({ open: false, candidateId: null, candidateName: '' });
    await handleStatusUpdate(candidateId, 'NOT_JOINED', statusReason);
    setStatusReason('');
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

  const acceptedCount  = allCycleCandidates.filter(c => c.applicationStage === 'OFFER_ACCEPTED').length;
  const joinedCount    = allCycleCandidates.filter(c => c.applicationStage === 'JOINED').length;
  const notJoinedCount = allCycleCandidates.filter(c => c.applicationStage === 'NOT_JOINED').length;



  const renderActionCell = (candidate: JoiningTrackerCandidate) => {
    if (candidate.applicationStage === 'OFFER_ACCEPTED') {
      return (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            className="jt-btn-join"
            disabled={updatingId === candidate.candidateId}
            onClick={() => handleStatusUpdate(candidate.candidateId, 'JOINED')}
          >
            {updatingId === candidate.candidateId ? 'Updating...' : 'Mark as Joined'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            className="jt-btn-dropped"
            disabled={updatingId === candidate.candidateId}
            onClick={() => {
              setStatusConfirm({
                open: true,
                candidateId: candidate.candidateId,
                candidateName: `${candidate.firstName} ${candidate.lastName}`,
              });
              setStatusReason('');
            }}
          >
            Mark as Not Joined
          </Button>
        </Stack>
      );
    }

    if (candidate.applicationStage === 'JOINED') {
      if (candidate.userId) {
        return (
          <Typography className="jt-row-secondary">Intern account activated</Typography>
        );
      }

      return (
        <Button
          size="small"
          variant="contained"
          className="jt-btn-activate"
          onClick={() => {
            setOutlookEmail(candidate.email);
            setActivateDialog({
              open: true,
              candidateId: candidate.candidateId,
              candidateName: `${candidate.firstName} ${candidate.lastName}`,
              candidateEmail: candidate.email,
            });
          }}
        >
          Activate Intern
        </Button>
      );
    }

    return (
      <Typography className="jt-row-secondary">No actions required</Typography>
    );
  };

  return (
    <Box className="jt-page">
      <Card className="jt-card">
        <Box className="jt-stats-row">
          <Box
            className={`jt-stat-card jt-stat-card--accepted ${stageFilter === 'OFFER_ACCEPTED' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('OFFER_ACCEPTED'); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">Offer Accepted</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? acceptedCount : '—'}</Typography>
          </Box>
          <Box
            className={`jt-stat-card jt-stat-card--joined ${stageFilter === 'JOINED' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('JOINED'); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">Joined</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? joinedCount : '—'}</Typography>
          </Box>
          <Box
            className={`jt-stat-card jt-stat-card--dropped ${stageFilter === 'NOT_JOINED' ? 'jt-stat-card--active' : ''}`}
            onClick={() => { setStageFilter('NOT_JOINED'); }}
            style={{ cursor: 'pointer' }}
          >
            <Typography className="jt-stat-label">Not Joined</Typography>
            <Typography className="jt-stat-value">{selectedCycleId ? notJoinedCount : '—'}</Typography>
          </Box>
        </Box>

        <Box className="jt-filter-section">
          <Box className="jt-filter-row">
          <TextField
            size="small"
            placeholder="Search name or email"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); }}
            className="jt-search-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField select size="small" label="Institute" value={instituteFilter} onChange={(e) => { setInstituteFilter(e.target.value); }} className="jt-filter-select">
            <MenuItem value="ALL">All Institutes</MenuItem>
            {institutes.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Department" value={departmentFilter} onChange={(e) => { setDepartmentFilter(e.target.value); }} className="jt-filter-select">
            <MenuItem value="ALL">All Departments</MenuItem>
            {departments.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Degree" value={degreeFilter} onChange={(e) => { setDegreeFilter(e.target.value); }} className="jt-filter-select">
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
                      <TableCell className="jt-table-head-cell jt-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCandidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="jt-empty-cell">
                          <PersonIcon className="jt-empty-icon" />
                          <Typography className="jt-empty-text">No candidates found for the selected status and filters</Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredCandidates.map((c, idx) => (
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
                        <TableCell className="jt-table-cell jt-table-cell--actions">
                          {renderActionCell(c)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Card>
      {/* Activate Intern Dialog */}
      <Dialog open={activateDialog.open} onClose={() => setActivateDialog({ open: false, candidateId: null, candidateName: '', candidateEmail: '' })} maxWidth="sm" fullWidth>
        <DialogTitle className="jt-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Activate Intern Account — {activateDialog.candidateName}
          <IconButton size="small" onClick={() => setActivateDialog({ open: false, candidateId: null, candidateName: '', candidateEmail: '' })}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, mb: 2, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Enter the Outlook/company email for this intern's login account. A temporary password will be sent to this email.
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Intern Login Email *"
            placeholder="e.g. manohar.bavigadda@kanini.com"
            value={outlookEmail}
            onChange={e => setOutlookEmail(e.target.value)}
            type="email"
          />
          <Typography sx={{ mt: 1, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Candidate's personal email: {activateDialog.candidateEmail}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setActivateDialog({ open: false, candidateId: null, candidateName: '', candidateEmail: '' })} className="jt-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleActivateIntern} disabled={activating || !outlookEmail.trim()} className="jt-btn-activate">
            {activating ? 'Activating...' : 'Activate Intern'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Confirmation Dialog */}
      <Dialog
        open={statusConfirm.open}
        onClose={() => setStatusConfirm({ open: false, candidateId: null, candidateName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="jt-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Confirm — Mark as Not Joined
          <IconButton size="small" onClick={() => setStatusConfirm({ open: false, candidateId: null, candidateName: '' })}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to mark <strong>{statusConfirm.candidateName}</strong> as <strong>Not Joined</strong>?
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            label="Reason *"
            placeholder="Enter reason"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${statusReason.length}/500`}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setStatusConfirm({ open: false, candidateId: null, candidateName: '' })}
            className="jt-dialog-cancel-btn"
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleStatusConfirmed} className="jt-dialog-confirm-drop-btn" disabled={!statusReason.trim()}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JoiningTracker;
