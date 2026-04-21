import type { InternDashboardData } from '../../../types/Academy/intern.types';
import '../../../css/Academy/Intern/InternAttendance.css';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const InternAttendance = ({ data }: { data: InternDashboardData }) => {
  const { attendanceRecords, attendancePercentage } = data;

  const presentDays = attendanceRecords.filter(r => r.isPresent).length;
  const absentDays  = attendanceRecords.filter(r => !r.isPresent).length;
  const totalDays   = attendanceRecords.length;

  // How many consecutive days needed to reach 75%
  // (presentDays + x) / (totalDays + x) = 0.75 => x = (0.75*totalDays - presentDays) / 0.25
  const daysToReach75 = attendancePercentage < 75
    ? Math.ceil((0.75 * totalDays - presentDays) / 0.25)
    : 0;

  const attColor = attendancePercentage < 75 ? 'var(--color-error-dark)'
    : attendancePercentage < 85 ? 'var(--color-warning-text)'
    : 'var(--color-success-dark)';

  // Group by month
  const byMonth: Record<string, { date: string; isPresent: boolean }[]> = {};
  attendanceRecords.forEach(r => {
    const month = r.date.substring(0, 7);
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(r);
  });

  return (
    <div className="ina-page">

      {/* Header */}
      <div className="ina-header">
        <h3 className="ina-title">Attendance</h3>
        <p className="ina-subtitle">Your attendance record across the training period</p>
      </div>

      {/* Summary Cards */}
      <div className="ina-cards-row">
        <div className="ina-card">
          <span className="ina-card-label">Total Days</span>
          <span className="ina-card-value">{totalDays}</span>
        </div>
        <div className="ina-card ina-card--present">
          <span className="ina-card-label">Present</span>
          <span className="ina-card-value" style={{ color: 'var(--color-success-dark)' }}>{presentDays}</span>
        </div>
        <div className="ina-card ina-card--absent">
          <span className="ina-card-label">Absent</span>
          <span className="ina-card-value" style={{ color: 'var(--color-error)' }}>{absentDays}</span>
        </div>
        <div className="ina-card ina-card--pct">
          <span className="ina-card-label">Attendance</span>
          <span className="ina-card-value" style={{ color: attColor }}>{attendancePercentage.toFixed(1)}%</span>
        </div>
      </div>

      {/* Progress bar with thresholds */}
      <div className="ina-bar-section">
        <div className="ina-bar-header">
          <span className="ina-bar-label">Overall Attendance</span>
          <span className="ina-bar-pct" style={{ color: attColor }}>{attendancePercentage.toFixed(1)}%</span>
        </div>
        <div className="ina-bar-track">
          <div className="ina-bar-fill" style={{ width: `${Math.min(attendancePercentage, 100)}%`, background: attColor }} />
          <div className="ina-threshold-line" style={{ left: '75%' }} title="75% minimum" />
          <div className="ina-threshold-line ina-threshold-line--excellent" style={{ left: '85%' }} title="85% excellent" />
        </div>
        <div className="ina-threshold-labels">
          <span className="ina-threshold-text" style={{ left: '75%' }}>75% min</span>
          <span className="ina-threshold-text" style={{ left: '85%' }}>85% excellent</span>
        </div>
      </div>

      {/* Status message */}
      {attendancePercentage < 75 ? (
        <div className="ina-alert ina-alert--risk">
          <strong>Below minimum attendance.</strong> You need to attend at least {daysToReach75} more consecutive session{daysToReach75 !== 1 ? 's' : ''} to reach 75%.
        </div>
      ) : attendancePercentage < 85 ? (
        <div className="ina-alert ina-alert--warn">
          Attendance is acceptable. Attend consistently to reach 85% (excellent).
        </div>
      ) : (
        <div className="ina-alert ina-alert--good">
          Excellent attendance. Keep it up!
        </div>
      )}

      {/* Monthly heatmap */}
      {totalDays === 0 ? (
        <div className="ina-empty">No attendance records yet.</div>
      ) : (
        Object.entries(byMonth).map(([month, records]) => {
          const [year, monthNum] = month.split('-');
          const monthPresent = records.filter(r => r.isPresent).length;
          const monthPct = records.length > 0 ? Math.round((monthPresent / records.length) * 100) : 0;
          return (
            <div key={month} className="ina-month-card">
              <div className="ina-month-header">
                <span className="ina-month-title">{MONTH_NAMES[parseInt(monthNum) - 1]} {year}</span>
                <span className="ina-month-stat">{monthPresent}/{records.length} present &middot; {monthPct}%</span>
              </div>
              <div className="ina-heatmap">
                {records.map(r => (
                  <div key={r.date}
                    className={`ina-day ${r.isPresent ? 'ina-day--present' : 'ina-day--absent'}`}
                    title={`${r.date} — ${r.isPresent ? 'Present' : 'Absent'}`}>
                    <span className="ina-day-num">{parseInt(r.date.split('-')[2])}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

    </div>
  );
};

export default InternAttendance;
