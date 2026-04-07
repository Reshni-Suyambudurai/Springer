import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Button, IconButton, CircularProgress,
  Alert, Chip, TextField, Divider, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import CloseIcon from '@mui/icons-material/Close';
import BackButton from '../../Common/BackButton';
import { useNavigate } from 'react-router-dom';
import { roundTemplateApi } from '../../../services/drive.api';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import type { RoundTemplateRequest, RoundTemplateResponse, RoundTemplateUpdateRequest } from '../../../types/TA_Recruiter/Drive/roundTemplate.types';
import '../../../css/TA_Recruiter/Settings/RoundTemplateManagement.css';

interface Section { sectionName: string; outOf: number; }
type Template = Omit<RoundTemplateResponse, 'sections'> & { sections: Section[] };

const EMPTY_FORM = { roundNo: '', roundName: '', outoffScore: '', minScore: '', weightage: '' };

const RoundTemplateManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filtered, setFiltered] = useState<Template[]>([]);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState<Template | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  useEffect(() => {
    let f = [...templates];
    if (filterName.trim()) f = f.filter(t => t.roundName.toLowerCase().includes(filterName.toLowerCase()));
    if (filterStatus !== 'all') f = f.filter(t => t.isActive === (filterStatus === 'true'));
    setFiltered(f);
  }, [filterName, filterStatus, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await roundTemplateApi.getAllRoundTemplates();
      if (res.success && res.data) {
        const data = res.data.map(t => ({ ...t, sections: Array.isArray(t.sections) ? t.sections as Section[] : [] }));
        setTemplates(data); setFiltered(data);
      }
    } catch { showToast('Failed to load templates', 'error'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditMode(false); setCurrent(null); setForm(EMPTY_FORM); setSections([]); setDialogOpen(true); };

  const openEdit = (t: Template) => {
    setEditMode(true); setCurrent(t);
    setForm({ roundNo: String(t.roundNo), roundName: t.roundName, outoffScore: String(t.outoffScore), minScore: String(t.minScore), weightage: String(t.weightage) });
    setSections(t.sections.length ? [...t.sections] : []);
    setDialogOpen(true);
  };

  const toggleStatus = async (t: Template) => {
    try {
      const res = await roundTemplateApi.deleteRoundTemplate(t.roundConfigId);
      if (res.success) { showToast(`Template ${t.isActive ? 'deactivated' : 'activated'}`, 'success'); fetchTemplates(); }
    } catch { showToast('Failed to update status', 'error'); }
  };

  const validate = () => {
    if (!form.roundNo || !form.roundName || !form.outoffScore || !form.minScore || !form.weightage) {
      showToast('All fields are required', 'error'); return false;
    }
    if (isNaN(parseFloat(form.outoffScore)) || isNaN(parseFloat(form.minScore)) || isNaN(parseFloat(form.weightage))) {
      showToast('Score and weightage must be valid numbers', 'error'); return false;
    }
    if (parseFloat(form.minScore) > parseFloat(form.outoffScore)) {
      showToast('Min score cannot exceed total score', 'error'); return false;
    }
    if (sections.length) {
      for (let i = 0; i < sections.length; i++) {
        if (!sections[i].sectionName.trim()) { showToast(`Section ${i + 1}: name required`, 'error'); return false; }
        if (sections[i].outOf <= 0) { showToast(`Section ${i + 1}: score must be > 0`, 'error'); return false; }
      }
      const total = sections.reduce((s, r) => s + r.outOf, 0);
      if (total !== parseFloat(form.outoffScore)) { showToast(`Section scores (${total}) must equal total (${form.outoffScore})`, 'error'); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const user = tokenstore.getUser();
    if (!user) { showToast('Please log in', 'error'); return; }
    setSaving(true);
    try {
      if (editMode && current) {
        const data: RoundTemplateUpdateRequest = {
          roundNo: parseInt(form.roundNo), roundName: form.roundName,
          outoffScore: parseFloat(form.outoffScore), minScore: parseFloat(form.minScore),
          weightage: parseFloat(form.weightage),
          sections: sections.length ? (sections as unknown as Record<string, unknown>) : undefined,
        };
        const res = await roundTemplateApi.updateRoundTemplate(current.roundConfigId, data);
        if (res.success) { showToast('Template updated successfully', 'success'); fetchTemplates(); setDialogOpen(false); }
      } else {
        const data: RoundTemplateRequest = {
          roundNo: parseInt(form.roundNo), roundName: form.roundName,
          outoffScore: parseFloat(form.outoffScore), minScore: parseFloat(form.minScore),
          weightage: parseFloat(form.weightage), isActive: true, createdBy: user.userId,
          sections: sections.length ? (sections as unknown as Record<string, unknown>) : [] as unknown as Record<string, unknown>,
        };
        const res = await roundTemplateApi.createRoundTemplate(data);
        if (res.success) { showToast('Template created successfully', 'success'); fetchTemplates(); setDialogOpen(false); }
      }
    } catch { showToast(editMode ? 'Failed to update' : 'Failed to create', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Box className="t-page">
      <Card className="t-card">

        {/* Header */}
        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BackButton onClick={() => navigate('/ta-recruiter/settings')} variant="header" />
            <Box className="t-icon-box">
              <ViewListIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack gap="2px">
              <Typography className="t-page-title">Round Templates</Typography>
              <Typography className="t-page-subtitle">Configure interview round templates</Typography>
            </Stack>
          </Stack>
          <Button variant="contained" startIcon={<AddIcon />} className="t-btn-primary" onClick={openAdd}
            sx={{ backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-dark)' } }}>
            Add Template
          </Button>
        </Box>

        <Box className="t-separator" />

        {/* Filters */}
        <Box className="rt-filter-section">
          <Stack direction="row" gap={2}>
            <TextField size="small" placeholder="Search by name..." value={filterName}
              onChange={(e) => setFilterName(e.target.value)} className="t-search-field" />
            <FormControl size="small" sx={{ width: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Body */}
        <Box className="t-body">
          <Box className="rt-body-content">
          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="t-loading-text">Loading templates...</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Alert severity="info">No round templates found. Click Add Template to create one.</Alert>
          ) : (
            filtered.map((t) => (
              <Card key={t.roundConfigId} className="rt-item-card">
                <Box className="rt-item-content">
                  <Box className="rt-item-top">
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Typography className="rt-item-title">Round {t.roundNo}: {t.roundName}</Typography>
                      <Chip label={t.isActive ? 'Active' : 'Inactive'} size="small"
                        className={t.isActive ? 't-chip-success' : 't-chip-neutral'} />
                    </Stack>
                    <Stack direction="row" gap={0.5}>
                      <IconButton size="small" className="t-action-btn" onClick={() => openEdit(t)} title="Edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" className="t-action-btn" onClick={() => toggleStatus(t)}
                        title={t.isActive ? 'Deactivate' : 'Activate'}>
                        {t.isActive ? <ToggleOnIcon fontSize="small" sx={{ color: 'var(--color-success)' }} /> : <ToggleOffIcon fontSize="small" />}
                      </IconButton>
                    </Stack>
                  </Box>

                  <Stack direction="row" gap={4}>
                    {[['Total Score', t.outoffScore], ['Min Score', t.minScore], ['Weightage', `${t.weightage}%`], ['Created By', t.createdByName]].map(([label, val]) => (
                      <Box key={label as string}>
                        <Typography className="rt-meta-label">{label}</Typography>
                        <Typography className="rt-meta-value">{val}</Typography>
                      </Box>
                    ))}
                  </Stack>

                  {t.sections.length > 0 && (
                    <>
                      <Divider sx={{ my: 1.5, borderColor: 'var(--color-grey-200)' }} />
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {t.sections.map((s, i) => (
                          <Chip key={i} label={`${s.sectionName}: ${s.outOf}`} size="small" className="t-chip-primary" />
                        ))}
                      </Stack>
                    </>
                  )}
                </Box>
              </Card>
            ))
          )}
          </Box>
        </Box>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={700} fontSize="var(--text-md)">{editMode ? 'Edit Template' : 'Create Template'}</Typography>
            <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <Stack direction="row" gap={2}>
              <TextField size="small" label="Round No" type="number" fullWidth value={form.roundNo}
                onChange={(e) => setForm({ ...form, roundNo: e.target.value })} />
              <TextField size="small" label="Round Name" fullWidth value={form.roundName}
                onChange={(e) => setForm({ ...form, roundName: e.target.value })} />
            </Stack>
            <Stack direction="row" gap={2}>
              <TextField size="small" label="Total Score" type="number" fullWidth value={form.outoffScore}
                onChange={(e) => setForm({ ...form, outoffScore: e.target.value })} />
              <TextField size="small" label="Min Score" type="number" fullWidth value={form.minScore}
                onChange={(e) => setForm({ ...form, minScore: e.target.value })} />
              <TextField size="small" label="Weightage (%)" type="number" fullWidth value={form.weightage}
                onChange={(e) => setForm({ ...form, weightage: e.target.value })} />
            </Stack>

            <Divider sx={{ borderColor: 'var(--color-grey-200)' }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontSize="var(--text-sm)" fontWeight={600} color="var(--color-text-primary)">Sections (Optional)</Typography>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setSections([...sections, { sectionName: '', outOf: 0 }])}
                className="t-btn-small">Add Section</Button>
            </Stack>

            {sections.map((s, i) => (
              <Box key={i} className="rt-section-row">
                <TextField size="small" label="Section Name" value={s.sectionName} sx={{ flex: 1 }}
                  onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], sectionName: e.target.value }; setSections(u); }} />
                <TextField size="small" label="Out Of" type="number" value={s.outOf || ''} sx={{ width: 100 }}
                  onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], outOf: parseFloat(e.target.value) || 0 }; setSections(u); }} />
                <IconButton size="small" color="error" onClick={() => setSections(sections.filter((_, j) => j !== i))}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {sections.length > 0 && (
              <Alert severity="info" sx={{ fontSize: 'var(--text-xs)' }}>
                Total: {sections.reduce((s, r) => s + r.outOf, 0)} / {form.outoffScore || 0}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} disabled={saving} className="t-dialog-cancel-btn">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}
            className="t-dialog-confirm-btn"
            sx={{ backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-dark)' } }}>
            {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoundTemplateManagement;
