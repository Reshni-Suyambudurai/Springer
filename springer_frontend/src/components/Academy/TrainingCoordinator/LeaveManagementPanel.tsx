import { useState, useEffect } from 'react';
import { FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { leaveApi } from '../../../services/leave.api';
import type { LeaveRequestResponse } from '../../../services/leave.api';
import { tokenstore } from '../../../auth/tokenstore';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import type { AcademyContextProps } from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/LeaveManagement.css';

const statusLabel: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'lmg-status--pending' },
  APPROVED: { label: 'Approved', cls: 'lmg-status--approved' },
  REJECTED: { label: 'Rejected', cls: 'lmg-status--rejected' },
};

const LeaveManagementPanel = ({ context }: { context: AcademyContextProps }) => {
  const { programs: yearPrograms } = context;
  const user     = tokenstore.getUser();
  const userRole = user?.roleName?.toUpperCase() || '';
  const isTA     = userRole === 'TA_MANAGER' || userRole === 'TA_HEAD';

  const [leaves, setLeaves]             = useState<LeaveRequestResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch]   = useState('all');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(0);
  const [rowsPerPage] = useState(20);

  // Stats (derived from paginated data — no separate getAllLeaves call)
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Review dialog — only TA
  const [reviewLeave, setReviewLeave] = useState<LeaveRequestResponse | null>(null);
  const [decision, setDecision]       = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks]         = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // Fetch paginated data whenever filters change
  useEffect(() => { fetchLeaves(); }, [filterStatus, filterProgram, filterBatch, search, page, rowsPerPage, yearPrograms]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      // Scope to year-selected programs when no specific program filter is set
      const yearProgramIds = yearPrograms.map(p => p.programId);
      const res = await leaveApi.getLeavesFiltered({
        programId: filterProgram !== 'all' ? Number(filterProgram) : undefined,
        programIds: filterProgram === 'all' && yearProgramIds.length > 0 ? yearProgramIds : undefined,
        batchNumber: filterBatch !== 'all' ? Number(filterBatch) : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        search: search.trim() || undefined,
        page,
        size: rowsPerPage,
      });
      if (res.success && res.data) {
        setLeaves(res.data.content);
        setTotalElements(res.data.totalElements);
        // Derive stats from unfiltered total when no filters active
        if (!filterStatus || filterStatus === 'ALL') {
          setStats(prev => ({ ...prev, total: res.data!.totalElements }));
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleReview = async () => {
    if (!reviewLeave) return;
    // Confirmation for reject action
    if (decision === 'REJECT' && !window.confirm(`Are you sure you want to REJECT the leave request from ${reviewLeave.studentName}?`)) return;
    try {
      setSubmitting(true);
      const res = await leaveApi.reviewLeave(reviewLeave.leaveId, {
        decision,
        remarks: remarks.trim() || undefined,
        reviewedBy: user?.userId ?? 0,
      });
      if (res.success) {
        showToast(`Leave ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`, 'success');
        setReviewLeave(null);
        setRemarks('');
        fetchLeaves();
        // Update stats optimistically
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          approved: decision === 'APPROVE' ? prev.approved + 1 : prev.approved,
          rejected: decision === 'REJECT' ? prev.rejected + 1 : prev.rejected,
        }));
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to submit review', 'error');
    } finally { setSubmitting(false); }
  };

  const availablePrograms = yearPrograms;
  const availableBatches: number[] = filterProgram !== 'all'
    ? Array.from({ length: yearPrograms.find(p => p.programId === Number(filterProgram))?.numberOfBatches ?? 0 }, (_, i) => i + 1)
    : [];

  const pendingCount  = stats.pending;
  const approvedCount = stats.approved;
  const rejectedCount = stats.rejected;

  return (
    <div className="lmg-page">

      {/* Stats */}
      <div className="lmg-stats">
        <div className="lmg-stat">
          <span className="lmg-stat-val">{stats.total}</span>
          <span className="lmg-stat-label">Total</span>
        </div>
        <div className="lmg-stat">
          <span className="lmg-stat-val lmg-stat-val--pending">{pendingCount}</span>
          <span className="lmg-stat-label">Pending</span>
        </div>
        <div className="lmg-stat">
          <span className="lmg-stat-val lmg-stat-val--approved">{approvedCount}</span>
          <span className="lmg-stat-label">Approved</span>
        </div>
        <div className="lmg-stat">
          <span className="lmg-stat-val lmg-stat-val--rejected">{rejectedCount}</span>
          <span className="lmg-stat-label">Rejected</span>
        </div>
      </div>

      {/* Role info banner */}
      {!isTA && (
        <div className="lmg-info-banner">
          👁 You can view leave requests. Only TA Head or TA Manager can approve or reject.
        </div>
      )}

      {/* Filters */}
      <div className="lmg-filters">
        <input
          className="lmg-filter-select"
          style={{ minWidth: 180 }}
          placeholder="Search student..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <select className="lmg-filter-select" value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterBatch('all'); setPage(0); }}>
          <option value="all">All Programs</option>
          {availablePrograms.map(p => <option key={p.programId} value={String(p.programId)}>{p.programName}</option>)}
        </select>
        <select className="lmg-filter-select" value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(0); }}>
          <option value="all">All Batches</option>
          {availableBatches.map(b => <option key={b} value={String(b)}>Batch {b}</option>)}
        </select>
        <select className="lmg-filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}>
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="lmg-count">{totalElements} request{totalElements !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="lmg-empty">Loading leave requests...</div>
      ) : leaves.length === 0 ? (
        <div className="lmg-empty">No leave requests found.</div>
      ) : (
        <div className="lmg-table-wrap">
          <table className="lmg-table">
            <thead>
              <tr className="lmg-thead-row">
                <th className="lmg-th">Intern</th>
                <th className="lmg-th">Batch</th>
                <th className="lmg-th">Dates</th>
                <th className="lmg-th">Days</th>
                <th className="lmg-th">Type</th>
                <th className="lmg-th">Reason</th>
                <th className="lmg-th">Status</th>
                <th className="lmg-th">Reviewed By</th>
                {isTA && <th className="lmg-th">Action</th>}
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => {
                const st = statusLabel[l.status] ?? { label: l.status, cls: '' };
                return (
                  <tr key={l.leaveId} className="lmg-row">
                    <td className="lmg-td">
                      <p className="lmg-name">{l.studentName}</p>
                      <p className="lmg-sub">{l.programName}</p>
                    </td>
                    <td className="lmg-td">Batch {l.batchNumber}</td>
                    <td className="lmg-td">
                      <p className="lmg-date">{new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      {l.fromDate !== l.toDate && (
                        <p className="lmg-date">→ {new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      )}
                    </td>
                    <td className="lmg-td lmg-td--center">{l.totalDays}</td>
                    <td className="lmg-td"><span className="lmg-type">{l.leaveType.charAt(0) + l.leaveType.slice(1).toLowerCase()}</span></td>
                    <td className="lmg-td lmg-td--reason">{l.reason}</td>
                    <td className="lmg-td"><span className={`lmg-status ${st.cls}`}>{st.label}</span></td>
                    <td className="lmg-td">
                      {l.reviewedBy ? (
                        <div>
                          <p className="lmg-name">{l.reviewedBy}</p>
                          {l.remarks && <p className="lmg-remark">"{l.remarks}"</p>}
                        </div>
                      ) : <span className="lmg-sub">—</span>}
                    </td>
                    {isTA && (
                      <td className="lmg-td">
                        {l.status === 'PENDING' ? (
                          <button className="lmg-review-btn"
                            onClick={() => { setReviewLeave(l); setDecision('APPROVE'); setRemarks(''); }}>
                            Review
                          </button>
                        ) : <span className="lmg-sub">Done</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalElements > rowsPerPage && (
        <div className="lmg-filters" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="lmg-review-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="lmg-count">Page {page + 1} of {Math.ceil(totalElements / rowsPerPage)}</span>
          <button className="lmg-review-btn" disabled={(page + 1) * rowsPerPage >= totalElements} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {/* Review dialog — TA only */}
      {reviewLeave && isTA && (
        <div className="lmg-overlay" onClick={() => setReviewLeave(null)}>
          <div className="lmg-dialog" onClick={e => e.stopPropagation()}>
            <div className="lmg-dialog-header">
              <p className="lmg-dialog-title">Review Leave — {reviewLeave.studentName}</p>
              <button className="lmg-dialog-close" onClick={() => setReviewLeave(null)}><CloseIcon style={{ fontSize: '1.25rem' }} /></button>
            </div>
            <div className="lmg-dialog-body">
              <div className="lmg-dialog-info">
                <p><strong>Type:</strong> {reviewLeave.leaveType}</p>
                <p><strong>Dates:</strong> {reviewLeave.fromDate} → {reviewLeave.toDate} ({reviewLeave.totalDays} day{reviewLeave.totalDays > 1 ? 's' : ''})</p>
                <p><strong>Reason:</strong> {reviewLeave.reason}</p>
              </div>
              <div className="lmg-dialog-decision">
                <label className="lmg-radio-label">
                  <input type="radio" checked={decision === 'APPROVE'} onChange={() => setDecision('APPROVE')} />
                  Approve
                </label>
                <label className="lmg-radio-label">
                  <input type="radio" checked={decision === 'REJECT'} onChange={() => setDecision('REJECT')} />
                  Reject
                </label>
              </div>
              <div>
                <label className="lmg-label">Remarks (optional)</label>
                <textarea className="lmg-textarea" rows={2} value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  maxLength={500}
                  placeholder="Add a note for the intern..." />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{remarks.length}/500</span>
              </div>
              <div className="lmg-dialog-actions">
                <button className="lmg-cancel-btn" onClick={() => setReviewLeave(null)}>Cancel</button>
                <button
                  className={`lmg-submit-btn ${decision === 'APPROVE' ? 'lmg-submit-btn--approve' : 'lmg-submit-btn--reject'}`}
                  onClick={handleReview} disabled={submitting}>
                  {submitting ? 'Saving...' : decision === 'APPROVE' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementPanel;
