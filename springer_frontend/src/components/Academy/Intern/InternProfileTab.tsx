import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, CircularProgress,
  TextField, Stack, IconButton, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { internApi } from '../../../services/intern.api';
import { tokenstore } from '../../../auth/tokenstore';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import type { InternDashboardData, ProfileLink } from '../../../types/Academy/intern.types';
import '../../../css/Academy/Intern/InternProfileTab.css';

const PLATFORM_OPTIONS = [
  'LinkedIn',
  'GitHub',
  'HackerRank',
  'CodeChef',
  'LeetCode',
  'Portfolio',
  'Other',
];

const InternProfileTab = ({ data }: { data: InternDashboardData }) => {
  const user   = tokenstore.getUser();
  const userId = user?.userId ?? 0;

  const [bio, setBio]         = useState('');
  const [links, setLinks]     = useState<ProfileLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    internApi.getProfile(userId)
      .then(res => {
        if (res.success && res.data) {
          setBio(res.data.bio ?? '');
          setLinks(res.data.profileLinks ?? []);
        }
      })
      .catch(error => showToast(handleAxiosError(error).message || 'Failed to load profile', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const addLink = () =>
    setLinks(prev => [...prev, { platform: 'LinkedIn', url: '' }]);

  const updateLink = (idx: number, field: keyof ProfileLink, value: string) =>
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));

  const removeLink = (idx: number) =>
    setLinks(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    for (const link of links) {
      if (!link.url.trim()) {
        showToast(`Please enter a URL for ${link.platform}`, 'error');
        return;
      }
      if (!link.url.trim().startsWith('http://') && !link.url.trim().startsWith('https://')) {
        showToast(`${link.platform} URL must start with http:// or https://`, 'error');
        return;
      }
    }
    try {
      setSaving(true);
      const res = await internApi.saveOrUpdateProfile(userId, { bio, profileLinks: links });
      if (res.success) showToast('Profile saved successfully!', 'success');
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="ipt-loading">
        <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  return (
    <Box className="ipt-page">

      {/* Profile Info Banner */}
      <Card className="ipt-info-card">
        <Box className="ipt-avatar">{data.candidateName.charAt(0).toUpperCase()}</Box>
        <Box>
          <Typography className="ipt-name">{data.candidateName}</Typography>
          <Typography className="ipt-meta">
            {data.department} · {data.programName} · Batch {data.batchNumber}
          </Typography>
          <Typography className="ipt-meta">{data.email}</Typography>
        </Box>
      </Card>

      {/* Bio */}
      <Card className="ipt-section-card">
        <Typography className="ipt-section-title">About Me</Typography>
        <TextField
          multiline
          minRows={3}
          fullWidth
          size="small"
          placeholder="Write a short bio — your interests, goals, skills..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          inputProps={{ maxLength: 500 }}
          helperText={`${bio.length}/500`}
          className="ipt-bio-field"
        />
      </Card>

      {/* Profile Links */}
      <Card className="ipt-section-card">
        <Box className="ipt-section-header">
          <Typography className="ipt-section-title">Profile Links</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addLink} className="ipt-add-link-btn">
            Add Link
          </Button>
        </Box>

        {links.length === 0 ? (
          <Box className="ipt-links-empty">
            <LinkIcon className="ipt-links-empty-icon" />
            <Typography className="ipt-links-empty-text">
              Add your LinkedIn, GitHub, HackerRank, LeetCode or any other profile links
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {links.map((link, idx) => (
              <Box key={idx} className="ipt-link-row">
                <TextField
                  select
                  size="small"
                  value={link.platform}
                  onChange={e => updateLink(idx, 'platform', e.target.value)}
                  className="ipt-platform-select"
                >
                  {PLATFORM_OPTIONS.map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={`https://www.${link.platform.toLowerCase()}.com/in/yourprofile`}
                  value={link.url}
                  onChange={e => updateLink(idx, 'url', e.target.value)}
                  className="ipt-url-field"
                />
                <IconButton size="small" onClick={() => removeLink(idx)} className="ipt-remove-link-btn">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      {/* Save */}
      <Box className="ipt-save-row">
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          className="ipt-save-btn"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>
    </Box>
  );
};

export default InternProfileTab;
