import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Card, TextField, Button, Typography, Stack, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  Save as SaveIcon, Upload as UploadIcon, Download as DownloadIcon,
} from '@mui/icons-material';
import { FigmaAddIcon as AddIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import {
  trainingScoreApi, trainingCourseApi,
  batchAllocationApi, batchCourseApi, trainingProgramApi,
  excelUploadApi,
} from '../../../services/academy.api';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import FilterSelect from '../../Common/FilterSelect';
import type {
  TrainingScoreResponse, TrainingScoreRequest,
  TrainingCourseResponse, BatchAllocationResponse,
  BatchCourseResponse, AcademyContextProps, TrainingProgramResponse,
} from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/TrainingScoresPanel.css';

const STATUS_CLASS: Record<string, string> = {
  EXCELLENT:     'sc-status-chip sc-status-chip--excellent',
  GOOD:          'sc-status-chip sc-status-chip--good',
  AVERAGE:       'sc-status-chip sc-status-chip--average',
  BELOW_AVERAGE: 'sc-status-chip sc-status-chip--below',
};

const TrainingScoresPanel = ({ context, readOnly = false }: { context: AcademyContextProps; readOnly?: boolean }) => {
  const { programYear, programs: yearPrograms, cycles: ctxCycles = [] } = context;
  const loggedInUser = tokenstore.getUser();
  const userRole = loggedInUser?.roleName?.toUpperCase() ?? '';
  const userId = loggedInUser?.userId ?? 0;
  const isTrainer = userRole === 'TRAINING_COORDINATOR' || userRole === 'MEMBERS' || userRole === 'TA_MANAGER';
  const canEdit = !readOnly && isTrainer;

  // ── Base data ──
  const [allCourses, setAllCourses]     = useState<TrainingCourseResponse[]>([]);
  const [batchCourses, setBatchCourses] = useState<BatchCourseResponse[]>([]);
  const [batchStudents, setBatchStudents] = useState<BatchAllocationResponse[]>([]);
  const [scores, setScores]             = useState<TrainingScoreResponse[]>([]);
  const [allPrograms, setAllPrograms]   = useState<TrainingProgramResponse[]>([]);
  const [loading, setLoading]           = useState(true);

  // ── View filters ──
  const [filterProgramId, setFilterProgramId] = useState(0);
  const [filterBatchNo, setFilterBatchNo]     = useState(0);
  const [filterCourseId, setFilterCourseId]   = useState(0);

  // ── Give Score dialog ──
  const [dlgOpen, setDlgOpen] = useState(false);
  const [scoreMap, setScoreMap] = useState<Record<number, { score: string; review: string; commScores: Record<string, string> }>>({});
  const [saving, setSaving]   = useState(false);

  // ── Upload state ──
  const [uploading, setUploading]       = useState(false);
  const uploadRef                       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBase();
    setFilterProgramId(0); setFilterBatchNo(0); setFilterCourseId(0);
  }, [yearPrograms]);

  // Fetch scores from backend only when program + batch + course are all selected
  useEffect(() => {
    if (filterProgramId && filterBatchNo && filterCourseId) {
      trainingScoreApi.getScoresByBatchAndCourse(filterProgramId, filterBatchNo, filterCourseId)
        .then(res => { if (res.success && res.data) setScores(res.data); })
        .catch(() => {});
    } else {
      setScores([]);
    }
  }, [filterProgramId, filterBatchNo, filterCourseId]);

  // Fetch only active students for selected batch — used in table and dialog
  useEffect(() => {
    if (filterProgramId && filterBatchNo) {
      batchAllocationApi.getAllocationsByBatch(filterProgramId, filterBatchNo)
        .then(res => {
          if (res.success && res.data)
            setBatchStudents(res.data.filter(a => a.isActive));
        })
        .catch(() => {});
    } else {
      setBatchStudents([]);
    }
  }, [filterProgramId, filterBatchNo]);

  const fetchBase = async () => {
    try {
      setLoading(true);
      // Only fetch courses, batch-courses and programs upfront
      // Scores are fetched on-demand when program+batch+course are selected
      const [crsRes, bcRes, progRes] = await Promise.all([
        trainingCourseApi.getAllCourses(),
        batchCourseApi.getAllBatchCourses(),
        trainingProgramApi.getAllPrograms(),
      ]);
      if (crsRes.success && crsRes.data)    setAllCourses(crsRes.data);
      if (bcRes.success && bcRes.data)      setBatchCourses(bcRes.data);
      if (progRes.success && progRes.data)  setAllPrograms(progRes.data);
    } catch (err) {
      const e = handleAxiosError(err);
      showToast(e.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshScores = async () => {
    if (filterProgramId && filterBatchNo && filterCourseId) {
      const res = await trainingScoreApi.getScoresByBatchAndCourse(filterProgramId, filterBatchNo, filterCourseId);
      if (res.success && res.data) setScores(res.data);
    }
  };

  // ── Auto-select based on global programYear ──
  useEffect(() => {
    if (loading || allPrograms.length === 0) return;
    if (filterProgramId !== 0) return; // don't override if user already selected

    // Find cycle matching programYear from context
    const matchedCycle = programYear !== 0
      ? ctxCycles.find(c => c.cycleYear === programYear)
      : ctxCycles.find(c => c.status === 'OPEN') ?? ctxCycles[0];
    if (!matchedCycle) return;

    // Pick first active program in that cycle
    const prog = allPrograms.find(p => p.cycleId === matchedCycle.cycleId && p.status === true)
      ?? allPrograms.find(p => p.cycleId === matchedCycle.cycleId);
    if (!prog) return;
    setFilterProgramId(prog.programId);

    if (prog.numberOfBatches >= 1) {
      setFilterBatchNo(1);
      const linkedBC = batchCourses.find(bc => bc.programId === prog.programId && bc.batchNo === 1);
      if (linkedBC) {
        const course = allCourses.find(c => c.courseId === linkedBC.courseId);
        if (course) setFilterCourseId(course.courseId);
      }
    }
  }, [loading, allPrograms, programYear, ctxCycles, batchCourses, allCourses]);

  // ── View filter derived ──

  // Programs scoped to global programYear — uses yearPrograms from context
  const programsForCycle = programYear === 0 ? allPrograms : yearPrograms;

  // Batch numbers for selected program (view)
  const batchesForProgram = filterProgramId
    ? Array.from({ length: allPrograms.find(p => p.programId === filterProgramId)?.numberOfBatches ?? 0 }, (_, i) => i + 1)
    : [];

  // Courses linked to selected program+batch (view) — all courses visible for viewing
  const coursesForBatch = (filterProgramId && filterBatchNo)
    ? batchCourses
        .filter(bc => bc.programId === filterProgramId && bc.batchNo === filterBatchNo)
        .map(bc => allCourses.find(c => c.courseId === bc.courseId))
        .filter((c): c is TrainingCourseResponse => !!c)
    : [];

  // For TC and MEMBERS, restrict score editing to only their assigned courses
  const isAssignedCourse = (userRole === 'TRAINING_COORDINATOR' || userRole === 'MEMBERS')
    ? batchCourses.some(bc => bc.programId === filterProgramId && bc.batchNo === filterBatchNo && bc.courseId === filterCourseId && bc.conductedBy === userId)
    : true;

  // Students for selected program+batch — from targeted batch endpoint
  const studentsForView = batchStudents;

  // Filtered rows for table — students with score for selected course
  const tableRows = filterCourseId
    ? studentsForView.map(s => ({
        student: s,
        score: scores.find(sc => sc.courseId === filterCourseId && sc.studentId === s.studentId) ?? null,
      }))
    : [];

  // ── Dialog derived — uses batchStudents from targeted endpoint ──
  const dlgStudents = batchStudents;

  // ── Active program check — scores can only be given for active programs ──
  const selectedProgramObj = allPrograms.find(p => p.programId === filterProgramId);
  const isSelectedProgramActive = selectedProgramObj?.status === true;
  // Also check batch course status — can only score ACTIVE batch courses
  const selectedBatchCourseStatus = batchCourses.find(
    bc => bc.programId === filterProgramId && bc.batchNo === filterBatchNo && bc.courseId === filterCourseId
  )?.status;
  const isBatchCourseActive = selectedBatchCourseStatus === 'ACTIVE';
  const canGiveScore = canEdit && filterProgramId !== 0 && filterBatchNo !== 0 && filterCourseId !== 0 && isSelectedProgramActive && isBatchCourseActive && isAssignedCourse;

  const getGiveScoreTooltip = () => {
    if (!canEdit) return '';
    if (filterProgramId === 0) return 'Select a specific program first';
    if (!isSelectedProgramActive) return 'Scores can only be given for active programs';
    if (!isAssignedCourse) return 'You can only give scores for courses assigned to you';
    if (filterBatchNo === 0) return 'Select a batch first';
    if (filterCourseId === 0) return 'Select a course first';
    if (!isBatchCourseActive) return `Course is ${selectedBatchCourseStatus ?? 'not active'} — move it to ACTIVE first`;
    return '';
  };

  const openDlg = () => {
    const map: Record<number, { score: string; review: string; commScores: Record<string, string> }> = {};
    batchStudents.forEach(s => {
      const existing = scores.find(sc => sc.courseId === filterCourseId && sc.studentId === s.studentId);
      // Pre-fill commScores from existing breakdown if available
      let commScores: Record<string, string> = {};
      if (isCommCourse && existing?.communicationBreakdown) {
        try {
          const parsed: { name: string; score: number }[] = JSON.parse(existing.communicationBreakdown);
          parsed.forEach(f => { commScores[f.name] = String(f.score); });
        } catch { /* ignore */ }
      }
      map[s.studentId] = {
        score:  existing ? String(existing.score) : '',
        review: existing?.review ?? '',
        commScores,
      };
    });
    setScoreMap(map);
    setDlgOpen(true);
  };

  const downloadScoreTemplate = () => {
    if (!filterProgramId || !filterBatchNo || !filterCourseId) {
      showToast('Select Program, Batch and Course before downloading template', 'error');
      return;
    }
    const sorted = [...batchStudents].sort((a, b) => a.candidateName.localeCompare(b.candidateName));
    if (sorted.length === 0) {
      showToast('No active students found for selected Program and Batch', 'error');
      return;
    }
    const rows = sorted.map(student => ({
      'Student ID': student.studentId,
      'Candidate Name': student.candidateName,
      'Candidate Email': student.candidateEmail,
      'Score': '',
      'Review': '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
    XLSX.writeFile(workbook, `scores_template_program_${filterProgramId}_batch_${filterBatchNo}_course_${filterCourseId}.xlsx`);
  };

  const handleScoreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!file.name.endsWith('.xlsx')) { showToast('Only .xlsx files are supported', 'error'); return; }
    if (!filterProgramId || !filterBatchNo || !filterCourseId) {
      showToast('Select Program, Batch and Course before uploading', 'error'); return;
    }
    try {
      setUploading(true);
      const res = await excelUploadApi.uploadScores(file, filterProgramId, filterBatchNo, filterCourseId, loggedInUser?.userId ?? 0);
      if (res.success && res.data) {
        const d = res.data;
        if (d.failedCount === 0) {
          showToast(`✅ ${d.savedCount} score(s) saved successfully`, 'success');
        } else if (d.savedCount === 0) {
          showToast(`❌ Upload failed — ${d.failedCount} error(s). Check details below.`, 'error');
        } else {
          showToast(`⚠ ${d.savedCount} saved, ${d.failedCount} failed — check details below`, 'error');
        }
        if (d.errors.length > 0) {
          // Show first 3 errors as individual toasts so user sees them
          d.errors.slice(0, 3).forEach(err => showToast(err, 'error'));
          if (d.errors.length > 3) showToast(`...and ${d.errors.length - 3} more errors`, 'error');
        }
        await refreshScores();
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAll = async () => {
    const entries = Object.entries(scoreMap).filter(([, v]) => {
      if (isCommCourse) {
        // For communication courses, at least one sub-score must be filled
        return Object.values(v.commScores).some(s => s.trim() !== '');
      }
      return v.score.trim() !== '';
    });
    if (entries.length === 0) { showToast('Enter at least one score', 'error'); return; }

    if (!isCommCourse) {
      for (const [, v] of entries) {
        const n = Number(v.score);
        if (isNaN(n) || n < 0 || n > 100) { showToast('All scores must be between 0 and 100', 'error'); return; }
      }
    } else {
      for (const [, v] of entries) {
        for (const field of commTemplate) {
          const val = v.commScores[field.name];
          if (val === undefined || val.trim() === '') { showToast(`Enter score for "${field.name}" for all students`, 'error'); return; }
          const n = Number(val);
          if (isNaN(n) || n < 0 || n > field.maxScore) { showToast(`"${field.name}" score must be between 0 and ${field.maxScore}`, 'error'); return; }
        }
      }
    }

    // Check if any entries will overwrite existing scores
    const overwriteCount = entries.filter(([studentIdStr]) => {
      const studentId = Number(studentIdStr);
      return scores.some(sc => sc.courseId === filterCourseId && sc.studentId === studentId);
    }).length;
    if (overwriteCount > 0) {
      if (!window.confirm(`${overwriteCount} student(s) already have scores for this course. Their scores will be updated. Continue?`)) return;
    }

    try {
      setSaving(true);
      let saved = 0;
      for (const [studentIdStr, v] of entries) {
        const studentId = Number(studentIdStr);
        const existing = scores.find(sc => sc.courseId === filterCourseId && sc.studentId === studentId);

        let scoreNum: number;
        let communicationBreakdown: string | undefined;

        if (isCommCourse) {
          // Build breakdown array and compute total score from sub-scores
          const breakdown = commTemplate.map(f => ({
            name: f.name,
            score: Number(v.commScores[f.name] ?? 0),
            maxScore: f.maxScore,
          }));
          scoreNum = breakdown.reduce((sum, f) => sum + f.score, 0);
          communicationBreakdown = JSON.stringify(breakdown);
        } else {
          scoreNum = Number(v.score);
        }

        const req: TrainingScoreRequest = {
          courseId: filterCourseId, studentId, score: scoreNum,
          review: v.review, reviewedBy: loggedInUser?.userId ?? 0,
          ...(communicationBreakdown && { communicationBreakdown }),
        };
        try {
          if (existing) {
            await trainingScoreApi.updateScore(existing.scoreId, req);
          } else {
            await trainingScoreApi.createScore(req);
          }
          saved++;
        } catch (err: any) {
          const msg = err?.message || `Failed to save score for student ${studentId}`;
          showToast(msg, 'error');
        }
      }
      if (saved > 0) showToast(`${saved} score(s) saved successfully`, 'success');
      setDlgOpen(false);
      await refreshScores();
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to save scores', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getExistingScore = (studentId: number) =>
    scores.find(s => s.courseId === filterCourseId && s.studentId === studentId);

  // ── Communication course detection — must be declared before openDlg ──
  const selectedCourse = allCourses.find(c => c.courseId === filterCourseId);
  // Detect via isCommunication flag OR communicationTemplate on the course
  const isCommCourse = selectedCourse?.isCommunication === true || !!selectedCourse?.communicationTemplate;

  // Template lives on TrainingCourse — same for all batches in the program
  const commTemplate: { name: string; maxScore: number }[] = (() => {
    if (!isCommCourse) return [];
    if (selectedCourse?.communicationTemplate) {
      try { return JSON.parse(selectedCourse.communicationTemplate); }
      catch { /* fall through to default */ }
    }
    return [
      { name: 'Grammar', maxScore: 20 },
      { name: 'Proactiveness', maxScore: 20 },
      { name: 'Fluency', maxScore: 10 },
    ];
  })();

  if (loading) {
    return (
      <Box className="sc-loading-wrap">
        <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  return (
    <Box className="sc-page">
      <Card className="sc-card">

        {/* Filters */}
        <Box className="sc-filter-section">
          <Box className="sc-filter-row">

            {/* Program */}
            <FilterSelect label="Program" value={String(filterProgramId)}
              onChange={v => {
                setFilterProgramId(Number(v));
                setFilterBatchNo(0); setFilterCourseId(0);

              }}>
              <MenuItem value="0">All Programs</MenuItem>
              {programsForCycle.map(p => (
                <MenuItem key={p.programId} value={String(p.programId)}>{p.programName}</MenuItem>
              ))}
            </FilterSelect>

            {/* Batch */}
            <FilterSelect label="Batch" value={String(filterBatchNo)}
              onChange={v => { setFilterBatchNo(Number(v)); setFilterCourseId(0); }}>
              <MenuItem value="0">All Batches</MenuItem>
              {batchesForProgram.map(b => (
                <MenuItem key={b} value={String(b)}>Batch {b}</MenuItem>
              ))}
            </FilterSelect>

            {/* Course — selecting course auto-fills Cycle, Program, Batch */}
            <FilterSelect label="Course" value={String(filterCourseId)}
              onChange={v => {
                const courseId = Number(v);
                setFilterCourseId(courseId);
                if (!courseId) return;
                // Auto-fill upward only if batch not already selected
                if (!filterBatchNo) {
                  const linkedBCs = batchCourses.filter(bc => bc.courseId === courseId);
                  if (linkedBCs.length === 0) return;
                  const bc = linkedBCs[0];
                  const prog = allPrograms.find(p => p.programId === bc.programId);
                  if (!prog) return;
                  setFilterProgramId(prog.programId);
                  setFilterBatchNo(bc.batchNo);
                }
              }}>
              <MenuItem value="0">All Courses</MenuItem>
              {/* Show only batch-linked courses when batch is selected, else show all */}
              {(filterBatchNo ? coursesForBatch : allCourses).map(c => (
                <MenuItem key={c.courseId} value={String(c.courseId)}>{c.courseName}</MenuItem>
              ))}
            </FilterSelect>

            <Box className="sc-filter-spacer" />
            {canEdit && (
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />}
                onClick={downloadScoreTemplate} className="sc-template-btn">
                Template
              </Button>
            )}
            {canEdit && (
              <>
                <input ref={uploadRef} type="file" accept=".xlsx"
                  style={{ display: 'none' }} onChange={handleScoreUpload} />
                <Button variant="outlined" size="small"
                  startIcon={uploading ? <CircularProgress size={14} /> : <UploadIcon />}
                  onClick={() => {
                    if (!filterProgramId || !filterBatchNo || !filterCourseId) {
                      showToast('Select Program, Batch and Course first', 'error'); return;
                    }
                    uploadRef.current?.click();
                  }}
                  disabled={uploading} className="sc-upload-btn">
                  {uploading ? 'Uploading...' : 'Upload Excel'}
                </Button>
              </>
            )}
            {canEdit && (
              <Button variant="contained" startIcon={<AddIcon />}
                onClick={openDlg}
                disabled={!canGiveScore}
                title={getGiveScoreTooltip()}
                className="sc-add-button">
                Give Score
              </Button>
            )}

            {/* Course info pill */}
            {selectedCourse && (() => {
              const bc = batchCourses.find(b => b.courseId === filterCourseId && b.programId === filterProgramId && b.batchNo === filterBatchNo);
              return (
                <Typography className="sc-course-pill">
                  Min Score: {selectedCourse.minScore}{bc?.status ? ` · ${bc.status}` : ''}
                </Typography>
              );
            })()}
          </Box>
        </Box>

        <Box className="sc-separator" />

        {/* Table */}
        <Box className="sc-table-section">
          {!filterCourseId ? (
            <Box className="sc-empty-state">
              <MenuBookIcon className="sc-empty-icon" />
              <Typography className="sc-empty-text">
                {!filterProgramId ? 'Select a program to get started'
                  : !filterBatchNo ? 'Now select a batch'
                  : 'Now select a course to view scores'}
              </Typography>
            </Box>
          ) : tableRows.length === 0 ? (
            <Box className="sc-empty-state">
              <Typography className="sc-empty-text">No active students in this batch</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="sc-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="sc-table-head-row">
                      <TableCell className="sc-table-head-cell">Student</TableCell>
                      <TableCell className="sc-table-head-cell">Score</TableCell>
                      <TableCell className="sc-table-head-cell">Status</TableCell>
                      <TableCell className="sc-table-head-cell">Review</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map(({ student, score }, idx) => (
                      <TableRow key={student.studentId} hover
                        className={`sc-table-row ${idx % 2 === 0 ? 'sc-table-row--even' : 'sc-table-row--odd'}`}>
                        <TableCell className="sc-table-cell">
                          <Typography className="sc-row-primary">
                            {student.candidateName || `Student #${student.studentId}`}
                          </Typography>
                          <Typography className="sc-row-secondary">{student.department || ''}</Typography>
                        </TableCell>
                        <TableCell className="sc-table-cell">
                          <Typography className={score ? 'sc-score-filled' : 'sc-score-empty'}>
                            {score
                              ? isCommCourse && score.maxScore
                                ? `${Math.round((score.score / score.maxScore) * 100)} / 100`
                                : `${score.score} / 100`
                              : '—'}
                          </Typography>
                          {/* Show sub-score breakdown for Communication courses */}
                          {score?.communicationBreakdown && (() => {
                            try {
                              const fields: { name: string; score: number; maxScore: number }[] =
                                JSON.parse(score.communicationBreakdown);
                              return (
                                <Box sx={{ mt: 0.5 }}>
                                  {fields.map(f => (
                                    <Typography key={f.name} sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                      {f.name}: {f.score}/{f.maxScore}
                                    </Typography>
                                  ))}
                                </Box>
                              );
                            } catch { return null; }
                          })()}
                        </TableCell>
                        <TableCell className="sc-table-cell">
                          {score ? (
                            <Chip label={score.status.replace('_', ' ')} size="small" variant="outlined"
                              className={STATUS_CLASS[score.status] ?? 'sc-status-chip'} />
                          ) : <Typography className="sc-score-empty">—</Typography>}
                        </TableCell>
                        <TableCell className="sc-table-cell">
                          <Typography className="sc-review">{score?.review || '—'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Card>

      {/* Give Score Dialog */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="sc-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Give Score — {selectedProgramObj?.programName} · Batch {filterBatchNo} · {allCourses.find(c => c.courseId === filterCourseId)?.courseName}
          <IconButton size="small" onClick={() => setDlgOpen(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Students table with inline score inputs */}
            {dlgStudents.length === 0 ? (
              <Typography sx={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center', py: 2 }}>
                No active students in this batch
              </Typography>
            ) : (
              <Box className="sc-dlg-table-wrap">
                <Box className="sc-dlg-row sc-dlg-row--header"
                  sx={{ gridTemplateColumns: isCommCourse ? '1.5fr 2fr 2fr 140px' : '2fr 1fr 2fr 140px' }}>
                  <Typography className="sc-dlg-col-label sc-dlg-col--student">Student</Typography>
                  <Typography className="sc-dlg-col-label sc-dlg-col--score">
                    {isCommCourse ? `Sub-scores (Total: ${commTemplate.reduce((s, f) => s + f.maxScore, 0)})` : 'Score (0–100) *'}
                  </Typography>
                  <Typography className="sc-dlg-col-label sc-dlg-col--review">Review</Typography>
                  <Typography className="sc-dlg-col-label sc-dlg-col--status">Current Status</Typography>
                </Box>
                {dlgStudents.map(s => {
                  const existing = getExistingScore(s.studentId);
                  const val = scoreMap[s.studentId] ?? { score: '', review: '', commScores: {} };
                  return (
                    <Box key={s.studentId}
                      className={`sc-dlg-row ${existing ? 'sc-dlg-row--scored' : ''}`}
                      sx={{ gridTemplateColumns: isCommCourse ? '1.5fr 2fr 2fr 140px' : '2fr 1fr 2fr 140px', alignItems: 'start' }}>
                      <Box className="sc-dlg-col--student">
                        <Typography className="sc-row-primary">
                          {s.candidateName || `Student #${s.studentId}`}
                        </Typography>
                        <Typography className="sc-row-secondary">{s.department || ''}</Typography>
                      </Box>
                      <Box className="sc-dlg-col--score">
                        {isCommCourse ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {commTemplate.map(field => {
                              const raw = val.commScores[field.name] ?? '';
                              const num = raw === '' ? NaN : Number(raw);
                              const isErr = raw !== '' && (isNaN(num) || num < 0 || num > field.maxScore);
                              return (
                                <Box key={field.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontSize: 'var(--text-xs)', width: 110, flexShrink: 0, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                    {field.name}
                                  </Typography>
                                  <TextField
                                    size="small"
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                    value={raw}
                                    error={isErr}
                                    helperText={isErr ? `0–${field.maxScore}` : ''}
                                    onChange={e => {
                                      const v = e.target.value.replace(/[^0-9]/g, '');
                                      setScoreMap(prev => ({
                                        ...prev,
                                        [s.studentId]: {
                                          ...prev[s.studentId],
                                          commScores: { ...prev[s.studentId]?.commScores, [field.name]: v },
                                        },
                                      }));
                                    }}
                                    sx={{ width: 72 }}
                                    placeholder={`/${field.maxScore}`}
                                  />
                                </Box>
                              );
                            })}
                            <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', mt: 0.5, fontWeight: 600 }}>
                              Total: {commTemplate.reduce((sum, f) => sum + (Number(val.commScores[f.name]) || 0), 0)}
                              /{commTemplate.reduce((sum, f) => sum + f.maxScore, 0)}
                            </Typography>
                          </Box>
                        ) : (
                          <TextField
                            size="small"
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                            value={val.score}
                            onChange={e => {
                              const v = e.target.value.replace(/[^0-9]/g, '');
                              setScoreMap(prev => ({
                                ...prev,
                                [s.studentId]: { ...prev[s.studentId] ?? { score: '', review: '', commScores: {} }, score: v },
                              }));
                            }}
                            error={val.score !== '' && (Number(val.score) < 0 || Number(val.score) > 100)}
                            helperText={val.score !== '' && (Number(val.score) < 0 || Number(val.score) > 100) ? '0–100' : ''}
                            className="sc-score-input"
                            placeholder="0–100"
                          />
                        )}
                      </Box>
                      <Box className="sc-dlg-col--review">
                        <TextField
                          size="small" fullWidth
                          value={val.review}
                          onChange={e => setScoreMap(prev => ({
                            ...prev,
                            [s.studentId]: { ...prev[s.studentId] ?? { score: '', review: '', commScores: {} }, review: e.target.value },
                          }))}
                          placeholder="Optional feedback"
                          className="sc-review-input"
                        />
                      </Box>
                      <Box className="sc-dlg-col--status">
                        {existing ? (
                          <Chip label={existing.status.replace('_', ' ')} size="small" variant="outlined"
                            className={STATUS_CLASS[existing.status] ?? 'sc-status-chip'} />
                        ) : (
                          <Typography className="sc-score-empty">Not scored</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDlgOpen(false)} className="sc-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" startIcon={<SaveIcon />}
            onClick={handleSaveAll}
            disabled={saving || dlgStudents.length === 0}
            className="sc-dialog-submit-btn">
            {saving ? 'Saving...' : 'Save All Scores'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingScoresPanel;
