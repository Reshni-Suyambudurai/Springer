import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Stack, Button, CircularProgress,
  Alert, Chip, TextField, Checkbox, FormControlLabel, FormHelperText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { FigmaEditIcon as EditIcon } from '../../Common/FigmaIcons';
import BackButton from '../../Common/BackButton';
import { useNavigate } from 'react-router-dom';
import { candidateApi } from '../../../services/drive.api';
import { showToast } from '../../../utils/toast';
import { syncEligibilityFiltersToSession } from '../../../utils/eligibilityFilterSync';
import { Degree, Department } from '../../../types/TA_Recruiter/Drive/candidate.types';
import type { EligibilityRuleDTO, EligibilityRuleUpdateRequest } from '../../../types/TA_Recruiter/Drive/eligibility.types';
import '../../../css/TA_Recruiter/Settings/EligibilityManagement.css';

const DEGREE_OPTIONS = Object.values(Degree);
const DEPARTMENT_OPTIONS = Object.values(Department);

const FIELD_LABELS: Record<string, string> = {
  cgpa: 'CGPA', passoutYear: 'Passout Year', historyOfArrears: 'History of Arrears', degree: 'Degree', department: 'Department',
};

const EligibilityManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<EligibilityRuleDTO[]>([]);
  const [original, setOriginal] = useState<EligibilityRuleUpdateRequest | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await candidateApi.getEligibilityRules();
      if (res.success && res.data) {
        setRules(res.data.rules || []); setOriginal(res.data);
      } else showToast(res.message || 'Failed to load rules', 'error');
    } catch (error: unknown) {
      console.error('Error fetching eligibility rules:', error);
      let errorMessage = 'Failed to load eligibility rules';
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') errorMessage = error.message;
        else if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string } } };
          if (axiosError.response?.data?.message) errorMessage = axiosError.response.data.message;
        }
      }
      showToast(errorMessage, 'error');
    } finally { setLoading(false); }
  };

  const validate = (rule: EligibilityRuleDTO): string => {
    if (rule.operator === 'BETWEEN') {
      if (rule.min === null || rule.min === undefined) return 'Min value is required';
      if (rule.max === null || rule.max === undefined) return 'Max value is required';
      if (['cgpa', 'passoutYear', 'historyOfArrears'].includes(rule.field)) {
        if (rule.min < 0) return 'Min value cannot be negative';
        if (rule.max < 0) return 'Max value cannot be negative';
      }
      if (rule.field === 'cgpa') {
        if (rule.min > 10) return 'CGPA cannot exceed 10.0';
        if (rule.max > 10) return 'CGPA cannot exceed 10.0';
      }
      if (rule.field === 'passoutYear') {
        if (String(rule.min).length !== 4 || String(rule.max).length !== 4) return 'Year must be a 4-digit number';
        if (rule.min < 1900 || rule.min > 2100 || rule.max < 1900 || rule.max > 2100) return 'Year must be between 1900 and 2100';
      }
      if (rule.min > rule.max) return 'Min must be â‰¤ Max';
    } else if (rule.operator === 'IN') {
      return '';
    } else {
      if (rule.value === null || rule.value === undefined) return 'Value is required';
      if (['cgpa', 'passoutYear', 'historyOfArrears'].includes(rule.field) && rule.value < 0) return 'Value cannot be negative';
      if (rule.field === 'cgpa' && rule.value > 10) return 'CGPA cannot exceed 10.0';
      if (rule.field === 'passoutYear') {
        if (String(rule.value).length !== 4) return 'Year must be a 4-digit number';
        if (rule.value < 1900 || rule.value > 2100) return 'Year must be between 1900 and 2100';
      }
    }
    return '';
  };

  const handleChange = (index: number, field: keyof EligibilityRuleDTO, value: unknown) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
    const err = validate(updated[index]);
    setErrors(prev => { const n = { ...prev }; err ? (n[index] = err) : delete n[index]; return n; });
  };

  const handleSave = async () => {
    const newErrors: Record<number, string> = {};
    rules.forEach((r, i) => { const e = validate(r); if (e) newErrors[i] = e; });
    if (Object.keys(newErrors).length) { setErrors(newErrors); showToast('Fix errors before saving', 'error'); return; }
    setSaving(true);
    try {
      const res = await candidateApi.updateEligibilityRules({ rules, logic: 'AND' });
      if (res.success) {
        showToast('Eligibility rules updated', 'success');
        setOriginal(res.data); setEditMode(false); fetchRules();
        syncEligibilityFiltersToSession().catch(() => {});
      } else showToast(res.message || 'Failed', 'error');
    } catch { showToast('Something went wrong', 'error'); }
    finally { setSaving(false); }
  };

  const renderValue = (rule: EligibilityRuleDTO, index: number) => {
    if (!editMode) {
      if (rule.operator === 'BETWEEN') return <Typography className="eligibility-value-text">{rule.min} â€” {rule.max}</Typography>;
      if (rule.operator === 'IN') return (
        <Box className="eligibility-chips-wrap">
          {rule.allowedValues && rule.allowedValues.length > 0
            ? rule.allowedValues.map((v, i) => <Chip key={i} label={v} size="small" className="t-chip-primary" />)
            : <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No values â€” click Edit to configure</Typography>
          }
        </Box>
      );
      return <Typography className="eligibility-value-text">{rule.value}</Typography>;
    }

    const options = rule.field === 'degree' ? DEGREE_OPTIONS : DEPARTMENT_OPTIONS;

    if (rule.operator === 'BETWEEN') return (
      <Box>
        <Box className="eligibility-input-row">
          <TextField size="small" type="number" placeholder="Min" value={rule.min ?? ''} sx={{ width: 100 }}
            onChange={(e) => handleChange(index, 'min', e.target.value ? Number(e.target.value) : undefined)}
            inputProps={{ min: 0, step: rule.field === 'cgpa' ? 0.01 : 1 }} error={!!errors[index]} />
          <Typography className="eligibility-between-text">to</Typography>
          <TextField size="small" type="number" placeholder="Max" value={rule.max ?? ''} sx={{ width: 100 }}
            onChange={(e) => handleChange(index, 'max', e.target.value ? Number(e.target.value) : undefined)}
            inputProps={{ min: 0, step: rule.field === 'cgpa' ? 0.01 : 1 }} error={!!errors[index]} />
        </Box>
        {errors[index] && <FormHelperText error>{errors[index]}</FormHelperText>}
      </Box>
    );

    if (rule.operator === 'IN') return (
      <Box sx={{ width: '100%' }}>
        <Box className="eligibility-select-all-row">
          <Button size="small" variant="outlined" className="t-btn-small"
            onClick={() => handleChange(index, 'allowedValues', options)}>Select All</Button>
          <Button size="small" variant="outlined" className="t-btn-small"
            onClick={() => handleChange(index, 'allowedValues', [])}>Clear</Button>
          <Typography sx={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', ml: 1 }}>
            {rule.allowedValues?.length || 0} selected
          </Typography>
        </Box>
        <Box className="eligibility-checkbox-grid">
          {options.map((opt) => (
            <FormControlLabel key={opt} label={<Typography fontSize="var(--text-xs)">{opt}</Typography>}
              control={<Checkbox size="small" checked={rule.allowedValues?.includes(opt) || false}
                onChange={(e) => {
                  const cur = rule.allowedValues || [];
                  handleChange(index, 'allowedValues', e.target.checked ? [...cur, opt] : cur.filter(v => v !== opt));
                }} />} />
          ))}
        </Box>
        {errors[index] && <FormHelperText error>{errors[index]}</FormHelperText>}
      </Box>
    );

    return (
      <Box>
        <TextField size="small" type="number" fullWidth value={rule.value ?? ''}
          onChange={(e) => handleChange(index, 'value', e.target.value ? Number(e.target.value) : undefined)}
          inputProps={{ min: 0, step: rule.field === 'cgpa' ? 0.01 : 1 }} error={!!errors[index]} />
        {errors[index] && <FormHelperText error>{errors[index]}</FormHelperText>}
      </Box>
    );
  };

  return (
    <Box className="t-page">
      <Card className="t-card">

        {/* Header */}
        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BackButton onClick={() => navigate('/ta-recruiter/settings')} variant="header" />
            <Box className="t-icon-box">
              <CheckCircleIcon sx={{ fontSize: 20, color: 'var(--color-primary)' }} />
            </Box>
            <Stack gap="2px">
              <Typography className="t-page-title">Eligibility Management</Typography>
              <Typography className="t-page-subtitle">Configure candidate eligibility criteria</Typography>
            </Stack>
          </Stack>
          {/* Edit Values button â€” t-header is already space-between */}
          {!editMode ? (
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)}
              className="t-btn-primary"
              sx={{ backgroundColor: 'var(--color-primary)', '&:hover': { backgroundColor: 'var(--color-primary-dark)' } }}>
              Edit Values
            </Button>
          ) : (
            <Stack direction="row" gap={1.5}>
              <Button variant="outlined" startIcon={<CancelIcon />}
                onClick={() => { if (original) setRules(original.rules || []); setErrors({}); setEditMode(false); }}
                disabled={saving} className="t-btn-secondary">Cancel</Button>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}
                className="t-btn-success"
                sx={{ backgroundColor: 'var(--color-success-dark)', '&:hover': { backgroundColor: 'var(--color-success-dark)' } }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          )}
        </Box>

        <Box className="t-separator" />

        {/* Body */}
        <Box className="t-body">
          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="t-loading-text">Loading rules...</Typography>
            </Box>
          ) : rules.length === 0 ? (
            <Alert severity="info">No eligibility rules configured.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '160px 120px 1fr', background: 'var(--color-bg-table-header)', borderRadius: '10px 10px 0 0', border: '1px solid var(--color-border-card)' }}>
                <Typography className="t-head-cell" sx={{ padding: '10px 16px' }}>Field</Typography>
                <Typography className="t-head-cell" sx={{ padding: '10px 16px' }}>Operator</Typography>
                <Typography className="t-head-cell" sx={{ padding: '10px 16px' }}>Value</Typography>
              </Box>
              {rules.map((rule, index) => (
                <Box key={index} sx={{
                  display: 'grid', gridTemplateColumns: '160px 120px 1fr',
                  border: '1px solid var(--color-border-card)', borderTop: 'none',
                  background: 'var(--color-surface)',
                  '&:last-child': { borderRadius: '0 0 10px 10px' }
                }}>
                  <Box sx={{ padding: '14px 16px', borderRight: '1px solid var(--color-border-table)' }}>
                    <Typography className="eligibility-field-text">{FIELD_LABELS[rule.field] || rule.field}</Typography>
                  </Box>
                  <Box sx={{ padding: '14px 16px', borderRight: '1px solid var(--color-border-table)' }}>
                    <Typography className="eligibility-operator-text">{rule.operator}</Typography>
                  </Box>
                  <Box sx={{ padding: '14px 16px' }}>
                    {renderValue(rule, index)}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

      </Card>
    </Box>
  );
};

export default EligibilityManagement;
