import { useState, useEffect } from 'react';
import { FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { useInternData } from './useInternData';
import { leaveApi } from '../../../services/leave.api';
import type { LeaveRequestResponse } from '../../../services/leave.api';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import '../../../css/Academy/Intern/InternLeave.css';

const LEAVE_TYPES = ['SICK', 'PERSONAL', 'EMERGENCY', 'OTHER'];

const statusLabel: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',  cls: 'ilv-status--pending' },
  APPROVED: { label: 'Approved', cls: 'ilv-status--approved' },
  REJECTED: { label: 'Rejected', cls: 'ilv-status--rejected' },
};

const InternLeavePage = () => {
  const { data, loading } = useInternData();
  const [leaves, setLeaves]       = useState<LeaveRequestResponse[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Apply form
  const [showForm, setShowForm]   = useState(false);
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');
  const [leaveType, setLeaveType] = useState('SICK');
  const [reason, setReason]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data?.studentId) fetchLeaves();
  }, [data?.studentId]);

  const fetchLeaves = async () => {
    if (!data?.studentId) return;
    try {
      setLoadingLeaves(true);
      const res = await leaveApi.getLeavesByStudent(data.studentId);
      if (res.success && res.data) setLeaves(res.data);
    } catch { /* silent */ }
    finally { setLoadingLeaves(false); }
  };

  const handleApply = async () => {
    if (!fromDate) { showToast('From date is required', 'error'); return; }
    if (!toDate)   { showToast('To date is required', 'error'); return; }
    if (!reason.trim()) { showToast('Reason is required', 'error'); return; }
    if (fromDate < new Date().toISOString().split('T')[0]) { showToast('From date cannot be in the past', 'error'); return; }
    if (toDate < fromDate) { showToast('To date cannot be before From date', 'error'); return; }
    if (totalDays(fromDate, toDate) > 30) { showToast('Leave duration cannot exceed 30 days', 'error'); return; }

    try {
      setSubmitting(true);
      const res = await leaveApi.applyLeave({
        studentId: data!.studentId,
        fromDate, toDate, leaveType, reason: reason.trim(),
      });
      if (res.success) {
        showToast('Leave request submitted successfully!', 'success');
        setShowForm(false);
        setFromDate(''); setToDate(''); setLeaveType('SICK'); setReason('');
        fetchLeaves();
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to submit leave', 'error');
    } finally { setSubmitting(false); }
  };

  const totalDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const diff = new Date(to).getTime() - new Date(from).getTime();
    return Math.floor(diff / 86400000) + 1;
  };

  const pendingCount  = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  if (loading) return <div className="ilv-loading">Loading...</div>;

  return (
    <div className="ilv-page">

      {/* Header */}
      <div className="ilv-header">
        <div className="ilv-header-left">
          <p className="ilv-title">Leave Requests</p>
          <p className="ilv-subtitle">{data?.programName} · Batch {data?.batchNumber}</p>
        </div>
        <button className="ilv-apply-btn" onClick={() => setShowForm(true)}>
          + Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="ilv-stats">
        <div className="ilv-stat">
          <span className="ilv-stat-val">{leaves.length}</span>
          <span className="ilv-stat-label">Total Requests</span>
        </div>
        <div className="ilv-stat">
          <span className="ilv-stat-val ilv-stat-val--pending">{pendingCount}</span>
          <span className="ilv-stat-label">Pending</span>
        </div>
        <div className="ilv-stat">
          <span className="ilv-stat-val ilv-stat-val--approved">{approvedCount}</span>
          <span className="ilv-stat-label">Approved</span>
        </div>
        <div className="ilv-stat">
          <span className="ilv-stat-val ilv-stat-val--rejected">{rejectedCount}</span>
          <span className="ilv-stat-label">Rejected</span>
        </div>
      </div>

      {/* Apply form */}
      {showForm && (
        <div className="ilv-form-card">
          <div className="ilv-form-header">
            <p className="ilv-form-title">Apply for Leave</p>
            <button className="ilv-form-close" onClick={() => setShowForm(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></button>
          </div>
          <div className="ilv-form-body">
            <div className="ilv-form-row">
              <div className="ilv-form-field">
                <label className="ilv-label">From Date *</label>
                <input className="ilv-input" type="date" value={fromDate}
                  onChange={e => setFromDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="ilv-form-field">
                <label className="ilv-label">To Date *</label>
                <input className="ilv-input" type="date" value={toDate}
                  onChange={e => setToDate(e.target.value)} min={fromDate} />
              </div>
              <div className="ilv-form-field">
                <label className="ilv-label">Leave Type *</label>
                <select className="ilv-input" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>
            {fromDate && toDate && toDate >= fromDate && (
              <p className="ilv-days-info">
                📅 {totalDays(fromDate, toDate)} day{totalDays(fromDate, toDate) > 1 ? 's' : ''} leave
                {totalDays(fromDate, toDate) > 30 && <span style={{ color: 'var(--color-error, #d32f2f)', marginLeft: 8 }}>(max 30 days)</span>}
              </p>
            )}
            <div className="ilv-form-field">
              <label className="ilv-label">Reason *</label>
              <textarea className="ilv-input ilv-textarea" rows={3}
                placeholder="Explain your reason for leave..."
                maxLength={1000}
                value={reason} onChange={e => setReason(e.target.value)} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{reason.length}/1000</span>
            </div>
            <div className="ilv-form-actions">
              <button className="ilv-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="ilv-submit-btn" onClick={handleApply} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave history */}
      <div className="ilv-list-card">
        <p className="ilv-list-title">My Leave History</p>
        {loadingLeaves ? (
          <p className="ilv-empty">Loading...</p>
        ) : leaves.length === 0 ? (
          <p className="ilv-empty">No leave requests yet. Click "+ Apply Leave" to request one.</p>
        ) : (
          <div className="ilv-list">
            {leaves.map(l => {
              const st = statusLabel[l.status] ?? { label: l.status, cls: '' };
              return (
                <div key={l.leaveId} className="ilv-item">
                  <div className="ilv-item-left">
                    <div className="ilv-item-top">
                      <span className="ilv-item-type">{l.leaveType.charAt(0) + l.leaveType.slice(1).toLowerCase()}</span>
                      <span className={`ilv-status ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="ilv-item-dates">
                      {new Date(l.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {l.fromDate !== l.toDate && ` → ${new Date(l.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                      <span className="ilv-item-days"> · {l.totalDays} day{l.totalDays > 1 ? 's' : ''}</span>
                    </p>
                    <p className="ilv-item-reason">{l.reason}</p>
                  </div>
                  <div className="ilv-item-right">
                    {l.status !== 'PENDING' && (
                      <div className="ilv-review-row">
                        <span className={`ilv-status ${l.status === 'APPROVED' ? 'ilv-status--approved' : 'ilv-status--rejected'}`}>
                          {l.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                        {l.remarks && <span className="ilv-review-remark">"{l.remarks}"</span>}
                      </div>
                    )}
                    <p className="ilv-applied-at">
                      Applied: {new Date(l.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternLeavePage;
