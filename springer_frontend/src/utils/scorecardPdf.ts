import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InternDashboardData } from '../types/Academy/intern.types';
import type {
  BatchAllocationResponse, TrainingScoreResponse,
  BatchCourseResponse, TrainingCourseResponse,
  AttendanceStatsResponse, TrainingProgramResponse,
} from '../types/Academy/academy.types';

const PRIMARY  = [15, 76, 129]   as [number, number, number];
const SUCCESS  = [22, 163, 74]   as [number, number, number];
const WARNING  = [217, 119, 6]   as [number, number, number];
const DANGER   = [220, 38, 38]   as [number, number, number];
const GREY     = [107, 114, 128] as [number, number, number];
const LIGHT_BG = [249, 250, 251] as [number, number, number];
const BORDER   = [229, 231, 235] as [number, number, number];
const WHITE    = [255, 255, 255] as [number, number, number];
const DARK     = [17, 24, 39]    as [number, number, number];

const scoreRgb = (score: number | null, min: number): [number, number, number] => {
  if (score == null) return GREY;
  if (score < min)   return DANGER;
  if (score >= 85)   return SUCCESS;
  if (score >= 60)   return WARNING;
  return DANGER;
};

const rankLabel = (r: number) =>
  r === 1 ? '1st' : r === 2 ? '2nd' : r === 3 ? '3rd' : `${r}th`;

const drawPageHeader = (doc: jsPDF, title: string) => {
  const W = doc.internal.pageSize.getWidth();
  const margin = 14;
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(13); doc.setFont('helvetica', 'bold');
  doc.text('Kanini Software Solutions', margin, 10);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('Talent Acquisition & Academy Management System', margin, 16);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(title, W - margin, 10, { align: 'right' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generated: ${today}`, W - margin, 16, { align: 'right' });
};

const drawPageFooter = (doc: jsPDF) => {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 14;
  doc.setFillColor(...PRIMARY);
  doc.rect(0, H - 10, W, 10, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text('System-generated report from Kanini Academy Portal. Not valid without official stamp.', margin, H - 4);
  doc.text(`© ${new Date().getFullYear()} Kanini Software Solutions`, W - margin, H - 4, { align: 'right' });
};

const drawInfoBox = (doc: jsPDF, y: number, left: [string, string, string, string], right: [string, string, string, string]) => {
  const W = doc.internal.pageSize.getWidth();
  const margin = 14;
  doc.setFillColor(...LIGHT_BG); doc.setDrawColor(...BORDER);
  doc.roundedRect(margin, y, W - margin * 2, 28, 2, 2, 'FD');
  doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(left[0], margin + 4, y + 7);
  doc.setTextColor(...DARK); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(left[1], margin + 4, y + 13);
  doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(left[2], margin + 4, y + 20);
  doc.setTextColor(...DARK); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(left[3], margin + 4, y + 25);
  const rx = W / 2 + 4;
  doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(right[0], rx, y + 7);
  doc.setTextColor(...DARK); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(right[1], rx, y + 13);
  doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(right[2], rx, y + 20);
  doc.setTextColor(...DARK); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(right[3], rx, y + 25);
};

const drawStatBoxes = (doc: jsPDF, y: number, boxes: { label: string; value: string; sub: string; color: [number, number, number] }[]) => {
  const W = doc.internal.pageSize.getWidth();
  const margin = 14;
  const boxW = (W - margin * 2 - (boxes.length - 1) * 4) / boxes.length;
  boxes.forEach((b, i) => {
    const bx = margin + i * (boxW + 4);
    doc.setFillColor(...WHITE); doc.setDrawColor(...BORDER);
    doc.roundedRect(bx, y, boxW, 22, 2, 2, 'FD');
    doc.setFillColor(...PRIMARY); doc.rect(bx, y, boxW, 1.5, 'F');
    doc.setTextColor(...GREY); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text(b.label, bx + boxW / 2, y + 7, { align: 'center' });
    doc.setTextColor(...b.color); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(b.value, bx + boxW / 2, y + 15, { align: 'center' });
    doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(b.sub, bx + boxW / 2, y + 20, { align: 'center' });
  });
};

const drawSectionTitle = (doc: jsPDF, y: number, title: string) => {
  const W = doc.internal.pageSize.getWidth();
  const margin = 14;
  doc.setTextColor(...DARK); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  doc.setDrawColor(...BORDER); doc.line(margin, y + 2, W - margin, y + 2);
};

// ── 1. Intern downloads their own scorecard ───────────────────────────────────
export const downloadScorecard = (data: InternDashboardData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = 0;

  drawPageHeader(doc, 'TRAINING SCORECARD');
  y = 30;

  drawInfoBox(doc, y,
    ['INTERN NAME', data.candidateName, 'EMAIL', data.email],
    ['PROGRAM', data.programName, 'BATCH & YEAR', `Batch ${data.batchNumber}  ·  ${data.programYear}`]
  );
  y += 34;

  const ws = data.overallWeightedScore;
  drawStatBoxes(doc, y, [
    { label: 'OVERALL WEIGHTED SCORE', value: ws != null ? ws.toFixed(1) : '—', sub: 'out of 100', color: ws != null ? (ws >= 85 ? SUCCESS : ws >= 60 ? WARNING : DANGER) : GREY },
    { label: 'BATCH RANK', value: rankLabel(data.rank), sub: `out of ${data.totalInBatch} interns`, color: PRIMARY },
    { label: 'ATTENDANCE', value: `${data.attendancePercentage.toFixed(1)}%`, sub: data.attendancePercentage >= 75 ? 'Above minimum' : 'Below 75% minimum', color: data.attendancePercentage >= 75 ? SUCCESS : DANGER },
  ]);
  y += 28;

  drawSectionTitle(doc, y, 'Course-wise Scores');
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Course', 'Score', 'Min Score', 'Weight', 'Status']],
    body: data.courseScores.map(c => [c.courseName, c.score != null ? String(c.score) : '—', String(c.minScore), `${c.weightage}%`, c.status ? c.status.replace('_', ' ') : 'Not Scored']),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 70 }, 1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' }, 2: { halign: 'center', cellWidth: 22 }, 3: { halign: 'center', cellWidth: 22 }, 4: { halign: 'center', cellWidth: 32 } },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    didParseCell: (h) => {
      if (h.section === 'body' && (h.column.index === 1 || h.column.index === 4)) {
        const c = data.courseScores[h.row.index];
        if (c) h.cell.styles.textColor = scoreRgb(c.score, c.minScore);
      }
    },
    tableLineColor: BORDER, tableLineWidth: 0.3,
  });

  drawPageFooter(doc);
  doc.save(`Kanini_Scorecard_${data.candidateName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
};

// ── 2. TA downloads individual intern report ──────────────────────────────────
export interface IndividualReportData {
  allocation: BatchAllocationResponse;
  scores: TrainingScoreResponse[];
  batchCourses: BatchCourseResponse[];
  allCourses: TrainingCourseResponse[];
  stats: AttendanceStatsResponse | null;
  program: TrainingProgramResponse | null;
  programName: string;
  totalInBatch: number;
  rank: number;
}

export const downloadIndividualReport = (d: IndividualReportData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = 0;

  drawPageHeader(doc, 'INTERN PROGRESS REPORT');
  y = 30;

  drawInfoBox(doc, y,
    ['INTERN NAME', d.allocation.candidateName, 'EMAIL', d.allocation.candidateEmail],
    ['PROGRAM', d.programName, 'BATCH & YEAR', `Batch ${d.allocation.batchNumber}  ·  ${d.program?.programYear ?? ''}`]
  );
  y += 34;

  const att = Number(d.allocation.attendancePercentage ?? 0);
  const ws  = d.allocation.overallWeightedScore != null ? Number(d.allocation.overallWeightedScore) : null;
  drawStatBoxes(doc, y, [
    { label: 'OVERALL WEIGHTED SCORE', value: ws != null ? ws.toFixed(1) : '—', sub: 'out of 100', color: ws != null ? (ws >= 85 ? SUCCESS : ws >= 60 ? WARNING : DANGER) : GREY },
    { label: 'BATCH RANK', value: rankLabel(d.rank), sub: `out of ${d.totalInBatch} interns`, color: PRIMARY },
    { label: 'ATTENDANCE', value: `${att.toFixed(1)}%`, sub: att >= 75 ? 'Above minimum' : 'Below 75% minimum', color: att >= 75 ? SUCCESS : DANGER },
  ]);
  y += 28;

  if (d.stats) {
    drawSectionTitle(doc, y, 'Attendance Summary');
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [['Present Days', 'Absent Days', 'Total Days', 'Attendance %']],
      body: [[String(d.stats.presentDays), String(d.stats.absentDays), String(d.stats.totalDays), `${att.toFixed(1)}%`]],
      margin: { left: margin, right: margin },
      headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 9, halign: 'center' },
      bodyStyles: { fontSize: 9, textColor: DARK, halign: 'center' },
      tableLineColor: BORDER, tableLineWidth: 0.3,
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  drawSectionTitle(doc, y, 'Course-wise Scores');
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Course', 'Score', 'Min Score', 'Weight', 'Status']],
    body: d.batchCourses.map(bc => {
      const course = d.allCourses.find(c => c.courseId === bc.courseId);
      const score  = d.scores.find(s => s.courseId === bc.courseId);
      return [course?.courseName ?? `Course ${bc.courseId}`, score ? String(score.score) : '—', String(course?.minScore ?? '—'), `${course?.weightage ?? '—'}%`, score ? score.status.replace('_', ' ') : 'Not Scored'];
    }),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 9, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 70 }, 1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' }, 2: { halign: 'center', cellWidth: 22 }, 3: { halign: 'center', cellWidth: 22 }, 4: { halign: 'center', cellWidth: 32 } },
    bodyStyles: { fontSize: 9, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    didParseCell: (h) => {
      if (h.section === 'body' && (h.column.index === 1 || h.column.index === 4)) {
        const bc = d.batchCourses[h.row.index];
        const course = d.allCourses.find(c => c.courseId === bc?.courseId);
        const score  = d.scores.find(s => s.courseId === bc?.courseId);
        if (course) h.cell.styles.textColor = scoreRgb(score?.score ?? null, course.minScore);
      }
    },
    tableLineColor: BORDER, tableLineWidth: 0.3,
  });

  if (d.allocation.performance) {
    const fy = (doc as any).lastAutoTable.finalY + 8;
    doc.setFillColor(...LIGHT_BG); doc.setDrawColor(...BORDER);
    doc.roundedRect(margin, fy, doc.internal.pageSize.getWidth() - margin * 2, 14, 2, 2, 'FD');
    doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('PERFORMANCE STATUS', margin + 4, fy + 6);
    doc.setTextColor(...DARK); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(d.allocation.performance.replace('_', ' '), margin + 4, fy + 11);
  }

  drawPageFooter(doc);
  doc.save(`Kanini_Report_${d.allocation.candidateName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
};

// ── 3. TA downloads full batch report ────────────────────────────────────────
export interface BatchReportData {
  allocations: BatchAllocationResponse[];
  batchCourses: BatchCourseResponse[];
  allCourses: TrainingCourseResponse[];
  allScores: TrainingScoreResponse[];  // all scores for this batch
  programName: string;
  batchNumber: number;
  programYear: number;
}

export const downloadBatchReport = (d: BatchReportData) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 14;

  drawPageHeader(doc, 'BATCH PROGRESS REPORT');

  let y = 30;
  doc.setFillColor(...LIGHT_BG); doc.setDrawColor(...BORDER);
  doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'FD');
  const cols = [
    { label: 'PROGRAM', value: d.programName, x: margin + 4 },
    { label: 'BATCH',   value: `Batch ${d.batchNumber}`, x: W / 4 },
    { label: 'YEAR',    value: String(d.programYear), x: W / 2 },
    { label: 'TOTAL INTERNS', value: String(d.allocations.length), x: W * 3 / 4 },
  ];
  cols.forEach(c => {
    doc.setTextColor(...GREY); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(c.label, c.x, y + 5);
    doc.setTextColor(...DARK); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(c.value, c.x, y + 11);
  });
  y += 20;

  const courseHeaders = d.batchCourses.map(bc =>
    d.allCourses.find(c => c.courseId === bc.courseId)?.courseName ?? `Course ${bc.courseId}`
  );

  // Sort by overall score descending for the report
  const sorted = [...d.allocations].sort((a, b) =>
    Number(b.overallWeightedScore ?? 0) - Number(a.overallWeightedScore ?? 0)
  );

  const body = sorted.map((a, idx) => {
    const att = Number(a.attendancePercentage ?? 0);
    const ws  = a.overallWeightedScore != null ? Number(a.overallWeightedScore).toFixed(1) : '—';
    const courseScores = d.batchCourses.map(bc => {
      const score = d.allScores.find(s => s.studentId === a.studentId && s.courseId === bc.courseId);
      return score ? String(score.score) : '—';
    });
    return [String(idx + 1), a.candidateName, `${att.toFixed(1)}%`, ws, a.performance ? a.performance.replace('_', ' ') : '—', ...courseScores];
  });

  const fixedW = 10 + 50 + 22 + 22 + 28;
  const courseColW = Math.max(18, (W - margin * 2 - fixedW) / Math.max(d.batchCourses.length, 1));
  const colStyles: Record<number, object> = {
    0: { halign: 'center', cellWidth: 10 },
    1: { halign: 'left',   cellWidth: 50 },
    2: { halign: 'center', cellWidth: 22 },
    3: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
    4: { halign: 'center', cellWidth: 28 },
  };
  d.batchCourses.forEach((_, i) => { colStyles[5 + i] = { halign: 'center', cellWidth: courseColW }; });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Intern Name', 'Attendance', 'Overall Score', 'Performance', ...courseHeaders]],
    body,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    columnStyles: colStyles,
    didParseCell: (h) => {
      if (h.section === 'body' && h.column.index === 2) {
        const val = parseFloat(String(h.cell.raw).replace('%', ''));
        h.cell.styles.textColor = val < 75 ? DANGER : SUCCESS;
      }
      if (h.section === 'body' && h.column.index === 3) {
        const val = parseFloat(String(h.cell.raw));
        if (!isNaN(val)) h.cell.styles.textColor = val >= 85 ? SUCCESS : val >= 60 ? WARNING : DANGER;
      }
      // Color course score columns
      if (h.section === 'body' && h.column.index >= 5) {
        const courseIdx = h.column.index - 5;
        const bc = d.batchCourses[courseIdx];
        const course = d.allCourses.find(c => c.courseId === bc?.courseId);
        const val = parseFloat(String(h.cell.raw));
        if (!isNaN(val) && course) h.cell.styles.textColor = scoreRgb(val, course.minScore);
      }
    },
    tableLineColor: BORDER, tableLineWidth: 0.3,
  });

  drawPageFooter(doc);
  doc.save(`Kanini_Batch_Report_${d.programName.replace(/\s+/g, '_')}_Batch${d.batchNumber}_${new Date().getFullYear()}.pdf`);
};
