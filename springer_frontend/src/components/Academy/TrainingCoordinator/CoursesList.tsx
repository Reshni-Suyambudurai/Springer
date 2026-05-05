import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, InputAdornment, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel,
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
  courseName: '', description: '', minScore: 0, weightage: 0, isCommunication: false,
  communicationTemplate: '',
};

const DEFAULT_COMM_FIELDS = [
  { name: 'Grammar',       maxScore: 20 },
  { name: 'Proactiveness', maxScore: 20 },
  { name: 'Fluency',       maxScore: 10 },
];

const CoursesList = ({ context }: { context: AcademyContextProps }) => {
  const [courses, setCourses] = useState<TrainingCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<TrainingCourseResponse | null>(null);
  const [form, setForm] = useState<TrainingCourseRequest>(EMPTY_FORM);
  const [commFields, setCommFields] = useState(DEFAULT_COMM_FIELDS.map(f => ({ ...f })));
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
    setCommFields(DEFAULT_COMM_FIELDS.map(f => ({ ...f })));
    setDialogOpen(true);
  };

  const openEdit = (course: TrainingCourseResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCourse(course);
    setForm({
      courseName:      course.courseName,
      description:     course.description ?? '',
      minScore:        course.minScore,
      weightage:       course.weightage ?? 0,
      isCommunication: course.isCommunication ?? false,
      communicationTemplate: course.communicationTemplate ?? '',
    });
    // Parse existing template into commFields for editing
    if (course.isCommunication && course.communicationTemplate) {
      try {
        setCommFields(JSON.parse(course.communicationTemplate));
      } catch { setCommFields(DEFAULT_COMM_FIELDS.map(f => ({ ...f }))); }
    } else {
      setCommFields(DEFAULT_COMM_FIELDS.map(f => ({ ...f })));
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.courseName.trim()) { showToast('Course name is required', 'error'); return; }
    if (form.minScore < 0 || form.minScore > 100) { showToast('Min score must be between 0 and 100', 'error'); return; }
    if (!form.isCommunication) {
      if (!form.weightage || form.weightage < 1 || form.weightage > 100) {
        showToast('Weightage must be between 1 and 100', 'error'); return;
      }
    }
    if (form.isCommunication) {
      if (commFields.some(f => !f.name.trim())) { showToast('All sub-field names are required', 'error'); return; }
      if (commFields.some(f => f.maxScore < 1)) { showToast('All max scores must be at least 1', 'error'); return; }
    }
    const payload: TrainingCourseRequest = {
      ...form,
      weightage: form.isCommunication ? undefined : form.weightage,
      communicationTemplate: form.isCommunication ? JSON.stringify(commFields) : undefined,
    };
    try {
      setSubmitting(true);
      const res = editCourse
        ? await trainingCourseApi.updateCourse(editCourse.courseId, payload)
        : await trainingCourseApi.createCourse(payload);
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
                      <TableCell className="crs-table-head-cell">Type</TableCell>
                      <TableCell className="crs-table-head-cell crs-table-head-cell--actions">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="crs-empty-cell">
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
                        <TableCell className="crs-table-cell">
                          {course.isCommunication ? (
                            <Chip label="Communication" size="small" variant="outlined"
                              sx={{ fontSize: 'var(--text-xs)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                          ) : <Typography className="crs-row-secondary">—</Typography>}
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
              inputProps={{ maxLength: 100 }}
              className="crs-dialog-field"
            />
            <TextField
              label="Description" size="small" fullWidth multiline rows={2}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              inputProps={{ maxLength: 500 }}
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
              helperText={form.isCommunication
                ? 'Minimum passing score out of 100 (after normalization)'
                : 'Minimum passing score'}
            />

            {/* Weightage — only for technical courses */}
            {!form.isCommunication && (
              <TextField
                label="Weightage (%) *" size="small" fullWidth
                value={!form.weightage ? '' : String(form.weightage)}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setForm(prev => ({ ...prev, weightage: val ? Number(val) : 0 }));
                }}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                className="crs-dialog-field"
                helperText="How much this course contributes to overall weighted score"
              />
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.isCommunication}
                  onChange={e => {
                    const checked = e.target.checked;
                    setForm(prev => ({ ...prev, isCommunication: checked, weightage: checked ? 0 : prev.weightage }));
                    if (checked) setCommFields(DEFAULT_COMM_FIELDS.map(f => ({ ...f })));
                  }}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: 'var(--text-sm)' }}>
                  Communication Course
                  <Typography component="span" sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', ml: 1 }}>
                    (score shown separately, not in overall weighted score)
                  </Typography>
                </Typography>
              }
            />

            {/* Sub-field template builder — only for communication courses */}
            {form.isCommunication && (
              <Box sx={{ border: '1px solid var(--color-border)', borderRadius: 1, p: 1.5 }}>
                <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600, mb: 1.5 }}>
                  Sub-score Fields
                  <Typography component="span" sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', ml: 1, fontWeight: 400 }}>
                    Total max: {commFields.reduce((s, f) => s + (f.maxScore || 0), 0)} → normalized to 100
                  </Typography>
                </Typography>
                {commFields.map((field, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                      size="small" label="Field Name" value={field.name}
                      onChange={e => setCommFields(prev => {
                        const u = [...prev];
                        u[idx] = { ...u[idx], name: e.target.value };
                        return u;
                      })}
                      sx={{ flex: 2 }}
                    />
                    <TextField
                      size="small" label="Max Score" value={field.maxScore === 0 ? '' : String(field.maxScore)}
                      onChange={e => {
                        const v = e.target.value.replace(/[^0-9]/g, '');
                        setCommFields(prev => {
                          const u = [...prev];
                          u[idx] = { ...u[idx], maxScore: v ? Number(v) : 0 };
                          return u;
                        });
                      }}
                      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                      error={field.maxScore < 1}
                      helperText={field.maxScore < 1 ? 'Min 1' : ''}
                      sx={{ flex: 1 }}
                    />
                    <Button size="small" color="error"
                      disabled={commFields.length <= 1}
                      onClick={() => setCommFields(prev => prev.filter((_, i) => i !== idx))}>
                      ✕
                    </Button>
                  </Box>
                ))}
                <Button size="small" variant="outlined"
                  onClick={() => setCommFields(prev => [...prev, { name: '', maxScore: 10 }])}
                  sx={{ mt: 0.5, fontSize: 'var(--text-xs)' }}>
                  + Add Field
                </Button>
              </Box>
            )}
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
