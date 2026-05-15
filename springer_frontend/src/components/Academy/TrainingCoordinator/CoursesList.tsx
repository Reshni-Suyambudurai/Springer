import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableSkeleton } from '../../Common/TableSkeleton';
import {
  Box, Card, TextField, InputAdornment, Button, Typography, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel, Tooltip,
} from '@mui/material';
import {
  MenuBook as MenuBookIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import { FigmaEditIcon as EditIcon, FigmaDeleteIcon as DeleteIcon, FigmaAddIcon as AddIcon, FigmaSearchIcon as SearchIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
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
  const debouncedSearch = useDebounce(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<TrainingCourseResponse | null>(null);
  const [form, setForm] = useState<TrainingCourseRequest>(EMPTY_FORM);
  const [commFields, setCommFields] = useState(DEFAULT_COMM_FIELDS.map(f => ({ ...f })));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<TrainingCourseResponse | null>(null);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ courseId: number | null; field: 'courseName' | 'weightage' | null }>({ courseId: null, field: null });
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    fetchData();
    setSearch('');
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
    (c.courseName ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const openCreate = () => {
    setEditCourse(null);
    setForm(EMPTY_FORM);
    setCommFields(DEFAULT_COMM_FIELDS.map(f => ({ ...f })));
    setErrors({});
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
    setErrors({});
    setDialogOpen(true);
  };

  const validateCourseName = () => {
    const name = form.courseName.trim();
    if (!name) {
      setErrors(prev => ({ ...prev, courseName: 'Course name is required' }));
      return false;
    }
    if (name.length < 3) {
      setErrors(prev => ({ ...prev, courseName: 'Must be at least 3 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, courseName: '' }));
    return true;
  };

  const validateMinScore = () => {
    if (form.minScore < 0 || form.minScore > 100) {
      setErrors(prev => ({ ...prev, minScore: 'Must be between 0 and 100' }));
      return false;
    }
    setErrors(prev => ({ ...prev, minScore: '' }));
    return true;
  };

  const validateWeightage = () => {
    if (form.isCommunication) {
      setErrors(prev => ({ ...prev, weightage: '' }));
      return true;
    }
    if (!form.weightage || form.weightage < 1 || form.weightage > 100) {
      setErrors(prev => ({ ...prev, weightage: 'Must be between 1 and 100' }));
      return false;
    }
    setErrors(prev => ({ ...prev, weightage: '' }));
    return true;
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isNameValid = validateCourseName();
    const isMinScoreValid = validateMinScore();
    const isWeightageValid = validateWeightage();

    if (!isNameValid || !isMinScoreValid || !isWeightageValid) {
      showToast('Please fix validation errors', 'error');
      return;
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
        setDeleteCourse(null);
        fetchData();
      }
    } catch (err: any) {
      // Show detailed error message
      const errorMsg = err.message || 'Failed to delete course';
      showToast(errorMsg, 'error');
      // Keep dialog open so user can see the error
    }
  };

  const handleInlineEdit = (course: TrainingCourseResponse, field: 'courseName' | 'weightage') => {
    setEditingCell({ courseId: course.courseId, field });
    setEditValue(field === 'courseName' ? course.courseName : String(course.weightage || 0));
  };

  const handleInlineSave = async () => {
    if (!editingCell.courseId || !editingCell.field) return;
    const course = courses.find(c => c.courseId === editingCell.courseId);
    if (!course) return;

    const trimmed = editValue.trim();
    if (editingCell.field === 'courseName') {
      if (!trimmed || trimmed.length < 3) {
        showToast('Course name must be at least 3 characters', 'error');
        return;
      }
    } else if (editingCell.field === 'weightage') {
      const val = Number(trimmed);
      if (isNaN(val) || val < 1 || val > 100) {
        showToast('Weightage must be between 1 and 100', 'error');
        return;
      }
    }

    try {
      const payload: TrainingCourseRequest = {
        courseName: editingCell.field === 'courseName' ? trimmed : course.courseName,
        description: course.description ?? '',
        minScore: course.minScore,
        weightage: editingCell.field === 'weightage' ? Number(trimmed) : course.weightage ?? 0,
        isCommunication: course.isCommunication ?? false,
        communicationTemplate: course.communicationTemplate ?? '',
      };
      const res = await trainingCourseApi.updateCourse(course.courseId, payload);
      if (res.success) {
        showToast('Updated successfully', 'success');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setEditingCell({ courseId: null, field: null });
    }
  };

  const handleInlineCancel = () => {
    setEditingCell({ courseId: null, field: null });
    setEditValue('');
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
              onChange={e => setSearch(e.target.value)}
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
            <TableSkeleton rows={5} columns={6} />
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
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="crs-empty-cell">
                          <MenuBookIcon className="crs-empty-icon" />
                          <Typography className="crs-empty-text">
                            {filtered.length === 0 && courses.length > 0 ? 'All courses are archived' : 'No courses found'}
                          </Typography>
                          <Typography className="crs-empty-text" sx={{ fontSize: 'var(--text-xs)', mt: 0.5 }}>
                            {filtered.length === 0 && courses.length > 0
                              ? 'Create a new course to get started.'
                              : 'Courses are reusable templates. Dates and trainer are set when linking to a batch.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((course, idx) => (
                      <TableRow key={course.courseId} hover
                        className={`crs-table-row ${idx % 2 === 0 ? 'crs-table-row--even' : 'crs-table-row--odd'}`}>
                        <TableCell className="crs-table-cell" onDoubleClick={() => handleInlineEdit(course, 'courseName')}>
                          {editingCell.courseId === course.courseId && editingCell.field === 'courseName' ? (
                            <TextField
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleInlineSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineSave();
                                if (e.key === 'Escape') handleInlineCancel();
                              }}
                              autoFocus
                              size="small"
                              fullWidth
                              sx={{ '& .MuiInputBase-root': { fontSize: 'var(--text-sm)' } }}
                            />
                          ) : (
                            <Box className="crs-name-cell" sx={{ cursor: 'pointer', '&:hover .edit-hint': { opacity: 0.5 } }}>
                              <Box className="crs-name-icon-box">
                                <MenuBookIcon className="crs-name-icon" />
                              </Box>
                              <Typography className="crs-row-primary">{course.courseName}</Typography>
                              <EditIcon className="edit-hint" style={{ fontSize: 14, marginLeft: 4, opacity: 0, transition: 'opacity 0.2s' }} />
                            </Box>
                          )}
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
                        <TableCell className="crs-table-cell" onDoubleClick={() => !course.isCommunication && handleInlineEdit(course, 'weightage')}>
                          {editingCell.courseId === course.courseId && editingCell.field === 'weightage' ? (
                            <TextField
                              value={editValue}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditValue(val);
                              }}
                              onBlur={handleInlineSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineSave();
                                if (e.key === 'Escape') handleInlineCancel();
                              }}
                              autoFocus
                              size="small"
                              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                              sx={{ width: 80, '& .MuiInputBase-root': { fontSize: 'var(--text-sm)' } }}
                            />
                          ) : course.isCommunication ? (
                            <Typography className="crs-row-secondary" sx={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>N/A</Typography>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover .edit-hint': { opacity: 0.5 } }}>
                              <Typography className="crs-row-secondary">{course.weightage}%</Typography>
                              <EditIcon className="edit-hint" style={{ fontSize: 14, marginLeft: 4, opacity: 0, transition: 'opacity 0.2s' }} />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell className="crs-table-cell">
                          {course.isCommunication ? (
                            <Chip label="Communication" size="small" variant="outlined"
                              sx={{ fontSize: 'var(--text-xs)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                          ) : (
                            <Chip label="Technical" size="small" variant="outlined"
                              sx={{ fontSize: 'var(--text-xs)', borderColor: '#6b7280', color: '#6b7280' }} />
                          )}
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
            </>
          )}
        </Box>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="crs-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editCourse ? 'Edit Course' : 'Create Training Course'}
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Course Name *" size="small" fullWidth
              value={form.courseName}
              onChange={e => setForm(prev => ({ ...prev, courseName: e.target.value }))}
              onBlur={validateCourseName}
              error={!!errors.courseName}
              helperText={errors.courseName || 'Enter a unique course name'}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography component="label" sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Min Score (0–100) *
              </Typography>
              <Tooltip 
                title="Minimum score required to pass this course. For communication courses, this applies after normalization to 100."
                arrow
                placement="top"
              >
                <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
              </Tooltip>
            </Box>
            <TextField
              size="small" fullWidth
              value={form.minScore === 0 ? '' : String(form.minScore)}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setForm(prev => ({ ...prev, minScore: val ? Number(val) : 0 }));
              }}
              onBlur={validateMinScore}
              error={!!errors.minScore}
              helperText={errors.minScore || (form.isCommunication
                ? 'Minimum passing score out of 100 (after normalization)'
                : 'Minimum passing score')}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              className="crs-dialog-field"
            />

            {/* Weightage — only for technical courses */}
            {!form.isCommunication && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Typography component="label" sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                    Weightage (%) *
                  </Typography>
                  <Tooltip 
                    title="Relative weight for this course's contribution to the overall score. Weights are auto-normalised — they don't need to sum to 100%. Communication courses don't use weightage."
                    arrow
                    placement="top"
                  >
                    <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
                  </Tooltip>
                </Box>
                <TextField
                  size="small" fullWidth
                  value={!form.weightage ? '' : String(form.weightage)}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setForm(prev => ({ ...prev, weightage: val ? Number(val) : 0 }));
                  }}
                  onBlur={validateWeightage}
                  error={!!errors.weightage}
                  helperText={errors.weightage || 'How much this course contributes to overall weighted score'}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  className="crs-dialog-field"
                />
              </>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 'var(--text-sm)' }}>
                    Communication Course
                    <Typography component="span" sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', ml: 1 }}>
                      (score shown separately, not in overall weighted score)
                    </Typography>
                  </Typography>
                  <Tooltip 
                    title="Communication courses are scored separately and don't contribute to the overall weighted score. They use sub-fields like Grammar, Fluency, Proactiveness, etc."
                    arrow
                    placement="top"
                  >
                    <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
                  </Tooltip>
                </Box>
              }
            />

            {/* Sub-field template builder — only for communication courses */}
            {form.isCommunication && (
              <Box sx={{ border: '1px solid var(--color-border)', borderRadius: 1, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                  <Typography sx={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    Sub-score Fields
                    <Typography component="span" sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', ml: 1, fontWeight: 400 }}>
                      Total max: {commFields.reduce((s, f) => s + (f.maxScore || 0), 0)} → normalized to 100
                    </Typography>
                  </Typography>
                  <Tooltip 
                    title="Define scoring criteria for communication assessment. Total will be normalized to 100. Example: Grammar (20), Fluency (10), Proactiveness (20) = 50 total → normalized to 100."
                    arrow
                    placement="top"
                  >
                    <HelpIcon sx={{ fontSize: 14, color: 'var(--color-text-secondary)', cursor: 'help' }} />
                  </Tooltip>
                </Box>
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
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setDeleteCourse(null); }} maxWidth="xs" fullWidth>
        <DialogTitle className="crs-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Delete Course
          <IconButton size="small" onClick={() => { setDeleteDialogOpen(false); setDeleteCourse(null); }}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          {deleteCourse && (
            <>
              <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                Are you sure you want to delete <strong>{deleteCourse.courseName}</strong>?
              </Typography>
              <Typography sx={{ mt: 1.5, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                ⚠️ This action cannot be undone. The course will be permanently removed if it has no batch links or recorded scores.
              </Typography>
              {deleteCourse.isCommunication && (
                <Typography sx={{ mt: 1, fontSize: 'var(--text-xs)', color: 'var(--color-warning)', background: 'var(--color-warning-light)', p: 1, borderRadius: 1 }}>
                  📌 This is a Communication course. Ensure no students have scores recorded before deleting.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeleteCourse(null); }} className="crs-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={confirmDelete}
            sx={{ background: 'var(--color-error) !important', textTransform: 'none', fontWeight: 600 }}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesList;
