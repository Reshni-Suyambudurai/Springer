import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, CircularProgress, Chip,
  TextField, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Checkbox, Stack, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
  Send as SendIcon, Search as SearchIcon,
  Refresh as RefreshIcon, Person as PersonIcon,
} from '@mui/icons-material';
import { documentTypeApi, documentLinkApi, documentSubmissionApi } from '../../../services/document.api';
import { candidateApi } from '../../../services/drive.api';
import { showToast } from '../../../utils/toast';
import FilterSelect from '../../Common/FilterSelect';
import type { DocumentTypeResponse, DocProcessingContextProps } from '../../../types/DocumentCollection/document.types';
import type { CandidateResponse } from '../../../types/TA_Recruiter/Drive/candidate.types';
import '../../../css/TA_Recruiter/DocumentProcessing/SendDocumentsTab.css';

const SendDocumentsTab = ({ context }: { context: DocProcessingContextProps }) => {
  const { cycleId, cycleName } = context;

  const getDefaultSubmissionDeadline = () => {
    const value = new Date();
    value.setDate(value.getDate() + 7);
    value.setSeconds(0, 0);
    const offsetMs = value.getTimezoneOffset() * 60 * 1000;
    return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const [docTypes, setDocTypes] = useState<DocumentTypeResponse[]>([]);
  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [submissions, setSubmissions] = useState<Record<number, number>>({}); // Count of SUBMITTED documents (COLLECTED/APPROVED/REJECTED)
  const [linkSent, setLinkSent] = useState<Record<number, boolean>>({}); // Track if link was ever sent (includes PENDING)
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubmission, setFilterSubmission] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  // Send dialog
  const [sendDialog, setSendDialog] = useState(false);
  const [selectedDocTypeIds, setSelectedDocTypeIds] = useState<Set<number>>(new Set());
  const [submissionDeadline, setSubmissionDeadline] = useState(getDefaultSubmissionDeadline());

  useEffect(() => {
    if (cycleId) fetchData();
    setSelectedCandidateIds(new Set());
    setSearch('');
    setFilterSubmission('all');
    setPage(0);
    setSubmissionDeadline(getDefaultSubmissionDeadline());
  }, [cycleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typeRes, candRes, subRes] = await Promise.all([
        documentTypeApi.getAllTypes(),
        candidateApi.getCandidatesByCycleId(cycleId),
        documentSubmissionApi.getAllSubmissions({ cycleId, size: 500 }),
      ]);
      if (typeRes.success && typeRes.data) {
        setDocTypes(typeRes.data);
        setSelectedDocTypeIds(new Set(typeRes.data.map(d => d.documentTypeId)));
      }
      if (candRes.success && candRes.data) {
        // Show SELECTED, OFFERED and ACCEPTED candidates — all need documents
        setCandidates(candRes.data.filter(c =>
          ['SELECTED', 'OFFERED', 'ACCEPTED'].includes(c.applicationStage)
        ));
      }
      if (subRes.success && subRes.data) {
        // Track TWO things:
        // 1. submissions = count of SUBMITTED documents (COLLECTED/APPROVED/REJECTED) — for status chip
        // 2. linkSent = whether link was ever sent (ANY status including PENDING) — for resend button
        const countsActual: Record<number, Set<string>> = {};
        const linkSentMap: Record<number, boolean> = {};
        
        subRes.data.forEach(s => {
          // Track if ANY submission exists (link was sent)
          linkSentMap[s.candidateId] = true;
          
          // Count only submitted documents
          if (s.verificationStatus !== 'PENDING') {
            if (!countsActual[s.candidateId]) countsActual[s.candidateId] = new Set();
            if (s.documentType) countsActual[s.candidateId].add(s.documentType);
          }
        });
        
        const uniqueCounts: Record<number, number> = {};
        Object.entries(countsActual).forEach(([cid, set]) => {
          uniqueCounts[Number(cid)] = set.size;
        });
        setSubmissions(uniqueCounts);
        setLinkSent(linkSentMap);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatus = (candidateId: number): 'none' | 'partial' | 'full' => {
    const submitted = submissions[candidateId] || 0;
    if (submitted === 0) return 'none';
    if (submitted >= docTypes.length && docTypes.length > 0) return 'full';
    return 'partial';
  };

  const filtered = candidates.filter(c => {
    const name = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchSearch = search.trim() === '' || name.includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const status = getSubmissionStatus(c.candidateId);
    const matchSubmission =
      filterSubmission === 'all'     ? true :
      filterSubmission === 'none'    ? status === 'none' :
      filterSubmission === 'partial' ? status === 'partial' :
      filterSubmission === 'full'    ? status === 'full' :
      status !== 'none'; // 'any-submitted'
    return matchSearch && matchSubmission;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const toggleCandidate = (id: number) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCandidateIds.size === filtered.length) setSelectedCandidateIds(new Set());
    else setSelectedCandidateIds(new Set(filtered.map(c => c.candidateId)));
  };

  const toggleDocType = (id: number) => {
    setSelectedDocTypeIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedDocTypeIds.size === 0) { showToast('Select at least one document type', 'error'); return; }
    if (!submissionDeadline) { showToast('Select a submission deadline', 'error'); return; }
    try {
      setSending(true);
      const res = await documentLinkApi.sendBulkSubmissionLinks({
        candidateIds: Array.from(selectedCandidateIds),
        cycleId,
        documentTypeIds: Array.from(selectedDocTypeIds),
        submissionDeadline,
      });
      if (res.success) {
        const results = res.data as Record<string, string>;
        const successCount = Object.values(results).filter(v => v === 'SUCCESS').length;
        showToast(`Links sent to ${successCount}/${selectedCandidateIds.size} candidates`, 'success');
        setSelectedCandidateIds(new Set());
        setSendDialog(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send links', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (candidateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setResendingId(candidateId);
      // Pass the currently selected document types to resend only those
      await documentLinkApi.resendSubmissionLink(candidateId, cycleId, Array.from(selectedDocTypeIds), submissionDeadline || undefined);
      showToast('Link resent successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to resend', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const submittedCount = candidates.filter(c => (submissions[c.candidateId] || 0) > 0).length;

  return (
    <Box className="sdt-page">
      <Card className="sdt-card">

        {/* Filters */}
        <Box className="sdt-filter-section">
          <Box className="sdt-filter-row">
            <TextField
              placeholder="Search by name or email..."
              size="small"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="sdt-search-field"
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className="sdt-search-icon" /></InputAdornment>
              }}
            />
            <FilterSelect label="Submission" value={filterSubmission} onChange={v => { setFilterSubmission(v); setPage(0); }}>
              <MenuItem value="all">All Candidates</MenuItem>
              <MenuItem value="none">Not Yet Submitted</MenuItem>
              <MenuItem value="partial">Partially Submitted</MenuItem>
              <MenuItem value="full">Fully Submitted</MenuItem>
              <MenuItem value="any-submitted">Any Submission</MenuItem>
            </FilterSelect>
            <Box className="sdt-filter-spacer" />
            <Typography className="sdt-filter-count">
              {submittedCount}/{candidates.length} submitted
            </Typography>
            <IconButton size="small" onClick={fetchData} title="Refresh" className="sdt-refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SendIcon />}
              onClick={() => {
                if (selectedCandidateIds.size === 0) { showToast('Select at least one candidate', 'error'); return; }
                setSendDialog(true);
              }}
              disabled={sending || selectedCandidateIds.size === 0}
              className="sdt-send-button"
            >
              {selectedCandidateIds.size > 0 ? `Send to ${selectedCandidateIds.size} Candidate(s)` : 'Send Links'}
            </Button>
          </Box>
        </Box>

        <Box className="sdt-separator" />

        {/* Table */}
        <Box className="sdt-table-section">
          {loading ? (
            <Box className="sdt-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="sdt-empty-text">Loading candidates...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="sdt-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="sdt-table-head-row">
                      <TableCell padding="checkbox" className="sdt-table-head-cell">
                        <Checkbox
                          checked={filtered.length > 0 && selectedCandidateIds.size === filtered.length}
                          indeterminate={selectedCandidateIds.size > 0 && selectedCandidateIds.size < filtered.length}
                          onChange={toggleAll}
                          size="small"
                          sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' } }}
                        />
                      </TableCell>
                      <TableCell className="sdt-table-head-cell">Candidate</TableCell>
                      <TableCell className="sdt-table-head-cell">Department</TableCell>
                      <TableCell className="sdt-table-head-cell">Stage</TableCell>
                      <TableCell className="sdt-table-head-cell">Docs Submitted</TableCell>
                      <TableCell className="sdt-table-head-cell sdt-table-head-cell--actions">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="sdt-empty-cell">
                          <PersonIcon className="sdt-empty-icon" />
                          <Typography className="sdt-empty-text">
                            {candidates.length === 0
                              ? `No SELECTED candidates for ${cycleName}`
                              : 'No candidates match the filter'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((c, idx) => {
                        const submitted = submissions[c.candidateId] || 0;
                        return (
                          <TableRow
                            key={c.candidateId}
                            hover
                            selected={selectedCandidateIds.has(c.candidateId)}
                            onClick={() => toggleCandidate(c.candidateId)}
                            className={`sdt-table-row ${idx % 2 === 0 ? 'sdt-table-row--even' : 'sdt-table-row--odd'}`}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedCandidateIds.has(c.candidateId)}
                                size="small"
                                onClick={e => e.stopPropagation()}
                                onChange={() => toggleCandidate(c.candidateId)}
                                sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' } }}
                              />
                            </TableCell>
                            <TableCell className="sdt-table-cell">
                              <Box className="sdt-name-cell">
                                <Box className="sdt-name-icon-box">
                                  <PersonIcon className="sdt-name-icon" />
                                </Box>
                                <Box>
                                  <Typography className="sdt-row-primary">{c.firstName} {c.lastName}</Typography>
                                  <Typography className="sdt-row-secondary">{c.email}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell className="sdt-table-cell">
                              <Typography className="sdt-row-secondary">{c.department || '—'}</Typography>
                            </TableCell>
                            <TableCell className="sdt-table-cell">
                              <Chip
                                label={c.applicationStage || '—'}
                                size="small"
                                variant="outlined"
                                className={`sdt-stage-chip sdt-stage-chip--${(c.applicationStage || '').toLowerCase()}`}
                              />
                            </TableCell>
                            <TableCell className="sdt-table-cell">
                              {(() => {
                                const st = getSubmissionStatus(c.candidateId);
                                if (st === 'full') {
                                  return (
                                    <Chip
                                      label={`All submitted (${submitted}/${docTypes.length})`}
                                      size="small"
                                      className="sdt-docs-chip sdt-docs-chip--full"
                                    />
                                  );
                                }
                                if (st === 'partial') {
                                  return (
                                    <Chip
                                      label={`${submitted}/${docTypes.length} submitted`}
                                      size="small"
                                      className="sdt-docs-chip sdt-docs-chip--partial"
                                    />
                                  );
                                }
                                return (
                                  <Typography className="sdt-row-secondary">Not submitted</Typography>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="sdt-table-cell sdt-table-cell--actions" onClick={e => e.stopPropagation()}>
                              {linkSent[c.candidateId] && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  className="sdt-resend-btn"
                                  disabled={resendingId === c.candidateId}
                                  onClick={e => handleResend(c.candidateId, e)}
                                >
                                  {resendingId === c.candidateId ? '...' : 'Resend'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="sdt-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* Send Dialog — choose doc types */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="sdt-dialog-title">Select Document Types to Request</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', mb: 0.5 }}>
              Sending to <strong>{selectedCandidateIds.size} candidate(s)</strong>. Select which documents to request:
            </Typography>
            {docTypes.length === 0 ? (
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                No document types configured. Go to ① Setup first.
              </Typography>
            ) : (
              docTypes.map(dt => (
                <Box
                  key={dt.documentTypeId}
                  onClick={() => toggleDocType(dt.documentTypeId)}
                  className={`sdt-doctype-row ${selectedDocTypeIds.has(dt.documentTypeId) ? 'sdt-doctype-row--selected' : ''}`}
                >
                  <Checkbox
                    checked={selectedDocTypeIds.has(dt.documentTypeId)}
                    size="small"
                    onClick={e => e.stopPropagation()}
                    onChange={() => toggleDocType(dt.documentTypeId)}
                    sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' }, p: 0.5 }}
                  />
                  <Typography className="sdt-doctype-label">{dt.documentType.replace(/_/g, ' ')}</Typography>
                </Box>
              ))
            )}
            <TextField
              label="Submission Deadline *"
              type="datetime-local"
              size="small"
              fullWidth
              value={submissionDeadline}
              onChange={e => setSubmissionDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getDefaultSubmissionDeadline() }}
              className="sdt-deadline-field"
            />
            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Candidates must upload before this date and time. If you do not change it, the system uses the default 7-day deadline.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSendDialog(false)} className="sdt-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={sending || selectedDocTypeIds.size === 0}
            className="sdt-dialog-submit-btn"
          >
            {sending ? 'Sending...' : `Send to ${selectedCandidateIds.size} Candidate(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SendDocumentsTab;
