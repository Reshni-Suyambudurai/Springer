import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, InputAdornment, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MenuBook as MenuBookIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { trainingCourseApi, userApi } from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import type { TrainingCourseResponse, TrainingCourseRequest, AcademyContextProps, UserSummary } from '../../../types/Academy/academy.types';
import FilterSelect from '../../Common/FilterSelect';
import '../../../css/Academy/TrainingCoordinator/CoursesList.css';

const COURSE_STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const STATUS_CLASS: Record<string, string> = {
  PLANNED:   'crs-status-chip crs-status-chip--planned',
  ACTIVE:    'crs-status-chip crs-status-chip--active',
  COMPLETED: 'crs-status-chip crs-status-chip--completed',
  CANCELLED: 'crs-status-chip crs-status-chip--cancelled',
};

const EMPTY_FORM: TrainingCourseRequest = {
  courseName: '', description: '', startDate: '', endDate: '',
  minScore: 0, weightage: 0, conductedBy: 0,
};

const NEXT_STATUS: Record<string, string> = {
  PLANNED: 'ACTIVE',
  ACTIVE:  'COMPLETED',
};

const CoursesList = ({ context }: { context: AcademyContextProps }) => {
  const [courses, setCourses] = useState<TrainingCourseResponse[]>([]);
  const [trainers, setTrainers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<TrainingCourseResponse | null>(null);
  const [form, setForm] = useState<TrainingCourseRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusCourse, setStatusCourse] = useState<TrainingCourseResponse | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<TrainingCourseResponse | null>(null);

  useEffect(() => {
    fetchData();
    setSearch('');
    setFilterStatus('all');
    setPage(0);
  }, [context.programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [crsRes, tcRes, memRes] = await Promise.all([
        trainingCourseApi.getAllCourses(),
        userApi.getUsersByRole('TRAINING_COORDINATOR'),
        userApi.getUsersByRole('MEMBERS'),
      ]);
      if (crsRes.success && crsRes.data) setCourses(crsRes.data);
      const combined: UserSummary[] = [];
      if (tcRes.success && tcRes.data) combined.push(...tcRes.data);
      if (memRes.success && memRes.data) combined.push(...memRes.data);
      setTrainers(combined);
    } catch (err: any) {
      showToast(err.message || 'Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { programYear } = context;

  // Filter courses by selected program year via start date
  const filtered = courses.filter((c) => {
    const matchYear = programYear === 0
      ? true  // All Years → show all courses regardless of year
      : (!c.startDate || new Date(c.startDate).getFullYear() === programYear);
    const matchSearch = (c.courseName ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchYear && matchSearch && matchStatus;
  });
  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const openCreate = () => {
    setEditCourse(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (course: TrainingCourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCourse(course);
    setForm({
      courseName:  course.courseName,
      description: course.description ?? '',
      startDate:   course.startDate?.split('T')[0] ?? '',
      endDate:     course.endDate?.split('T')[0] ?? '',
      minScore:    course.minScore,
      weightage:   course.weightage,
      conductedBy: course.conductedBy,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.courseName.trim() || !form.startDate || !form.endDate || !form.conductedBy) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (form.endDate < form.startDate) {
      showToast('End date cannot be before start date', 'error');
      return;
    }
    if (form.minScore < 0 || form.minScore > 100) {
      showToast('Min score must be between 0 and 100', 'error');
      return;
    }
    if (form.weightage < 1 || form.weightage > 100) {
      showToast('Weightage must be between 1 and 100', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = editCourse
        ? await trainingCourseApi.updateCourse(editCourse.courseId, form)
        : await trainingCourseApi.createCourse(form);
      if (res.success) {
        showToast(editCourse ? 'Course updated' : 'Course created', 'success');
        setDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusDialog = (course: TrainingCourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusCourse(course);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!statusCourse) return;
    const next = NEXT_STATUS[statusCourse.status];
    if (!next) return;
    try {
      setStatusSubmitting(true);
      const res = await trainingCourseApi.updateCourseStatus(statusCourse.courseId, next);
      if (res.success) {
        showToast(`Course moved to ${next}`, 'success');
        setStatusDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDelete = async (course: TrainingCourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteCourse(course);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteCourse) return;
    try {
      const res = await trainingCourseApi.deleteCourse(deleteCourse.courseId);
      if (res.success) {
        showToast('Course cancelled', 'success');
        setDeleteDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel course', 'error');
    }
  };

  const getTrainerName = (id: number) =>
    trainers.find((t) => t.userId === id)?.username ?? `User #${id}`;

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box className="crs-page">
      <Card className="crs-card">

        <Box className="crs-filter-section">
          <Box className="crs-filter-row">
            <TextField
              placeholder="Search by course name..."
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="crs-search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" className="crs-search-icon" />
                  </InputAdornment>
                ),
              }}
            />
            <FilterSelect label="Status" value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(0); }}>
              <MenuItem value="all">All Status</MenuItem>
              {COURSE_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </FilterSelect>
            <Box className="crs-filter-spacer" />
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} className="crs-add-button">
              Add Course
            </Button>
          </Box>
        </Box>

        <Box className="crs-separator" />

        <Box className="crs-table-section">
          {loading ? (
            <Box className="crs-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="crs-empty-text">Loading courses...</Typography>
            </Box>
          ) : (
            <>
              <TableContainer className="crs-table-container">
                <Table stickyHeader>
                  <TableHead>
                    <TableRow className="crs-table-head-row">
                      <TableCell className="crs-table-head-cell">Course</TableCell>
                      <TableCell className="crs-table-head-cell">Trainer</TableCell>
                      <TableCell className="crs-table-head-cell">Start Date</TableCell>
                      <TableCell className="crs-table-head-cell">End Date</TableCell>
                      <TableCell className="crs-table-head-cell">Min Score</TableCell>
                      <TableCell className="crs-table-head-cell">Weightage</TableCell>
                      <TableCell className="crs-table-head-cell">Status</TableCell>
                      <TableCell className="crs-table-head-cell crs-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="crs-empty-cell">
                          <MenuBookIcon className="crs-empty-icon" />
                          <Typography className="crs-empty-text">No courses found{programYear === 0 ? '' : ` for ${programYear}`}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((course, idx) => (
                      <TableRow
                        key={course.courseId}
                        hover
                        className={`crs-table-row ${idx % 2 === 0 ? 'crs-table-row--even' : 'crs-table-row--odd'}`}
                      >
                        <TableCell className="crs-table-cell">
                          <Box className="crs-name-cell">
                            <Box className="crs-name-icon-box">
                              <MenuBookIcon className="crs-name-icon" />
                            </Box>
                            <Box>
                              <Typography className="crs-row-primary">{course.courseName}</Typography>
                              <Typography className="crs-row-secondary">
                                {course.description && course.description.length > 50
                                  ? course.description.substring(0, 50) + '...'
                                  : course.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{getTrainerName(course.conductedBy)}</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{formatDate(course.startDate)}</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{formatDate(course.endDate)}</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{course.minScore}</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{course.weightage}%</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Chip
                            label={course.status}
                            size="small"
                            variant="outlined"
                            className={STATUS_CLASS[course.status] ?? 'crs-status-chip'}
                          />
                        </TableCell>
                        <TableCell className="crs-table-cell crs-table-cell--actions">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" className="crs-action-button" title="Edit" onClick={(e) => openEdit(course, e)}>
                              <EditIcon className="crs-action-icon" />
                            </IconButton>
                            {NEXT_STATUS[course.status] && (
                              <IconButton
                                size="small"
                                className="crs-action-button"
                                title={`Move to ${NEXT_STATUS[course.status]}`}
                                onClick={(e) => openStatusDialog(course, e)}
                              >
                                {course.status === 'PLANNED'
                                  ? <PlayArrowIcon className="crs-action-icon" />
                                  : <CheckCircleIcon className="crs-action-icon" />}
                              </IconButton>
                            )}
                            {course.status !== 'COMPLETED' && course.status !== 'CANCELLED' && (
                              <IconButton size="small" className="crs-action-button crs-action-button--remove" title="Cancel Course" onClick={(e) => handleDelete(course, e)}>
                                <DeleteIcon className="crs-action-icon--remove" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="crs-pagination"
              />
            </>
          )}
        </Box>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="crs-dialog-title">Update Course Status</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Move <strong>{statusCourse?.courseName}</strong> from{' '}
            <strong>{statusCourse?.status}</strong> to{' '}
            <strong>{statusCourse ? NEXT_STATUS[statusCourse.status] : ''}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialogOpen(false)} className="crs-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleStatusChange} disabled={statusSubmitting} className="crs-dialog-submit-btn">
            {statusSubmitting ? 'Updating...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="crs-dialog-title">
          {editCourse ? 'Edit Course' : 'Create Training Course'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Course Name *" size="small" fullWidth
              value={form.courseName}
              onChange={(e) => setForm((prev) => ({ ...prev, courseName: e.target.value }))}
              className="crs-dialog-field"
            />
            <TextField
              label="Description" size="small" fullWidth multiline rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="crs-dialog-field"
            />
            <TextField
              label="Start Date *" size="small" fullWidth type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              inputProps={{ min: editCourse ? undefined : new Date().toISOString().split('T')[0] }}
              className="crs-dialog-field"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date *" size="small" fullWidth type="date"
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              inputProps={{ min: form.startDate || new Date().toISOString().split('T')[0] }}
              className="crs-dialog-field"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Min Score *" size="small" fullWidth
              value={form.minScore === 0 ? '' : String(form.minScore)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm((prev) => ({ ...prev, minScore: val ? Number(val) : 0 }));
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="crs-dialog-field"
            />
            <TextField
              label="Weightage (%) *" size="small" fullWidth
              value={form.weightage === 0 ? '' : String(form.weightage)}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm((prev) => ({ ...prev, weightage: val ? Number(val) : 0 }));
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="crs-dialog-field"
            />
            {/* Trainer dropdown — shows TRAINING_COORDINATOR + MEMBERS users */}
            <TextField
              select
              label="Trainer *"
              size="small"
              fullWidth
              value={form.conductedBy || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, conductedBy: Number(e.target.value) }))}
              className="crs-dialog-field"
              disabled={trainers.length === 0 || loading}
            >
              {trainers.length === 0 ? (
                <MenuItem disabled value="">
                  {loading ? 'Loading trainers...' : 'No trainers available'}
                </MenuItem>
              ) : (
                trainers.map((t) => (
                  <MenuItem key={t.userId} value={t.userId}>
                    {t.username} — {t.email}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} className="crs-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} className="crs-dialog-submit-btn">
            {submitting ? 'Saving...' : editCourse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="crs-dialog-title">Cancel Course</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to cancel <strong>{deleteCourse?.courseName}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} className="crs-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={confirmDelete}
            sx={{ background: 'var(--color-error) !important', textTransform: 'none', fontWeight: 600 }}>
            Cancel Course
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesList;
