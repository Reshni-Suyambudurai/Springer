import { useState, useEffect } from 'react';
import { warningApi } from '../../../services/warning.api';
import type { InternWarningResponse } from '../../../services/warning.api';
import { batchAllocationApi } from '../../../services/academy.api';
import type { BatchAllocationResponse } from '../../../types/Academy/academy.types';
import { tokenstore } from '../../../auth/tokenstore';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import type { AcademyContextProps } from '../../../types/Academy/academy.types';
import '../../../css/Academy/Intern/InternWarnings.css';
import '../../../css/Academy/TrainingCoordinator/LeaveManagement.css';

const severityMeta: Record<string, { cls: string }> = {
  MINOR:    { cls: 'iwarn-severity--minor' },
  MODERATE: { cls: 'iwarn-severity--moderate' },
  SEVERE:   { cls: 'iwarn-severity--severe' },
};

const statusMeta: Record<string, { cls: string }> = {
  ACTIVE:       { cls: 'iwarn-status--active' },
  ACKNOWLEDGED: { cls: 'iwarn-status--acknowledged' },
};

const fmt = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const WarningsPanel = ({ context: _context }: { context: AcademyContextProps }) => {
  const user = tokenstore.getUser();

  const [warnings, setWarnings]       = useState<InternWarningResponse[]>([]);
  const [allocations, setAllocations] = useState<BatchAllocationResponse[]>([]);
  const [loading, setLoading]         = useState(true);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType]     = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch]   = useState('all');
  const [search, setSearch]             = useState('');

  const [showForm, setShowForm]         = useState(false);
  const [formStudent, setFormStudent]   = useState('');
  const [formType, setFormType]         = useState('BEHAVIOUR');
  const [formSeverity, setFormSeverity] = useState('MINOR');
  const [formMessage, setFormMessage]   = useState('');
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [warnRes, allocRes] = await Promise.all([
        warningApi.getAllWarnings(),
        batchAllocationApi.getAllAllocations().catch(() => ({ success: false, data: [] })),
      ]);
      if (warnRes.success && warnRes.data) {
        const sorted = [...warnRes.data].sort((a, b) =>
          (b.issuedAt ?? '').localeCompare(a.issuedAt ?? '')
        );
        setWarnings(sorted);
      }
      if (allocRes.success && allocRes.data) setAllocations(allocRes.data as BatchAllocationResponse[]);
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to load warnings', 'error');
    } finally { setLoading(false); }
  };

  const handleIssueWarning = async () => {
    if (!formStudent || !formMessage.trim()) {
      showToast('Please select an intern and enter a message', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await warningApi.issueWarning({
        studentId: Number(formStudent),
        issuedBy: user?.userId ?? 0,
        warningType: formType,
        severity: formSeverity,
        message: formMessage.trim(),
      });
      if (res.success && res.data) {
        setWarnings(prev => [res.data!, ...prev]);
        setShowForm(false);
        setFormStudent(''); setFormMessage(''); setFormType('BEHAVIOUR'); setFormSeverity('MINOR');
        showToast('Warning issued successfully', 'success');
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to issue warning', 'error');
    } finally { setSubmitting(false); }
  };

  const filtered = warnings.filter(w => {
    const matchStatus  = filterStatus === 'ALL'  || w.status === filterStatus;
    const matchType    = filterType === 'ALL'    || w.warningType === filterType;
    const matchProgram = filterProgram === 'all' || w.programName === filterProgram;
    const matchBatch   = filterBatch === 'all'   || String(w.batchNumber) === filterBatch;
    const matchSearch  = search.trim() === ''    || w.studentName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchProgram && matchBatch && matchSearch;
  });

  const activeCount  = warnings.filter(w => w.status === 'ACTIVE').length;
  const ackCount     = warnings.filter(w => w.status === 'ACKNOWLEDGED').length;
  const activeAllocs = allocations.filter(a => a.isActive);
  const availablePrograms = Array.from(new Set(warnings.map(w => w.programName))).sort();
  const availableBatches  = Array.from(new Set(
    warnings
      .filter(w => filterProgram === 'all' || w.programName === filterProgram)
      .map(w => w.batchNumber)
  )).sort((a, b) => a - b);

  return (
    <div className="iwarn-page">

      {/* Stats + Issue button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="iwarn-stats" style={{ flex: 1 }}>
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
        <button className="lmg-review-btn"
          style={{ padding: '8px 18px', fontWeight: 700, fontSize: 'var(--text-sm)' }}
          onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Issue Notice'}
        </button>
      </div>

      {/* Issue warning form */}
      {showForm && (
        <div className="iwarn-list-card">
          <p className="iwarn-list-title">Issue New Warning</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="lmg-label">Intern *</label>
                <select className="lmg-filter-select" style={{ width: '100%' }}
                  value={formStudent} onChange={e => setFormStudent(e.target.value)}>
                  <option value="">Select intern...</option>
                  {activeAllocs.map(a => (
                    <option key={a.studentId} value={String(a.studentId)}>
                      {a.candidateName} — Batch {a.batchNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="lmg-label">Type *</label>
                <select className="lmg-filter-select" style={{ width: '100%' }}
                  value={formType} onChange={e => setFormType(e.target.value)}>
                  {['ATTENDANCE','PERFORMANCE','BEHAVIOUR','PUNCTUALITY','OTHER'].map(t =>
                    <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 110, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="lmg-label">Severity *</label>
                <select className="lmg-filter-select" style={{ width: '100%' }}
                  value={formSeverity} onChange={e => setFormSeverity(e.target.value)}>
                  {['MINOR','MODERATE','SEVERE'].map(s =>
                    <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="lmg-label">Message *</label>
              <textarea className="lmg-textarea" rows={3}
                placeholder="Describe the reason for this warning..."
                value={formMessage} onChange={e => setFormMessage(e.target.value)} />
            </div>
            <div className="lmg-dialog-actions">
              <button className="lmg-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="lmg-submit-btn lmg-submit-btn--approve"
                disabled={submitting || !formStudent || !formMessage.trim()}
                onClick={handleIssueWarning}>
                {submitting ? 'Issuing...' : 'Issue Warning'}
              </button>
            </div>
          </div>
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
          <option value="ACTIVE">Active</option>
          <option value="ACKNOWLEDGED">Acknowledged</option>
        </select>
        <select className="lmg-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="ALL">All Types</option>
          {['ATTENDANCE','PERFORMANCE','BEHAVIOUR','PUNCTUALITY','OTHER'].map(t =>
            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
        </select>
        <span className="lmg-count">{filtered.length} notice{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="lmg-empty">Loading notices...</div>
      ) : filtered.length === 0 ? (
        <div className="lmg-empty">No notices found.</div>
      ) : (
        <div className="lmg-table-wrap">
          <table className="lmg-table">
            <thead>
              <tr className="lmg-thead-row">
                <th className="lmg-th">Intern</th>
                <th className="lmg-th">Batch</th>
                <th className="lmg-th">Type</th>
                <th className="lmg-th">Severity</th>
                <th className="lmg-th">Message</th>
                <th className="lmg-th">Issued By</th>
                <th className="lmg-th">Date</th>
                <th className="lmg-th">Status</th>
                <th className="lmg-th">Intern's Comment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.warningId} className="lmg-row">
                  <td className="lmg-td">
                    <p className="lmg-name">{w.studentName}</p>
                    <p className="lmg-sub">{w.programName}</p>
                  </td>
                  <td className="lmg-td">Batch {w.batchNumber}</td>
                  <td className="lmg-td">
                    <span className="iwarn-item-type">{w.warningType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </td>
                  <td className="lmg-td">
                    <span className={`iwarn-severity ${severityMeta[w.severity]?.cls ?? ''}`}>{w.severity.charAt(0) + w.severity.slice(1).toLowerCase()}</span>
                  </td>
                  <td className="lmg-td lmg-td--reason">{w.message}</td>
                  <td className="lmg-td lmg-sub">{w.issuedByName}</td>
                  <td className="lmg-td lmg-sub">{fmt(w.issuedAt)}</td>
                  <td className="lmg-td">
                    <span className={`iwarn-status ${statusMeta[w.status]?.cls ?? ''}`}>{w.status.charAt(0) + w.status.slice(1).toLowerCase()}</span>
                  </td>
                  <td className="lmg-td lmg-td--reason">
                    {w.acknowledgementComment
                      ? <span style={{ fontStyle: 'italic', color: 'var(--color-success-dark)' }}>"{w.acknowledgementComment}"</span>
                      : <span className="lmg-sub">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WarningsPanel;
