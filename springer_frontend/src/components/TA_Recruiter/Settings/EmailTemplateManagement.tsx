import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, TextField, Typography, Stack, Button, IconButton,
  CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { emailTemplateApi } from '../../../services/emailtemplate.api';
import { useNavbarAction } from '../../../contexts/NavbarActionContext';
import { showToast } from '../../../utils/toast';
import type { EmailTemplateRequest, EmailTemplateResponse, EmailTemplateUpdateRequest } from '../../../types/Common/emailTemplate.types';
import '../../../css/TA_Recruiter/Settings/EmailTemplateManagement.css';

const resolveImagePaths = (html: string): string =>
  html
    .replace(/src=['"]cid-right-logo['"]/gi, 'src="/right-logo.png"')
    .replace(/src=['"]cid-signature['"]/gi, 'src="/siganture.png"')
    .replace(/src=['"]cid-kanini-logo['"]/gi, 'src="/kanini.png"')
    .replace(/src=['"]cid-kanini['"]/gi, 'src="/kanini.png"');

// Converts Quill class-based alignment/indent into inline styles so formatting
// survives outside the editor (DB storage, preview, email clients).
const sanitizeQuillOutput = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  (['center', 'right', 'justify'] as const).forEach((align) => {
    doc.querySelectorAll(`.ql-align-${align}`).forEach((el) => {
      (el as HTMLElement).style.textAlign = align;
      el.classList.remove(`ql-align-${align}`);
      if (!el.className) el.removeAttribute('class');
    });
  });
  for (let i = 1; i <= 8; i++) {
    doc.querySelectorAll(`.ql-indent-${i}`).forEach((el) => {
      (el as HTMLElement).style.paddingLeft = `${i * 3}em`;
      el.classList.remove(`ql-indent-${i}`);
      if (!el.className) el.removeAttribute('class');
    });
  }
  return doc.body.innerHTML;
};

const QUILL_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
  ['link', 'image'],
  [{ align: [] }],
  ['clean'],
];

const EmailTemplateManagement = () => {
  const { setAction } = useNavbarAction();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplateResponse[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateResponse | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  const [templateName, setTemplateName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState<'text' | 'html'>('text');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const quillRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);
  const initialBodyRef = useRef<string>('');

  // Initialize Quill once when dialog opens; clean up when it closes
  useEffect(() => {
    if (!dialogOpen) {
      quillInstance.current = null;
      if (quillRef.current) quillRef.current.innerHTML = '';
      return;
    }

    const timer = setTimeout(() => {
      if (!quillRef.current || quillInstance.current) return;

      quillRef.current.innerHTML = '';
      quillInstance.current = new Quill(quillRef.current, {
        theme: 'snow',
        modules: { toolbar: QUILL_TOOLBAR },
        placeholder: 'Enter email body content with formatting...',
      });

      const toolbar = quillInstance.current.getModule('toolbar') as {
        addHandler: (type: string, handler: () => void) => void;
      };
      toolbar.addHandler('image', () => setImageSelectorOpen(true));

      if (initialBodyRef.current) {
        const clipboard = quillInstance.current.getModule('clipboard') as {
          dangerouslyPasteHTML: (html: string) => void;
        };
        clipboard.dangerouslyPasteHTML(resolveImagePaths(initialBodyRef.current));
      }

      quillInstance.current.on('text-change', () => {
        if (!quillInstance.current) return;
        const raw = quillInstance.current.root.innerHTML;
        setBody(raw === '<p><br></p>' ? '' : sanitizeQuillOutput(raw));
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [dialogOpen]);

  // Sync content when switching body types
  useEffect(() => {
    if (!dialogOpen) return;
    if (bodyType === 'text' && quillInstance.current && body) {
      const clipboard = quillInstance.current.getModule('clipboard') as {
        dangerouslyPasteHTML: (html: string) => void;
      };
      clipboard.dangerouslyPasteHTML(resolveImagePaths(body));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyType, dialogOpen]);

  // Insert image from selector into Quill
  const insertImageIntoQuill = useCallback((imageUrl: string) => {
    if (quillInstance.current) {
      const range = quillInstance.current.getSelection();
      const index = range ? range.index : quillInstance.current.getLength() - 1;
      quillInstance.current.insertEmbed(index, 'image', imageUrl);
    }
    setImageSelectorOpen(false);
    setCustomImageUrl('');
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await emailTemplateApi.getAllEmailTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        showToast(response.message || 'Failed to load email templates', 'error');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(err?.response?.data?.message ?? err?.message ?? 'Failed to load email templates', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Auto-select first template on load; keep selectedTemplate object in sync
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].templateId);
      return;
    }
    setSelectedTemplate(templates.find(t => t.templateId === selectedTemplateId) ?? null);
  }, [templates, selectedTemplateId]);

  const openAddDialog = () => {
    setEditMode(false);
    setTemplateName('');
    setSubject('');
    setBody('');
    initialBodyRef.current = '';
    setBodyType('text');
    setDialogOpen(true);
  };

  useEffect(() => {
    setAction({
      label: 'Add Template',
      onClick: openAddDialog,
      icon: <AddIcon className="email-template-navbar-icon" />,
    });
    return () => setAction(null);
  }, [setAction]);

  const openEditDialog = () => {
    if (!selectedTemplate) return;
    setEditMode(true);
    setTemplateName(selectedTemplate.templateName);
    setSubject(selectedTemplate.subject);
    setBody(selectedTemplate.body);
    initialBodyRef.current = selectedTemplate.body;
    // Auto-detect body type: if it looks like raw HTML (has DOCTYPE or <html>), set to html mode
    const isRawHtml = /<!DOCTYPE|<html/i.test(selectedTemplate.body);
    setBodyType(isRawHtml ? 'html' : 'text');
    
    // Small delay to ensure focus transition happens cleanly
    setTimeout(() => {
      setDialogOpen(true);
    }, 0);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setTemplateName('');
    setSubject('');
    setBody('');
    initialBodyRef.current = '';
    setBodyType('text');
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) return showToast('Template name is required', 'error');
    if (!subject.trim()) return showToast('Subject is required', 'error');
    if (!body.trim()) return showToast('Body is required', 'error');

    setSaving(true);
    try {
      if (editMode && selectedTemplate) {
        const data: EmailTemplateUpdateRequest = {
          templateName: templateName.trim(),
          subject: subject.trim(),
          body: body.trim(),
        };
        const res = await emailTemplateApi.updateEmailTemplate(selectedTemplate.templateId, data);
        if (res.success) {
          showToast('Email template updated successfully', 'success');
          await fetchTemplates();
          setSelectedTemplateId(selectedTemplate.templateId);
          closeDialog();
        } else {
          showToast(res.message || 'Failed to update template', 'error');
        }
      } else {
        const data: EmailTemplateRequest = {
          templateName: templateName.trim(),
          subject: subject.trim(),
          body: body.trim(),
        };
        const res = await emailTemplateApi.createEmailTemplate(data);
        if (res.success) {
          showToast('Email template created successfully', 'success');
          await fetchTemplates();
          if (res.data) setSelectedTemplateId(res.data.templateId);
          closeDialog();
        } else {
          showToast(res.message || 'Failed to create template', 'error');
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const fallback = editMode ? 'Failed to update template' : 'Failed to create template';
      showToast(err?.response?.data?.message ?? err?.message ?? fallback, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = () => {
    if (!selectedTemplate) return;
    setTimeout(() => setDeleteDialogOpen(true), 0);
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setDeleting(true);
    try {
      const res = await emailTemplateApi.deleteEmailTemplate(selectedTemplate.templateId);
      if (res.success) {
        showToast('Email template deleted successfully', 'success');
        setSelectedTemplateId('');
        await fetchTemplates();
        setDeleteDialogOpen(false);
      } else {
        showToast(res.message || 'Failed to delete template', 'error');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(err?.response?.data?.message ?? err?.message ?? 'Failed to delete template', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box className="t-page settings-page-override">
      <Card className="t-card settings-card-override">

        <Box className="t-separator" />

        {/* Body */}
        <Box className="t-body">
          {loading ? (
            <Box className="t-loading">
              <CircularProgress size={32} className="email-template-loading-spinner" />
              <Typography className="t-loading-text">Loading templates...</Typography>
            </Box>
          ) : templates.length === 0 ? (
            <Alert severity="info">
              No email templates yet. Click "Add Template" to create one.
            </Alert>
          ) : (
            <>
              {/* Template Selector */}
              <Box className="email-template-selector-section">
                <FormControl size="small" className="email-template-dropdown">
                  <InputLabel>Select Template</InputLabel>
                  <Select
                    value={selectedTemplateId}
                    label="Select Template"
                    onChange={(e) => setSelectedTemplateId(e.target.value as number)}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.templateId} value={template.templateId}>
                        {template.templateName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Template Preview */}
              {selectedTemplate && (
                <Card className="email-template-preview-card">
                  <Box className="email-template-preview-body">
                    <Box className="email-template-field-group">
                      <Stack direction="row" alignItems="center" justifyContent="space-between" className="et-subject-row">
                        <Typography className="email-template-field-label">Subject</Typography>
                          <Stack direction="row" className="et-action-btn-row">
                          <IconButton
                            size="small"
                            className="email-template-action-btn"
                            onClick={openEditDialog}
                            onMouseDown={(e) => e.currentTarget.blur()}
                            title="Edit Template"
                          >
                            <EditIcon className="email-template-edit-icon" />
                          </IconButton>
                          <IconButton
                            size="small"
                            className="email-template-action-btn email-template-delete-btn"
                            onClick={openDeleteDialog}
                            onMouseDown={(e) => e.currentTarget.blur()}
                            title="Delete Template"
                          >
                            <DeleteIcon className="email-template-delete-icon" />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Box className="email-template-field-content">
                        <Typography className="email-template-subject-text">
                          {selectedTemplate.subject}
                        </Typography>
                      </Box>
                    </Box>

                    <Box className="email-template-field-group">
                      <Typography className="email-template-field-label">Email Body</Typography>
                      <Box 
                        className="email-template-field-content email-template-body-content"
                        dangerouslySetInnerHTML={{ __html: resolveImagePaths(selectedTemplate.body) }}
                      />
                    </Box>
                  </Box>
                </Card>
              )}
            </>
          )}
        </Box>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog} 
        maxWidth="md" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography className="email-template-dialog-title">
              {editMode ? 'Edit Email Template' : 'Add Email Template'}
            </Typography>
            <IconButton size="small" onClick={closeDialog}>
              <CloseIcon className="email-template-dialog-close-icon" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack className="et-dialog-form-stack">
            <Stack direction="row" className="et-form-row">
              <TextField
                size="small"
                label="Template Name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Interview Invitation, Offer Letter"
                inputProps={{ maxLength: 255 }}
                className="email-template-name-field"
              />
                          <FormControl size="small" className="email-template-body-type-field">
                <InputLabel>Body Type</InputLabel>
                <Select
                  value={bodyType}
                  label="Body Type"
                  onChange={(e) => setBodyType(e.target.value as 'text' | 'html')}
                >
                  <MenuItem value="text">Rich Text Editor</MenuItem>
                  <MenuItem value="html">Raw HTML</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              size="small"
              fullWidth
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              inputProps={{ maxLength: 500 }}
            />
            <Box>
              <Typography className="email-template-field-label-dialog">
                Email Body {bodyType === 'html' ? '(Raw HTML)' : '(Rich Text)'}
              </Typography>
              {/* Always render both, show/hide via CSS to prevent Quill re-mount */}
              <Box className={bodyType === 'html' ? 'email-template-editor-hidden' : ''}>
                <div ref={quillRef} className="email-template-quill-editor" />
              </Box>
              <Box className={bodyType === 'text' ? 'email-template-editor-hidden' : ''}>
                <TextField
                  multiline
                  fullWidth
                  minRows={12}
                  maxRows={20}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Paste your raw HTML email template here..."
                  className="email-template-html-textarea"
                />
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions className="email-template-dialog-actions">
          <Button
            variant="outlined"
            onClick={closeDialog}
            disabled={saving}
            className="t-dialog-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            className="t-dialog-confirm-btn"
          >
            {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography className="email-template-dialog-title">
              Delete Email Template
            </Typography>
            <IconButton size="small" onClick={() => setDeleteDialogOpen(false)}>
              <CloseIcon className="email-template-dialog-close-icon" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography className="t-body-text">
            Are you sure you want to delete the template "{selectedTemplate?.templateName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="email-template-dialog-actions">
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            className="t-dialog-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            className="email-template-delete-confirm-btn"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Selector Modal */}
      <Dialog 
        open={imageSelectorOpen} 
        onClose={() => setImageSelectorOpen(false)} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography className="email-template-dialog-title">
              Insert Image
            </Typography>
            <IconButton size="small" onClick={() => setImageSelectorOpen(false)}>
              <CloseIcon className="email-template-dialog-close-icon" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack className="et-image-selector-stack">
            <Typography className="email-template-field-label-dialog">
              Select from available images:
            </Typography>
            <Box className="email-template-image-grid">
              <Card 
                className="email-template-image-card"
                onClick={() => insertImageIntoQuill('/siganture.png')}
              >
                <Box className="email-template-image-preview">
                  <img src="/siganture.png" alt="Signature" />
                </Box>
                <Typography className="email-template-image-label">
                  Signature
                </Typography>
              </Card>
              <Card 
                className="email-template-image-card"
                onClick={() => insertImageIntoQuill('/kanini.png')}
              >
                <Box className="email-template-image-preview">
                  <img src="/kanini.png" alt="Kanini Icon" />
                </Box>
                <Typography className="email-template-image-label">
                  Kanini Icon
                </Typography>
              </Card>
            </Box>
            <Typography className="email-template-field-label-dialog email-template-custom-url-label">
              Or enter a custom URL:
            </Typography>
            <TextField
              size="small"
              fullWidth
              value={customImageUrl}
              onChange={(e) => setCustomImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customImageUrl.trim()) {
                  insertImageIntoQuill(customImageUrl.trim());
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions className="email-template-dialog-actions">
          <Button
            variant="outlined"
            onClick={() => setImageSelectorOpen(false)}
            className="t-dialog-cancel-btn"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplateManagement;