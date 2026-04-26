import { useState, useEffect } from 'react';
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

const LeaveManagementPanel = ({ context: _context }: { context: AcademyContextProps }) => {
  const user     = tokenstore.getUser();
  const userRole = user?.roleName?.toUpperCase() || '';
  const isTA     = userRole === 'TA_RECRUITER' || userRole === 'TA_HEAD';

  const [leaves, setLeaves]             = useState<LeaveRequestResponse[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch]   = useState('all');
  const [search, setSearch]             = useState('');

  // Review dialog — only TA
  const [reviewLeave, setReviewLeave] = useState<LeaveRequestResponse | null>(null);
  const [decision, setDecision]       = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [remarks, setRemarks]         = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getAllLeaves();
      if (res.success && res.data) setLeaves(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleReview = async () => {
    if (!reviewLeave) return;
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
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to submit review', 'error');
    } finally { setSubmitting(false); }
  };

  const availablePrograms = Array.from(new Set(leaves.map(l => l.programName))).sort();
  const availableBatches  = Array.from(new Set(
    leaves
      .filter(l => filterProgram === 'all' || l.programName === filterProgram)
      .map(l => l.batchNumber)
  )).sort((a, b) => a - b);

  const filtered = leaves.filter(l => {
    const matchStatus  = filterStatus === 'ALL'  || l.status === filterStatus;
    const matchProgram = filterProgram === 'all' || l.programName === filterProgram;
    const matchBatch   = filterBatch === 'all'   || String(l.batchNumber) === filterBatch;
    const matchSearch  = search.trim() === ''    || l.studentName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchProgram && matchBatch && matchSearch;
  });

  const pendingCount  = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  return (
    <div className="lmg-page">

      {/* Stats */}
      <div className="lmg-stats">
        <div className="lmg-stat">
          <span className="lmg-stat-val">{leaves.length}</span>
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
          👁 You can view leave requests. Only TA Head or TA Recruiter can approve or reject.
        </div>
      )}

      {/* Filters */}
      <div className="lmg-filters">
        <input
          className="lmg-filter-select"
          style={{ minWidth: 180 }}
          placeholder="Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="lmg-filter-select" value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterBatch('all'); }}>
          <option value="all">All Programs</option>
          {availablePrograms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="lmg-filter-select" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="all">All Batches</option>
          {availableBatches.map(b => <option key={b} value={String(b)}>Batch {b}</option>)}
        </select>
        <select className="lmg-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="lmg-count">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="lmg-empty">Loading leave requests...</div>
      ) : filtered.length === 0 ? (
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
              {filtered.map(l => {
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

      {/* Review dialog — TA only */}
      {reviewLeave && isTA && (
        <div className="lmg-overlay" onClick={() => setReviewLeave(null)}>
          <div className="lmg-dialog" onClick={e => e.stopPropagation()}>
            <div className="lmg-dialog-header">
              <p className="lmg-dialog-title">Review Leave — {reviewLeave.studentName}</p>
              <button className="lmg-dialog-close" onClick={() => setReviewLeave(null)}>✕</button>
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
                  placeholder="Add a note for the intern..." />
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
