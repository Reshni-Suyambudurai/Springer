import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableSkeleton } from '../../Common/TableSkeleton';
import ProgressDialog from '../../Common/ProgressDialog';
import {
  Box, Card, Typography, Button, CircularProgress,
  TextField, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Checkbox, Stack, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon, Person as PersonIcon,
} from '@mui/icons-material';
import { FigmaSearchIcon as SearchIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { documentLinkApi } from '../../../services/document.api';
import { showToast } from '../../../utils/toast';
import { useDocumentProcessing } from '../../../contexts/DocumentProcessingContext';
import FilterSelect from '../../Common/FilterSelect';
<<<<<<< HEAD
import type { DocumentTypeResponse, DocProcessingContextProps } from '../../../types/DocumentCollection/document.types';
import type { CandidateResponse } from '../../../types/TA_Recruiter/Drive/candidate.types';
=======
import type { DocProcessingContextProps } from '../../../types/DocumentCollection/document.types';
>>>>>>> origin/Mano-Branch
import '../../../css/TA_Recruiter/DocumentProcessing/SendDocumentsTab.css';

const SendDocumentsTab = ({ context }: { context: DocProcessingContextProps }) => {
  const { cycleId, cycleName } = context;
  const { docTypes, selectedCandidates, submissions, loadingCandidates, loadingSubmissions, fetchSelectedCandidates, fetchSubmissions, refreshAll } = useDocumentProcessing();

  const getDefaultSubmissionDeadline = () => {
    const value = new Date();
    value.setDate(value.getDate() + 7);
    value.setSeconds(0, 0);
    const offsetMs = value.getTimezoneOffset() * 60 * 1000;
    return new Date(value.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const [submissionDetails, setSubmissionDetails] = useState<Record<number, { name: string; submitted: boolean }[]>>({});
  const [mailSent, setMailSent] = useState<Record<number, boolean>>({});
  const [allSubmitted, setAllSubmitted] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filterSubmission, setFilterSubmission] = useState('all');
  const [loadingCycleData, setLoadingCycleData] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  // Progress state
  const [progressState, setProgressState] = useState({ open: false, current: 0, total: 0, currentItem: '' });

  // Send dialog
  const [sendDialog, setSendDialog] = useState(false);
  const [selectedDocTypeIds, setSelectedDocTypeIds] = useState<Set<number>>(new Set());
  const [submissionDeadline, setSubmissionDeadline] = useState(getDefaultSubmissionDeadline());

  useEffect(() => {
    if (cycleId) {
      setLoadingCycleData(true);
      Promise.all([
        fetchSelectedCandidates(cycleId),
        fetchSubmissions(cycleId)
      ]).finally(() => setLoadingCycleData(false));
    }
    setSelectedCandidateIds(new Set());
    setSearch('');
    setFilterSubmission('all');
    setSubmissionDeadline(getDefaultSubmissionDeadline());
  }, [cycleId]);

  useEffect(() => {
    const submittedCounts: Record<number, Set<string>> = {};
    const pendingCounts: Record<number, number> = {};
    const detailsMap: Record<number, Record<string, boolean>> = {};

    submissions.forEach(s => {
      if (s.verificationStatus === 'PENDING') {
        pendingCounts[s.candidateId] = (pendingCounts[s.candidateId] || 0) + 1;
        if (!detailsMap[s.candidateId]) detailsMap[s.candidateId] = {};
        if (detailsMap[s.candidateId][s.documentType] === undefined)
          detailsMap[s.candidateId][s.documentType] = false;
      } else {
        if (!submittedCounts[s.candidateId]) submittedCounts[s.candidateId] = new Set();
        if (s.documentType) submittedCounts[s.candidateId].add(s.documentType);
        if (!detailsMap[s.candidateId]) detailsMap[s.candidateId] = {};
        detailsMap[s.candidateId][s.documentType] = true;
      }
    });

    const mailSentMap: Record<number, boolean> = {};
    const allSubmittedMap: Record<number, boolean> = {};
    const detailsResult: Record<number, { name: string; submitted: boolean }[]> = {};

    submissions.forEach(s => { mailSentMap[s.candidateId] = true; });

    Object.keys(mailSentMap).forEach(cid => {
      const id = Number(cid);
      allSubmittedMap[id] = mailSentMap[id] && !(pendingCounts[id] > 0);
    });

    Object.entries(detailsMap).forEach(([cid, docMap]) => {
      detailsResult[Number(cid)] = Object.entries(docMap).map(([name, submitted]) => ({
        name: name.replace(/_/g, ' '),
        submitted,
      }));
    });

    setSubmissionDetails(detailsResult);
    setMailSent(mailSentMap);
    setAllSubmitted(allSubmittedMap);
  }, [submissions]);

  const getSubmissionStatus = (candidateId: number): 'none' | 'partial' | 'full' => {
    const submitted = Object.keys(submissionDetails[candidateId] || {}).filter(
      k => submissionDetails[candidateId]?.find(d => d.name === k)?.submitted
    ).length;
    const total = docTypes.length;
    if (submitted === 0) return 'none';
    if (total > 0 && submitted >= total) return 'full';
    return 'partial';
  };

  const filtered = useMemo(() => {
    return selectedCandidates.filter(c => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchSearch = debouncedSearch.trim() === '' || name.includes(debouncedSearch.toLowerCase()) || c.email.toLowerCase().includes(debouncedSearch.toLowerCase());
      const status = getSubmissionStatus(c.candidateId);
      const matchSubmission =
        filterSubmission === 'all'     ? true :
        filterSubmission === 'none'    ? status === 'none' :
        filterSubmission === 'partial' ? status === 'partial' :
        filterSubmission === 'full'    ? status === 'full' : true;
      return matchSearch && matchSubmission;
    });
  }, [selectedCandidates, debouncedSearch, filterSubmission, submissionDetails, docTypes.length]);



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
    
    const candidateList = Array.from(selectedCandidateIds);
    const totalCandidates = candidateList.length;
    
    try {
      setSending(true);
      setProgressState({ open: true, current: 0, total: totalCandidates, currentItem: 'Sending to all candidates...' });
      
      // Single bulk API call instead of N individual calls
      const res = await documentLinkApi.sendBulkSubmissionLinks({
        candidateIds: candidateList,
        cycleId,
        documentTypeIds: Array.from(selectedDocTypeIds),
        submissionDeadline,
      });
      
      let successCount = 0;
      const failedEntries: Array<{ candidateId: number; reason: string }> = [];
      
      if (res.success) {
        const results = res.data as Record<string, string>;
        for (const [idStr, status] of Object.entries(results)) {
          if (status === 'SUCCESS') {
            successCount++;
          } else {
            failedEntries.push({ candidateId: Number(idStr), reason: status });
          }
        }
      }
      
      setProgressState({ open: true, current: totalCandidates, total: totalCandidates, currentItem: 'Done' });
      
      // Show results
      if (successCount > 0) {
        showToast(`Links sent to ${successCount}/${totalCandidates} candidate(s)`, 'success');
      }
      if (failedEntries.length > 0) {
        failedEntries.forEach(({ candidateId, reason }) => {
          const candidate = selectedCandidates.find(c => c.candidateId === candidateId);
          const name = candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidate #${candidateId}`;
          showToast(`${name}: ${reason.replace('FAILED: ', '')}`, 'error');
        });
      }
      
      setSelectedCandidateIds(new Set());
      setSendDialog(false);
      await refreshAll(cycleId);
    } catch (err: any) {
      showToast(err.message || 'Failed to send mails', 'error');
    } finally {
      setSending(false);
      setProgressState({ open: false, current: 0, total: 0, currentItem: '' });
    }
  };

  const handleResend = async (candidateId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setResendingId(candidateId);
      const result = await documentLinkApi.resendSubmissionLink(candidateId, cycleId, [], undefined);
      if (result.success) {
        showToast('Link resent successfully', 'success');
        await refreshAll(cycleId);
      } else {
        showToast('Nothing to resend — all documents are submitted or approved', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resend', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const submittedCount = selectedCandidates.filter(c => (submissionDetails[c.candidateId]?.length || 0) > 0).length;
  const loading = loadingCandidates || loadingSubmissions || loadingCycleData;

  return (
    <Box className="sdt-page">
      <Card className="sdt-card">

        {/* Filters */}
        <Box className="sdt-filter-section">
          <Box className="sdt-filter-row">
            <Box className="sdt-filter-left">
              <TextField
                placeholder="Search by name or email..."
                size="small"
                value={search}
                onChange={e => { setSearch(e.target.value); }}
                className="sdt-search-field"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className="sdt-search-icon" /></InputAdornment>
                }}
              />
              <FilterSelect label="Submission" value={filterSubmission} onChange={v => { setFilterSubmission(v); }} className="sdt-submission-select">
                <MenuItem value="all">All Candidates</MenuItem>
                <MenuItem value="none">Not Yet Submitted</MenuItem>
                <MenuItem value="partial">Partially Submitted</MenuItem>
                <MenuItem value="full">Fully Submitted</MenuItem>
              </FilterSelect>
            </Box>
            <Box className="sdt-filter-right">
              <Typography className="sdt-filter-count">
                {submittedCount}/{selectedCandidates.length} submitted
              </Typography>
              <IconButton size="small" onClick={() => refreshAll(cycleId)} title="Refresh" className="sdt-refresh-btn">
                <RefreshIcon fontSize="small" />
              </IconButton>
              <Button
                variant="contained"
                startIcon={sending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>}
                onClick={() => {
                  if (selectedCandidateIds.size === 0) { showToast('Select at least one candidate', 'error'); return; }
                  setSendDialog(true);
                }}
                disabled={sending || selectedCandidateIds.size === 0}
                className="sdt-send-button"
              >
                {selectedCandidateIds.size > 0 ? `Send to ${selectedCandidateIds.size} Candidate(s)` : 'Send Mails'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className="sdt-separator" />

        {/* Table */}
        <Box className="sdt-table-section">
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
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
                      <TableCell className="sdt-table-head-cell">Docs Submitted</TableCell>
                      <TableCell className="sdt-table-head-cell sdt-table-head-cell--actions">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="sdt-empty-cell">
                          <PersonIcon className="sdt-empty-icon" />
                          <Typography className="sdt-empty-text">
                            {selectedCandidates.length === 0
                              ? `No SELECTED candidates for ${cycleName}`
                              : 'No candidates match the filter'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((c, idx) => {
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
                                <Box className="sdt-name-avatar">
                                  {(c.firstName?.[0] || '').toUpperCase()}{(c.lastName?.[0] || '').toUpperCase()}
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
                              {(() => {
                                const details = submissionDetails[c.candidateId];
                                if (!details || details.length === 0) {
                                  return <Typography className="sdt-row-secondary">Not submitted</Typography>;
                                }
                                return (
                                  <Box className="sdt-doc-tags">
                                    {details.map(d => (
                                      <span key={d.name} className={`sdt-doc-tag ${d.submitted ? 'sdt-doc-tag--done' : 'sdt-doc-tag--pending'}`}>
                                        {d.submitted ? '✓' : '○'} {d.name}
                                      </span>
                                    ))}
                                  </Box>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="sdt-table-cell sdt-table-cell--actions" onClick={e => e.stopPropagation()}>
                              {/* Show Remind only if: mail was sent AND candidate still has pending docs */}
                              {mailSent[c.candidateId] && !allSubmitted[c.candidateId] && (
                                <Tooltip title="Send a reminder to submit remaining documents" arrow>
                                  <span>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      className="sdt-resend-btn"
                                      disabled={resendingId === c.candidateId}
                                      onClick={e => handleResend(c.candidateId, e)}
                                    >
                                      {resendingId === c.candidateId
                                        ? <CircularProgress size={12} />
                                        : 'Remind'}
                                    </Button>
                                  </span>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Card>

      {/* Send Dialog — choose doc types */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="sdt-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Select Document Types to Request
          <IconButton size="small" onClick={() => setSendDialog(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', mb: 0.5 }}>
              Sending to <strong>{selectedCandidateIds.size} candidate(s)</strong>. Select which documents to request:
            </Typography>
            {docTypes.length === 0 ? (
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                No document types configured. Go to Document Types tab first.
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

      {/* Progress Dialog */}
      <ProgressDialog
        open={progressState.open}
        title="Sending Document Request Emails"
        current={progressState.current}
        total={progressState.total}
        currentItem={progressState.currentItem}
      />
    </Box>
  );
};

export default SendDocumentsTab;
