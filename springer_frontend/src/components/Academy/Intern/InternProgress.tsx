import type { InternDashboardData } from '../../../types/Academy/intern.types';
import { generateProgressReport } from '../../../utils/progressReport';
import '../../../css/Academy/Intern/InternProgress.css';

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';

const InternProgress = ({ data }: { data: InternDashboardData }) => {
  const { status, batchStartDate, batchEndDate, attendancePercentage,
          overallWeightedScore, performance, courseScores } = data;

  const isTransferred = !!(data as any).transferredFromStudentId;

  // Days remaining in batch
  const daysRemaining = batchEndDate
    ? Math.max(0, Math.ceil((new Date(batchEndDate).getTime() - Date.now()) / 86400000))
    : null;

  // Readiness score — composite of attendance + weighted score
  const readinessScore = (() => {
    const attScore = Math.min(attendancePercentage, 100);
    const scoreScore = overallWeightedScore != null ? overallWeightedScore : 0;
    return Math.round((attScore * 0.4 + scoreScore * 0.6));
  })();

  const steps = [
    {
      key: 'JOINED',
      label: isTransferred ? 'Transferred to This Batch' : 'Joined Training',
      desc: isTransferred
        ? `Transferred — batch started ${fmt(batchStartDate)}`
        : `Batch started ${fmt(batchStartDate)}`,
      done: true,
      active: false,
    },
    {
      key: 'TRAINING',
      label: 'In Training',
      desc: `${courseScores.filter(c => c.score != null).length} of ${courseScores.length} courses scored`,
      done: overallWeightedScore != null,
      active: status === 'IN_TRAINING' || status === 'AT_RISK',
    },
    {
      key: 'ASSESSMENT',
      label: 'Assessment Complete',
      desc: overallWeightedScore != null
        ? `Overall score: ${overallWeightedScore.toFixed(1)} / 100`
        : 'Awaiting all course scores',
      done: status === 'PROJECT_READY',
      active: overallWeightedScore != null && status !== 'PROJECT_READY',
    },
    {
      key: 'PROJECT_READY',
      label: 'Project Ready',
      desc: batchEndDate ? `Expected by ${fmt(batchEndDate)}` : 'Pending completion',
      done: status === 'PROJECT_READY',
      active: false,
    },
  ];

  const statusClass = status === 'PROJECT_READY' ? 'inp-status--ready'
    : status === 'AT_RISK' ? 'inp-status--risk'
    : status === 'DROPPED' ? 'inp-status--dropped'
    : 'inp-status--training';

  const statusLabel = status === 'PROJECT_READY' ? 'Project Ready'
    : status === 'AT_RISK' ? 'At Risk'
    : status === 'DROPPED' ? 'Dropped'
    : 'In Training';

  return (
    <div className="inp-page">

      {/* Header */}
      <div className="inp-header">
        <div>
          <h3 className="inp-title">My Progress</h3>
          <p className="inp-subtitle">Track your training journey from joining to project ready</p>
        </div>
        <span className={`inp-status-badge ${statusClass}`}>{statusLabel}</span>
        <button
          className="inp-download-btn"
          onClick={() => generateProgressReport(data)}
          title="Download Progress Report as PDF"
        >
          ⬇ Download Report
        </button>
      </div>

      {/* Stats row */}
      <div className="inp-stats-row">
        <div className="inp-stat-card">
          <span className="inp-stat-label">Attendance</span>
          <span className="inp-stat-val" style={{ color: attendancePercentage < 75 ? 'var(--color-error)' : 'var(--color-success-dark)' }}>
            {attendancePercentage.toFixed(1)}%
          </span>
        </div>
        <div className="inp-stat-card">
          <span className="inp-stat-label">Overall Score</span>
          <span className="inp-stat-val">{overallWeightedScore != null ? `${overallWeightedScore.toFixed(1)} / 100` : '—'}</span>
        </div>
        <div className="inp-stat-card">
          <span className="inp-stat-label">Courses Done</span>
          <span className="inp-stat-val">{courseScores.filter(c => c.score != null).length}/{courseScores.length}</span>
        </div>
        <div className="inp-stat-card">
          <span className="inp-stat-label">Days Remaining</span>
          <span className="inp-stat-val">{daysRemaining != null ? daysRemaining : '—'}</span>
        </div>
        <div className="inp-stat-card">
          <span className="inp-stat-label">Readiness Score</span>
          <span className="inp-stat-val" style={{ color: readinessScore >= 75 ? 'var(--color-success-dark)' : 'var(--color-warning-text)' }}>
            {readinessScore}%
          </span>
        </div>
      </div>

      {/* Readiness bar */}
      <div className="inp-readiness-section">
        <div className="inp-readiness-header">
          <span className="inp-readiness-label">Project Readiness</span>
          <span className="inp-readiness-pct">{readinessScore}%</span>
        </div>
        <div className="inp-readiness-bar-bg">
          <div className="inp-readiness-bar-fill"
            style={{ width: `${readinessScore}%`, background: readinessScore >= 75 ? 'var(--color-success-dark)' : readinessScore >= 50 ? 'var(--color-warning-text)' : 'var(--color-error)' }} />
        </div>
        <p className="inp-readiness-note">Readiness = 40% Attendance + 60% Overall Score</p>
      </div>

      {/* Timeline */}
      <div className="inp-section-title">Training Journey</div>
      <div className="inp-timeline">
        {steps.map((step, idx) => (
          <div key={step.key} className="inp-step-wrap">
            <div className={`inp-step ${step.done ? 'inp-step--done' : step.active ? 'inp-step--active' : 'inp-step--pending'}`}>
              <div className="inp-step-num">
                {step.done ? '✓' : idx + 1}
              </div>
              <div className="inp-step-body">
                <span className="inp-step-label">{step.label}</span>
                <span className="inp-step-desc">{step.desc}</span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`inp-connector ${step.done ? 'inp-connector--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Performance */}
      {performance && (
        <div className="inp-perf-row">
          <span className="inp-perf-label">Current Performance Rating:</span>
          <span className={`inp-perf-badge inp-perf-badge--${performance.toLowerCase().replace('_', '-')}`}>
            {performance.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Batch dates */}
      <div className="inp-dates-row">
        <div className="inp-date-item">
          <span className="inp-date-label">Batch Start</span>
          <span className="inp-date-val">{fmt(batchStartDate)}</span>
        </div>
        <div className="inp-date-sep" />
        <div className="inp-date-item">
          <span className="inp-date-label">Batch End</span>
          <span className="inp-date-val">{fmt(batchEndDate)}</span>
        </div>
        {daysRemaining != null && daysRemaining > 0 && (
          <>
            <div className="inp-date-sep" />
            <div className="inp-date-item">
              <span className="inp-date-label">Days Remaining</span>
              <span className="inp-date-val">{daysRemaining} days</span>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default InternProgress;
