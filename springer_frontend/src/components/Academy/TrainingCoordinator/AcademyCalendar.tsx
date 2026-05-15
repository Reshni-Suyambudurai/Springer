import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, Typography, CircularProgress, IconButton,
  Button, MenuItem, FormControl, Select,
  Dialog, DialogTitle, DialogContent, Chip,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
  batchScheduleApi, batchCourseApi,
  batchAllocationApi, attendanceApi,
  trainingProgramApi,
} from '../../../services/academy.api';
import { academyEventApi } from '../../../services/academyEvent.api';
import type { AcademyEventResponse } from '../../../services/academyEvent.api';
import { tokenstore } from '../../../auth/tokenstore';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import type {
  AcademyContextProps, BatchScheduleResponse,
  BatchCourseResponse,
  BatchAllocationResponse, AttendanceResponse,
} from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/AcademyCalendar.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const toMidnight = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
const parseDate  = (s: string) => toMidnight(new Date(s));
const sameDay    = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
const isBetween  = (date: Date, start: Date, end: Date) => {
  const d = toMidnight(date).getTime();
  return d >= toMidnight(start).getTime() && d <= toMidnight(end).getTime();
};

// ── Multi-day bar types ───────────────────────────────────────────────────────
interface MultiDayBar {
  id: string;
  label: string;
  type: 'batch' | 'course-planned' | 'course-active' | 'course-completed' | 'course-cancelled' | 'event';
  startDate: Date;
  endDate: Date;
  batchNo?: number;
  venue?: string; // ONLINE | OFFLINE
}

interface DayAtt { present: number; absent: number; }

// ── Component ─────────────────────────────────────────────────────────────────
const AcademyCalendar: React.FC<{ context?: AcademyContextProps }> = ({ context }) => {
  const currentYear = new Date().getFullYear();
  const [standalonePrograms, setStandalonePrograms] = useState<import('../../../types/Academy/academy.types').TrainingProgramResponse[]>([]);

  useEffect(() => {
    if (!context) {
      trainingProgramApi.getAllPrograms(true)
        .then(res => { if (res.success && res.data) setStandalonePrograms(res.data); })
        .catch(() => {});
    }
  }, [context]);

  const programYear = context?.programYear ?? currentYear;
  const yearPrograms = context?.programs ?? standalonePrograms.filter(p => p.programYear === programYear);
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  const [loading, setLoading]             = useState(true);
  const [currentDate, setCurrentDate]     = useState(new Date());
  const [selectedYear, setSelectedYear]   = useState(currentYear);
  const [schedules, setSchedules]         = useState<BatchScheduleResponse[]>([]);
  const [batchCourses, setBatchCourses]   = useState<BatchCourseResponse[]>([]);
  const [attMap, setAttMap]               = useState<Record<string, DayAtt>>({});
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterBatch, setFilterBatch]     = useState('all');
  const [viewMode, setViewMode]           = useState<'month' | 'week'>('month');
  const [selectedDay, setSelectedDay]     = useState<Date | null>(null);
  const [events, setEvents]               = useState<AcademyEventResponse[]>([]);
  const user = tokenstore.getUser();

  // Add event dialog
  const [addEventOpen, setAddEventOpen]   = useState(false);
  const [evtTitle, setEvtTitle]           = useState('');
  const [evtDesc, setEvtDesc]             = useState('');
  const [evtDate, setEvtDate]             = useState('');
  const [evtTime, setEvtTime]             = useState('');
  const [evtType, setEvtType]             = useState('MEETING');
  const [evtVenue, setEvtVenue]           = useState('ONLINE');
  const [evtProgram, setEvtProgram]       = useState<number | null>(null);
  const [evtBatches, setEvtBatches]         = useState<number[]>([]);
  const [savingEvent, setSavingEvent]     = useState(false);

  useEffect(() => {
    fetchData();
    fetchEvents();
    setFilterProgram('all');
    setFilterBatch('all');
  }, [programYear]);

  const fetchEvents = async () => {
    try {
      const res = await academyEventApi.getAllEvents();
      if (res.success && res.data) setEvents(res.data);
    } catch { /* silent */ }
  };

  const handleSaveEvent = async () => {
    if (!evtTitle.trim()) { showToast('Title is required', 'error'); return; }
    if (!evtDate) { showToast('Date is required', 'error'); return; }
    try {
      setSavingEvent(true);
      const res = await academyEventApi.createEvent({
        title: evtTitle.trim(),
        description: evtDesc.trim() || undefined,
        eventDate: evtDate,
        eventTime: evtTime || undefined,
        eventType: evtType,
        venue: evtVenue || undefined,
        programId: evtProgram,
        batchNumbers: evtBatches.length > 0 ? evtBatches : null,
        createdBy: user?.userId ?? 0,
      });
      if (res.success) {
        showToast('Event created successfully', 'success');
        setAddEventOpen(false);
        setEvtTitle(''); setEvtDesc(''); setEvtDate(''); setEvtTime('');
        setEvtType('MEETING'); setEvtVenue('ONLINE'); setEvtProgram(null); setEvtBatches([]);
        fetchEvents();
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to create event', 'error');
    } finally {
      setSavingEvent(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const progIds = yearPrograms.map(p => p.programId);

      // Fetch batch courses, allocations, and schedules per year-scoped program in parallel
      const [bcResults, allocResults, schedResults] = await Promise.all([
        Promise.allSettled(progIds.map(id => batchCourseApi.getCoursesByProgram(id))),
        Promise.allSettled(progIds.map(id => batchAllocationApi.getAllocationsByProgram(id, true))),
        Promise.allSettled(progIds.map(id => batchScheduleApi.getByProgram(id))),
      ]);

      const allBCs: BatchCourseResponse[] = [];
      bcResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data)
          allBCs.push(...r.value.data);
      });
      setBatchCourses(allBCs);

      const allocs: BatchAllocationResponse[] = [];
      allocResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data)
          allocs.push(...r.value.data);
      });

      const allScheds: BatchScheduleResponse[] = [];
      schedResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data)
          allScheds.push(...r.value.data);
      });
      setSchedules(allScheds);

      const active = allocs.filter(a => a.isActive);
      const attResults = await Promise.allSettled(active.map(a => attendanceApi.getAttendanceRecords(a.studentId)));
      const map: Record<string, DayAtt> = {};
      attResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data) {
          r.value.data.forEach((rec: AttendanceResponse) => {
            const key = String(rec.attendanceDate);
            if (!map[key]) map[key] = { present: 0, absent: 0 };
            if (rec.isPresent) map[key].present++; else map[key].absent++;
          });
        }
      });
      setAttMap(map);
    } catch (error: unknown) {
      showToast((error as { message?: string })?.message || 'Failed to load calendar data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday   = () => setCurrentDate(new Date());
  const changeYear = (year: number) => { setSelectedYear(year); setCurrentDate(new Date(year, currentDate.getMonth(), 1)); };

  // ── Scoped data ───────────────────────────────────────────────────────────
  const scopedPrograms = yearPrograms.filter(p =>
    filterProgram === 'all' || String(p.programId) === filterProgram
  );
  const scopedProgramIds = new Set(scopedPrograms.map(p => p.programId));

  // Available batches for selected program
  const availableBatches = Array.from(new Set(
    schedules
      .filter(s => scopedProgramIds.has(s.programId))
      .map(s => s.batchNumber)
  )).sort((a, b) => a - b);

  const scopedSchedules = schedules.filter(s =>
    scopedProgramIds.has(s.programId) &&
    (filterBatch === 'all' || String(s.batchNumber) === filterBatch)
  );
  const scopedBatchCourses = batchCourses.filter(bc =>
    scopedProgramIds.has(bc.programId) &&
    bc.startDate && bc.endDate &&
    (filterBatch === 'all' || String(bc.batchNo) === filterBatch)
  );

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const multiDayBars: MultiDayBar[] = [];

  // Batch duration bars
  scopedSchedules.forEach(s => {
    const prog = yearPrograms.find(p => p.programId === s.programId);
    multiDayBars.push({
      id: `batch-${s.batchScheduleId}`,
      label: `Batch ${s.batchNumber} · ${prog?.programName ?? 'Program'}`,
      type: 'batch',
      startDate: parseDate(s.startDate),
      endDate: parseDate(s.endDate),
      batchNo: s.batchNumber,
    });
  });

  // Course duration bars
  scopedBatchCourses.forEach(bc => {
    const status = bc.status?.toLowerCase() ?? 'planned';
    const type = status === 'active' ? 'course-active'
      : status === 'completed' ? 'course-completed'
      : status === 'cancelled' ? 'course-cancelled'
      : 'course-planned';
    multiDayBars.push({
      id: `course-${bc.batchCourseId}`,
      label: `${bc.courseName ?? 'Course'} (B${bc.batchNo})`,
      type,
      startDate: parseDate(bc.startDate!),
      endDate: parseDate(bc.endDate!),
      batchNo: bc.batchNo,
    });
  });

  // Academy events — scoped to selected programs (null programId = global event)
  const scopedEvents = events.filter(ev =>
    ev.programId == null || scopedProgramIds.has(ev.programId)
  );
  scopedEvents.forEach(ev => {
    const evDate = parseDate(ev.eventDate);
    multiDayBars.push({
      id: `event-${ev.eventId}`,
      label: `${ev.eventType}: ${ev.title}`,
      type: 'event',
      startDate: evDate,
      endDate: evDate,
      venue: ev.venue ?? undefined,
    });
  });

  // Batches available for the selected program in the Add Event form
  const evtAvailableBatches = Array.from(new Set(
    schedules
      .filter(s => evtProgram != null ? s.programId === evtProgram : true)
      .map(s => s.batchNumber)
  )).sort((a, b) => a - b);
  const getCalendarDays = (): (Date | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  // For each day, get which bars are active (for the continuous bar rendering)
  const getBarsForDay = (date: Date | null): { bar: MultiDayBar; isStart: boolean; isEnd: boolean }[] => {
    if (!date) return [];
    return multiDayBars
      .filter(bar => isBetween(date, bar.startDate, bar.endDate))
      .map(bar => ({
        bar,
        isStart: sameDay(date, bar.startDate),
        isEnd:   sameDay(date, bar.endDate),
      }));
  };

  const getAttForDate = (date: Date | null): DayAtt | null => {
    if (!date) return null;
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return attMap[key] ?? null;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return sameDay(date, new Date());
  };

  // Day detail popup data
  const getDayDetail = (date: Date) => {
    const bars = getBarsForDay(date);
    const att  = getAttForDate(date);
    return { bars, att };
  };

  const calendarDays = getCalendarDays();

  const barTypeClass: Record<string, string> = {
    'batch':            'acal-bar--batch',
    'course-planned':   'acal-bar--planned',
    'course-active':    'acal-bar--active',
    'course-completed': 'acal-bar--completed',
    'course-cancelled': 'acal-bar--cancelled',
    'event':            'acal-bar--event',
  };

  // ── Week view helpers ──
  const WEEK_HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 – 19:00

  const getWeekDays = (): Date[] => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0=Sun
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + i);
      dt.setHours(0, 0, 0, 0);
      return dt;
    });
  };

  const weekDays = useMemo(() => getWeekDays(), [currentDate]);

  const getWeekBarsForDay = (date: Date) => {
    return multiDayBars
      .filter(bar => isBetween(date, bar.startDate, bar.endDate))
      .map(bar => {
        const evt = events.find(e => bar.id === `event-${e.eventId}`);
        const timeStr = evt?.eventTime || '09:00';
        const [h, m] = timeStr.split(':').map(Number);
        return { bar, hour: h || 9, minute: m || 0, type: bar.type, evt };
      });
  };

  return (
    <Box className="acal-container">

      {/* ── Toolbar row 1: Filters left, Navigation right ── */}
      <Box className="acal-toolbar">
        <Box className="acal-toolbar-left">
          <FormControl size="small" className="acal-program-select">
            <Select value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterBatch('all'); }} displayEmpty>
              <MenuItem value="all">All Programs</MenuItem>
              {yearPrograms.map(p => <MenuItem key={p.programId} value={String(p.programId)}>{p.programName}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" className="acal-batch-select">
            <Select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} displayEmpty>
              <MenuItem value="all">All Batches</MenuItem>
              {availableBatches.map(b => <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" onClick={() => setAddEventOpen(true)}
            sx={{ background: 'var(--color-primary)', textTransform: 'none', fontWeight: 600, borderRadius: '6px', whiteSpace: 'nowrap', px: 2 }}>
            + Add Event
          </Button>
        </Box>

        <Box className="acal-toolbar-right">
          <Button variant="outlined" onClick={goToday} className="acal-today-btn">Today</Button>
          <Box className="acal-nav-buttons">
            <IconButton onClick={prevMonth} className="acal-nav-btn"><ChevronLeftIcon /></IconButton>
            <IconButton onClick={nextMonth} className="acal-nav-btn"><ChevronRightIcon /></IconButton>
          </Box>
          <Typography variant="h6" className="acal-month-year">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
        </Box>
      </Box>

      {/* ── Toolbar row 2: Legend left, View toggle right ── */}
      <Box className="acal-toolbar acal-toolbar--secondary">
        <Box className="acal-legend">
          {[
            { cls: 'acal-legend-batch',     label: 'Batch Period' },
            { cls: 'acal-legend-active',    label: 'Course Active' },
            { cls: 'acal-legend-planned',   label: 'Course Planned' },
            { cls: 'acal-legend-completed', label: 'Completed' },
            { cls: 'acal-legend-event',     label: 'Event' },
            { cls: 'acal-legend-present',   label: 'Present' },
            { cls: 'acal-legend-absent',    label: 'Absent' },
          ].map(l => (
            <Box key={l.label} className="acal-legend-item">
              <span className={`acal-legend-color ${l.cls}`} />
              <Typography variant="body2">{l.label}</Typography>
            </Box>
          ))}
        </Box>
        <Box className="acal-view-toggle">
          <CalendarTodayIcon sx={{ fontSize: 18, color: 'var(--color-text-secondary)' }} />
          <FormControl size="small">
            <Select
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'month' | 'week')}
              className="acal-view-select"
            >
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="week">Week</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* ── Calendar Grid ── */}
      {loading ? (
        <Box className="acal-loading">
          <CircularProgress />
          <Typography>Loading academy schedule...</Typography>
        </Box>
      ) : viewMode === 'month' ? (
        <Card className="acal-grid-container">

          {/* Weekday headers */}
          <Box className="acal-weekday-header">
            {DAYS_OF_WEEK.map(day => (
              <Box key={day} className="acal-weekday-cell">
                <Typography variant="subtitle2" className="acal-weekday-label">{day}</Typography>
              </Box>
            ))}
          </Box>

          {/* Days */}
          <Box className="acal-grid">
            {calendarDays.map((date, index) => {
              const barsForDay   = getBarsForDay(date);
              const att          = getAttForDate(date);
              const isCurrentDay = isToday(date);
              const hasContent   = barsForDay.length > 0 || (att && (att.present > 0 || att.absent > 0));
              const hasToday     = isCurrentDay && barsForDay.length > 0;

              return (
                <Box key={index}
                  className={`acal-day-cell ${!date ? 'acal-day-cell--empty' : ''} ${isCurrentDay ? 'acal-day-cell--today' : ''} ${hasToday ? 'acal-day-cell--has-event-today' : ''}`}
                  onClick={() => date && hasContent && setSelectedDay(date)}
                  style={{ cursor: date && hasContent ? 'pointer' : 'default' }}>

                  {date && (
                    <>
                      {/* Day number */}
                      <Typography variant="body2" className="acal-day-number">
                        {date.getDate()}
                      </Typography>

                      {/* Attendance pills */}
                      {att && (att.present > 0 || att.absent > 0) && (
                        <Box className="acal-att-row">
                          {att.present > 0 && <Typography variant="caption" className="acal-att-pill acal-att-pill--present">✓ {att.present}</Typography>}
                          {att.absent  > 0 && <Typography variant="caption" className="acal-att-pill acal-att-pill--absent">✗ {att.absent}</Typography>}
                        </Box>
                      )}

                      {/* Dots + Summary — clean professional view */}
                      <Box className="acal-dots-row">
                        {/* Batch dot */}
                        {barsForDay.some(b => b.bar.type === 'batch') && (
                          <span className="acal-dot acal-dot--batch" title="Batch Period" />
                        )}
                        {/* Active course dot */}
                        {barsForDay.some(b => b.bar.type === 'course-active') && (
                          <span className="acal-dot acal-dot--active" title="Course Active" />
                        )}
                        {/* Planned course dot */}
                        {barsForDay.some(b => b.bar.type === 'course-planned') && (
                          <span className="acal-dot acal-dot--planned" title="Course Planned" />
                        )}
                        {/* Completed course dot */}
                        {barsForDay.some(b => b.bar.type === 'course-completed') && (
                          <span className="acal-dot acal-dot--completed" title="Completed" />
                        )}
                        {/* Event dot */}
                        {barsForDay.some(b => b.bar.type === 'event') && (
                          <span className="acal-dot acal-dot--event" title="Event" />
                        )}
                      </Box>

                      {/* Summary line */}
                      {barsForDay.length > 0 && (() => {
                        const activeCourses  = barsForDay.filter(b => b.bar.type === 'course-active').length;
                        const plannedCourses = barsForDay.filter(b => b.bar.type === 'course-planned').length;
                        const completedCourses = barsForDay.filter(b => b.bar.type === 'course-completed').length;
                        const events        = barsForDay.filter(b => b.bar.type === 'event').length;
                        const parts: string[] = [];
                        if (activeCourses > 0)   parts.push(`${activeCourses} active`);
                        if (plannedCourses > 0)  parts.push(`${plannedCourses} planned`);
                        if (completedCourses > 0) parts.push(`${completedCourses} done`);
                        if (events > 0)          parts.push(`${events} event${events > 1 ? 's' : ''}`);
                        return parts.length > 0 ? (
                          <Typography className="acal-day-summary">{parts.join(' · ')}</Typography>
                        ) : null;
                      })()}
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>
      ) : (
        /* ── Week View ── */
        <Card className="acal-week-container">
          {/* Week header with day names + dates */}
          <Box className="acal-week-header">
            <Box className="acal-week-time-gutter" />
            {weekDays.map((d, i) => {
              const dayIsToday = isToday(d);
              return (
                <Box key={i} className={`acal-week-day-col-header ${dayIsToday ? 'acal-week-day-col-header--today' : ''}`}>
                  <Typography className="acal-week-day-name">{DAYS_OF_WEEK[d.getDay()]}</Typography>
                  <Typography className={`acal-week-day-num ${dayIsToday ? 'acal-week-day-num--today' : ''}`}>{d.getDate()}</Typography>
                </Box>
              );
            })}
          </Box>

          {/* Time grid */}
          <Box className="acal-week-body">
            {WEEK_HOURS.map(hour => (
              <Box key={hour} className="acal-week-row">
                <Box className="acal-week-time-gutter">
                  <Typography className="acal-week-time-label">{String(hour).padStart(2, '0')}:00</Typography>
                </Box>
                {weekDays.map((d, di) => {
                  const dayBars = getWeekBarsForDay(d);
                  const barsAtHour = dayBars.filter(b => b.hour === hour);
                  return (
                    <Box key={di} className={`acal-week-cell ${isToday(d) ? 'acal-week-cell--today' : ''}`}
                      onClick={() => { const details = getBarsForDay(d); if (details.length > 0) setSelectedDay(d); }}>
                      {barsAtHour.map(({ bar }, bi) => (
                        <Box key={bi} className={`acal-week-event ${barTypeClass[bar.type] || 'acal-bar--active'}`}>
                          <Typography className="acal-week-event-title">{bar.label}</Typography>
                          {bar.venue && (
                            <Typography className="acal-week-event-sub">{bar.venue}</Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* ── Day Detail Dialog ── */}
      <Dialog open={!!selectedDay} onClose={() => setSelectedDay(null)} maxWidth="sm" fullWidth>
        {selectedDay && (() => {
          const { bars, att } = getDayDetail(selectedDay);
          const dateLabel = selectedDay.toLocaleDateString('en-IN', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
          });
          return (
            <>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
                  {dateLabel}
                </Typography>
                <IconButton size="small" onClick={() => setSelectedDay(null)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 0 }}>

                {/* Attendance */}
                {att && (att.present > 0 || att.absent > 0) && (
                  <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                      Attendance
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {att.present > 0 && <Chip label={`✓ ${att.present} Present`} size="small" sx={{ background: 'var(--color-success-light)', color: 'var(--color-success-dark)', border: '1px solid var(--color-success-border)', fontWeight: 600 }} />}
                      {att.absent  > 0 && <Chip label={`✗ ${att.absent} Absent`}  size="small" sx={{ background: 'var(--color-error-light)',   color: 'var(--color-error-dark)',   border: '1px solid var(--color-error-border)',   fontWeight: 600 }} />}
                    </Box>
                  </Box>
                )}

                {/* Active bars on this day */}
                {bars.length === 0 && !att && (
                  <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', py: 2 }}>
                    No events on this day
                  </Typography>
                )}

                {bars.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                    {/* Batch Period section */}
                    {bars.filter(b => b.bar.type === 'batch').length > 0 && (
                      <>
                        <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                          Batch Period
                        </Typography>
                        {bars.filter(b => b.bar.type === 'batch').map(({ bar }) => (
                          <Box key={bar.id} className="acal-bar acal-bar--dialog acal-bar--batch">
                            <Typography sx={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{bar.label}</Typography>
                            <Typography sx={{ fontSize: 'var(--text-xs)', opacity: 0.75 }}>
                              {bar.startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {bar.endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}

                    {/* Courses section */}
                    {bars.filter(b => b.bar.type.startsWith('course')).length > 0 && (
                      <>
                        <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', mt: 0.5, mb: 0.5 }}>
                          Courses ({bars.filter(b => b.bar.type.startsWith('course')).length})
                        </Typography>
                        {bars.filter(b => b.bar.type.startsWith('course')).map(({ bar, isStart, isEnd }) => (
                          <Box key={bar.id} className={`acal-bar acal-bar--dialog ${barTypeClass[bar.type]}`}>
                            <Typography sx={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{bar.label}</Typography>
                            <Typography sx={{ fontSize: 'var(--text-xs)', opacity: 0.75 }}>
                              {isStart && isEnd ? 'Single day'
                                : isStart ? `Starts today → ${bar.endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
                                : isEnd   ? `${bar.startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → Ends today`
                                : `${bar.startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → ${bar.endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}

                    {/* Events section */}
                    {bars.filter(b => b.bar.type === 'event').length > 0 && (
                      <>
                        <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', mt: 0.5, mb: 0.5 }}>
                          Events ({bars.filter(b => b.bar.type === 'event').length})
                        </Typography>
                        {bars.filter(b => b.bar.type === 'event').map(({ bar }) => (
                          <Box key={bar.id} className="acal-bar acal-bar--dialog acal-bar--event">
                            <Typography sx={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{bar.label}</Typography>
                            {bar.venue && (
                              <Chip
                                label={bar.venue === 'ONLINE' ? '🌐 Online' : '📍 Offline'}
                                size="small"
                                sx={{ mt: 0.5, background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '11px' }}
                              />
                            )}
                          </Box>
                        ))}
                      </>
                    )}

                  </Box>
                )}
              </DialogContent>
            </>
          );
        })()}
      </Dialog>
      {/* ── Add Event Dialog ── */}
      <Dialog open={addEventOpen} onClose={() => setAddEventOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>Add Event</Typography>
          <IconButton size="small" onClick={() => setAddEventOpen(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Title *</Typography>
                <input className="acal-input" value={evtTitle} onChange={e => setEvtTitle(e.target.value)} placeholder="e.g. Sprint Review Meeting" />
              </Box>
              <Box sx={{ minWidth: 160 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Type *</Typography>
                <select className="acal-input" value={evtType} onChange={e => setEvtType(e.target.value)}>
                  {['MEETING','ASSESSMENT','REVIEW','SESSION','CLIENT_VISIT','OTHER'].map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Description</Typography>
              <textarea className="acal-input" rows={2} value={evtDesc} onChange={e => setEvtDesc(e.target.value)} placeholder="Optional details..." style={{ resize: 'vertical' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Date *</Typography>
                <input className="acal-input" type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Time</Typography>
                <input className="acal-input" type="time" value={evtTime} onChange={e => setEvtTime(e.target.value)} />
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Venue *</Typography>
              <select className="acal-input" value={evtVenue} onChange={e => setEvtVenue(e.target.value)}>
                <option value="ONLINE">🌐 Online</option>
                <option value="OFFLINE">📍 Offline</option>
              </select>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>Program (optional)</Typography>
                <select className="acal-input" value={evtProgram ?? ''} onChange={e => {
                  setEvtProgram(e.target.value ? Number(e.target.value) : null);
                  setEvtBatches([]); // reset batches when program changes
                }}>
                  <option value="">All Programs</option>
                  {yearPrograms.map(p => <option key={p.programId} value={p.programId}>{p.programName}</option>)}
                </select>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', mb: 0.5 }}>
                  Batches
                  <span style={{ fontWeight: 400 }}>
                    {evtProgram ? ' (optional — leave empty for all batches in this program)' : ' (select a program first)'}
                  </span>
                </Typography>
                <Box sx={{ border: '1px solid var(--color-border)', borderRadius: '6px', p: 1, background: 'var(--color-bg)', maxHeight: 120, overflowY: 'auto', opacity: evtProgram ? 1 : 0.5, pointerEvents: evtProgram ? 'auto' : 'none' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', cursor: 'pointer', marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={evtBatches.length === 0}
                      onChange={() => setEvtBatches([])}
                    />
                    All Batches
                  </label>
                  {evtAvailableBatches.map(b => (
                    <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', cursor: 'pointer', marginBottom: 2 }}>
                      <input
                        type="checkbox"
                        checked={evtBatches.includes(b)}
                        onChange={() => {
                          setEvtBatches(prev =>
                            prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
                          );
                        }}
                      />
                      Batch {b}
                    </label>
                  ))}
                </Box>
              </Box>
            </Box>
            {/* no email note needed */}
          </Box>
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, pb: 2 }}>
          <Button onClick={() => setAddEventOpen(false)} variant="outlined" size="small"
            sx={{ textTransform: 'none', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>Cancel</Button>
          <Button onClick={handleSaveEvent} variant="contained" size="small" disabled={savingEvent}
            sx={{ textTransform: 'none', background: 'var(--color-primary)', fontWeight: 600 }}>
            {savingEvent ? 'Creating...' : 'Create Event'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AcademyCalendar;
