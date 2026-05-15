import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Button, IconButton,
  CircularProgress, Alert, TextField, MenuItem, Select,
  InputLabel, FormControl, FormControlLabel, Checkbox, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as DemandIcon,
  Save as SaveIcon,

} from '@mui/icons-material';
import { FigmaEditIcon as EditIcon, FigmaDeleteIcon as DeleteIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { useNavigate, useParams } from 'react-router-dom';
import { hiringDemandApi, skillsApi } from '../../../services/hiring.api';
import type { HiringDemandResponse } from '../../../types/TA_Recruiter/Hiring/hiringDemand.types';
import type { SkillResponse } from '../../../types/TA_Recruiter/Hiring/skill.types';
import { showToast } from '../../../utils/toast';
import '../../../css/HiringManager/HiringDemand/HiringDemandDetails.css';

const BUSINESS_UNITS = [
  { value: 'DATA_ANALYTICS_AND_AI', label: 'Data Analytics & AI' },
  { value: 'SERVICENOW',            label: 'ServiceNow' },
  { value: 'PRODUCT_ENGINEERING',   label: 'Product Engineering' },
];

const buLabelMap: Record<string, string> = {
  DATA_ANALYTICS_AND_AI: 'Data Analytics & AI',
  SERVICENOW:            'ServiceNow',
  PRODUCT_ENGINEERING:   'Product Engineering',
};

const approvalStatusClassMap: Record<string, string> = {
  DRAFT:     'hdd-status-chip hdd-status--draft',
  SUBMITTED: 'hdd-status-chip hdd-status--submitted',
  APPROVED:  'hdd-status-chip hdd-status--approved',
  REJECTED:  'hdd-status-chip hdd-status--rejected',
};

const HiringDemandDetails = () => {
  const navigate = useNavigate();
  const { demandId } = useParams<{ demandId: string }>();
  const id = Number(demandId);

  const [demand, setDemand] = useState<HiringDemandResponse | null>(null);
  const [allSkills, setAllSkills] = useState<SkillResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    businessUnit: '',
    demandCount: '',
    compensationBand: '',
    jobDescription: '',
    selectedSkillIds: [] as number[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      const [demandRes, skillsRes] = await Promise.all([
        hiringDemandApi.getDemandById(id),
        skillsApi.getAllSkills(),
      ]);
      if (demandRes.success && demandRes.data) {
        setDemand(demandRes.data);
        setForm({
          businessUnit: demandRes.data.businessUnit,
          demandCount: demandRes.data.demandCount.toString(),
          compensationBand: demandRes.data.compensationBand,
          jobDescription: '',
          selectedSkillIds: demandRes.data.skills.map(s => s.skillId),
        });
      } else {
        setError(demandRes.message || 'Failed to load demand.');
      }
      if (skillsRes.success && skillsRes.data) setAllSkills(skillsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load demand.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSkillToggle = (skillId: number) => {
    setForm(prev => ({
      ...prev,
      selectedSkillIds: prev.selectedSkillIds.includes(skillId)
        ? prev.selectedSkillIds.filter(sid => sid !== skillId)
        : [...prev.selectedSkillIds, skillId],
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.businessUnit) newErrors.businessUnit = 'Business unit is required.';
    if (!form.demandCount || Number(form.demandCount) <= 0) newErrors.demandCount = 'Enter a valid demand count.';
    if (!form.compensationBand.trim()) newErrors.compensationBand = 'Compensation band is required.';
    if (form.selectedSkillIds.length === 0) newErrors.selectedSkillIds = 'Select at least one skill.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (approvalStatus?: string) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await hiringDemandApi.updateDemand(id, {
        businessUnit: form.businessUnit,
        demandCount: Number(form.demandCount),
        compensationBand: form.compensationBand,
        jobDescription: form.jobDescription || undefined,
        skillIds: form.selectedSkillIds,
        ...(approvalStatus ? { approvalStatus: approvalStatus as any } : {}),
      });
      if (res.success) {
        showToast(
          approvalStatus === 'SUBMITTED'
            ? 'Demand submitted for approval.'
            : 'Demand updated successfully.',
          'success'
        );
        setEditMode(false);
        await load();
      } else {
        showToast(res.message || 'Failed to update demand.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update demand.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await hiringDemandApi.deleteDemand(id);
      if (res.success) {
        showToast('Demand deleted successfully.', 'success');
        navigate(`/hiring-manager/hiring-cycles/${demand?.cycleId}`);
      } else {
        showToast(res.message || 'Failed to delete demand.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete demand.', 'error');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const canEdit = demand?.approvalStatus === 'DRAFT' || demand?.approvalStatus === 'REJECTED';

  return (
    <Box className="hdd-page">
      <Card className="hdd-card">

        {/* Header */}
        <Box className="hdd-header">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconButton
                size="small"
                className="hdd-back-btn"
                onClick={() => navigate(`/hiring-manager/hiring-cycles/${demand?.cycleId}`)}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Box className="hdd-icon-box">
                <DemandIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
              </Box>
              <Stack>
                <Typography className="hdd-title">
                  {loading ? 'Demand Details' : `Demand â€” ${buLabelMap[demand?.businessUnit ?? ''] ?? demand?.businessUnit}`}
                </Typography>
                <Typography className="hdd-subtitle">{demand?.cycleName ?? 'Hiring demand details'}</Typography>
              </Stack>
            </Stack>

            {!loading && !error && demand && (
              <Stack direction="row" gap={1}>
                {canEdit && !editMode && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteIcon style={{ fontSize: '16px' }} />}
                      className="hdd-delete-btn"
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon style={{ fontSize: '16px' }} />}
                      className="hdd-edit-btn"
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                  </>
                )}
                {editMode && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloseIcon style={{ fontSize: '16px' }} />}
                      className="hdd-cancel-btn"
                      onClick={() => { setEditMode(false); setErrors({}); }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SaveIcon sx={{ fontSize: '16px !important' }} />}
                      className="hdd-save-draft-btn"
                      onClick={() => handleSave()}
                      disabled={saving}
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      className="hdd-submit-btn"
                      onClick={() => handleSave('SUBMITTED')}
                      disabled={saving}
                    >
                      {saving ? 'Submitting...' : 'Submit for Approval'}
                    </Button>
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </Box>

        <Box className="hdd-separator" />

        {loading ? (
          <Box className="hdd-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="hdd-loading-text">Loading...</Typography>
          </Box>
        ) : error ? (
          <Box className="hdd-alert-wrap"><Alert severity="error">{error}</Alert></Box>
        ) : demand && (
          <Box className="hdd-body">

            {/* Demand Info Section */}
            <Box className="hdd-section">
              <Box className="hdd-section-header">
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography className="hdd-section-label">Demand Details</Typography>
                  <Chip
                    label={demand.approvalStatus}
                    size="small"
                    className={approvalStatusClassMap[demand.approvalStatus] ?? 'hdd-status-chip'}
                  />
                </Stack>
                <Box className="hdd-section-rule" />
              </Box>

              {!editMode ? (
                <Box className="hdd-info-grid">
                  <Box className="hdd-info-field">
                    <Typography className="hdd-info-label">Hiring Cycle</Typography>
                    <Typography className="hdd-info-value">{demand.cycleName}</Typography>
                  </Box>
                  <Box className="hdd-info-field">
                    <Typography className="hdd-info-label">Business Unit</Typography>
                    <Typography className="hdd-info-value">{buLabelMap[demand.businessUnit] ?? demand.businessUnit}</Typography>
                  </Box>
                  <Box className="hdd-info-field">
                    <Typography className="hdd-info-label">Demand Count</Typography>
                    <Typography className="hdd-info-value">{demand.demandCount}</Typography>
                  </Box>
                  <Box className="hdd-info-field">
                    <Typography className="hdd-info-label">Compensation Band</Typography>
                    <Typography className="hdd-info-value">{demand.compensationBand}</Typography>
                  </Box>
                  <Box className="hdd-info-field">
                    <Typography className="hdd-info-label">Raised By</Typography>
                    <Typography className="hdd-info-value">{demand.createdByUsername}</Typography>
                  </Box>
                  <Box className="hdd-info-field">
                    <Typography className="hdd-info-label">Created On</Typography>
                    <Typography className="hdd-info-value">
                      {new Date(demand.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box className="hdd-form-grid">
                  <FormControl size="small" fullWidth error={!!errors.businessUnit}>
                    <InputLabel>Business Unit *</InputLabel>
                    <Select
                      value={form.businessUnit}
                      label="Business Unit *"
                      onChange={(e) => handleChange('businessUnit', e.target.value)}
                    >
                      {BUSINESS_UNITS.map(bu => (
                        <MenuItem key={bu.value} value={bu.value}>{bu.label}</MenuItem>
                      ))}
                    </Select>
                    {errors.businessUnit && <Typography className="hdd-error">{errors.businessUnit}</Typography>}
                  </FormControl>

                  <TextField
                    label="Demand Count *"
                    size="small"
                    type="number"
                    fullWidth
                    value={form.demandCount}
                    onChange={(e) => handleChange('demandCount', e.target.value)}
                    error={!!errors.demandCount}
                    helperText={errors.demandCount}
                    inputProps={{ min: 1 }}
                  />

                  <TextField
                    label="Compensation Band *"
                    size="small"
                    fullWidth
                    value={form.compensationBand}
                    onChange={(e) => handleChange('compensationBand', e.target.value)}
                    error={!!errors.compensationBand}
                    helperText={errors.compensationBand}
                  />

                  <TextField
                    label="Job Description"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={form.jobDescription}
                    onChange={(e) => handleChange('jobDescription', e.target.value)}
                    sx={{ gridColumn: '1 / -1' }}
                  />
                </Box>
              )}
            </Box>

            {/* Skills Section */}
            <Box className="hdd-section" sx={{ mt: '24px' }}>
              <Box className="hdd-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="hdd-section-label">Required Skills</Typography>
                  <Chip label={editMode ? form.selectedSkillIds.length : demand.skills.length} size="small" className="hdd-count-chip" />
                </Stack>
                <Box className="hdd-section-rule" />
              </Box>

              {!editMode ? (
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {demand.skills.length === 0 ? (
                    <Typography className="hdd-empty-text">No skills added.</Typography>
                  ) : demand.skills.map(s => (
                    <Chip key={s.skillId} label={s.skillName} size="small" className="hdd-skill-chip" />
                  ))}
                </Stack>
              ) : (
                <>
                  {errors.selectedSkillIds && (
                    <Typography className="hdd-error" sx={{ mb: '8px' }}>{errors.selectedSkillIds}</Typography>
                  )}
                  <Box className="hdd-skills-grid">
                    {allSkills.map(skill => (
                      <FormControlLabel
                        key={skill.skillId}
                        control={
                          <Checkbox
                            checked={form.selectedSkillIds.includes(skill.skillId)}
                            onChange={() => handleSkillToggle(skill.skillId)}
                            size="small"
                            sx={{ color: 'var(--color-text-disabled)', '&.Mui-checked': { color: 'var(--color-primary)' } }}
                          />
                        }
                        label={skill.skillName}
                        className="hdd-skill-label"
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>

          </Box>
        )}
      </Card>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Delete Demand?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            This demand will be permanently deleted and cannot be recovered.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            className="hdd-cancel-btn"
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            className="hdd-delete-solid-btn"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HiringDemandDetails;
