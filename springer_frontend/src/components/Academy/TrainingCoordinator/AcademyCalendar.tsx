import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, CircularProgress, IconButton,
  Button, MenuItem, FormControl, Select,
  Dialog, DialogTitle, DialogContent, Chip,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import {
  batchScheduleApi, batchCourseApi, trainingCourseApi,
  batchAllocationApi, attendanceApi,
} from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import type {
  AcademyContextProps, BatchScheduleResponse,
  BatchCourseResponse, TrainingCourseResponse,
  BatchAllocationResponse, AttendanceResponse,
} from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/AcademyCalendar.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const setMidnight = (d: Date) => { d.setHours(0, 0, 0, 0); return d; };
const parseDate   = (s: string) => setMidnight(new Date(s));
const sameDay     = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

// ── Types ─────────────────────────────────────────────────────────────────────
interface CalEvent {
  id: string;
  title: string;
  subtitle: string;
  type: 'batch' | 'planned' | 'active' | 'completed' | 'cancelled';
}

interface DayAtt {
  present: number;
  absent: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
const AcademyCalendar: React.FC<{ context: AcademyContextProps }> = ({ context }) => {
  const { programYear, programs: yearPrograms } = context;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  const [loading, setLoading]             = useState<boolean>(true);
  const [currentDate, setCurrentDate]     = useState<Date>(new Date());
  const [selectedYear, setSelectedYear]   = useState<number>(currentYear);
  const [schedules, setSchedules]         = useState<BatchScheduleResponse[]>([]);
  const [batchCourses, setBatchCourses]   = useState<BatchCourseResponse[]>([]);
  const [allCourses, setAllCourses]       = useState<TrainingCourseResponse[]>([]);
  const [attMap, setAttMap]               = useState<Record<string, DayAtt>>({});
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [selectedDay, setSelectedDay]     = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
    setFilterProgram('all');
  }, [programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [bcRes, crsRes, allocRes] = await Promise.all([
        batchCourseApi.getAllBatchCourses(),
        trainingCourseApi.getAllCourses(),
        batchAllocationApi.getAllAllocations(),
      ]);

      if (bcRes.success && bcRes.data)   setBatchCourses(bcRes.data);
      if (crsRes.success && crsRes.data) setAllCourses(crsRes.data);

      const allocs: BatchAllocationResponse[] = (allocRes.success && allocRes.data) ? allocRes.data : [];

      // Batch schedules for year programs
      const progIds = yearPrograms.map(p => p.programId);
      const schedResults = await Promise.allSettled(
        progIds.map(id => batchScheduleApi.getByProgram(id))
      );
      const allScheds: BatchScheduleResponse[] = [];
      schedResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data)
          allScheds.push(...r.value.data);
      });
      setSchedules(allScheds);

      // Attendance records — aggregate by date
      const active = allocs.filter(a => a.isActive);
      const attResults = await Promise.allSettled(
        active.map(a => attendanceApi.getAttendanceRecords(a.studentId))
      );
      const map: Record<string, DayAtt> = {};
      attResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data) {
          r.value.data.forEach((rec: AttendanceResponse) => {
            const key = String(rec.attendanceDate);
            if (!map[key]) map[key] = { present: 0, absent: 0 };
            if (rec.isPresent) map[key].present++;
            else               map[key].absent++;
          });
        }
      });
      setAttMap(map);

    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || 'Failed to load calendar data';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handlePreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleToday = () => setCurrentDate(new Date());

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  };

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const getCalendarDays = (): (Date | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return sameDay(date, today);
  };

  // ── Scoped data ───────────────────────────────────────────────────────────
  const scopedPrograms = yearPrograms.filter(p =>
    filterProgram === 'all' || String(p.programId) === filterProgram
  );
  const scopedProgramIds = new Set(scopedPrograms.map(p => p.programId));
  const scopedSchedules    = schedules.filter(s => scopedProgramIds.has(s.programId));
  const scopedBatchCourses = batchCourses.filter(bc =>
    scopedProgramIds.has(bc.programId) && bc.startDate && bc.endDate
  );

  // ── Events for a day ──────────────────────────────────────────────────────
  const getEventsForDate = (date: Date | null): CalEvent[] => {
    if (!date) return [];
    const events: CalEvent[] = [];

    // Batch start/end events
    scopedSchedules.forEach(s => {
      const prog = yearPrograms.find(p => p.programId === s.programId);
      const progName = prog?.programName ?? 'Program';

      if (sameDay(date, parseDate(s.startDate))) {
        events.push({
          id: `bs-${s.batchScheduleId}`,
          title: `${progName} — Batch ${s.batchNumber} Starts`,
          subtitle: `Ends ${new Date(s.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
          type: 'batch',
        });
      }
      if (sameDay(date, parseDate(s.endDate))) {
        events.push({
          id: `be-${s.batchScheduleId}`,
          title: `${progName} — Batch ${s.batchNumber} Ends`,
          subtitle: '',
          type: 'batch',
        });
      }
    });

    // Course start AND end events
    scopedBatchCourses.forEach(bc => {
      const course  = allCourses.find(c => c.courseId === bc.courseId);
      const prog    = yearPrograms.find(p => p.programId === bc.programId);
      const status  = bc.status?.toLowerCase() ?? 'planned';
      const type    = (['planned','active','completed','cancelled'].includes(status)
        ? status : 'planned') as CalEvent['type'];
      const subtitle = `${prog?.programName ?? ''} · Batch ${bc.batchNo}`;

      if (bc.startDate && sameDay(date, parseDate(bc.startDate))) {
        events.push({
          id: `bc-start-${bc.batchCourseId}`,
          title: `${course?.courseName ?? `Course ${bc.courseId}`} Starts`,
          subtitle,
          type,
        });
      }
      if (bc.endDate && sameDay(date, parseDate(bc.endDate))) {
        events.push({
          id: `bc-end-${bc.batchCourseId}`,
          title: `${course?.courseName ?? `Course ${bc.courseId}`} Ends`,
          subtitle,
          type,
        });
      }
    });

    return events;
  };

  // Attendance for a day
  const getAttForDate = (date: Date | null): DayAtt | null => {
    if (!date) return null;
    // Key format: YYYY-MM-DD
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return attMap[key] ?? null;
  };

  const calendarDays = getCalendarDays();

  return (
    <Box className="acal-container">

      {/* ── Header ── */}
      <Card className="acal-header">

        {/* Left — year + nav */}
        <Box className="acal-header-left">
          <FormControl className="acal-year-select">
            <Select
              value={selectedYear}
              onChange={e => handleYearChange(e.target.value as number)}
              className="acal-year-dropdown"
            >
              {yearOptions.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box className="acal-nav-controls">
            <Box className="acal-nav-buttons">
              <IconButton onClick={handlePreviousMonth} className="acal-nav-btn">
                <ChevronLeftIcon />
              </IconButton>
              <IconButton onClick={handleNextMonth} className="acal-nav-btn">
                <ChevronRightIcon />
              </IconButton>
            </Box>
            <Button variant="outlined" onClick={handleToday} className="acal-today-btn">
              Today
            </Button>
            <Typography variant="h6" className="acal-month-year">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
          </Box>
        </Box>

        {/* Center — title */}
        <Box className="acal-header-center">
          <Typography variant="h5" className="acal-title">
            Academy Calendar
          </Typography>
        </Box>

        {/* Right — program filter + legend */}
        <Box className="acal-header-right">
          <FormControl size="small" className="acal-program-select">
            <Select
              value={filterProgram}
              onChange={e => setFilterProgram(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Programs</MenuItem>
              {yearPrograms.map(p => (
                <MenuItem key={p.programId} value={String(p.programId)}>{p.programName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box className="acal-legend">
            {[
              { cls: 'acal-legend-batch',     label: 'Batch' },
              { cls: 'acal-legend-active',    label: 'Course Active' },
              { cls: 'acal-legend-planned',   label: 'Planned' },
              { cls: 'acal-legend-completed', label: 'Completed' },
              { cls: 'acal-legend-present',   label: 'Present' },
              { cls: 'acal-legend-absent',    label: 'Absent' },
            ].map(l => (
              <Box key={l.label} className="acal-legend-item">
                <span className={`acal-legend-color ${l.cls}`} />
                <Typography variant="body2">{l.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Card>

      {/* ── Calendar Grid ── */}
      {loading ? (
        <Box className="acal-loading">
          <CircularProgress />
          <Typography>Loading academy schedule...</Typography>
        </Box>
      ) : (
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
              const events      = getEventsForDate(date);
              const att         = getAttForDate(date);
              const isCurrentDay = isToday(date);
              const visible     = events.slice(0, 3);
              const more        = events.length - visible.length;

              return (
                <Box key={index}
                  className={`acal-day-cell ${!date ? 'acal-day-cell--empty' : ''} ${isCurrentDay ? 'acal-day-cell--today' : ''}`}
                  onClick={() => date && (events.length > 0 || att) && setSelectedDay(date)}
                  style={{ cursor: date && (events.length > 0 || att) ? 'pointer' : 'default' }}>
                  {date && (
                    <>
                      <Typography variant="body2" className="acal-day-number">
                        {date.getDate()}
                      </Typography>

                      <Box className="acal-events">
                        {/* Attendance summary */}
                        {att && (att.present > 0 || att.absent > 0) && (
                          <Box className="acal-att-row">
                            {att.present > 0 && (
                              <Typography variant="caption" className="acal-att-pill acal-att-pill--present">
                                ✓ {att.present}
                              </Typography>
                            )}
                            {att.absent > 0 && (
                              <Typography variant="caption" className="acal-att-pill acal-att-pill--absent">
                                ✗ {att.absent}
                              </Typography>
                            )}
                          </Box>
                        )}

                        {/* Events */}
                        {visible.map(ev => (
                          <Box key={ev.id} className={`acal-event acal-event--${ev.type}`}>
                            <Typography variant="caption" className="acal-event-name">
                              {ev.title}
                            </Typography>
                            {ev.subtitle && (
                              <Typography variant="caption" className="acal-event-sub">
                                {ev.subtitle}
                              </Typography>
                            )}
                          </Box>
                        ))}

                        {more > 0 && (
                          <Typography variant="caption" className="acal-more">
                            +{more} more
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              );
            })}
          </Box>
        </Card>
      )}

      {/* ── Day Detail Dialog ── */}
      <Dialog
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        maxWidth="xs"
        fullWidth
      >
        {selectedDay && (() => {
          const dayEvents = getEventsForDate(selectedDay);
          const dayAtt    = getAttForDate(selectedDay);
          const dateLabel = selectedDay.toLocaleDateString('en-IN', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
          });
          return (
            <>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
                  {dateLabel}
                </Typography>
                <IconButton size="small" onClick={() => setSelectedDay(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 0 }}>

                {/* Attendance summary */}
                {dayAtt && (dayAtt.present > 0 || dayAtt.absent > 0) && (
                  <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-light)' }}>
                    <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-grey-600)', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                      Attendance
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {dayAtt.present > 0 && (
                        <Chip label={`✓ ${dayAtt.present} Present`} size="small"
                          sx={{ background: 'var(--color-success-light)', color: 'var(--color-success-dark)', border: '1px solid var(--color-success-border)', fontWeight: 600 }} />
                      )}
                      {dayAtt.absent > 0 && (
                        <Chip label={`✗ ${dayAtt.absent} Absent`} size="small"
                          sx={{ background: 'var(--color-error-light)', color: 'var(--color-error-dark)', border: '1px solid var(--color-error-border)', fontWeight: 600 }} />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Events list */}
                {dayEvents.length === 0 && !dayAtt && (
                  <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', py: 2 }}>
                    No events on this day
                  </Typography>
                )}

                {dayEvents.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-grey-600)', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                      Events ({dayEvents.length})
                    </Typography>
                    {dayEvents.map(ev => (
                      <Box key={ev.id} className={`acal-event acal-event--${ev.type}`}
                        sx={{ cursor: 'default !important' }}>
                        <Typography variant="caption" className="acal-event-name" sx={{ fontSize: '13px !important' }}>
                          {ev.title}
                        </Typography>
                        {ev.subtitle && (
                          <Typography variant="caption" className="acal-event-sub" sx={{ fontSize: '11px !important' }}>
                            {ev.subtitle}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </DialogContent>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
};

export default AcademyCalendar;
