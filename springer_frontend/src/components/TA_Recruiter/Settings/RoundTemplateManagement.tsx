import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, IconButton, CircularProgress,
  Alert, Chip, Select, MenuItem, FormControl,
  Dialog,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { roundTemplateApi } from '../../../services/drive.api';
import { showToast } from '../../../utils/toast';
import { tokenstore } from '../../../auth/tokenstore';
import type { RoundTemplateRequest, RoundTemplateResponse, RoundTemplateUpdateRequest } from '../../../types/TA_Recruiter/Drive/roundTemplate.types';
import '../../../css/TA_Recruiter/Settings/RoundTemplateManagement.css';

interface Section { sectionName: string; outOf: number; }
type Template = Omit<RoundTemplateResponse, 'sections'> & { sections: Section[] };

const EMPTY_FORM = { roundNo: '', roundName: '', outoffScore: '', minScore: '', weightage: '' };

const RoundTemplateManagement = () => {
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



  const openEdit = (t: Template) => {
    setEditMode(true); setCurrent(t);
    setForm({ roundNo: String(t.roundNo), roundName: t.roundName, outoffScore: String(t.outoffScore), minScore: String(t.minScore), weightage: String(t.weightage) });
    setSections(t.sections.length ? [...t.sections] : []);
    setDialogOpen(true);
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
    <Box className="t-page settings-page-override">
      <Card className="t-card settings-card-override">

        {/* Filters */}
        <Box className="rt-filter-section">
          <Box className="rt-search-wrap">
            <span className="rt-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              className="rt-search-input"
              placeholder="Search by name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Box>
          <FormControl size="small" className="rt-status-select">
            <Select value={filterStatus} label="" onChange={(e) => setFilterStatus(e.target.value)} displayEmpty>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Body */}
        <Box className="t-body">
          <Box className="rt-body-content">
          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={32} className="rt-spinner" />
              <Typography className="t-loading-text">Loading templates...</Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Alert severity="info">No round templates found. Click Add Template to create one.</Alert>
          ) : (
            filtered.map((t) => (
              <Card key={t.roundConfigId} className="rt-item-card">
                <Box className="rt-item-content">
                  {/* Title + Edit */}
                  <Box className="rt-item-top">
                    <Stack direction="row" alignItems="center" gap={1.5}>
                      <Typography className="rt-item-title">Round {t.roundNo}: {t.roundName}</Typography>
                      <Chip label={t.isActive ? 'Active' : 'Inactive'} size="small"
                        className={t.isActive ? 't-chip-success' : 't-chip-neutral'} />
                    </Stack>
                    <IconButton size="small" className="rt-edit-btn" onClick={() => openEdit(t)} title="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Meta: 4 columns */}
                  <Box className="rt-meta-grid">
                    {[['TOTAL SCORE', t.outoffScore], ['MIN SCORE', t.minScore], ['WEIGHTAGE', `${t.weightage}%`], ['CREATED BY', t.createdByName]].map(([label, val]) => (
                      <Box key={label as string}>
                        <Typography className="rt-meta-label">{label}</Typography>
                        <Typography className="rt-meta-value">{val}</Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Section chips */}
                  {t.sections.length > 0 && (
                    <Box className="rt-sections-row">
                      {t.sections.map((s, i) => (
                        <span key={i} className="rt-section-chip">{s.sectionName}: {s.outOf}</span>
                      ))}
                    </Box>
                  )}
                </Box>
              </Card>
            ))
          )}
          </Box>
        </Box>
      </Card>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth={false}
        PaperProps={{ className: 'rt-dialog-paper' }}
      >
        {/* Header */}
        <Box className="rt-dialog-header">
          <Typography className="rt-dialog-title-text">{editMode ? 'Edit Template' : 'Add Template'}</Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)} className="rt-dialog-close-btn">
            <CloseIcon className="rt-dialog-close-icon" />
          </IconButton>
        </Box>

        {/* Content */}
        <Box className="rt-dialog-content">

          {/* Row 1: Round No + Round Name */}
          <Box className="rt-dialog-row-2">
            <Box className="rt-dialog-field">
              <Typography className="rt-dialog-label">Round No.</Typography>
              <input
                className="rt-dialog-input"
                type="number"
                placeholder="1"
                value={form.roundNo}
                onChange={(e) => setForm({ ...form, roundNo: e.target.value })}
              />
            </Box>
            <Box className="rt-dialog-field">
              <Typography className="rt-dialog-label">Round Name</Typography>
              <input
                className="rt-dialog-input"
                placeholder="e.g. Aptitude Round"
                value={form.roundName}
                onChange={(e) => setForm({ ...form, roundName: e.target.value })}
              />
            </Box>
          </Box>

          {/* Row 2: Total Score + Min Score + Weightage */}
          <Box className="rt-dialog-row-3">
            <Box className="rt-dialog-field">
              <Typography className="rt-dialog-label">Total Score</Typography>
              <input
                className="rt-dialog-input"
                type="number"
                placeholder="120"
                value={form.outoffScore}
                onChange={(e) => setForm({ ...form, outoffScore: e.target.value })}
              />
            </Box>
            <Box className="rt-dialog-field">
              <Typography className="rt-dialog-label">Min Score</Typography>
              <input
                className="rt-dialog-input"
                type="number"
                placeholder="80"
                value={form.minScore}
                onChange={(e) => setForm({ ...form, minScore: e.target.value })}
              />
            </Box>
            <Box className="rt-dialog-field">
              <Typography className="rt-dialog-label">Weightage %</Typography>
              <input
                className="rt-dialog-input"
                type="number"
                placeholder="40"
                value={form.weightage}
                onChange={(e) => setForm({ ...form, weightage: e.target.value })}
              />
            </Box>
          </Box>

          {/* Sections */}
          <Box className="rt-dialog-sections-header">
            <Typography className="rt-dialog-sections-label">Sections (Optional)</Typography>
            <button
              className="rt-dialog-add-section-btn"
              onClick={() => setSections([...sections, { sectionName: '', outOf: 0 }])}
            >
              + Add Section
            </button>
          </Box>

          {sections.map((s, i) => (
            <Box key={i} className="rt-dialog-section-row">
              <input
                className="rt-dialog-input rt-dialog-section-name"
                placeholder="Section Name"
                value={s.sectionName}
                onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], sectionName: e.target.value }; setSections(u); }}
              />
              <input
                className="rt-dialog-input rt-dialog-section-score"
                type="number"
                placeholder="0"
                value={s.outOf || ''}
                onChange={(e) => { const u = [...sections]; u[i] = { ...u[i], outOf: parseFloat(e.target.value) || 0 }; setSections(u); }}
              />
              <IconButton size="small" className="rt-dialog-remove-btn" onClick={() => setSections(sections.filter((_, j) => j !== i))}>
                <CloseIcon className="rt-dialog-remove-icon" />
              </IconButton>
            </Box>
          ))}

          {sections.length > 0 && (
            <Typography className="rt-dialog-total">
              Total: {sections.reduce((s, r) => s + r.outOf, 0)} / {form.outoffScore || 0}
            </Typography>
          )}
        </Box>

        {/* Footer */}
        <Box className="rt-dialog-footer">
          <button className="rt-dialog-cancel-btn" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</button>
          <button className="rt-dialog-submit-btn" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default RoundTemplateManagement;
