import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, CircularProgress, Button } from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  MenuBook as MenuBookIcon,
  CheckCircle as CheckCircleIcon,
  BarChart as BarChartIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { trainingProgramApi, batchAllocationApi, trainingScoreApi, trainingCourseApi } from '../../../services/academy.api';
import { tokenstore } from '../../../auth/tokenstore';
import { showToast } from '../../../utils/toast';
import '../../../css/Academy/TrainingCoordinator/TrainingCoordinatorDashboard.css';

const CURRENT_YEAR = new Date().getFullYear();

const TrainingCoordinatorDashboard = () => {
  const navigate = useNavigate();
  const user = tokenstore.getUser();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activePrograms: 0,
    totalStudents: 0,
    activeStudents: 0,
    projectReadyStudents: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalScores: 0,
    avgAttendance: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [progRes, allocRes, scoreRes, courseRes] = await Promise.all([
        trainingProgramApi.getAllPrograms(),
        batchAllocationApi.getAllAllocations(),
        trainingScoreApi.getAllScores(),
        trainingCourseApi.getAllCourses(),
      ]);

      const programs = (progRes.success && progRes.data) ? progRes.data : [];
      const allocations = (allocRes.success && allocRes.data) ? allocRes.data : [];
      const scores = (scoreRes.success && scoreRes.data) ? scoreRes.data : [];
      const courses = (courseRes.success && courseRes.data) ? courseRes.data : [];

      // Filter to current year
      const yearPrograms = programs.filter((p) => p.programYear === CURRENT_YEAR);
      const yearProgramIds = new Set(yearPrograms.map((p) => p.programId));
      const yearAllocations = allocations.filter((a) => yearProgramIds.has(a.programId));
      const activeStudents = yearAllocations.filter((a) => a.isActive);
      const projectReady = yearAllocations.filter((a) => a.performance === 'PROJECT_READY');

      const avgAtt = activeStudents.length > 0
        ? activeStudents.reduce((sum, a) => sum + Number(a.attendancePercentage), 0) / activeStudents.length
        : 0;

      const yearCourses = courses.filter(
        (c) => !c.startDate || new Date(c.startDate).getFullYear() === CURRENT_YEAR
      );

      setStats({
        totalPrograms: yearPrograms.length,
        activePrograms: yearPrograms.filter((p) => p.status).length,
        totalStudents: yearAllocations.length,
        activeStudents: activeStudents.length,
        projectReadyStudents: projectReady.length,
        totalCourses: yearCourses.length,
        activeCourses: yearCourses.filter((c) => c.status === 'ACTIVE').length,
        totalScores: scores.length,
        avgAttendance: Math.round(avgAtt * 10) / 10,
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (pct: number) => {
    if (pct < 50) return 'var(--color-error)';
    if (pct < 75) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

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

      {/* Welcome Header */}
      <Box className="tcd-welcome">
        <Box>
          <Typography className="tcd-welcome-title">
            Welcome back, {user?.username ?? 'Coordinator'} 👋
          </Typography>
          <Typography className="tcd-welcome-subtitle">
            {CURRENT_YEAR} Training Overview — here's what's happening today
          </Typography>
        </Box>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/training-coordinator/academy')}
          className="tcd-goto-btn"
        >
          Go to Academy
        </Button>
      </Box>

      {/* Stats Grid */}
      <Box className="tcd-stats-grid">

        {/* Programs */}
        <Card className="tcd-stat-card">
          <Box className="tcd-stat-icon-box tcd-stat-icon-box--blue">
            <SchoolIcon className="tcd-stat-icon" />
          </Box>
          <Box className="tcd-stat-content">
            <Typography className="tcd-stat-value">{stats.totalPrograms}</Typography>
            <Typography className="tcd-stat-label">Programs in {CURRENT_YEAR}</Typography>
            <Typography className="tcd-stat-sub">{stats.activePrograms} active</Typography>
          </Box>
        </Card>

        {/* Students */}
        <Card className="tcd-stat-card">
          <Box className="tcd-stat-icon-box tcd-stat-icon-box--green">
            <PeopleIcon className="tcd-stat-icon" />
          </Box>
          <Box className="tcd-stat-content">
            <Typography className="tcd-stat-value">{stats.activeStudents}</Typography>
            <Typography className="tcd-stat-label">Active Students</Typography>
            <Typography className="tcd-stat-sub">{stats.projectReadyStudents} project ready</Typography>
          </Box>
        </Card>

        {/* Courses */}
        <Card className="tcd-stat-card">
          <Box className="tcd-stat-icon-box tcd-stat-icon-box--purple">
            <MenuBookIcon className="tcd-stat-icon" />
          </Box>
          <Box className="tcd-stat-content">
            <Typography className="tcd-stat-value">{stats.totalCourses}</Typography>
            <Typography className="tcd-stat-label">Courses in {CURRENT_YEAR}</Typography>
            <Typography className="tcd-stat-sub">{stats.activeCourses} currently active</Typography>
          </Box>
        </Card>

        {/* Scores */}
        <Card className="tcd-stat-card">
          <Box className="tcd-stat-icon-box tcd-stat-icon-box--orange">
            <BarChartIcon className="tcd-stat-icon" />
          </Box>
          <Box className="tcd-stat-content">
            <Typography className="tcd-stat-value">{stats.totalScores}</Typography>
            <Typography className="tcd-stat-label">Scores Recorded</Typography>
            <Typography className="tcd-stat-sub">across all courses</Typography>
          </Box>
        </Card>

        {/* Attendance */}
        <Card className="tcd-stat-card tcd-stat-card--wide">
          <Box className="tcd-stat-icon-box tcd-stat-icon-box--teal">
            <CheckCircleIcon className="tcd-stat-icon" />
          </Box>
          <Box className="tcd-stat-content">
            <Typography className="tcd-stat-value" style={{ color: getAttendanceColor(stats.avgAttendance) }}>
              {stats.avgAttendance}%
            </Typography>
            <Typography className="tcd-stat-label">Avg Attendance ({CURRENT_YEAR})</Typography>
            <Box className="tcd-attendance-bar-bg">
              <Box
                className="tcd-attendance-bar-fill"
                style={{
                  width: `${Math.min(stats.avgAttendance, 100)}%`,
                  backgroundColor: getAttendanceColor(stats.avgAttendance),
                }}
              />
            </Box>
            <Typography className="tcd-stat-sub">
              {stats.avgAttendance < 75 ? '⚠ Below 75% threshold' : '✓ Above 75% threshold'}
            </Typography>
          </Box>
        </Card>

      </Box>

      {/* Quick Actions */}
      <Box className="tcd-quick-actions">
        <Typography className="tcd-section-title">Quick Actions</Typography>
        <Box className="tcd-action-grid">
          {[
            { label: 'Manage Programs', tab: 'programs', icon: <SchoolIcon />, desc: 'Create & manage training programs' },
            { label: 'Manage Courses', tab: 'courses', icon: <MenuBookIcon />, desc: 'Add courses & assign trainers' },
            { label: 'Allocate Students', tab: 'batch-allocations', icon: <PeopleIcon />, desc: 'Bulk allocate JOINED candidates' },
            { label: 'Mark Attendance', tab: 'attendance', icon: <CheckCircleIcon />, desc: 'Mark batch attendance for today' },
            { label: 'Record Scores', tab: 'scores', icon: <BarChartIcon />, desc: 'Enter course scores for students' },
          ].map((action) => (
            <Card
              key={action.tab}
              className="tcd-action-card"
              onClick={() => navigate(`/training-coordinator/academy`)}
            >
              <Box className="tcd-action-icon-box">{action.icon}</Box>
              <Box>
                <Typography className="tcd-action-label">{action.label}</Typography>
                <Typography className="tcd-action-desc">{action.desc}</Typography>
              </Box>
              <ArrowForwardIcon className="tcd-action-arrow" />
            </Card>
          ))}
        </Box>
      </Box>

    </Box>
  );
};

export default TrainingCoordinatorDashboard;
