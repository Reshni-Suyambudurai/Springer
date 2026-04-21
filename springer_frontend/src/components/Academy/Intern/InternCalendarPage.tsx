import { useState, useEffect } from 'react';
import { useInternData } from './useInternData';
import { academyEventApi } from '../../../services/academyEvent.api';
import type { AcademyEventResponse } from '../../../services/academyEvent.api';
import { leaveApi } from '../../../services/leave.api';
import type { LeaveRequestResponse } from '../../../services/leave.api';
import '../../../css/Academy/Intern/InternCalendar.css';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const toMid     = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
const parse     = (s: string) => toMid(new Date(s));
const sameDay   = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
const isBetween = (d: Date, s: Date, e: Date) => {
  const t = toMid(d).getTime();
  return t >= toMid(s).getTime() && t <= toMid(e).getTime();
};
const fmt      = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtShort = (d: Date)   => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const dateKey  = (d: Date)   =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

interface Bar {
  id: string;
  label: string;
  type: 'batch' | 'active' | 'planned' | 'completed' | 'event';
  start: Date;
  end: Date;
  venue?: string; // ONLINE | OFFLINE
  description?: string;
}

const InternCalendarPage = () => {
  const { data, loading } = useInternData();
  const [current, setCurrent]           = useState(new Date());
  const [internEvents, setInternEvents] = useState<AcademyEventResponse[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);

  // Fetch events + leaves together once studentId is known
  useEffect(() => {
    if (!data?.studentId) return;
    let cancelled = false;
    setExtraLoading(true);
    Promise.all([
      academyEventApi.getEventsForStudent(data.studentId).catch(() => ({ success: false, data: [] })),
      leaveApi.getLeavesByStudent(data.studentId).catch(() => ({ success: false, data: [] })),
    ]).then(([evRes, leaveRes]) => {
      if (cancelled) return;
      if (evRes.success && evRes.data)    setInternEvents(evRes.data as AcademyEventResponse[]);
      if (leaveRes.success && leaveRes.data) setLeaveRequests(leaveRes.data as LeaveRequestResponse[]);
    }).finally(() => { if (!cancelled) setExtraLoading(false); });
    return () => { cancelled = true; };
  }, [data?.studentId]);

  if (loading || extraLoading) return <div className="ical-loading">Loading calendar...</div>;
  if (!data)                   return <div className="ical-loading">No data found.</div>;

  const {
    batchStartDate, batchEndDate, courseScores, attendanceRecords,
    programName, batchNumber, attendancePercentage, totalApprovedLeaveDays,
  } = data;

  // ── Build bars ──────────────────────────────────────────────────────────────
  const bars: Bar[] = [];

  if (batchStartDate && batchEndDate) {
    bars.push({ id: 'batch', label: `${programName} · Batch ${batchNumber}`, type: 'batch',
      start: parse(batchStartDate), end: parse(batchEndDate) });
  }

  courseScores.forEach(c => {
    if (!c.courseStartDate || !c.courseEndDate) return;
    const type = c.courseStatus === 'ACTIVE' ? 'active'
      : c.courseStatus === 'COMPLETED' ? 'completed' : 'planned';
    bars.push({ id: `course-${c.courseId}`, label: c.courseName, type,
      start: parse(c.courseStartDate), end: parse(c.courseEndDate) });
  });

  internEvents.forEach(ev => {
    bars.push({
      id: `event-${ev.eventId}`,
      label: `${ev.eventType.replace('_',' ')}: ${ev.title}`,
      type: 'event',
      start: parse(ev.eventDate), end: parse(ev.eventDate),
      venue: ev.venue ?? undefined,
      description: ev.description ?? undefined,
    });
  });

  // ── Attendance map ──────────────────────────────────────────────────────────
  const attMap: Record<string, boolean> = {};
  attendanceRecords.forEach(r => { attMap[r.date] = r.isPresent; });

  const totalPresent = attendanceRecords.filter(r => r.isPresent).length;
  const totalAbsent  = attendanceRecords.filter(r => !r.isPresent).length;

  // ── Leave map ───────────────────────────────────────────────────────────────
  const leaveMap: Record<string, string> = {}; // dateKey -> leaveType
  leaveRequests.filter(l => l.status === 'APPROVED').forEach(l => {
    const s = parse(l.fromDate);
    const e = parse(l.toDate);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      leaveMap[dateKey(d)] = l.leaveType;
    }
  });

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const year        = current.getFullYear();
  const month       = current.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  const todayDate = toMid(new Date());

  const getBars  = (date: Date) => bars.filter(b => isBetween(date, b.start, b.end))
    .map(b => ({ b, isStart: sameDay(date, b.start), isEnd: sameDay(date, b.end) }));
  const getAtt   = (date: Date) => attMap[dateKey(date)] ?? null;
  const getLeave = (date: Date) => leaveMap[dateKey(date)] ?? null;
  const isToday  = (date: Date) => sameDay(date, todayDate);

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday   = () => setCurrent(new Date());

  return (
    <div className="ical-page">

      {/* ── Header ── */}
      <div className="ical-header">
        <div className="ical-header-left">
          <div className="ical-header-meta">
            <span className="ical-header-title">Calendar</span>
            <span className="ical-header-subtitle">
              {programName} · Batch {batchNumber}
              {batchStartDate && batchEndDate ? ` · ${fmt(batchStartDate)} → ${fmt(batchEndDate)}` : ''}
            </span>
          </div>

          <div className="ical-nav-shell">
            <div className="ical-nav">
              <button className="ical-nav-btn" onClick={prevMonth}>&#8249;</button>
              <button className="ical-nav-btn" onClick={nextMonth}>&#8250;</button>
            </div>
            <button className="ical-today-btn" onClick={goToday}>Today</button>
            <span className="ical-month-label">{MONTHS[month]} {year}</span>
          </div>
        </div>
        <div className="ical-header-right">
          <div className="ical-header-metrics">
            <span className="ical-header-pill ical-header-pill--present">{totalPresent} Present</span>
            <span className="ical-header-pill ical-header-pill--absent">{totalAbsent} Absent</span>
            <span className="ical-header-pill ical-header-pill--attendance">
              {attendancePercentage != null ? `${attendancePercentage.toFixed(1)}% Attendance` : 'Attendance —'}
            </span>
            <span className="ical-header-pill ical-header-pill--leave">{totalApprovedLeaveDays ?? 0} Leave Days</span>
          </div>
          <div className="ical-legend">
            <span className="ical-legend-item"><span className="ical-dot ical-dot--batch" />Batch</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--active" />Active</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--planned" />Planned</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--completed" />Done</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--event" />Event</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--present" />Present</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--absent" />Absent</span>
            <span className="ical-legend-item"><span className="ical-dot ical-dot--leave" />Leave</span>
          </div>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className="ical-grid-wrap">
        <div className="ical-weekdays">
          {DAYS.map(d => <div key={d} className="ical-weekday">{d}</div>)}
        </div>
        <div className="ical-grid">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} className="ical-cell ical-cell--empty" />;

            const dayBars    = getBars(date);
            const att        = getAtt(date);
            const leave      = getLeave(date);
            const isTodayCell = isToday(date);
            const hasContent = dayBars.length > 0 || att !== null || leave !== null;

            const active    = dayBars.filter(x => x.b.type === 'active').length;
            const planned   = dayBars.filter(x => x.b.type === 'planned').length;
            const completed = dayBars.filter(x => x.b.type === 'completed').length;
            const events    = dayBars.filter(x => x.b.type === 'event').length;
            const summaryParts: string[] = [];
            if (active > 0)    summaryParts.push(`${active} active`);
            if (planned > 0)   summaryParts.push(`${planned} planned`);
            if (completed > 0) summaryParts.push(`${completed} done`);
            if (events > 0)    summaryParts.push(`${events} event${events > 1 ? 's' : ''}`);

            return (
              <div key={idx}
                className={[
                  'ical-cell',
                  isTodayCell ? 'ical-cell--today' : '',
                  leave       ? 'ical-cell--leave' : '',
                  hasContent  ? 'ical-cell--clickable' : '',
                ].join(' ')}
                onClick={() => hasContent && setSelectedDay(date)}>

                <span className="ical-day-num">{date.getDate()}</span>

                {/* Top-right indicator: leave badge takes priority over att dot */}
                {leave !== null ? (
                  <span className="ical-leave-dot" title={`On Leave (${leave})`}>L</span>
                ) : att !== null ? (
                  <span className={`ical-att-dot ${att ? 'ical-att-dot--present' : 'ical-att-dot--absent'}`}
                    title={att ? 'Present' : 'Absent'} />
                ) : null}

                {/* Dots row */}
                <div className="ical-dots-row">
                  {dayBars.some(x => x.b.type === 'batch')     && <span className="ical-dot ical-dot--batch"     title="Batch Period" />}
                  {dayBars.some(x => x.b.type === 'active')    && <span className="ical-dot ical-dot--active"    title="Course Active" />}
                  {dayBars.some(x => x.b.type === 'planned')   && <span className="ical-dot ical-dot--planned"   title="Course Planned" />}
                  {dayBars.some(x => x.b.type === 'completed') && <span className="ical-dot ical-dot--completed" title="Completed" />}
                  {dayBars.some(x => x.b.type === 'event')     && <span className="ical-dot ical-dot--event"     title="Event" />}
                </div>

                {summaryParts.length > 0 && (
                  <span className="ical-day-summary">{summaryParts.join(' · ')}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Day detail popup ── */}
      {selectedDay && (() => {
        const dayBars    = getBars(selectedDay);
        const att        = getAtt(selectedDay);
        const leaveOnDay = leaveRequests.find(l =>
          l.status === 'APPROVED' && isBetween(selectedDay, parse(l.fromDate), parse(l.toDate))
        );
        const dateLabel = selectedDay.toLocaleDateString('en-IN', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
        });
        const hasAnything = att !== null || leaveOnDay || dayBars.length > 0;

        return (
          <div className="ical-popup-overlay" onClick={() => setSelectedDay(null)}>
            <div className="ical-popup" onClick={e => e.stopPropagation()}>
              <div className="ical-popup-header">
                <span className="ical-popup-date">{dateLabel}</span>
                <button className="ical-popup-close" onClick={() => setSelectedDay(null)}>✕</button>
              </div>
              <div className="ical-popup-body">

                {/* Attendance */}
                {att !== null && (
                  <div className={`ical-popup-att ${att ? 'ical-popup-att--present' : 'ical-popup-att--absent'}`}>
                    {att ? '✓ You were Present' : '✗ You were Absent'}
                  </div>
                )}

                {/* Leave */}
                {leaveOnDay && (
                  <div className="ical-popup-att ical-popup-att--leave">
                    🏖 On Approved Leave · {leaveOnDay.leaveType} · {leaveOnDay.reason}
                  </div>
                )}

                {/* Courses */}
                {dayBars.filter(x => x.b.type !== 'event' && x.b.type !== 'batch').length > 0 && (
                  <div className="ical-popup-section">
                    <p className="ical-popup-section-title">Courses</p>
                    {dayBars.filter(x => x.b.type !== 'event' && x.b.type !== 'batch').map(({ b, isStart, isEnd }) => (
                      <div key={b.id} className={`ical-popup-item ical-popup-item--${b.type}`}>
                        <span className="ical-popup-item-name">{b.label}</span>
                        <span className="ical-popup-item-dates">
                          {isStart && isEnd ? 'Single day'
                            : isStart ? `Starts today → ${fmtShort(b.end)}`
                            : isEnd   ? `${fmtShort(b.start)} → Ends today`
                            : `${fmtShort(b.start)} → ${fmtShort(b.end)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Events */}
                {dayBars.filter(x => x.b.type === 'event').length > 0 && (
                  <div className="ical-popup-section">
                    <p className="ical-popup-section-title">Events</p>
                    {dayBars.filter(x => x.b.type === 'event').map(({ b }) => (
                      <div key={b.id} className="ical-popup-item ical-popup-item--event">
                        <span className="ical-popup-item-name">{b.label}</span>
                        {b.description && <span className="ical-popup-item-dates">{b.description}</span>}
                        {b.venue && (
                          <span className="ical-popup-item-dates">
                            {b.venue === 'ONLINE' ? '🌐 Online' : '📍 Offline'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!hasAnything && (
                  <p className="ical-popup-empty">No activity on this day.</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default InternCalendarPage;
