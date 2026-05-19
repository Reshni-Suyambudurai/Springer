import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button, LinearProgress, Chip } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  HourglassEmpty as PendingIcon,
  Description as DocIcon,
  ErrorOutline as ErrorIcon,
  Visibility as ViewIcon,
  SwapHoriz as ChangeIcon,
} from '@mui/icons-material';
import { FigmaApproveIcon as CheckIcon, FigmaRejectIcon as RejectIcon } from '../components/Common/FigmaIcons';
import { documentSubmissionApi, documentSubmissionPageApi } from '../services/document.api';
import { showToast } from '../utils/toast';
import type { DocumentStatusDTO, DocumentSubmissionStatusResponse } from '../types/DocumentCollection/document.types';
import '../css/pages/DocumentSubmitPage.css';

const STATUS_PRIORITY: Record<string, number> = {
  APPROVED: 4,
  COLLECTED: 3,
  REJECTED: 2,
  PENDING: 1,
};

const normalizeStatus = (status: string): string => {
  const normalized = (status || '').toUpperCase();
  const aliases: Record<string, string> = {
    SUBMITTED: 'COLLECTED',
    UPLOADED: 'COLLECTED',
    IN_REVIEW: 'COLLECTED',
    UNDER_REVIEW: 'COLLECTED',
    VERIFIED: 'APPROVED',
    DECLINED: 'REJECTED',
    NOT_UPLOADED: 'PENDING',
    REQUIRED: 'PENDING',
  };
  return aliases[normalized] || normalized || 'PENDING';
};

const toTime = (value: string | null | undefined): number => {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

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
        // Deduplicate documents — keep latest per documentTypeId
        const deduped = deduplicateDocs(res.data.documents);
        setStatus({ ...res.data, documents: deduped });
      } else {
        setError('Unable to load your document checklist. The link may be expired or invalid.');
      }
    } catch (err: any) {
      setError(err.message || 'This link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // Merge duplicate rows from backend so each required doc type appears once.
  const deduplicateDocs = (docs: DocumentStatusDTO[]): DocumentStatusDTO[] => {
    const map = new Map<number, DocumentStatusDTO>();
    docs.forEach(rawDoc => {
      const doc: DocumentStatusDTO = {
        ...rawDoc,
        status: normalizeStatus(rawDoc.status),
      };
      const existing = map.get(doc.documentTypeId);

      if (!existing) {
        map.set(doc.documentTypeId, doc);
      } else {
        const statusDiff = (STATUS_PRIORITY[doc.status] || 0) - (STATUS_PRIORITY[existing.status] || 0);
        const docTime = toTime(doc.uploadedAt);
        const existingTime = toTime(existing.uploadedAt);
        const isNewer = docTime > existingTime;

        if (statusDiff > 0 || (statusDiff === 0 && isNewer)) {
          map.set(doc.documentTypeId, doc);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.documentType.localeCompare(b.documentType));
  };

  const handleUploadClick = (docTypeId: number) => {
    setActiveDocTypeId(docTypeId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDocTypeId) return;
    e.target.value = '';

    if (file.size > 10 * 1024 * 1024) { showToast('File size must be under 10MB', 'error'); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) { showToast('Only PDF, JPG, PNG files are allowed', 'error'); return; }

    try {
      setUploadingDocTypeId(activeDocTypeId);
      const res = await documentSubmissionPageApi.uploadDocument(activeDocTypeId, file, token);
      if (res.success) {
        showToast('Document uploaded successfully!', 'success');
        fetchStatus();
      }
    } catch (err: any) {
      showToast(err.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploadingDocTypeId(null);
      setActiveDocTypeId(null);
    }
  };

  const handleViewDocument = async (documentId: number) => {
    try {
      await documentSubmissionApi.openFile(documentId);
    } catch {
      showToast('Unable to open document. Please try again.', 'error');
    }
  };

  const getDocIcon = (doc: DocumentStatusDTO) => {
    if (uploadingDocTypeId === doc.documentTypeId) return <CircularProgress size={20} sx={{ color: 'var(--color-primary)' }} />;
    switch (doc.status) {
      case 'APPROVED':  return <CheckIcon className="dsub-doc-icon dsub-doc-icon--approved" />;
      case 'REJECTED':  return <RejectIcon className="dsub-doc-icon dsub-doc-icon--rejected" />;
      case 'COLLECTED': return <PendingIcon className="dsub-doc-icon dsub-doc-icon--pending" />;
      default:          return <DocIcon className="dsub-doc-icon dsub-doc-icon--default" />;
    }
  };

  const getStatusChip = (doc: DocumentStatusDTO) => {
    if (uploadingDocTypeId === doc.documentTypeId) {
      return <Chip label="Uploading..." size="small" className="dsub-chip dsub-chip--uploading" />;
    }
    const map: Record<string, { label: string; cls: string }> = {
      APPROVED:  { label: '✓ Approved',      cls: 'dsub-chip--approved' },
      REJECTED:  { label: '✗ Rejected',      cls: 'dsub-chip--rejected' },
      COLLECTED: { label: '⏳ Under Review',  cls: 'dsub-chip--review' },
      PENDING:   { label: 'Upload Required', cls: 'dsub-chip--pending' },
    };
    const cfg = map[doc.status] || { label: doc.status, cls: '' };
    return <Chip label={cfg.label} size="small" className={`dsub-chip ${cfg.cls}`} />;
  };

  const canUpload = (doc: DocumentStatusDTO) => doc.status === 'PENDING';
  const canChange = (doc: DocumentStatusDTO) => doc.status === 'COLLECTED' || doc.status === 'REJECTED';
  const canView = (doc: DocumentStatusDTO) => {
    const hasDocumentId = typeof doc.documentId === 'number' && doc.documentId > 0;
    const viewableStatus = doc.status === 'COLLECTED' || doc.status === 'APPROVED' || doc.status === 'REJECTED';
    return viewableStatus && hasDocumentId;
  };

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
          <Typography className="dsub-error-hint">Please contact your recruiter to get a new submission link.</Typography>
        </Box>
      </Box>
    );
  }

  if (!status) return null;

  const allDone = status.documents.every(d => d.status === 'APPROVED');
  const approved = status.documents.filter(d => d.status === 'APPROVED').length;
  const total = status.documents.length;
  // Calculate progress from frontend — don't trust backend completionPercentage
  const progressPct = total > 0 ? Math.round((approved / total) * 100) : 0;
  const hasRejected = status.documents.some(d => d.status === 'REJECTED');

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
              <Typography className="dsub-progress-pct">{progressPct}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              className={`dsub-progress-bar ${allDone ? 'dsub-progress-bar--complete' : ''}`}
            />
          </Box>

          {/* Rejected Banner */}
          {hasRejected && !allDone && (
            <Box className="dsub-rejected-banner">
              <RejectIcon className="dsub-rejected-banner-icon" />
              <Box>
                <Typography className="dsub-rejected-banner-title">Some documents were rejected</Typography>
                <Typography className="dsub-rejected-banner-sub">Please re-upload the rejected documents below.</Typography>
              </Box>
            </Box>
          )}

          {/* All Done Banner */}
          {allDone && (
            <Box className="dsub-done-banner">
              <CheckIcon className="dsub-done-icon" />
              <Box>
                <Typography className="dsub-done-title">All documents verified!</Typography>
                <Typography className="dsub-done-sub">Your recruiter will be in touch with the next steps.</Typography>
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
                    <Typography className="dsub-doc-name">{doc.documentType.replace(/_/g, ' ')}</Typography>
                    {doc.status === 'REJECTED' && doc.rejectionReason && (
                      <Typography className="dsub-doc-rejection">
                        ⚠ {doc.rejectionReason}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box className="dsub-doc-right">
                  {getStatusChip(doc)}

                  {/* View button — for uploaded/approved/rejected docs */}
                  {canView(doc) && uploadingDocTypeId !== doc.documentTypeId && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => {
                        if (typeof doc.documentId === 'number') {
                          handleViewDocument(doc.documentId);
                        }
                      }}
                      className="dsub-view-btn"
                    >
                      View
                    </Button>
                  )}

                  {/* Upload button — for pending docs */}
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
                      className="dsub-upload-btn"
                    >
                      {uploadingDocTypeId === doc.documentTypeId ? 'Uploading...' : 'Upload'}
                    </Button>
                  )}

                  {/* Change button — for collected/rejected docs */}
                  {canChange(doc) && uploadingDocTypeId !== doc.documentTypeId && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ChangeIcon />}
                      onClick={() => handleUploadClick(doc.documentTypeId)}
                      className={`dsub-change-btn ${doc.status === 'REJECTED' ? 'dsub-change-btn--rejected' : ''}`}
                    >
                      {doc.status === 'REJECTED' ? 'Re-upload' : 'Change'}
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
              <li>Use <strong>Change</strong> to replace an uploaded document before review</li>
              <li>If a document is rejected, use <strong>Re-upload</strong> to submit a corrected version</li>
              <li>Contact your recruiter if you face any issues</li>
            </ul>
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default DocumentSubmitPage;
