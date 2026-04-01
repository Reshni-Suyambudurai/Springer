import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, LinearProgress, Chip } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  Description as DocIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { documentSubmissionPageApi } from '../services/document.api';
import { showToast } from '../utils/toast';
import type { DocumentStatusDTO, DocumentSubmissionStatusResponse } from '../types/DocumentCollection/document.types';
import '../css/pages/DocumentSubmitPage.css';

const DocumentSubmitPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<DocumentSubmissionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocTypeId, setUploadingDocTypeId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocTypeId, setActiveDocTypeId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { setError('Invalid link — no token found.'); setLoading(false); return; }
    fetchStatus();
  }, [token]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await documentSubmissionPageApi.getSubmissionStatus(token);
      if (res.success && res.data) {
        setStatus(res.data);
      } else {
        setError('Unable to load your document checklist. The link may be expired or invalid.');
      }
    } catch (err: any) {
      setError(err.message || 'This link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (docTypeId: number) => {
    setActiveDocTypeId(docTypeId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocTypeId) return;

    // Reset input so same file can be re-selected
    e.target.value = '';

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be under 10MB', 'error');
      return;
    }

    // Validate file type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      showToast('Only PDF, JPG, PNG files are allowed', 'error');
      return;
    }

    try {
      setUploadingDocTypeId(activeDocTypeId);
      const res = await documentSubmissionPageApi.uploadDocument(activeDocTypeId, file, token);
      if (res.success) {
        showToast('Document uploaded successfully!', 'success');
        fetchStatus(); // Refresh status
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploadingDocTypeId(null);
      setActiveDocTypeId(null);
    }
  };

  const getDocIcon = (doc: DocumentStatusDTO) => {
    switch (doc.status) {
      case 'APPROVED':  return <CheckIcon className="dsub-doc-icon dsub-doc-icon--approved" />;
      case 'REJECTED':  return <RejectIcon className="dsub-doc-icon dsub-doc-icon--rejected" />;
      case 'COLLECTED': return <PendingIcon className="dsub-doc-icon dsub-doc-icon--pending" />;
      default:          return <DocIcon className="dsub-doc-icon dsub-doc-icon--default" />;
    }
  };

  const getStatusChip = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      APPROVED:  { label: '✓ Approved',      cls: 'dsub-chip--approved' },
      REJECTED:  { label: '✗ Rejected',      cls: 'dsub-chip--rejected' },
      COLLECTED: { label: '⏳ Under Review',  cls: 'dsub-chip--review' },
      PENDING:   { label: 'Upload Required', cls: 'dsub-chip--pending' },
    };
    const cfg = map[status] || { label: status, cls: '' };
    return <Chip label={cfg.label} size="small" className={`dsub-chip ${cfg.cls}`} />;
  };

  const canUpload = (doc: DocumentStatusDTO) =>
    doc.status === 'PENDING' || doc.status === 'REJECTED';

  // ── Render States ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box className="dsub-fullpage">
        <Box className="dsub-center">
          <CircularProgress size={40} className="dsub-spinner" />
          <Typography className="dsub-loading-text">Loading your document checklist...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="dsub-fullpage">
        <Box className="dsub-center">
          <ErrorIcon className="dsub-error-icon" />
          <Typography className="dsub-error-title">Link Invalid or Expired</Typography>
          <Typography className="dsub-error-desc">{error}</Typography>
          <Typography className="dsub-error-hint">
            Please contact your recruiter to get a new submission link.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!status) return null;

  const allDone = status.documents.every(d => d.status === 'APPROVED');
  const approved = status.documents.filter(d => d.status === 'APPROVED').length;
  const total = status.documents.length;

  return (
    <Box className="dsub-page">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Header */}
      <Box className="dsub-header">
        <Box className="dsub-logo">
          <Typography className="dsub-logo-text">Springer</Typography>
          <Typography className="dsub-logo-sub">by Kanini</Typography>
        </Box>
      </Box>

      {/* Main Content */}
      <Box className="dsub-content">
        <Box className="dsub-card">

          {/* Welcome */}
          <Box className="dsub-welcome">
            <Box className="dsub-avatar">
              {status.candidateName?.charAt(0).toUpperCase()}
            </Box>
            <Box>
              <Typography className="dsub-welcome-title">
                Hello, {status.candidateName?.split(' ')[0]}! 👋
              </Typography>
              <Typography className="dsub-welcome-sub">
                Please upload the required documents below to complete your onboarding process.
              </Typography>
            </Box>
          </Box>

          {/* Progress */}
          <Box className="dsub-progress-section">
            <Box className="dsub-progress-header">
              <Typography className="dsub-progress-label">
                {allDone ? '🎉 All documents approved!' : `${approved} of ${total} documents approved`}
              </Typography>
              <Typography className="dsub-progress-pct">{status.completionPercentage}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={status.completionPercentage}
              className={`dsub-progress-bar ${allDone ? 'dsub-progress-bar--complete' : ''}`}
            />
          </Box>

          {/* All Done Banner */}
          {allDone && (
            <Box className="dsub-done-banner">
              <CheckIcon className="dsub-done-icon" />
              <Box>
                <Typography className="dsub-done-title">All documents verified!</Typography>
                <Typography className="dsub-done-sub">
                  Your recruiter will be in touch with the next steps.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Document List */}
          <Box className="dsub-doc-list">
            <Typography className="dsub-doc-list-title">Required Documents</Typography>

            {status.documents.map((doc) => (
              <Box
                key={doc.documentTypeId}
                className={`dsub-doc-item ${doc.status === 'REJECTED' ? 'dsub-doc-item--rejected' : ''} ${doc.status === 'APPROVED' ? 'dsub-doc-item--approved' : ''}`}
              >
                <Box className="dsub-doc-left">
                  {getDocIcon(doc)}
                  <Box>
                    <Typography className="dsub-doc-name">{doc.documentType}</Typography>
                    {doc.status === 'REJECTED' && doc.rejectionReason && (
                      <Typography className="dsub-doc-rejection">
                        ⚠ Rejected: {doc.rejectionReason}
                      </Typography>
                    )}
                    {doc.status === 'COLLECTED' && (
                      <Typography className="dsub-doc-hint">Uploaded — awaiting review</Typography>
                    )}
                    {doc.status === 'APPROVED' && (
                      <Typography className="dsub-doc-approved-text">Verified ✓</Typography>
                    )}
                  </Box>
                </Box>

                <Box className="dsub-doc-right">
                  {getStatusChip(doc.status)}
                  {canUpload(doc) && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        uploadingDocTypeId === doc.documentTypeId
                          ? <CircularProgress size={14} className="dsub-upload-spinner" />
                          : <UploadIcon />
                      }
                      onClick={() => handleUploadClick(doc.documentTypeId)}
                      disabled={uploadingDocTypeId === doc.documentTypeId}
                      className={`dsub-upload-btn ${doc.status === 'REJECTED' ? 'dsub-upload-btn--reupload' : ''}`}
                    >
                      {uploadingDocTypeId === doc.documentTypeId
                        ? 'Uploading...'
                        : doc.status === 'REJECTED' ? 'Re-upload' : 'Upload'}
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Expiry Notice */}
          {status.linkExpiryDate && (
            <Box className="dsub-expiry">
              <Typography className="dsub-expiry-text">
                🕐 This link expires on{' '}
                {new Date(status.linkExpiryDate).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </Typography>
            </Box>
          )}

          {/* Instructions */}
          <Box className="dsub-instructions">
            <Typography className="dsub-instructions-title">Instructions</Typography>
            <ul className="dsub-instructions-list">
              <li>Upload clear, readable scans or photos</li>
              <li>Accepted formats: PDF, JPG, PNG (max 10MB)</li>
              <li>If a document is rejected, re-upload a corrected version</li>
              <li>Contact your recruiter if you face any issues</li>
            </ul>
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default DocumentSubmitPage;
