import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, Typography, Stack, Button, IconButton,
  CircularProgress, Alert, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import BackButton from '../../Common/BackButton';
import { useNavigate } from 'react-router-dom';
import { skillsApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import type { SkillRequest, SkillResponse, SkillCategory } from '../../../types/TA_Recruiter/Hiring/skill.types';
import '../../../css/TA_Recruiter/Settings/SkillsManagement.css';

const CATEGORIES: SkillCategory[] = ['TECHNICAL', 'SOFT_SKILL'];

const categoryLabel = (c: SkillCategory) => c === 'TECHNICAL' ? 'Technical Skills' : 'Soft Skills';

const SkillsManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState<SkillResponse | null>(null);
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('TECHNICAL');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSkills(); }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await skillsApi.getAllSkills();
      if (response.success && response.data) {
        setSkills(response.data);
      } else {
        showToast(response.message || 'Failed to load skills', 'error');
      }
    } catch (error: unknown) {
      console.error('Error fetching skills:', error);
      let errorMessage = 'Failed to load skills';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          if (axiosError.response?.data?.message) errorMessage = axiosError.response.data.message;
        }
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = skills.filter(s =>
    s.skillName.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = (cat: SkillCategory) => {
    setEditMode(false); setCurrent(null);
    setSkillName(''); setCategory(cat);
    setDialogOpen(true);
  };

  const openEdit = (skill: SkillResponse) => {
    setEditMode(true); setCurrent(skill);
    setSkillName(skill.skillName); setCategory(skill.category);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false); setSkillName(''); setCurrent(null); setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!skillName.trim()) return showToast('Skill name is required', 'error');
    setSaving(true);
    try {
      const data: SkillRequest = { skillName: skillName.trim(), category };
      const res = editMode && current
        ? await skillsApi.updateSkill(current.skillId, data)
        : await skillsApi.createSkill(data);
      if (res.success) {
        showToast(editMode ? 'Skill updated successfully' : 'Skill created successfully', 'success');
        fetchSkills(); closeDialog();
      } else showToast(res.message || 'Failed', 'error');
    } catch (error: unknown) {
      console.error('Error saving skill:', error);
      let errorMessage = editMode ? 'Failed to update skill' : 'Failed to create skill';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          if (axiosError.response?.data?.message) errorMessage = axiosError.response.data.message;
        }
      }
      showToast(errorMessage, 'error');
    } finally { setSaving(false); }
  };

  return (
    <Box className="t-page">
      <Card className="t-card">

        {/* Header */}
        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BackButton onClick={() => navigate('/ta-recruiter/settings')} variant="header" />
            <Box className="t-icon-box">
              <SchoolIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack gap="2px">
              <Typography className="t-page-title">Skills Management</Typography>
              <Typography className="t-page-subtitle">Manage technical and soft skills</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className="t-separator" />

        {/* Body */}
        <Box className="t-body">

          <TextField
            size="small"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="t-search-field"
            InputProps={{ startAdornment: <SearchIcon className="t-search-icon" sx={{ mr: 1 }} /> }}
          />

          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="t-loading-text">Loading skills...</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Alert severity="info">
              {search ? `No skills found matching "${search}"` : 'No skills yet. Click + to add one.'}
            </Alert>
          ) : (
            CATEGORIES.map((cat) => {
              const catSkills = filtered.filter(s => (s.category || 'TECHNICAL') === cat);
              if (catSkills.length === 0 && search) return null;
              return (
                <Box key={cat} className="skills-category-section">
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography className="t-section-label">{categoryLabel(cat)}</Typography>
                    <Button variant="contained" size="small" startIcon={<AddIcon />}
                      className="t-btn-primary"
                      onClick={() => openAdd(cat)}
                      sx={{ backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-dark)' } }}>
                      Add {cat === 'TECHNICAL' ? 'Technical' : 'Soft'} Skill
                    </Button>
                  </Stack>

                  {catSkills.length === 0 ? (
                    <Alert severity="info" sx={{ fontSize: '0.8125rem' }}>
                      No {categoryLabel(cat).toLowerCase()} yet.
                    </Alert>
                  ) : (
                    <Box className="skills-cards-grid">
                      {catSkills.map((skill) => (
                        <Card key={skill.skillId} className="skill-card">
                          <Box className="skill-card-content">
                            <Box className="skill-card-inner">
                              <Typography className="skill-name">{skill.skillName}</Typography>
                              <IconButton size="small" className="skill-edit-btn" onClick={() => openEdit(skill)}>
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}

                  <Divider className="skills-category-divider" sx={{ mt: 1.5 }} />
                </Box>
              );
            })
          )}
        </Box>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={700} fontSize="1rem">
              {editMode ? 'Edit Skill' : 'Add Skill'}
            </Typography>
            <IconButton size="small" onClick={closeDialog}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            {editMode ? (
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value as SkillCategory)}>
                  <MenuItem value="TECHNICAL">Technical Skills</MenuItem>
                  <MenuItem value="SOFT_SKILL">Soft Skills</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField size="small" fullWidth label="Category" value={categoryLabel(category)} disabled />
            )}
            <TextField
              autoFocus size="small" fullWidth label="Skill Name"
              value={skillName} onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. Java, Python, Communication"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={closeDialog} disabled={saving} className="t-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained" onClick={handleSubmit} disabled={saving}
            className="t-dialog-confirm-btn"
            sx={{ backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-dark)' } }}
          >
            {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SkillsManagement;
