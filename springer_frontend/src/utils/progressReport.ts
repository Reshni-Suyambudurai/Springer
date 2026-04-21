import jsPDF from 'jspdf';
import type { InternDashboardData } from '../types/Academy/intern.types';

const PRIMARY   = [15, 76, 129]  as [number, number, number];
const WHITE     = [255, 255, 255] as [number, number, number];
const DARK      = [17, 24, 39]   as [number, number, number];
const MUTED     = [107, 114, 128] as [number, number, number];
const SUCCESS   = [2, 122, 72]   as [number, number, number];
const WARNING   = [180, 83, 9]   as [number, number, number];
const ERROR     = [185, 28, 28]  as [number, number, number];
const LIGHT_BG  = [249, 250, 251] as [number, number, number];
const BORDER    = [229, 231, 235] as [number, number, number];

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';

const scoreColor = (status: string | null): [number, number, number] => {
  switch (status?.toUpperCase()) {
    case 'EXCELLENT':     return SUCCESS;
    case 'GOOD':          return PRIMARY;
    case 'AVERAGE':       return WARNING;
    case 'BELOW_AVERAGE': return ERROR;
    default:              return MUTED;
  }
};

export const generateProgressReport = (data: InternDashboardData): void => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 0;

  // ── Helper functions ──────────────────────────────────────────────────────

  const setFont = (size: number, style: 'normal' | 'bold' = 'normal', color: [number,number,number] = DARK) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
  };

  const drawRect = (x: number, y: number, w: number, h: number, fill: [number,number,number], radius = 0) => {
    doc.setFillColor(...fill);
    if (radius > 0) doc.roundedRect(x, y, w, h, radius, radius, 'F');
    else doc.rect(x, y, w, h, 'F');
  };

  const drawBorder = (x: number, y: number, w: number, h: number, color: [number,number,number], radius = 0) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    if (radius > 0) doc.roundedRect(x, y, w, h, radius, radius, 'S');
    else doc.rect(x, y, w, h, 'S');
  };

  const text = (txt: string, x: number, y: number, align: 'left' | 'center' | 'right' = 'left') => {
    doc.text(txt, x, y, { align });
  };

  const sectionTitle = (title: string, yPos: number): number => {
    setFont(9, 'bold', MUTED);
    doc.setTextColor(...MUTED);
    text(title.toUpperCase(), 14, yPos);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(14, yPos + 1.5, W - 14, yPos + 1.5);
    return yPos + 7;
  };

  // ── HEADER ────────────────────────────────────────────────────────────────
  drawRect(0, 0, W, 38, PRIMARY);

  // Logo text
  setFont(18, 'bold', WHITE);
  text('KANINI', 14, 14);
  setFont(8, 'normal', [180, 210, 240]);
  text('Software Solutions', 14, 20);

  // Report title
  setFont(14, 'bold', WHITE);
  text('INTERN PROGRESS REPORT', W / 2, 14, 'center');
  setFont(8, 'normal', [180, 210, 240]);
  text('Official Training Assessment Document', W / 2, 20, 'center');

  // Generated date
  setFont(7, 'normal', [180, 210, 240]);
  text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, W - 14, 14, 'right');

  y = 44;

  // ── INTERN INFO ───────────────────────────────────────────────────────────
  drawRect(14, y, W - 28, 28, LIGHT_BG, 3);
  drawBorder(14, y, W - 28, 28, BORDER, 3);

  setFont(13, 'bold', DARK);
  text(data.candidateName, 20, y + 8);

  setFont(8, 'normal', MUTED);
  text(`Student ID: ${data.studentId}`, 20, y + 14);
  text(`Email: ${data.email}`, 20, y + 19);
  text(`Department: ${data.department}`, 20, y + 24);

  // Right side info
  setFont(8, 'bold', PRIMARY);
  text(data.programName, W - 20, y + 8, 'right');
  setFont(8, 'normal', MUTED);
  text(`Batch ${data.batchNumber}  ·  ${data.programYear}`, W - 20, y + 14, 'right');
  text(`${data.location ?? 'Chennai'}`, W - 20, y + 19, 'right');
  text(`${fmt(data.batchStartDate)} → ${fmt(data.batchEndDate)}`, W - 20, y + 24, 'right');

  y += 34;

  // ── STATUS BADGE ──────────────────────────────────────────────────────────
  const statusColor: [number,number,number] = data.status === 'PROJECT_READY' ? SUCCESS
    : data.status === 'AT_RISK' ? WARNING
    : data.status === 'DROPPED' ? ERROR
    : PRIMARY;
  const statusLabel = data.status === 'PROJECT_READY' ? 'PROJECT READY'
    : data.status === 'AT_RISK' ? 'AT RISK'
    : data.status === 'DROPPED' ? 'DROPPED'
    : 'IN TRAINING';

  drawRect(14, y, 50, 8, statusColor, 2);
  setFont(7, 'bold', WHITE);
  text(statusLabel, 39, y + 5.5, 'center');

  if (data.rank && data.totalInBatch) {
    setFont(8, 'normal', MUTED);
    text(`Batch Rank: ${data.rank} of ${data.totalInBatch}`, W - 14, y + 5.5, 'right');
  }

  y += 14;

  // ── PERFORMANCE SUMMARY ───────────────────────────────────────────────────
  y = sectionTitle('Performance Summary', y);

  const stats = [
    { label: 'Attendance', value: `${data.attendancePercentage.toFixed(1)}%`, color: data.attendancePercentage >= 75 ? SUCCESS : ERROR },
    { label: 'Weighted Score', value: data.overallWeightedScore != null ? `${data.overallWeightedScore.toFixed(1)}/100` : '—', color: PRIMARY },
    { label: 'Courses Scored', value: `${data.courseScores.filter(c => c.score != null).length}/${data.courseScores.length}`, color: PRIMARY },
    { label: 'Performance', value: data.performance?.replace('_', ' ') ?? '—', color: SUCCESS },
    { label: 'Approved Leaves', value: `${data.totalApprovedLeaveDays ?? 0} days`, color: MUTED },
  ];

  const statW = (W - 28 - 12) / 5;
  stats.forEach((s, i) => {
    const sx = 14 + i * (statW + 3);
    drawRect(sx, y, statW, 18, LIGHT_BG, 2);
    drawBorder(sx, y, statW, 18, BORDER, 2);
    setFont(11, 'bold', s.color);
    text(s.value, sx + statW / 2, y + 9, 'center');
    setFont(6.5, 'normal', MUTED);
    text(s.label, sx + statW / 2, y + 14.5, 'center');
  });

  y += 24;

  // ── READINESS BAR ─────────────────────────────────────────────────────────
  const readiness = Math.round(Math.min(data.attendancePercentage, 100) * 0.4 + (data.overallWeightedScore ?? 0) * 0.6);
  const barColor: [number,number,number] = readiness >= 75 ? SUCCESS : readiness >= 50 ? WARNING : ERROR;

  setFont(8, 'bold', DARK);
  text('Project Readiness', 14, y + 4);
  setFont(8, 'bold', barColor);
  text(`${readiness}%`, W - 14, y + 4, 'right');

  drawRect(14, y + 6, W - 28, 4, BORDER, 2);
  drawRect(14, y + 6, Math.max(2, (W - 28) * readiness / 100), 4, barColor, 2);
  setFont(6.5, 'normal', MUTED);
  text('Readiness = 40% Attendance + 60% Weighted Score', 14, y + 14);

  y += 20;

  // ── COURSE SCORES ─────────────────────────────────────────────────────────
  y = sectionTitle('Course Scores', y);

  // Table header
  drawRect(14, y, W - 28, 7, PRIMARY, 0);
  setFont(7, 'bold', WHITE);
  text('Course Name', 18, y + 4.8);
  text('Status', 110, y + 4.8);
  text('Score', 140, y + 4.8, 'center');
  text('Min Score', 162, y + 4.8, 'center');
  text('Rating', 188, y + 4.8, 'center');
  y += 7;

  data.courseScores.forEach((c, idx) => {
    const rowBg: [number,number,number] = idx % 2 === 0 ? WHITE : LIGHT_BG;
    drawRect(14, y, W - 28, 7, rowBg);
    drawBorder(14, y, W - 28, 7, BORDER);

    setFont(7.5, 'normal', DARK);
    text(c.courseName, 18, y + 4.8);

    const csColor: [number,number,number] = c.courseStatus === 'ACTIVE' ? SUCCESS
      : c.courseStatus === 'COMPLETED' ? PRIMARY
      : MUTED;
    setFont(7, 'normal', csColor);
    text(c.courseStatus ?? 'PLANNED', 110, y + 4.8);

    setFont(7.5, c.score != null ? 'bold' : 'normal', c.score != null ? DARK : MUTED);
    text(c.score != null ? `${c.score}/100` : '—', 140, y + 4.8, 'center');

    setFont(7, 'normal', MUTED);
    text(`${c.minScore}`, 162, y + 4.8, 'center');

    if (c.status) {
      const rc = scoreColor(c.status);
      drawRect(175, y + 1.5, 24, 4, [...rc, 20] as unknown as [number,number,number], 1);
      setFont(6.5, 'bold', rc);
      text(c.status.replace('_', ' '), 187, y + 4.8, 'center');
    } else {
      setFont(7, 'normal', MUTED);
      text('—', 187, y + 4.8, 'center');
    }

    y += 7;
  });

  y += 6;

  // ── ATTENDANCE SUMMARY ────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 14; }

  y = sectionTitle('Attendance Summary', y);

  const present = data.attendanceRecords.filter(r => r.isPresent).length;
  const absent  = data.attendanceRecords.filter(r => !r.isPresent).length;
  const total   = present + absent;

  drawRect(14, y, W - 28, 16, LIGHT_BG, 3);
  drawBorder(14, y, W - 28, 16, BORDER, 3);

  setFont(8, 'normal', MUTED);
  text('Total Days Marked:', 20, y + 6);
  setFont(9, 'bold', DARK);
  text(`${total}`, 65, y + 6);

  setFont(8, 'normal', MUTED);
  text('Present:', 80, y + 6);
  setFont(9, 'bold', SUCCESS);
  text(`${present}`, 100, y + 6);

  setFont(8, 'normal', MUTED);
  text('Absent:', 115, y + 6);
  setFont(9, 'bold', ERROR);
  text(`${absent}`, 133, y + 6);

  setFont(8, 'normal', MUTED);
  text('Attendance %:', 148, y + 6);
  setFont(9, 'bold', data.attendancePercentage >= 75 ? SUCCESS : ERROR);
  text(`${data.attendancePercentage.toFixed(1)}%`, 178, y + 6);

  if (data.totalApprovedLeaveDays) {
    setFont(7.5, 'normal', MUTED);
    text(`Approved Leave Days: ${data.totalApprovedLeaveDays}`, 20, y + 12);
  }

  y += 22;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = 285;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, W - 14, footerY);

  setFont(7, 'normal', MUTED);
  text('This is an official Kanini Academy progress report. Generated automatically by Springer HRMS.', W / 2, footerY + 4, 'center');
  text('© 2026 Kanini Software Solutions. For queries contact: hrops.india@kanini.com', W / 2, footerY + 8, 'center');

  // ── SAVE ──────────────────────────────────────────────────────────────────
  const fileName = `Kanini_Progress_Report_${data.candidateName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
  doc.save(fileName);
};
