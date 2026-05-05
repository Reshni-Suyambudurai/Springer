import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInternData } from './useInternData';
import { warningApi } from '../../../services/warning.api';
import '../../../css/Academy/Intern/InternDashboard.css';
import '../../../css/Academy/Intern/InternWarnings.css';

const InternDashboard = () => {
  const navigate = useNavigate();
  const { data, loading, retry } = useInternData();
  const [activeWarningCount, setActiveWarningCount] = useState(0);

  useEffect(() => {
    if (data?.studentId) {
      warningApi.getWarningsByStudent(data.studentId)
        .then(res => {
          if (res.success && res.data)
            setActiveWarningCount(res.data.filter(w => w.status === 'ACTIVE').length);
        })
        .catch(() => {});
    }
  }, [data?.studentId]);

  if (loading) {
    return (
      <div className="int-container">
        <div className="int-loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="int-container">
        <div className="int-empty">
          Your batch allocation is pending. Please contact your Training Coordinator.
          <button onClick={retry}
            style={{ marginTop: 12, padding: '6px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const attColor = data.attendancePercentage < 75 ? 'var(--color-error)'
    : data.attendancePercentage < 85 ? 'var(--color-warning-text)'
    : 'var(--color-success-dark)';

  const getOrdinal = (n: number) => {
    if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };
  const rankLabel = getOrdinal(data.rank);

  const statusLabel = data.status === 'PROJECT_READY' ? 'Project Ready'
    : data.status === 'AT_RISK' ? 'At Risk'
    : data.status === 'DROPPED' ? 'Dropped'
    : 'In Training';

  const statusClass = data.status === 'PROJECT_READY' ? 'int-status-badge--ready'
    : data.status === 'AT_RISK' ? 'int-status-badge--risk'
    : data.status === 'DROPPED' ? 'int-status-badge--dropped'
    : 'int-status-badge--training';

  return (
    <div className="int-container">

      {/* Header */}
      <div className="int-header">
        <div className="int-header-left">
          <h2 className="int-title">Overview</h2>
          <p className="int-subtitle">{data.programName} &middot; Batch {data.batchNumber} &middot; {data.programYear}</p>
        </div>
        <span className={`int-status-badge ${statusClass}`}>{statusLabel}</span>
      </div>

      {/* Summary Cards */}
      <div className="int-cards-row">
        <div className="int-card int-card--att">
          <span className="int-card-label">Attendance</span>
          <span className="int-card-value" style={{ color: attColor }}>
            {data.attendancePercentage.toFixed(1)}%
          </span>
          {data.attendancePercentage < 75 && (
            <span className="int-card-warn">Below 75% minimum</span>
          )}
        </div>
        <div className="int-card int-card--score">
          <span className="int-card-label">Overall Score</span>
          <span className="int-card-value">
            {data.overallWeightedScore != null ? `${data.overallWeightedScore.toFixed(1)} / 100` : '—'}
          </span>
        </div>
        <div className="int-card int-card--rank">
          <span className="int-card-label">Batch Rank</span>
          <span className="int-card-value">{rankLabel}</span>
          <span className="int-card-sub">out of {data.totalInBatch}</span>
        </div>
        <div className="int-card int-card--courses">
          <span className="int-card-label">Courses Scored</span>
          <span className="int-card-value">
            {data.courseScores.filter(c => c.score != null).length}/{data.courseScores.length}
          </span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="int-section-title">Quick Access</div>
      <div className="int-quick-links">
        {[
          { label: 'My Scores',       sub: 'View scores and batch leaderboard',      path: '/intern/scores' },
          { label: 'My Progress',      sub: 'Track your training journey',            path: '/intern/progress' },
          { label: 'Calendar',         sub: 'View attendance, schedule, and events',  path: '/intern/calendar' },
          { label: 'Certificates',     sub: 'Upload and manage certificates',         path: '/intern/certificates' },
          { label: 'My Profile',       sub: 'Update bio and profile links',           path: '/intern/profile' },
          { label: 'Leave Requests',   sub: 'Apply and track leave requests',         path: '/intern/leaves' },
          { label: 'Notices',          sub: 'View and acknowledge notices',           path: '/intern/warnings' },
        ].map(item => (
          <div key={item.path} className="int-quick-card" onClick={() => navigate(item.path)}>
            <span className="int-quick-label">{item.label}</span>
            <span className="int-quick-sub">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Active Warnings Banner */}
      {activeWarningCount > 0 && (
        <div className="iwarn-banner" onClick={() => navigate('/intern/warnings')}>
          <span className="iwarn-banner-text">
            ⚠ You have {activeWarningCount} unread notice{activeWarningCount > 1 ? 's' : ''}. Click to view and acknowledge.
          </span>
          <span className="iwarn-banner-arrow">→</span>
        </div>
      )}

      {/* At Risk Warning */}
      {data.status === 'AT_RISK' && (
        <div className="int-risk-banner">
          Your attendance is below 75%. Please attend upcoming sessions to avoid being marked at risk.
        </div>
      )}

    </div>
  );
};

export default InternDashboard;
