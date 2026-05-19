import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableSkeleton } from '../../Common/TableSkeleton';
import ProgressDialog from '../../Common/ProgressDialog';
import {
  Box, Card, Typography, Button, CircularProgress, Chip,
  TextField, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Stack, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, LinearProgress, Checkbox,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Person as PersonIcon, Refresh as RefreshIcon,
  ExpandMore as ExpandIcon, ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { FigmaSearchIcon as SearchIcon, FigmaApproveIcon as ApproveIcon, FigmaRejectIcon as RejectIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { documentSubmissionApi, verificationApi } from '../../../services/document.api';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import { useDocumentProcessing } from '../../../contexts/DocumentProcessingContext';
import FilterSelect from '../../Common/FilterSelect';
import type {
  DocumentSubmissionResponse, VerificationRequest,
  DocProcessingContextProps, CandidateWithDocs,
} from '../../../types/DocumentCollection/document.types';
import '../../../css/TA_Recruiter/DocumentProcessing/VerifyDocumentsTab.css';

type FilterType = 'all' | 'awaiting-review' | 'not-uploaded' | 'approved' | 'rejected';

const VerifyDocumentsTab = ({ context }: { context: DocProcessingContextProps }) => {
  const { cycleId, cycleName } = context;
  const user = tokenstore.getUser();
  const { submissions, selectedCandidates, loadingSubmissions, loadingCandidates, refreshAll } = useDocumentProcessing();

  const [candidatesWithDocs, setCandidatesWithDocs] = useState<CandidateWithDocs[]>([]);
  const loading = loadingSubmissions || loadingCandidates;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doc: DocumentSubmissionResponse | null }>({ open: false, doc: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState<{ open: boolean; doc: DocumentSubmissionResponse | null }>({ open: false, doc: null });
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
  // Progress state
  const [progressState, setProgressState] = useState({ open: false, current: 0, total: 0, currentItem: '' });

  useEffect(() => {
    if (cycleId) {
      // Don't fetch here - context already fetches submissions
      // Just reset UI state
    }
    setSearch(''); setFilter('all'); setExpandedId(null);
  }, [cycleId]);

  useEffect(() => {
    processSubmissionData();
  }, [submissions, selectedCandidates]);

  const processSubmissionData = () => {
      const STATUS_PRIORITY: Record<string, number> = { APPROVED: 4, COLLECTED: 3, REJECTED: 2, PENDING: 1 };

      const deduplicateDocs = (docs: DocumentSubmissionResponse[]): DocumentSubmissionResponse[] => {
        const map = new Map<string, DocumentSubmissionResponse>();
        docs.forEach(doc => {
          const key = doc.documentType;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, doc);
          } else {
            const currentPriority  = STATUS_PRIORITY[doc.verificationStatus]  || 0;
            const existingPriority = STATUS_PRIORITY[existing.verificationStatus] || 0;
            const isNewer = new Date(doc.uploadedAt || 0).getTime() > new Date(existing.uploadedAt || 0).getTime();
            if (currentPriority > existingPriority || (currentPriority === existingPriority && isNewer)) {
              map.set(key, doc);
            }
          }
        });
        return Array.from(map.values());
      };

      const grouped: Record<number, DocumentSubmissionResponse[]> = {};
      submissions.forEach(s => {
        if (!grouped[s.candidateId]) grouped[s.candidateId] = [];
        grouped[s.candidateId].push(s);
      });

      const result: CandidateWithDocs[] = Object.entries(grouped).map(([candidateId, rawDocs]) => {
        const docs = deduplicateDocs(rawDocs);
        const found = selectedCandidates.find(c => c.candidateId === Number(candidateId));
        // Use submission's candidateName as fallback when candidate isn't in selectedCandidates
        const subName = rawDocs[0]?.candidateName || '';
        const [subFirst, ...subRest] = subName.split(' ');
        const candidate = found
          ? { candidateId: found.candidateId, firstName: found.firstName, lastName: found.lastName, email: found.email, department: found.department, applicationStage: found.applicationStage }
          : { candidateId: Number(candidateId), firstName: subFirst || 'Candidate', lastName: subRest.join(' ') || `#${candidateId}`, email: '', department: '', applicationStage: 'UNKNOWN' };
        return {
          candidate, docs,
          approvedCount: docs.filter(d => d.verificationStatus === 'APPROVED').length,
          collectedCount: docs.filter(d => d.verificationStatus === 'COLLECTED').length,
          notUploadedCount: docs.filter(d => d.verificationStatus === 'PENDING').length,
          rejectedCount: docs.filter(d => d.verificationStatus === 'REJECTED').length,
        };
      });
      setCandidatesWithDocs(result);
  };

  const handleApprove = async (doc: DocumentSubmissionResponse) => {
    if (!user?.userId) { showToast('Session expired', 'error'); return; }
    try {
      setApprovingId(doc.documentId);
      const req: VerificationRequest = { verifiedBy: user.userId, comment: 'Approved' };
      const res = await verificationApi.approveDocument(doc.documentId, req);
      if (res.success) { showToast(`${doc.documentType.replace(/_/g, ' ')} approved`, 'success'); await refreshAll(cycleId); }
    } catch (err: any) {
      showToast(err.message || 'Failed to approve', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.doc || !user?.userId) return;
    if (!rejectReason.trim()) { showToast('Enter rejection reason', 'error'); return; }
    try {
      setRejecting(true);
      const req: VerificationRequest = { verifiedBy: user.userId, rejectionReason: rejectReason.trim() };
      const res = await verificationApi.rejectDocument(rejectDialog.doc.documentId, req);
      if (res.success) {
        showToast('Document rejected — candidate notified via email', 'success');
        setRejectDialog({ open: false, doc: null });
        setRejectReason('');
        await refreshAll(cycleId);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDocIds.size === 0) { showToast('Select documents to approve', 'error'); return; }
    if (!user?.userId) { showToast('Session expired', 'error'); return; }
    
    const docList = Array.from(selectedDocIds);
    const totalDocs = docList.length;
    
    try {
      setProgressState({ open: true, current: 0, total: totalDocs, currentItem: '' });
      
      let successCount = 0;
      const failedDocs: Array<{ docId: number; error: string }> = [];
      
      for (let i = 0; i < docList.length; i++) {
        const docId = docList[i];
        const doc = submissions.find(s => s.documentId === docId);
        const docName = doc ? doc.documentType.replace(/_/g, ' ') : `Document #${docId}`;
        
        setProgressState({
          open: true,
          current: i + 1,
          total: totalDocs,
          currentItem: docName,
        });
        
        try {
          const req: VerificationRequest = { verifiedBy: user.userId, comment: 'Bulk approved' };
          const res = await verificationApi.approveDocument(docId, req);
          if (res.success) {
            successCount++;
          } else {
            failedDocs.push({ docId, error: 'Approval failed' });
          }
        } catch (err: any) {
          failedDocs.push({ docId, error: err.message || 'Failed to approve' });
        }
      }
      
      if (successCount > 0) {
        showToast(`${successCount}/${totalDocs} document(s) approved`, 'success');
      }
      if (failedDocs.length > 0) {
        showToast(`${failedDocs.length} document(s) failed to approve`, 'error');
      }
      
      setSelectedDocIds(new Set());
      await refreshAll(cycleId);
    } catch (err: any) {
      showToast(err.message || 'Bulk approval failed', 'error');
    } finally {
      setProgressState({ open: false, current: 0, total: 0, currentItem: '' });
    }
  };

  const toggleDocSelection = (docId: number) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      next.has(docId) ? next.delete(docId) : next.add(docId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return candidatesWithDocs.filter(item => {
      const name = `${item.candidate.firstName} ${item.candidate.lastName}`.toLowerCase();
      const matchSearch = debouncedSearch.trim() === '' || name.includes(debouncedSearch.toLowerCase()) || item.candidate.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchFilter =
        filter === 'all'             ? true :
        filter === 'awaiting-review' ? item.collectedCount > 0 :
        filter === 'not-uploaded'    ? item.notUploadedCount > 0 :
        filter === 'approved'        ? item.approvedCount === item.docs.length && item.docs.length > 0 :
        filter === 'rejected'        ? item.rejectedCount > 0 : true;
      return matchSearch && matchFilter;
    });
  }, [candidatesWithDocs, debouncedSearch, filter]);


  const totalCollected   = candidatesWithDocs.reduce((s, c) => s + c.collectedCount, 0);
  const totalNotUploaded = candidatesWithDocs.reduce((s, c) => s + c.notUploadedCount, 0);
  const totalApproved    = candidatesWithDocs.reduce((s, c) => s + c.approvedCount, 0);
  const totalRejected    = candidatesWithDocs.reduce((s, c) => s + c.rejectedCount, 0);

  return (
    <Box className="vdt-page">
      <Card className="vdt-card">

        {/* Filters */}
        <Box className="vdt-filter-section">
          <Box className="vdt-filter-row">
            <TextField
              placeholder="Search candidate..."
              size="small"
              value={search}
              onChange={e => { setSearch(e.target.value); }}
              className="vdt-search-field"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className="vdt-search-icon" /></InputAdornment> }}
            />
            <FilterSelect label="Status" value={filter} onChange={v => { setFilter(v as FilterType); }}>
              <MenuItem value="all">All ({candidatesWithDocs.length})</MenuItem>
              <MenuItem value="awaiting-review">Awaiting Review ({totalCollected} docs)</MenuItem>
              <MenuItem value="not-uploaded">Not Yet Uploaded ({totalNotUploaded} docs)</MenuItem>
              <MenuItem value="approved">Fully Approved</MenuItem>
              <MenuItem value="rejected">Has Rejections ({totalRejected} docs)</MenuItem>
            </FilterSelect>

            <Box className="vdt-filter-spacer" />
            <Box className="vdt-stats-inline">
              <Typography className="vdt-stat-inline vdt-stat-inline--pending">{totalCollected} awaiting review</Typography>
              <Typography className="vdt-stat-inline vdt-stat-inline--approved">{totalApproved} approved</Typography>
              <Typography className="vdt-stat-inline vdt-stat-inline--rejected">{totalRejected} rejected</Typography>
            </Box>
            {selectedDocIds.size > 0 && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<ApproveIcon />}
                onClick={handleBulkApprove}
                sx={{ ml: 1, textTransform: 'none', fontWeight: 600 }}
              >
                Approve {selectedDocIds.size} Selected
              </Button>
            )}
            <IconButton size="small" onClick={() => refreshAll(cycleId)} title="Refresh" className="vdt-refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box className="vdt-separator" />

        {/* Table */}
        <Box className="vdt-table-section">
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : (
            <>
              <TableContainer className="vdt-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="vdt-table-head-row">
                      <TableCell className="vdt-table-head-cell">Candidate</TableCell>
                      <TableCell className="vdt-table-head-cell">Progress</TableCell>
                      <TableCell className="vdt-table-head-cell">Awaiting Review</TableCell>
                      <TableCell className="vdt-table-head-cell">Rejected</TableCell>
                      <TableCell className="vdt-table-head-cell vdt-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="vdt-empty-cell">
                          <PersonIcon className="vdt-empty-icon" />
                          <Typography className="vdt-empty-text">
                            {candidatesWithDocs.length === 0
                              ? `No documents submitted yet for ${cycleName}`
                              : 'No candidates match the filter'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item, idx) => {
                        const isExpanded = expandedId === item.candidate.candidateId;
                        const progress = item.docs.length > 0 ? (item.approvedCount / item.docs.length) * 100 : 0;
                        const allApproved = item.approvedCount === item.docs.length && item.docs.length > 0;
                        return (
                          <React.Fragment key={item.candidate.candidateId}>
                            <TableRow
                              hover
                              className={`vdt-table-row ${idx % 2 === 0 ? 'vdt-table-row--even' : 'vdt-table-row--odd'} ${allApproved ? 'vdt-table-row--complete' : ''}`}
                              onClick={() => setExpandedId(isExpanded ? null : item.candidate.candidateId)}
                            >
                              <TableCell className="vdt-table-cell">
                                <Box className="vdt-name-cell">
                                  <Box className="vdt-name-avatar">
                                    {(item.candidate.firstName?.[0] || '').toUpperCase()}{(item.candidate.lastName?.[0] || '').toUpperCase()}
                                  </Box>
                                  <Box>
                                    <Typography className="vdt-row-primary">
                                      {item.candidate.firstName} {item.candidate.lastName}
                                      {allApproved && <ApproveIcon className="vdt-complete-icon" />}
                                    </Typography>
                                    <Typography className="vdt-row-secondary">{item.candidate.email}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell className="vdt-table-cell">
                                <Box className="vdt-progress-cell">
                                  <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    className={`vdt-progress-bar ${allApproved ? 'vdt-progress-bar--complete' : ''}`}
                                  />
                                  <Typography className="vdt-progress-text">
                                    {item.approvedCount}/{item.docs.length}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell className="vdt-table-cell">
                                {item.collectedCount > 0
                                  ? <Chip label={item.collectedCount} size="small" className="vdt-badge vdt-badge--pending" />
                                  : <Typography className="vdt-row-secondary">—</Typography>}
                              </TableCell>
                              <TableCell className="vdt-table-cell">
                                {item.rejectedCount > 0
                                  ? <Chip label={item.rejectedCount} size="small" className="vdt-badge vdt-badge--rejected" />
                                  : <Typography className="vdt-row-secondary">—</Typography>}
                              </TableCell>
                              <TableCell className="vdt-table-cell vdt-table-cell--actions" onClick={e => e.stopPropagation()}>
                                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                                  <IconButton
                                    size="small"
                                    className="vdt-expand-btn"
                                    onClick={() => setExpandedId(isExpanded ? null : item.candidate.candidateId)}
                                    title={isExpanded ? 'Collapse' : 'View Documents'}
                                  >
                                    {isExpanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            </TableRow>

                            {/* Expanded doc cards — 3 per row grid */}
                            {isExpanded && (
                              <TableRow className="vdt-doc-grid-row">
                                <TableCell colSpan={5} className="vdt-doc-grid-cell">
                                  <Box className="vdt-doc-grid">
                                    {item.docs.map(doc => {
                                      const isCollected = doc.verificationStatus === 'COLLECTED';
                                      const isSelected = selectedDocIds.has(doc.documentId);
                                      return (
                                        <Box key={doc.documentId} className={`vdt-doc-card vdt-doc-card--${doc.verificationStatus.toLowerCase()}`}>
                                          {isCollected && (
                                            <Checkbox
                                              size="small"
                                              checked={isSelected}
                                              onChange={() => toggleDocSelection(doc.documentId)}
                                              sx={{
                                                position: 'absolute',
                                                top: 4,
                                                left: 4,
                                                color: 'var(--color-primary)',
                                                '&.Mui-checked': { color: 'var(--color-primary)' },
                                              }}
                                            />
                                          )}
                                          <Box className="vdt-doc-card-info">
                                            <Typography className="vdt-doc-card-type">{doc.documentType.replace(/_/g, ' ')}</Typography>
                                            <Typography className="vdt-doc-card-date">
                                              Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '—'}
                                            </Typography>
                                          </Box>
                                          <Box className="vdt-doc-card-actions">
                                            {doc.verificationStatus === 'COLLECTED' && (
                                              <>
                                                <IconButton
                                                  size="small"
                                                  title="Reject"
                                                  className="vdt-action-reject"
                                                  onClick={() => { setRejectDialog({ open: true, doc }); setRejectReason(''); }}
                                                >
                                                  <RejectIcon style={{ fontSize: '1.25rem' }} />
                                                </IconButton>
                                                <IconButton
                                                  size="small"
                                                  title="Approve"
                                                  className="vdt-action-approve"
                                                  disabled={approvingId === doc.documentId}
                                                  onClick={() => setApproveConfirm({ open: true, doc })}
                                                >
                                                  {approvingId === doc.documentId ? <CircularProgress size={14} /> : <ApproveIcon style={{ fontSize: '1.25rem' }} />}
                                                </IconButton>
                                              </>
                                            )}
                                            {doc.verificationStatus === 'APPROVED' && (
                                              <ApproveIcon style={{ fontSize: '1.25rem' }} className="vdt-card-status-icon vdt-card-status-icon--approved" />
                                            )}
                                            {doc.verificationStatus === 'REJECTED' && (
                                              <RejectIcon style={{ fontSize: '1.25rem' }} className="vdt-card-status-icon vdt-card-status-icon--rejected" />
                                            )}
                                            <IconButton
                                              size="small"
                                              title="View Document"
                                              className="vdt-action-view"
                                              onClick={async () => {
                                                try {
                                                  await documentSubmissionApi.openFile(doc.documentId);
                                                } catch (error) {
                                                  const message = error instanceof Error ? error.message : 'Failed to open document';
                                                  showToast(message, 'error');
                                                }
                                              }}
                                            >
                                              <ViewIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
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

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveConfirm.open} onClose={() => setApproveConfirm({ open: false, doc: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Confirm Approval
          <IconButton size="small" onClick={() => setApproveConfirm({ open: false, doc: null })}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1 }}>
            Are you sure you want to approve <strong>{approveConfirm.doc?.documentType.replace(/_/g, ' ')}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveConfirm({ open: false, doc: null })}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              if (approveConfirm.doc) handleApprove(approveConfirm.doc);
              setApproveConfirm({ open: false, doc: null });
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, doc: null })} maxWidth="sm" fullWidth>
        <DialogTitle className="vdt-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Reject Document
          <IconButton size="small" onClick={() => setRejectDialog({ open: false, doc: null })}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', mb: 2, mt: 1 }}>
            Rejecting <strong>{rejectDialog.doc?.documentType.replace(/_/g, ' ')}</strong>. The candidate will be notified via email with a resubmission link.
          </Typography>
          <TextField
            label="Rejection Reason *"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. Document is blurry, please resubmit a clear copy"
            inputProps={{ maxLength: 300 }}
            helperText={`${rejectReason.length}/300`}
            className="vdt-dialog-field"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialog({ open: false, doc: null })} className="vdt-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleReject} disabled={rejecting} className="vdt-dialog-reject-btn">
            {rejecting ? 'Rejecting...' : 'Reject & Notify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Dialog */}
      <ProgressDialog
        open={progressState.open}
        title="Approving Documents"
        current={progressState.current}
        total={progressState.total}
        currentItem={progressState.currentItem}
      />
    </Box>
  );
};

export default VerifyDocumentsTab;
