import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Button, IconButton,
  TextField, MenuItem, Select, InputLabel, FormControl,
  Checkbox, FormControlLabel, FormGroup, CircularProgress, Alert,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as DemandIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { hiringCycleApi, hiringDemandApi, skillsApi } from '../../../services/hiring.api';
import type { HiringCycleSummaryResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { SkillResponse } from '../../../types/TA_Recruiter/Hiring/skill.types';
import { tokenstore } from '../../../auth/tokenstore';
import { showToast } from '../../../utils/toast';
import '../../../css/HiringManager/HiringDemand/AddHiringDemand.css';

const BUSINESS_UNITS = [
  { value: 'DATA_ANALYTICS_AND_AI', label: 'Data Analytics & AI' },
  { value: 'SERVICENOW',            label: 'ServiceNow' },
  { value: 'PRODUCT_ENGINEERING',   label: 'Product Engineering' },
];

const AddHiringDemand = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCycleId = searchParams.get('cycleId');

  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initError, setInitError] = useState('');

  const [form, setForm] = useState({
    cycleId: preselectedCycleId ?? '',
    businessUnit: '',
    demandCount: '',
    compensationBand: '',
    jobDescription: '',
    selectedSkillIds: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      try {
        setLoadingInit(true);
        const [cyclesRes, skillsRes] = await Promise.all([
          hiringCycleApi.getAllCycleSummaries(),
          skillsApi.getAllSkills(),
        ]);
        if (cyclesRes.success && cyclesRes.data) {
          // Only OPEN cycles
          setCycles(cyclesRes.data.filter(c => c.status === 'OPEN'));
        }
        if (skillsRes.success && skillsRes.data) {
          setSkills(skillsRes.data);
        }
      } catch (err: any) {
        setInitError(err.message || 'Failed to load form data.');
      } finally {
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSkillToggle = (skillId: number) => {
    setForm(prev => ({
      ...prev,
      selectedSkillIds: prev.selectedSkillIds.includes(skillId)
        ? prev.selectedSkillIds.filter(id => id !== skillId)
        : [...prev.selectedSkillIds, skillId],
    }));
    setErrors(prev => ({ ...prev, selectedSkillIds: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.cycleId) newErrors.cycleId = 'Please select a hiring cycle.';
    if (!form.businessUnit) newErrors.businessUnit = 'Please select a business unit.';
    if (!form.demandCount || Number(form.demandCount) <= 0) newErrors.demandCount = 'Enter a valid demand count.';
    if (!form.compensationBand.trim()) newErrors.compensationBand = 'Compensation band is required.';
    if (form.selectedSkillIds.length === 0) newErrors.selectedSkillIds = 'Select at least one skill.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (approvalStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!validate()) return;
    const user = tokenstore.getUser();
    if (!user) { showToast('User session expired. Please login again.', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await hiringDemandApi.createDemand({
        cycleId: Number(form.cycleId),
        businessUnit: form.businessUnit,
        demandCount: Number(form.demandCount),
        compensationBand: form.compensationBand,
        jobDescription: form.jobDescription,
        approvalStatus,
        skillIds: form.selectedSkillIds,
      }, user.userId);

      if (res.success && res.data) {
        showToast(
          approvalStatus === 'DRAFT'
            ? 'Demand saved as draft.'
            : 'Demand submitted for approval.',
          'success'
        );
        navigate(`/hiring-manager/hiring-demands/${res.data.demandId}`);
      } else {
        showToast(res.message || 'Failed to create demand.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create demand.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="ahd-page">
      <Card className="ahd-card">

        {/* Header */}
        <Box className="ahd-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <IconButton
              size="small"
              className="ahd-back-btn"
              onClick={() => navigate(-1)}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box className="ahd-icon-box">
              <DemandIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack>
              <Typography className="ahd-title">Add Hiring Demand</Typography>
              <Typography className="ahd-subtitle">Raise a new hiring demand for an open cycle</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className="ahd-separator" />

        {loadingInit ? (
          <Box className="ahd-loading">
            <CircularProgress size={28} sx={{ color: 'var(--color-primary)' }} />
            <Typography className="ahd-loading-text">Loading form...</Typography>
          </Box>
        ) : initError ? (
          <Box className="ahd-alert-wrap"><Alert severity="error">{initError}</Alert></Box>
        ) : (
          <Box className="ahd-body">

            {/* Section: Demand Details */}
            <Box className="ahd-section">
              <Box className="ahd-section-header">
                <Typography className="ahd-section-label">Demand Details</Typography>
                <Box className="ahd-section-rule" />
              </Box>

              <Box className="ahd-form-grid">

                {/* Hiring Cycle */}
                <FormControl size="small" fullWidth error={!!errors.cycleId}>
                  <InputLabel>Hiring Cycle *</InputLabel>
                  <Select
                    value={form.cycleId}
                    label="Hiring Cycle *"
                    onChange={(e) => handleChange('cycleId', e.target.value)}
                    className="ahd-select"
                  >
                    {cycles.map(c => (
                      <MenuItem key={c.cycleId} value={c.cycleId.toString()}>
                        {c.cycleName} ({c.cycleYear})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.cycleId && <Typography className="ahd-error">{errors.cycleId}</Typography>}
                </FormControl>

                {/* Business Unit */}
                <FormControl size="small" fullWidth error={!!errors.businessUnit}>
                  <InputLabel>Business Unit *</InputLabel>
                  <Select
                    value={form.businessUnit}
                    label="Business Unit *"
                    onChange={(e) => handleChange('businessUnit', e.target.value)}
                    className="ahd-select"
                  >
                    {BUSINESS_UNITS.map(bu => (
                      <MenuItem key={bu.value} value={bu.value}>{bu.label}</MenuItem>
                    ))}
                  </Select>
                  {errors.businessUnit && <Typography className="ahd-error">{errors.businessUnit}</Typography>}
                </FormControl>

                {/* Demand Count */}
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
                  className="ahd-field"
                />

                {/* Compensation Band */}
                <TextField
                  label="Compensation Band *"
                  size="small"
                  fullWidth
                  placeholder="e.g. 3.5 - 5 LPA"
                  value={form.compensationBand}
                  onChange={(e) => handleChange('compensationBand', e.target.value)}
                  error={!!errors.compensationBand}
                  helperText={errors.compensationBand}
                  className="ahd-field"
                />

              </Box>

              {/* Job Description */}
              <TextField
                label="Job Description"
                size="small"
                fullWidth
                multiline
                rows={4}
                placeholder="Describe the role, responsibilities, and requirements..."
                value={form.jobDescription}
                onChange={(e) => handleChange('jobDescription', e.target.value)}
                className="ahd-field ahd-field--full"
                sx={{ mt: '16px' }}
              />
            </Box>

            {/* Section: Skills */}
            <Box className="ahd-section" sx={{ mt: '24px' }}>
              <Box className="ahd-section-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography className="ahd-section-label">Required Skills *</Typography>
                  {form.selectedSkillIds.length > 0 && (
                    <Chip
                      label={`${form.selectedSkillIds.length} selected`}
                      size="small"
                      className="ahd-count-chip"
                    />
                  )}
                </Stack>
                <Box className="ahd-section-rule" />
              </Box>

              {errors.selectedSkillIds && (
                <Typography className="ahd-error" sx={{ mb: '8px' }}>{errors.selectedSkillIds}</Typography>
              )}

              <Box className="ahd-skills-grid">
                {skills.map(skill => (
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
                    className="ahd-skill-label"
                  />
                ))}
              </Box>
            </Box>

            {/* Footer Actions */}
            <Box className="ahd-footer">
              <Button
                variant="outlined"
                size="small"
                className="ahd-draft-btn"
                onClick={() => handleSubmit('DRAFT')}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                variant="contained"
                size="small"
                className="ahd-submit-btn"
                onClick={() => handleSubmit('SUBMITTED')}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </Box>

          </Box>
        )}
      </Card>
    </Box>
  );
};

export default AddHiringDemand;
