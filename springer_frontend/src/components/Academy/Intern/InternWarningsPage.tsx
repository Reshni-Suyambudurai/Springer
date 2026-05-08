import { useState, useEffect } from 'react';
import { useInternData } from './useInternData';
import { warningApi } from '../../../services/warning.api';
import type { InternWarningResponse } from '../../../services/warning.api';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import '../../../css/Academy/Intern/InternWarnings.css';

const severityMeta: Record<string, { label: string; cls: string; itemCls: string }> = {
  MINOR:    { label: 'Minor',    cls: 'iwarn-severity--minor',    itemCls: 'iwarn-item--minor' },
  MODERATE: { label: 'Moderate', cls: 'iwarn-severity--moderate', itemCls: 'iwarn-item--moderate' },
  SEVERE:   { label: 'Severe',   cls: 'iwarn-severity--severe',   itemCls: 'iwarn-item--severe' },
};

const statusMeta: Record<string, { label: string; cls: string }> = {
  ACTIVE:       { label: 'Active',       cls: 'iwarn-status--active' },
  ACKNOWLEDGED: { label: 'Acknowledged', cls: 'iwarn-status--acknowledged' },
};

const fmt = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const InternWarningsPage = () => {
  const { data, loading } = useInternData();
  const [warnings, setWarnings]             = useState<InternWarningResponse[]>([]);
  const [loadingWarnings, setLoadingWarnings] = useState(false);

  // Acknowledge dialog
  const [ackWarning, setAckWarning]         = useState<InternWarningResponse | null>(null);
  const [ackComment, setAckComment]         = useState('');
  const [acknowledging, setAcknowledging]   = useState(false);

  useEffect(() => {
    if (data?.studentId) fetchWarnings();
  }, [data?.studentId]);

  const fetchWarnings = async () => {
    if (!data?.studentId) return;
    try {
      setLoadingWarnings(true);
      const res = await warningApi.getWarningsByStudent(data.studentId);
      if (res.success && res.data) setWarnings(res.data);
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to load warnings', 'error');
    } finally { setLoadingWarnings(false); }
  };

  const handleAcknowledge = async () => {
    if (!ackWarning) return;
    if (!ackComment.trim()) { showToast('Please write your acknowledgement comment', 'error'); return; }
    try {
      setAcknowledging(true);
      const res = await warningApi.acknowledgeWarning(ackWarning.warningId, ackComment.trim());
      if (res.success && res.data) {
        setWarnings(prev => prev.map(w => w.warningId === ackWarning.warningId ? res.data! : w));
        setAckWarning(null);
        setAckComment('');
        showToast('Warning acknowledged', 'success');
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to acknowledge', 'error');
    } finally { setAcknowledging(false); }
  };

  const activeCount = warnings.filter(w => w.status === 'ACTIVE').length;
  const ackCount    = warnings.filter(w => w.status === 'ACKNOWLEDGED').length;

  if (loading) return <div className="iwarn-loading">Loading...</div>;

  return (
    <div className="iwarn-page">

      {/* Header */}
      <div className="iwarn-header">
        <div>
          <p className="iwarn-title">My Notices</p>
          <p className="iwarn-subtitle">{data?.programName} · Batch {data?.batchNumber}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="iwarn-stats">
        <div className="iwarn-stat">
          <span className="iwarn-stat-val">{warnings.length}</span>
          <span className="iwarn-stat-label">Total</span>
        </div>
        <div className="iwarn-stat">
          <span className="iwarn-stat-val iwarn-stat-val--active">{activeCount}</span>
          <span className="iwarn-stat-label">Active</span>
        </div>
        <div className="iwarn-stat">
          <span className="iwarn-stat-val iwarn-stat-val--ack">{ackCount}</span>
          <span className="iwarn-stat-label">Acknowledged</span>
        </div>
      </div>

      {/* Warning list */}
      <div className="iwarn-list-card">
        <p className="iwarn-list-title">Notice History</p>
        {loadingWarnings ? (
          <p className="iwarn-empty">Loading...</p>
        ) : warnings.length === 0 ? (
          <p className="iwarn-empty">No notices issued. Keep up the good work! 🎉</p>
        ) : (
          <div className="iwarn-list">
            {warnings.map(w => {
              const sev = severityMeta[w.severity] ?? { label: w.severity, cls: '', itemCls: '' };
              const st  = statusMeta[w.status]     ?? { label: w.status, cls: '' };
              return (
                <div key={w.warningId} className={`iwarn-item ${sev.itemCls}`}>
                  <div className="iwarn-item-left">
                    <div className="iwarn-item-top">
                      <span className="iwarn-item-type">{w.warningType.replace('_', ' ')}</span>
                      <span className={`iwarn-severity ${sev.cls}`}>{sev.label}</span>
                      <span className={`iwarn-status ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="iwarn-item-message">{w.message}</p>
                    <p className="iwarn-item-meta">
                      Issued by {w.issuedByName} · {fmt(w.issuedAt)}
                    </p>
                    {/* Show acknowledgement comment if acknowledged */}
                    {w.status === 'ACKNOWLEDGED' && w.acknowledgementComment && (
                      <p className="iwarn-item-meta" style={{ fontStyle: 'italic', color: 'var(--color-success-dark)', marginTop: 4 }}>
                        ✓ Your comment: "{w.acknowledgementComment}"
                      </p>
                    )}
                  </div>
                  <div className="iwarn-item-right">
                    {w.status === 'ACTIVE' && (
                      <button
                        className="iwarn-ack-btn"
                        onClick={() => { setAckWarning(w); setAckComment(''); }}>
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Acknowledge dialog */}
      {ackWarning && (
        <div className="iwarn-ack-overlay" onClick={() => setAckWarning(null)}>
          <div className="iwarn-ack-dialog" onClick={e => e.stopPropagation()}>
            <div className="iwarn-ack-dialog-header">
              <p className="iwarn-ack-dialog-title">Acknowledge Notice</p>
              <button className="iwarn-form-close" onClick={() => setAckWarning(null)}>✕</button>
            </div>
            <div className="iwarn-ack-dialog-body">
              <div className="iwarn-ack-warning-info">
                <span className={`iwarn-severity iwarn-severity--${ackWarning.severity.toLowerCase()}`}>
                  {ackWarning.severity}
                </span>
                <span className="iwarn-item-type">{ackWarning.warningType.replace('_', ' ')}</span>
              </div>
              <p className="iwarn-ack-warning-msg">{ackWarning.message}</p>
              <label className="iwarn-ack-label">
                Your Acknowledgement *
                <span className="iwarn-ack-hint"> — explain that you understand and won't repeat this</span>
              </label>
              <textarea
                className="iwarn-ack-textarea"
                rows={4}
                placeholder="e.g. I acknowledge this warning and I understand the concern. I will ensure this does not happen again."
                value={ackComment}
                onChange={e => setAckComment(e.target.value)}
              />
              <div className="iwarn-ack-actions">
                <button className="iwarn-cancel-btn" onClick={() => setAckWarning(null)}>Cancel</button>
                <button
                  className="iwarn-submit-btn"
                  disabled={acknowledging || !ackComment.trim()}
                  onClick={handleAcknowledge}>
                  {acknowledging ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternWarningsPage;
