import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, CircularProgress, Chip,
  TextField, InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Stack, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon, CheckCircle as ApproveIcon,
  Cancel as RejectIcon, Visibility as ViewIcon,
  Person as PersonIcon, Refresh as RefreshIcon,
  ExpandMore as ExpandIcon, ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { documentSubmissionApi, verificationApi } from '../../../services/document.api';
import { candidateApi } from '../../../services/drive.api';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import FilterSelect from '../../Common/FilterSelect';
import type {
  DocumentSubmissionResponse, VerificationRequest,
  DocProcessingContextProps, CandidateWithDocs,
} from '../../../types/DocumentCollection/document.types';
import '../../../css/TA_Recruiter/DocumentProcessing/VerifyDocumentsTab.css';

type FilterType = 'all' | 'awaiting-review' | 'not-uploaded' | 'approved' | 'rejected';

// Format verification status for display
const formatStatus = (status: string): string => {
  const map: Record<string, string> = {
    COLLECTED: 'Under Review',
    PENDING:   'Not Uploaded',
    APPROVED:  'Approved',
    REJECTED:  'Rejected',
  };
  return map[status] ?? status;
};

const VerifyDocumentsTab = ({ context }: { context: DocProcessingContextProps }) => {
  const { cycleId, cycleName } = context;
  const user = tokenstore.getUser();

  const [candidatesWithDocs, setCandidatesWithDocs] = useState<CandidateWithDocs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; doc: DocumentSubmissionResponse | null }>({ open: false, doc: null });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (cycleId) fetchData();
    setSearch(''); setFilter('all'); setExpandedId(null); setPage(0);
  }, [cycleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, candRes] = await Promise.all([
        documentSubmissionApi.getAllSubmissions({ cycleId, size: 500 }),
        candidateApi.getCandidatesByCycleId(cycleId),
      ]);
      const submissions = (subRes.success && subRes.data) ? subRes.data : [];
      const candidates = (candRes.success && candRes.data) ? candRes.data : [];

      // Status priority: keep the most meaningful status per document type per candidate
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
        const found = candidates.find(c => c.candidateId === Number(candidateId));
        const candidate = found
          ? { candidateId: found.candidateId, firstName: found.firstName, lastName: found.lastName, email: found.email, department: found.department, applicationStage: found.applicationStage }
          : { candidateId: Number(candidateId), firstName: 'Candidate', lastName: `#${candidateId}`, email: '', department: '', applicationStage: 'UNKNOWN' };
        return {
          candidate, docs,
          approvedCount: docs.filter(d => d.verificationStatus === 'APPROVED').length,
          collectedCount: docs.filter(d => d.verificationStatus === 'COLLECTED').length,
          notUploadedCount: docs.filter(d => d.verificationStatus === 'PENDING').length,
          rejectedCount: docs.filter(d => d.verificationStatus === 'REJECTED').length,
        };
      });
      setCandidatesWithDocs(result);
    } catch (err: any) {
      showToast(err.message || 'Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (doc: DocumentSubmissionResponse) => {
    if (!user?.userId) { showToast('Session expired', 'error'); return; }
    try {
      setApprovingId(doc.documentId);
      const req: VerificationRequest = { verifiedBy: user.userId, comment: 'Approved' };
      const res = await verificationApi.approveDocument(doc.documentId, req);
      if (res.success) { showToast(`${doc.documentType.replace(/_/g, ' ')} approved`, 'success'); fetchData(); }
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
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const filtered = candidatesWithDocs.filter(item => {
    const name = `${item.candidate.firstName} ${item.candidate.lastName}`.toLowerCase();
    const matchSearch = search.trim() === '' || name.includes(search.toLowerCase()) || item.candidate.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'             ? true :
      filter === 'awaiting-review' ? item.collectedCount > 0 :
      filter === 'not-uploaded'    ? item.notUploadedCount > 0 :
      filter === 'approved'        ? item.approvedCount === item.docs.length && item.docs.length > 0 :
      filter === 'rejected'        ? item.rejectedCount > 0 :
      true;
    return matchSearch && matchFilter;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
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
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="vdt-search-field"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" className="vdt-search-icon" /></InputAdornment> }}
            />
            <FilterSelect label="Status" value={filter} onChange={v => { setFilter(v as FilterType); setPage(0); }}>
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
            <IconButton size="small" onClick={fetchData} title="Refresh" className="vdt-refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box className="vdt-separator" />

        {/* Table */}
        <Box className="vdt-table-section">
          {loading ? (
            <Box className="vdt-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="vdt-empty-text">Loading submissions...</Typography>
            </Box>
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
                    {paginated.length === 0 ? (
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
                      paginated.map((item, idx) => {
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
                                  <Box className="vdt-name-icon-box">
                                    <PersonIcon className="vdt-name-icon" />
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

                            {/* Expanded doc rows */}
                            {isExpanded && item.docs.map(doc => (
                              <TableRow key={doc.documentId} className="vdt-doc-row">
                                <TableCell className="vdt-doc-cell" colSpan={2}>
                                  <Box className="vdt-doc-info">
                                    <Typography className="vdt-doc-type">{doc.documentType.replace(/_/g, ' ')}</Typography>
                                    <Typography className="vdt-doc-date">
                                      Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN') : '—'}
                                    </Typography>
                                    {doc.verifiedAt && (
                                      <Typography className="vdt-doc-date">
                                        Verified: {new Date(doc.verifiedAt).toLocaleDateString('en-IN')}
                                        {doc.verifiedBy ? ` · By User #${doc.verifiedBy}` : ''}
                                      </Typography>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell className="vdt-doc-cell" colSpan={2}>
                                  <Chip
                                    label={formatStatus(doc.verificationStatus)}
                                    size="small"
                                    variant="outlined"
                                    className={`vdt-doc-status vdt-doc-status--${doc.verificationStatus.toLowerCase()}`}
                                  />
                                </TableCell>
                                <TableCell className="vdt-doc-cell vdt-table-cell--actions">
                                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                                    {doc.verificationStatus === 'COLLECTED' && (
                                      <>
                                        <IconButton
                                          size="small"
                                          title="Approve"
                                          className="vdt-action-approve"
                                          disabled={approvingId === doc.documentId}
                                          onClick={() => handleApprove(doc)}
                                        >
                                          {approvingId === doc.documentId ? <CircularProgress size={14} /> : <ApproveIcon fontSize="small" />}
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          title="Reject"
                                          className="vdt-action-reject"
                                          onClick={() => { setRejectDialog({ open: true, doc }); setRejectReason(''); }}
                                        >
                                          <RejectIcon fontSize="small" />
                                        </IconButton>
                                      </>
                                    )}
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
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
                className="vdt-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, doc: null })} maxWidth="sm" fullWidth>
        <DialogTitle className="vdt-dialog-title">Reject Document</DialogTitle>
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
    </Box>
  );
};

export default VerifyDocumentsTab;
