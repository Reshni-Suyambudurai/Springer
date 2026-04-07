import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, InputAdornment, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon,
  MenuBook as MenuBookIcon, Edit as EditIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { trainingCourseApi } from '../../../services/academy.api';
import { showToast } from '../../../utils/toast';
import type { TrainingCourseResponse, TrainingCourseRequest, AcademyContextProps } from '../../../types/Academy/academy.types';
import '../../../css/Academy/TrainingCoordinator/CoursesList.css';

const EMPTY_FORM: TrainingCourseRequest = {
  courseName: '', description: '', minScore: 0, weightage: 0,
};

const CoursesList = ({ context }: { context: AcademyContextProps }) => {
  const [courses, setCourses] = useState<TrainingCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<TrainingCourseResponse | null>(null);
  const [form, setForm] = useState<TrainingCourseRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<TrainingCourseResponse | null>(null);

  useEffect(() => {
    fetchData();
    setSearch('');
    setPage(0);
  }, [context.programYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await trainingCourseApi.getAllCourses();
      if (res.success && res.data) setCourses(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter(c =>
    (c.courseName ?? '').toLowerCase().includes(search.toLowerCase())
  );
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
      minScore:    course.minScore,
      weightage:   course.weightage,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.courseName.trim()) { showToast('Course name is required', 'error'); return; }
    if (form.minScore < 0 || form.minScore > 100) { showToast('Min score must be between 0 and 100', 'error'); return; }
    if (form.weightage < 1 || form.weightage > 100) { showToast('Weightage must be between 1 and 100', 'error'); return; }
    try {
      setSubmitting(true);
      const res = editCourse
        ? await trainingCourseApi.updateCourse(editCourse.courseId, form)
        : await trainingCourseApi.createCourse(form);
      if (res.success) {
        showToast(editCourse ? 'Course updated successfully' : 'Course created successfully', 'success');
        setDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCourse) return;
    try {
      const res = await trainingCourseApi.deleteCourse(deleteCourse.courseId);
      if (res.success) {
        showToast('Course deleted successfully', 'success');
        setDeleteDialogOpen(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete course', 'error');
    }
  };

  return (
    <Box className="crs-page">
      <Card className="crs-card">

        <Box className="crs-filter-section">
          <Box className="crs-filter-row">
            <TextField
              placeholder="Search by course name..."
              size="small"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="crs-search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" className="crs-search-icon" />
                  </InputAdornment>
                ),
              }}
            />
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
                      <TableCell className="crs-table-head-cell">Course Name</TableCell>
                      <TableCell className="crs-table-head-cell">Description</TableCell>
                      <TableCell className="crs-table-head-cell">Min Score</TableCell>
                      <TableCell className="crs-table-head-cell">Weightage</TableCell>
                      <TableCell className="crs-table-head-cell crs-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="crs-empty-cell">
                          <MenuBookIcon className="crs-empty-icon" />
                          <Typography className="crs-empty-text">No courses found</Typography>
                          <Typography className="crs-empty-text" sx={{ fontSize: 'var(--text-xs)', mt: 0.5 }}>
                            Courses are reusable templates. Dates and trainer are set when linking to a batch.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginated.map((course, idx) => (
                      <TableRow key={course.courseId} hover
                        className={`crs-table-row ${idx % 2 === 0 ? 'crs-table-row--even' : 'crs-table-row--odd'}`}>
                        <TableCell className="crs-table-cell">
                          <Box className="crs-name-cell">
                            <Box className="crs-name-icon-box">
                              <MenuBookIcon className="crs-name-icon" />
                            </Box>
                            <Typography className="crs-row-primary">{course.courseName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">
                            {course.description
                              ? course.description.length > 60
                                ? course.description.substring(0, 60) + '...'
                                : course.description
                              : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{course.minScore}</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          <Typography className="crs-row-secondary">{course.weightage}%</Typography>
                        </TableCell>
                        <TableCell className="crs-table-cell crs-table-cell--actions">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton size="small" className="crs-action-button" title="Edit Course"
                              onClick={e => openEdit(course, e)}>
                              <EditIcon className="crs-action-icon" />
                            </IconButton>
                            <IconButton size="small" className="crs-action-button crs-action-button--remove"
                              title="Delete Course"
                              onClick={e => { e.stopPropagation(); setDeleteCourse(course); setDeleteDialogOpen(true); }}>
                              <DeleteIcon className="crs-action-icon--remove" />
                            </IconButton>
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
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50]}
                className="crs-pagination"
              />
            </>
          )}
        </Box>
      </Card>

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
              onChange={e => setForm(prev => ({ ...prev, courseName: e.target.value }))}
              className="crs-dialog-field"
            />
            <TextField
              label="Description" size="small" fullWidth multiline rows={2}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="crs-dialog-field"
            />
            <TextField
              label="Min Score (0–100) *" size="small" fullWidth
              value={form.minScore === 0 ? '' : String(form.minScore)}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm(prev => ({ ...prev, minScore: val ? Number(val) : 0 }));
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="crs-dialog-field"
            />
            <TextField
              label="Weightage (%) *" size="small" fullWidth
              value={form.weightage === 0 ? '' : String(form.weightage)}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm(prev => ({ ...prev, weightage: val ? Number(val) : 0 }));
              }}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="crs-dialog-field"
              helperText="Dates and trainer are set when linking this course to a batch"
            />
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
        <DialogTitle className="crs-dialog-title">Delete Course</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete <strong>{deleteCourse?.courseName}</strong>?
            This will also remove all batch links for this course.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} className="crs-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={confirmDelete}
            sx={{ background: 'var(--color-error) !important', textTransform: 'none', fontWeight: 600 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesList;
