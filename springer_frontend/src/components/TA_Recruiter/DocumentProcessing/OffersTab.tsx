import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, CircularProgress, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Stack, IconButton, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon, EmojiEvents as OfferIcon,
} from '@mui/icons-material';
import { FigmaAddIcon as AddIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { offerApi } from '../../../services/document.api';
import { showToast } from '../../../utils/toast';
import FilterSelect from '../../Common/FilterSelect';
import type {
  OfferLetterResponse, BulkOfferResponseRequest,
  DocProcessingContextProps,
} from '../../../types/DocumentCollection/document.types';
import '../../../css/TA_Recruiter/DocumentProcessing/OffersTab.css';

type ViewMode = 'eligible' | 'recorded';

interface CandidateOfferRow {
  candidateId: number;
  candidateName: string;
  selected: boolean;
  issueDate: string;
  response: 'PENDING' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED';
  respondedDate: string;
  declineReason: string;
}

const today = () => new Date().toISOString().split('T')[0];

const OffersTab = ({ context }: { context: DocProcessingContextProps }) => {
  const { cycleId } = context;

  const [eligible, setEligible] = useState<OfferLetterResponse[]>([]);
  const [offers, setOffers] = useState<OfferLetterResponse[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingCycleData, setLoadingCycleData] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('eligible');
  const [filterResponse, setFilterResponse] = useState('all');

  // Generate Offer dialog
  const [offerDialog, setOfferDialog] = useState(false);
  const [rows, setRows] = useState<CandidateOfferRow[]>([]);
  const [bulkIssueDate, setBulkIssueDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);

  // Single edit dialog (recorded offers)
  const [singleDialog, setSingleDialog] = useState<{ open: boolean; offer: OfferLetterResponse | null }>({ open: false, offer: null });
  const [singleResponse, setSingleResponse] = useState<'OFFER_ACCEPTED' | 'OFFER_DECLINED'>('OFFER_ACCEPTED');
  const [singleDate, setSingleDate] = useState(today());
  const [singleReason, setSingleReason] = useState('');
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!cycleId) return;
    setLoadingCycleData(true);
    Promise.all([fetchEligible(), fetchOffers()]).finally(() => setLoadingCycleData(false));
  }, [cycleId]);

  const fetchAllOffersByCycle = async () => {
    const res = await offerApi.getAllOffers({ cycleId, size: 1000 });
    return (res.success && res.data) ? res.data : [];
  };

  const fetchEligible = async () => {
    if (!cycleId) return;
    try {
      setLoadingEligible(true);
      const res = await offerApi.getOfferReadyCandidates(cycleId);
      setEligible((res.success && res.data) ? res.data : []);
    } catch { setEligible([]); }
    finally { setLoadingEligible(false); }
  };

  const fetchOffers = async () => {
    if (!cycleId) return;
    try {
      setLoadingOffers(true);
      const all = await fetchAllOffersByCycle();
      setOffers(all);
    } catch (err: any) {
      showToast(err.message || 'Failed to load offers', 'error');
    } finally { setLoadingOffers(false); }
  };

  const refresh = () => {
    setLoadingCycleData(true);
    Promise.all([fetchEligible(), fetchOffers()]).finally(() => setLoadingCycleData(false));
  };

  // Open generate offer dialog â€” init rows from eligible list
  const openOfferDialog = () => {
    setRows(eligible.map(c => ({
      candidateId: c.candidateId,
      candidateName: c.candidateName || `Candidate #${c.candidateId}`,
      selected: true,
      issueDate: today(),
      response: 'PENDING',
      respondedDate: '',
      declineReason: '',
    })));
    setBulkIssueDate(today());
    setOfferDialog(true);
  };

  const updateRow = (candidateId: number, field: keyof CandidateOfferRow, value: any) => {
    setRows(prev => prev.map(r => r.candidateId === candidateId ? { ...r, [field]: value } : r));
  };

  const toggleRowSelect = (candidateId: number) => {
    updateRow(candidateId, 'selected', !rows.find(r => r.candidateId === candidateId)?.selected);
  };

  const toggleAllRows = () => {
    const allSelected = rows.every(r => r.selected);
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const applyBulkIssueDateToAll = () => {
    setRows(prev => prev.map(r => r.selected ? { ...r, issueDate: bulkIssueDate } : r));
  };

  const handleGenerateOffers = async () => {
    const selected = rows.filter(r => r.selected);
    if (selected.length === 0) { showToast('Select at least one candidate', 'error'); return; }

    const invalid = selected.find(r => !r.issueDate);
    if (invalid) { showToast(`Set issue date for ${invalid.candidateName}`, 'error'); return; }

    const declinedMissingReason = selected.find(r => r.response === 'OFFER_DECLINED' && !r.declineReason.trim());
    if (declinedMissingReason) { showToast(`Enter decline reason for ${declinedMissingReason.candidateName}`, 'error'); return; }

    const respondedMissingDate = selected.find(r => r.response !== 'PENDING' && !r.respondedDate);
    if (respondedMissingDate) { showToast(`Enter response date for ${respondedMissingDate.candidateName}`, 'error'); return; }

    try {
      setSubmitting(true);

      // Step 1: generate offer records
      const genRes = await offerApi.bulkGenerateOffers({
        candidateIds: selected.map(r => r.candidateId),
        cycleId,
      });
      if (!genRes.success) { showToast('Failed to create offer records', 'error'); return; }

      // Step 2: fetch new offer IDs
      const allOffers = await fetchAllOffersByCycle();

      // Step 3: record responses for non-PENDING
      const toRespond = selected.filter(r => r.response !== 'PENDING');
      if (toRespond.length > 0) {
        const bulkReqs: BulkOfferResponseRequest[] = toRespond.map(r => {
          const offer = allOffers.find(o => o.candidateId === r.candidateId && o.response === 'PENDING');
          return {
            offerId: offer?.offerId ?? 0,
            response: r.response,
            respondedDate: r.respondedDate,
            declineReason: r.response === 'OFFER_DECLINED' ? r.declineReason : undefined,
          };
        }).filter(r => r.offerId !== 0);

        if (bulkReqs.length > 0) await offerApi.bulkRecordResponse(bulkReqs);
      }

      showToast(`Offers generated for ${selected.length} candidate(s)`, 'success');
      setOfferDialog(false);
      setViewMode('recorded');
      refresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate offers', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleSave = async () => {
    if (!singleDialog.offer) return;
    if (!singleDate) { showToast('Enter response date', 'error'); return; }
    if (singleResponse === 'OFFER_DECLINED' && !singleReason.trim()) { showToast('Enter decline reason', 'error'); return; }
    try {
      setSingleSubmitting(true);
      const apiCall = isEditing ? offerApi.updateOfferResponse : offerApi.recordOfferResponse;
      const res = await apiCall(singleDialog.offer.offerId, {
        response: singleResponse,
        respondedDate: singleDate,
        declineReason: singleResponse === 'OFFER_DECLINED' ? singleReason.trim() : undefined,
      });
      if (res.success) {
        showToast(isEditing ? 'Response updated' : 'Response recorded', 'success');
        setSingleDialog({ open: false, offer: null });
        refresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to record response', 'error');
    } finally { setSingleSubmitting(false); }
  };

  const filteredOffers = offers.filter(o => filterResponse === 'all' || o.response === filterResponse);

  const accepted = offers.filter(o => o.response === 'OFFER_ACCEPTED').length;
  const declined = offers.filter(o => o.response === 'OFFER_DECLINED').length;
  const pending  = offers.filter(o => o.response === 'PENDING').length;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';

  const RESPONSE_CLASS: Record<string, string> = {
    PENDING:        'oft-chip oft-chip--pending',
    OFFER_ACCEPTED: 'oft-chip oft-chip--accepted',
    OFFER_DECLINED: 'oft-chip oft-chip--declined',
  };

  const loading = loadingEligible || loadingOffers || loadingCycleData;
  const selectedRows = rows.filter(r => r.selected);

  return (
    <Box className="oft-page">
      <Card className="oft-card">

        {/* View Toggle + Stats */}
        <Box className="oft-filter-section">
          <Box className="oft-filter-row">
            <Box className="oft-toggle">
              <button
                className={`oft-toggle-btn ${viewMode === 'eligible' ? 'oft-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('eligible')}
              >
                Eligible to Offer
                <span className="oft-toggle-badge">{eligible.length}</span>
              </button>
              <button
                className={`oft-toggle-btn ${viewMode === 'recorded' ? 'oft-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('recorded')}
              >
                Recorded Offers
                <span className="oft-toggle-badge">{offers.length}</span>
              </button>
            </Box>

            <Box className="oft-filter-spacer" />

            <IconButton size="small" onClick={refresh} title="Refresh" className="oft-refresh-btn">
              <RefreshIcon fontSize="small" />
            </IconButton>
            {viewMode === 'eligible' && eligible.length > 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openOfferDialog}
                className="oft-generate-btn"
              >
                Generate Offer
              </Button>
            )}

            {viewMode === 'recorded' && (
              <>
                <FilterSelect label="Status" value={filterResponse} onChange={v => setFilterResponse(v)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="PENDING">Awaiting Response</MenuItem>
                  <MenuItem value="OFFER_ACCEPTED">Accepted</MenuItem>
                  <MenuItem value="OFFER_DECLINED">Declined</MenuItem>
                </FilterSelect>
                <Box className="oft-stats-inline">
                  <Typography className="oft-stat-inline oft-stat-inline--pending">{pending} pending</Typography>
                  <Typography className="oft-stat-inline oft-stat-inline--accepted">{accepted} accepted</Typography>
                  <Typography className="oft-stat-inline oft-stat-inline--declined">{declined} declined</Typography>
                  {offers.length > 0 && (
                    <Typography className="oft-stat-inline oft-stat-inline--rate">
                      {Math.round((accepted / offers.length) * 100)}% acceptance
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>

        <Box className="oft-separator" />

        {/* Table */}
        <Box className="oft-table-section">
          {loading ? (
            <Box className="oft-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="oft-empty-text">Loading...</Typography>
            </Box>
          ) : viewMode === 'eligible' ? (

            /* â”€â”€ ELIGIBLE TABLE â”€â”€ */
            <TableContainer className="oft-table-container">
              <Table stickyHeader>
                <TableHead>
                  <TableRow className="oft-table-head-row">
                    <TableCell className="oft-table-head-cell">Candidate</TableCell>
                    <TableCell className="oft-table-head-cell">Docs Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eligible.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="oft-empty-cell">
                        <OfferIcon className="oft-empty-icon" />
                        <Typography className="oft-empty-text">No candidates with fully approved documents</Typography>
                        <Typography className="oft-empty-sub">Go to Review & Verify tab and approve all documents first</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    eligible.map((c, idx) => {
                      const name = c.candidateName || `Candidate #${c.candidateId}`;
                      const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                      <TableRow key={c.candidateId} hover className={`oft-table-row ${idx % 2 === 0 ? 'oft-table-row--even' : 'oft-table-row--odd'}`}>
                        <TableCell className="oft-table-cell">
                          <Box className="oft-name-cell">
                            <Box className="oft-name-avatar">{initials}</Box>
                            <Box>
                              <Typography className="oft-row-primary">{name}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell className="oft-table-cell">
                          <Chip label="All Docs Approved âœ“" size="small" className="oft-chip oft-chip--accepted" />
                        </TableCell>
                      </TableRow>
                    );})
                  )}
                </TableBody>
              </Table>
            </TableContainer>

          ) : (

            /* â”€â”€ RECORDED OFFERS TABLE â”€â”€ */
            <>
              <TableContainer className="oft-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="oft-table-head-row">
                      <TableCell className="oft-table-head-cell">Candidate</TableCell>
                      <TableCell className="oft-table-head-cell">Issue Date</TableCell>
                      <TableCell className="oft-table-head-cell">Response Status</TableCell>
                      <TableCell className="oft-table-head-cell">Response Date</TableCell>
                      <TableCell className="oft-table-head-cell">Decline Reason</TableCell>
                      <TableCell className="oft-table-head-cell oft-table-head-cell--actions">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOffers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="oft-empty-cell">
                          <OfferIcon className="oft-empty-icon" />
                          <Typography className="oft-empty-text">No offer records yet</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOffers.map((offer, idx) => {
                        const oName = offer.candidateName || `Candidate #${offer.candidateId}`;
                        const oInitials = oName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
                        return (
                        <TableRow key={offer.offerId} hover className={`oft-table-row ${idx % 2 === 0 ? 'oft-table-row--even' : 'oft-table-row--odd'}`}>
                          <TableCell className="oft-table-cell">
                            <Box className="oft-name-cell">
                              <Box className="oft-name-avatar">{oInitials}</Box>
                              <Box>
                                <Typography className="oft-row-primary">{oName}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell className="oft-table-cell">
                            <Typography className="oft-row-secondary">{formatDate(offer.issueDate)}</Typography>
                          </TableCell>
                          <TableCell className="oft-table-cell">
                            <Chip
                              label={offer.response === 'PENDING' ? 'Awaiting Response' : offer.response === 'OFFER_ACCEPTED' ? 'Accepted' : 'Declined'}
                              size="small"
                              variant="outlined"
                              className={RESPONSE_CLASS[offer.response] ?? 'oft-chip'}
                            />
                          </TableCell>
                          <TableCell className="oft-table-cell">
                            <Typography className="oft-row-secondary">{formatDate(offer.respondedDate)}</Typography>
                          </TableCell>
                          <TableCell className="oft-table-cell">
                            <Typography className="oft-decline-reason">{offer.declineReason || 'â€”'}</Typography>
                          </TableCell>
                          <TableCell className="oft-table-cell oft-table-cell--actions">
                            {offer.response === 'PENDING' && (
                              <Button
                                size="small"
                                variant="outlined"
                                className="oft-record-btn"
                                onClick={() => {
                                  setSingleResponse('OFFER_ACCEPTED');
                                  setSingleDate(today());
                                  setSingleReason('');
                                  setIsEditing(false);
                                  setSingleDialog({ open: true, offer });
                                }}
                              >
                                Record Response
                              </Button>
                            )}
                            {offer.response === 'OFFER_ACCEPTED' && offer.applicationStage === 'OFFER_ACCEPTED' && (
                              <Button
                                size="small"
                                variant="outlined"
                                className="oft-record-btn"
                                onClick={() => {
                                  setSingleResponse(offer.response as 'OFFER_ACCEPTED' | 'OFFER_DECLINED');
                                  setSingleDate(offer.respondedDate ?? today());
                                  setSingleReason(offer.declineReason ?? '');
                                  setIsEditing(true);
                                  setSingleDialog({ open: true, offer });
                                }}
                              >
                                Edit Response
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );})
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Card>

      {/* â”€â”€ Generate Offer Dialog â”€â”€ */}
      <Dialog open={offerDialog} onClose={() => setOfferDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle className="oft-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Generate Offers â€” {eligible.length} Eligible Candidate(s)
          <IconButton size="small" onClick={() => setOfferDialog(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>

            {/* Bulk issue date applicator */}
            <Box className="oft-bulk-date-row">
              <TextField
                label="Apply Issue Date to All Selected"
                type="date"
                size="small"
                value={bulkIssueDate}
                onChange={e => setBulkIssueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                className="oft-dialog-field"
                sx={{ width: 240 }}
              />
              <Button size="small" variant="outlined" className="oft-apply-btn" onClick={applyBulkIssueDateToAll}>
                Apply to Selected
              </Button>
            </Box>

            {/* Per-candidate table */}
            <TableContainer className="oft-dialog-table-container">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow className="oft-table-head-row">
                    <TableCell padding="checkbox" className="oft-table-head-cell">
                      <Checkbox
                        checked={rows.length > 0 && rows.every(r => r.selected)}
                        indeterminate={rows.some(r => r.selected) && !rows.every(r => r.selected)}
                        onChange={toggleAllRows}
                        size="small"
                        sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' } }}
                      />
                    </TableCell>
                    <TableCell className="oft-table-head-cell">Candidate</TableCell>
                    <TableCell className="oft-table-head-cell">Issue Date *</TableCell>
                    <TableCell className="oft-table-head-cell">Response</TableCell>
                    <TableCell className="oft-table-head-cell">Response Date</TableCell>
                    <TableCell className="oft-table-head-cell">Decline Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.candidateId} selected={row.selected} className="oft-dialog-row">
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={row.selected}
                          size="small"
                          onChange={() => toggleRowSelect(row.candidateId)}
                          sx={{ color: 'var(--color-primary)', '&.Mui-checked': { color: 'var(--color-primary)' } }}
                        />
                      </TableCell>
                      <TableCell className="oft-table-cell">
                        <Typography className="oft-row-primary" sx={{ fontSize: 'var(--text-sm)' }}>{row.candidateName}</Typography>
                      </TableCell>
                      <TableCell className="oft-table-cell">
                        <TextField
                          type="date"
                          size="small"
                          value={row.issueDate}
                          onChange={e => updateRow(row.candidateId, 'issueDate', e.target.value)}
                          disabled={!row.selected}
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                      <TableCell className="oft-table-cell">
                        <TextField
                          select
                          size="small"
                          value={row.response}
                          onChange={e => updateRow(row.candidateId, 'response', e.target.value)}
                          disabled={!row.selected}
                          sx={{ width: 140 }}
                        >
                          <MenuItem value="PENDING" sx={{ display: 'none' }}>Pending</MenuItem>
                          <MenuItem value="OFFER_ACCEPTED">Accepted</MenuItem>
                          <MenuItem value="OFFER_DECLINED">Declined</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell className="oft-table-cell">
                        <TextField
                          type="date"
                          size="small"
                          value={row.respondedDate}
                          onChange={e => updateRow(row.candidateId, 'respondedDate', e.target.value)}
                          disabled={!row.selected || row.response === 'PENDING'}
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 150 }}
                        />
                      </TableCell>
                      <TableCell className="oft-table-cell">
                        <TextField
                          size="small"
                          placeholder="Reason..."
                          value={row.declineReason}
                          onChange={e => updateRow(row.candidateId, 'declineReason', e.target.value)}
                          disabled={!row.selected || row.response !== 'OFFER_DECLINED'}
                          sx={{ width: 180 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              {selectedRows.length} of {rows.length} candidates selected
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOfferDialog(false)} className="oft-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateOffers}
            disabled={submitting || selectedRows.length === 0}
            className="oft-dialog-accept-btn"
          >
            {submitting ? 'Generating...' : `Generate for ${selectedRows.length} Candidate(s)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* â”€â”€ Single Record Response Dialog â”€â”€ */}
      <Dialog open={singleDialog.open} onClose={() => setSingleDialog({ open: false, offer: null })} maxWidth="xs" fullWidth>
        <DialogTitle className="oft-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isEditing ? 'Edit Response' : 'Record Response'} â€” {singleDialog.offer?.candidateName}
          <IconButton size="small" onClick={() => setSingleDialog({ open: false, offer: null })}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Response *"
              size="small"
              fullWidth
              value={singleResponse}
              onChange={e => setSingleResponse(e.target.value as 'OFFER_ACCEPTED' | 'OFFER_DECLINED')}
              className="oft-dialog-field"
            >
              <MenuItem value="OFFER_ACCEPTED">Accepted</MenuItem>
              <MenuItem value="OFFER_DECLINED">Declined</MenuItem>
            </TextField>
            <TextField
              label="Response Date *"
              type="date"
              size="small"
              fullWidth
              value={singleDate}
              onChange={e => setSingleDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              className="oft-dialog-field"
            />
            {singleResponse === 'OFFER_DECLINED' && (
              <TextField
                label="Decline Reason *"
                size="small"
                fullWidth
                multiline
                rows={3}
                value={singleReason}
                onChange={e => setSingleReason(e.target.value)}
                className="oft-dialog-field"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSingleDialog({ open: false, offer: null })} className="oft-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSingleSave}
            disabled={singleSubmitting}
            className={singleResponse === 'OFFER_ACCEPTED' ? 'oft-dialog-accept-btn' : 'oft-dialog-decline-btn'}
          >
            {singleSubmitting ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OffersTab;
