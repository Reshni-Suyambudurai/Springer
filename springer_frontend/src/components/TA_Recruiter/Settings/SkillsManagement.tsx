import { useState, useEffect } from 'react';
import {
  Box, Card, TextField, Typography, Stack, Button, IconButton,
  CircularProgress, Alert, Divider, Dialog, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { skillsApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import type { SkillRequest, SkillResponse, SkillCategory } from '../../../types/TA_Recruiter/Hiring/skill.types';
import '../../../css/TA_Recruiter/Settings/SkillsManagement.css';

const CATEGORIES: SkillCategory[] = ['TECHNICAL', 'SOFT_SKILL'];
const categoryLabel = (c: SkillCategory) => c === 'TECHNICAL' ? 'Technical Skills' : 'Soft Skills';

const SkillsManagement = () => {
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
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(axiosError?.response?.data?.message ?? axiosError?.message ?? 'Failed to load skills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = skills.filter(s => s.skillName.toLowerCase().includes(search.toLowerCase()));

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
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(axiosError?.response?.data?.message ?? axiosError?.message ?? 'Failed to save skill', 'error');
    } finally { setSaving(false); }
  };

  return (
    <Box className="t-page settings-page-override">
      <Card className="t-card settings-card-override">
        <Box className="t-body settings-body-override">

          {/* Search + Add button row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <TextField
              size="small"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="t-search-field"
              InputProps={{ startAdornment: <SearchIcon className="t-search-icon" /> }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => openAdd('TECHNICAL')}
              className="skills-add-btn"
            >
              Add Skills
            </Button>
          </Stack>

          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={32} className="skills-spinner" />
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
                  <Stack direction="row" alignItems="center">
                    <Typography className="skills-category-label">{categoryLabel(cat)}</Typography>
                  </Stack>

                  {catSkills.length === 0 ? (
                    <Alert severity="info" className="skills-empty-alert">
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
                                <EditIcon className="skill-edit-icon" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  )}

                  <Divider className="skills-category-divider" />
                </Box>
              );
            })
          )}
        </Box>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} classes={{ paper: 'skills-dialog-paper' }}>
        {/* Header */}
        <Box className="skills-dialog-header">
          <Typography className="skills-dialog-title">
            {editMode ? 'Edit Skill' : 'Add Skill'}
          </Typography>
          <IconButton size="small" onClick={closeDialog} className="skills-dialog-close-btn">
            <CloseIcon className="skills-dialog-close-icon" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box className="skills-dialog-body">
          <Box className="skills-dialog-field">
            <Typography className="skills-dialog-label">Category</Typography>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as SkillCategory)}
              displayEmpty
              size="small"
              className="skills-dialog-select"
            >
              <MenuItem value="TECHNICAL">Technical Skills</MenuItem>
              <MenuItem value="SOFT_SKILL">Soft Skills</MenuItem>
            </Select>
          </Box>

          <Box className="skills-dialog-field">
            <Typography className="skills-dialog-label">Skill Name</Typography>
            <TextField
              autoFocus
              size="small"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g., Java, Python, Communication"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="skills-dialog-input"
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box className="skills-dialog-footer">
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || !skillName.trim()}
            className="skills-dialog-submit-btn"
          >
            {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SkillsManagement;
