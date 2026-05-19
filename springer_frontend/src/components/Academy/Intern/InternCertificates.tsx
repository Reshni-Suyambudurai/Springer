import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, Typography, Button, CircularProgress,
  Stack, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Visibility as ViewIcon,
  WorkspacePremium as CertIcon,
} from '@mui/icons-material';
import { FigmaDeleteIcon as DeleteIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { internApi } from '../../../services/intern.api';
import { handleAxiosError } from '../../../services/api.error';
import { showToast } from '../../../utils/toast';
import type { InternCertificateResponse, InternDashboardData } from '../../../types/Academy/intern.types';
import '../../../css/Academy/Intern/InternCertificates.css';

const InternCertificates = ({ data }: { data: InternDashboardData }) => {
  const { studentId } = data;

  const [certificates, setCertificates] = useState<InternCertificateResponse[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; certId: number | null; certName: string }>({
    open: false, certId: null, certName: '',
  });

  // Upload form state
  const [uploadDialog, setUploadDialog] = useState(false);
  const [certName, setCertName]         = useState('');
  const [issuer, setIssuer]             = useState('');
  const [issueDate, setIssueDate]       = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchCertificates(); }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await internApi.getCertificates(studentId);
      if (res.success && res.data) setCertificates(res.data);
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('File size must be under 5MB', 'error'); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) { showToast('Only PDF, JPG, PNG files are allowed', 'error'); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!certName.trim()) { showToast('Certificate name is required', 'error'); return; }
    if (!issuer.trim()) { showToast('Issuer is required', 'error'); return; }
    if (!selectedFile) { showToast('Please select a file', 'error'); return; }
    if (issueDate && issueDate > new Date().toISOString().split('T')[0]) {
      showToast('Issue date cannot be in the future', 'error'); return;
    }
    try {
      setUploading(true);
      const res = await internApi.uploadCertificate(
        studentId, certName.trim(), issuer.trim(), issueDate || null, selectedFile
      );
      if (res.success) {
        showToast('Certificate uploaded successfully!', 'success');
        setUploadDialog(false);
        resetForm();
        fetchCertificates();
      }
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.certId) return;
    try {
      await internApi.deleteCertificate(deleteDialog.certId, studentId);
      showToast('Certificate deleted', 'success');
      setDeleteDialog({ open: false, certId: null, certName: '' });
      fetchCertificates();
    } catch (error) {
      const err = handleAxiosError(error);
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const resetForm = () => {
    setCertName(''); setIssuer(''); setIssueDate(''); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <Box className="inc-loading">
        <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  return (
    <Box className="inc-page">

      {/* Header */}
      <Box className="inc-header">
        <Typography className="inc-header-title">My Certificates</Typography>
        <Button variant="contained" startIcon={<UploadIcon />}
          onClick={() => { resetForm(); setUploadDialog(true); }}
          className="inc-upload-btn">
          Upload Certificate
        </Button>
      </Box>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Certificate Cards */}
      {certificates.length === 0 ? (
        <Box className="inc-empty">
          <CertIcon className="inc-empty-icon" />
          <Typography className="inc-empty-title">No certificates yet</Typography>
          <Typography className="inc-empty-sub">
            Upload certificates you've earned — AWS, Google, Udemy, HackerRank, etc.
          </Typography>
        </Box>
      ) : (
        <Box className="inc-grid">
          {certificates.map(cert => (
            <Card key={cert.certificateId} className="inc-card">
              <Box className="inc-card-icon-wrap">
                <CertIcon className="inc-card-icon" />
              </Box>
              <Box className="inc-card-body">
                <Typography className="inc-card-name">{cert.certificateName}</Typography>
                <Typography className="inc-card-issuer">{cert.issuer}</Typography>
                <Typography className="inc-card-date">
                  {cert.issueDate ? `Issued: ${fmt(cert.issueDate)}` : `Uploaded: ${fmt(cert.uploadedAt)}`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} className="inc-card-actions">
                <IconButton size="small" title="View" className="inc-action-view"
                  onClick={async () => {
                    try {
                      await internApi.openCertificate(cert.certificateId);
                    } catch {
                      showToast('Failed to open certificate', 'error');
                    }
                  }}>
                  <ViewIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" title="Delete" className="inc-action-delete"
                  onClick={() => setDeleteDialog({ open: true, certId: cert.certificateId, certName: cert.certificateName })}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Card>
          ))}
        </Box>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="inc-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Upload Certificate
          <IconButton size="small" onClick={() => setUploadDialog(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Certificate Name *" size="small" fullWidth
              value={certName} onChange={e => setCertName(e.target.value)}
              placeholder="e.g. AWS Cloud Practitioner"
              inputProps={{ maxLength: 200 }}
              helperText={`${certName.length}/200`} />
            <TextField label="Issuer *" size="small" fullWidth
              value={issuer} onChange={e => setIssuer(e.target.value)}
              placeholder="e.g. Amazon Web Services"
              inputProps={{ maxLength: 200 }}
              helperText={`${issuer.length}/200`} />
            <TextField label="Issue Date" type="date" size="small" fullWidth
              value={issueDate} onChange={e => setIssueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }} />
            <Box>
              <Button variant="outlined" size="small" startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}>
                {selectedFile ? selectedFile.name : 'Choose File (PDF / JPG / PNG, max 5MB)'}
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadDialog(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleUpload}
            disabled={uploading || !certName.trim() || !issuer.trim() || !selectedFile}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, certId: null, certName: '' })}
        maxWidth="xs" fullWidth>
        <DialogTitle className="inc-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Delete Certificate
          <IconButton size="small" onClick={() => setDeleteDialog({ open: false, certId: null, certName: '' })}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete <strong>{deleteDialog.certName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, certId: null, certName: '' })}
            variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleDelete}
            sx={{ background: 'var(--color-error) !important', textTransform: 'none', fontWeight: 600 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InternCertificates;
