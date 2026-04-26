import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, CircularProgress, Button, Chip, LinearProgress } from '@mui/material';
import {
  CheckCircle as AttendanceIcon,
  BarChart as ScoreIcon,
  People as PeopleIcon,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { trainingProgramApi, batchAllocationApi } from '../../../services/academy.api';
import type { BatchAllocationResponse } from '../../../types/Academy/academy.types';
import { tokenstore } from '../../../auth/tokenstore';
import { showToast } from '../../../utils/toast';
import '../../../css/Academy/TrainingCoordinator/TrainingCoordinatorDashboard.css';

const CURRENT_YEAR = new Date().getFullYear();

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
});

const TrainingCoordinatorDashboard = () => {
  const navigate = useNavigate();
  const user = tokenstore.getUser();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStudents: 0,
    projectReady: 0,
    atRisk: 0,
    avgAttendance: 0,
    scoresRecorded: 0,
    totalScoreable: 0,
    excellent: 0,
    needLearning: 0,
  });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const progRes = await trainingProgramApi.getAllPrograms();
      const programs = (progRes.success && progRes.data) ? progRes.data : [];

      // Only fetch allocations for current year programs — not all allocations
      const currentYearPrograms = programs.filter(p => p.programYear === CURRENT_YEAR);
      if (currentYearPrograms.length === 0) {
        setStats({ activeStudents: 0, projectReady: 0, atRisk: 0, avgAttendance: 0, scoresRecorded: 0, totalScoreable: 0, excellent: 0, needLearning: 0 });
        return;
      }

      const allocResults = await Promise.allSettled(
        currentYearPrograms.map(p => batchAllocationApi.getAllocationsByProgram(p.programId))
      );
      const allocations: BatchAllocationResponse[] = [];
      allocResults.forEach(r => {
        if (r.status === 'fulfilled' && r.value.success && r.value.data)
          allocations.push(...r.value.data);
      });

      const active = allocations.filter(a => a.isActive);
      const avgAtt = active.length > 0
        ? active.reduce((s, a) => s + Number(a.attendancePercentage ?? 0), 0) / active.length
        : 0;
      const scoresRecorded = active.filter(a => a.overallWeightedScore != null && Number(a.overallWeightedScore) > 0).length;

      setStats({
        activeStudents: active.length,
        projectReady:   active.filter(a => a.performance === 'PROJECT_READY').length,
        atRisk:         active.filter(a => Number(a.attendancePercentage ?? 0) > 0 && Number(a.attendancePercentage ?? 0) < 75).length,
        avgAttendance:  Math.round(avgAtt * 10) / 10,
        scoresRecorded,
        totalScoreable: active.length,
        excellent:      active.filter(a => Number(a.overallWeightedScore ?? 0) >= 90).length,
        needLearning:   active.filter(a => a.overallWeightedScore != null && Number(a.overallWeightedScore) < 50).length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const attColor = (pct: number) =>
    pct < 50 ? 'var(--color-error)' : pct < 75 ? 'var(--color-warning)' : 'var(--color-success-dark)';

  const goToAcademy = (tab: string) =>
    navigate('/training-coordinator/academy', { state: { tab } });

  if (loading) {
    return (
      <Box className="tcd-loading">
        <CircularProgress size={36} sx={{ color: 'var(--color-primary)' }} />
        <Typography className="tcd-loading-text">Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box className="tcd-page">

      {/* ── Welcome Banner ── */}
      <Box className="tcd-banner">
        <Box className="tcd-banner-left">
          <Typography className="tcd-greeting">
            {getGreeting()}, {user?.username ?? 'Lavanya'} 👋
          </Typography>
          <Typography className="tcd-date">{today}</Typography>
          <Typography className="tcd-role-desc">
            Training Coordinator — {CURRENT_YEAR} Batch
          </Typography>
        </Box>
        <Button variant="contained" endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/training-coordinator/academy')}
          className="tcd-goto-btn">
          Open Academy
        </Button>
      </Box>

      {/* ── Key Metrics ── */}
      <Box className="tcd-metrics-grid">

        {/* Active Students */}
        <Card className="tcd-metric-card">
          <Box className="tcd-metric-icon tcd-metric-icon--blue">
            <PeopleIcon />
          </Box>
          <Box className="tcd-metric-body">
            <Typography className="tcd-metric-value">{stats.activeStudents}</Typography>
            <Typography className="tcd-metric-label">Active Students</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip label={`${stats.projectReady} Project Ready`} size="small"
                sx={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-success-light)', color: 'var(--color-success-dark)', border: '1px solid var(--color-success-border)' }} />
              {stats.atRisk > 0 && (
                <Chip label={`${stats.atRisk} At Risk`} size="small"
                  sx={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-error-light)', color: 'var(--color-error-dark)', border: '1px solid var(--color-error-border)' }} />
              )}
            </Box>
          </Box>
        </Card>

        {/* Attendance */}
        <Card className="tcd-metric-card">
          <Box className="tcd-metric-icon tcd-metric-icon--green">
            <AttendanceIcon />
          </Box>
          <Box className="tcd-metric-body">
            <Typography className="tcd-metric-value" style={{ color: attColor(stats.avgAttendance) }}>
              {stats.avgAttendance}%
            </Typography>
            <Typography className="tcd-metric-label">Avg Attendance</Typography>
            <LinearProgress variant="determinate" value={Math.min(stats.avgAttendance, 100)}
              sx={{
                mt: 1, height: 6, borderRadius: 3,
                background: 'var(--color-grey-225)',
                '& .MuiLinearProgress-bar': {
                  background: attColor(stats.avgAttendance),
                  borderRadius: 3,
                },
              }} />
            <Typography sx={{ fontSize: '10px', color: 'var(--color-text-secondary)', mt: 0.5, fontWeight: 600 }}>
              {stats.avgAttendance < 75 ? '⚠ Below 75% threshold' : '✓ Above 75% threshold'}
            </Typography>
          </Box>
        </Card>

        {/* Scores */}
        <Card className="tcd-metric-card">
          <Box className="tcd-metric-icon tcd-metric-icon--purple">
            <ScoreIcon />
          </Box>
          <Box className="tcd-metric-body">
            <Typography className="tcd-metric-value">{stats.scoresRecorded}</Typography>
            <Typography className="tcd-metric-label">Scores Recorded</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {stats.excellent > 0 && (
                <Chip label={`${stats.excellent} Excellent`} size="small"
                  sx={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-success-light)', color: 'var(--color-success-dark)', border: '1px solid var(--color-success-border)' }} />
              )}
              {stats.needLearning > 0 && (
                <Chip label={`${stats.needLearning} Need Learning`} size="small"
                  sx={{ fontSize: '10px', fontWeight: 600, background: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', border: '1px solid var(--color-warning-border)' }} />
              )}
            </Box>
          </Box>
        </Card>

        {/* At Risk Alert */}
        <Card className={`tcd-metric-card ${stats.atRisk > 0 ? 'tcd-metric-card--alert' : ''}`}>
          <Box className={`tcd-metric-icon ${stats.atRisk > 0 ? 'tcd-metric-icon--red' : 'tcd-metric-icon--teal'}`}>
            {stats.atRisk > 0 ? <WarningIcon /> : <TrophyIcon />}
          </Box>
          <Box className="tcd-metric-body">
            <Typography className="tcd-metric-value"
              style={{ color: stats.atRisk > 0 ? 'var(--color-error)' : 'var(--color-success-dark)' }}>
              {stats.atRisk > 0 ? stats.atRisk : stats.projectReady}
            </Typography>
            <Typography className="tcd-metric-label">
              {stats.atRisk > 0 ? 'Students At Risk' : 'Project Ready'}
            </Typography>
            <Typography sx={{ fontSize: '10px', color: 'var(--color-text-secondary)', mt: 0.5, fontWeight: 600 }}>
              {stats.atRisk > 0
                ? 'Attendance below 75% — action needed'
                : 'Completed training successfully'}
            </Typography>
          </Box>
        </Card>

      </Box>

      {/* ── Quick Actions ── */}
      <Box className="tcd-actions-section">
        <Typography className="tcd-section-title">Your Work</Typography>
        <Box className="tcd-action-grid">

          <Card className="tcd-action-card" onClick={() => goToAcademy('scores')}>
            <Box className="tcd-action-icon-box tcd-action-icon--purple">
              <ScoreIcon />
            </Box>
            <Box className="tcd-action-content">
              <Typography className="tcd-action-label">Record Scores</Typography>
              <Typography className="tcd-action-desc">
                Enter course scores for students · {stats.scoresRecorded} recorded so far
              </Typography>
            </Box>
            <ArrowForwardIcon className="tcd-action-arrow" />
          </Card>

          <Card className="tcd-action-card" onClick={() => goToAcademy('attendance')}>
            <Box className="tcd-action-icon-box tcd-action-icon--green">
              <AttendanceIcon />
            </Box>
            <Box className="tcd-action-content">
              <Typography className="tcd-action-label">Mark Attendance</Typography>
              <Typography className="tcd-action-desc">
                Mark today's batch attendance · Avg {stats.avgAttendance}% this year
              </Typography>
            </Box>
            <ArrowForwardIcon className="tcd-action-arrow" />
          </Card>

          <Card className="tcd-action-card" onClick={() => goToAcademy('candidate-progress')}>
            <Box className="tcd-action-icon-box tcd-action-icon--blue">
              <TrendingUpIcon />
            </Box>
            <Box className="tcd-action-content">
              <Typography className="tcd-action-label">Candidate Progress</Typography>
              <Typography className="tcd-action-desc">
                View full progress of all {stats.activeStudents} active students
                {stats.atRisk > 0 && ` · ${stats.atRisk} need attention`}
              </Typography>
            </Box>
            <ArrowForwardIcon className="tcd-action-arrow" />
          </Card>

        </Box>
      </Box>

    </Box>
  );
};

export default TrainingCoordinatorDashboard;
