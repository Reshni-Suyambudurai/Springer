import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Card, Typography, Stack, Button, TextField, Chip,
  CircularProgress, IconButton, Tooltip, Menu, MenuItem,
  Select, FormControl, InputLabel,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import copy from 'copy-to-clipboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import BackButton from './BackButton';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { emailTemplateApi } from '../../services/emailtemplate.api';
import { showToast } from '../../utils/toast';
import '../../css/Common/SendEmail.css';

// ── Module-level utilities ────────────────────────────────────────────────────

const resolveImagePaths = (html: string): string =>
  html
    .replace(/src=['"]cid-right-logo['"]/gi, 'src="/right-logo.png"')
    .replace(/src=['"]cid-signature['"]/gi,  'src="/siganture.png"')
    .replace(/src=['"]cid-kanini-logo['"]/gi,'src="/kanini.png"')
    .replace(/src=['"]cid-kanini['"]/gi,     'src="/kanini.png"');

const VISIBLE_CHIPS = 6;

// ── Props ─────────────────────────────────────────────────────────────────────

interface SendEmailProps {
  templateId?: number;
  templateIds?: number[];
  emailIds?: string[];
  onBack?: () => void;
}

interface SendEmailRouterState {
  templateId?: number;
  templateIds?: number[];
  emailIds: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────

const SendEmail: React.FC<SendEmailProps> = (props) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const routerState = location.state as SendEmailRouterState | null;

  // Resolve template IDs — support both single templateId and array templateIds
  const resolvedIds = useMemo<number[]>(() => {
    const propIds   = props.templateIds ?? (props.templateId ? [props.templateId] : []);
    const stateIds  = routerState?.templateIds ?? (routerState?.templateId ? [routerState.templateId] : []);
    return propIds.length > 0 ? propIds : stateIds;
  }, [props.templateIds, props.templateId, routerState?.templateIds, routerState?.templateId]);

  const emailIds = useMemo(
    () => props.emailIds ?? routerState?.emailIds ?? [],
    [props.emailIds, routerState?.emailIds],
  );
  const onBack = props.onBack ?? (() => navigate(-1));

  const [loading,        setLoading]        = useState(true);
  const [sending,        setSending]        = useState(false);
  const [templates,      setTemplates]      = useState<{ templateId: number; templateName: string; subject: string; body: string }[]>([]);
  const [selectedId,     setSelectedId]     = useState<number>(0);
  const [templateName,   setTemplateName]   = useState('');
  const [subject,        setSubject]        = useState('');
  const [attachments,     setAttachments]     = useState<File[]>([]);
  const [imageMenuAnchor, setImageMenuAnchor] = useState<HTMLElement | null>(null);
  const [fetchedContent,  setFetchedContent]  = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const handleCopyEmails = useCallback(() => {
    copy(emailIds.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [emailIds]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── TipTap editor ─────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      // StarterKit 3.x includes Underline — disable it here to avoid duplicate
      StarterKit.configure({ underline: false }),
      Underline,
      TextStyle,
      Color,
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width:  { default: null },
            height: { default: null },
          };
        },
      }).configure({ inline: true, allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),

    ],
    content: '',
    editorProps: {
      handlePaste(_view, event) {
        // Block any pasted images — they arrive as data: URLs which break email delivery
        const items = Array.from(event.clipboardData?.items ?? []);
        const hasImage = items.some((i) => i.type.startsWith('image/'));
        if (hasImage) {
          showToast('Pasted images are not supported — use images from the template', 'error');
          return true; // prevent default Quill/TipTap handling
        }
        // Also strip data: src images from pasted HTML
        const html = event.clipboardData?.getData('text/html') ?? '';
        if (/src=["']data:image/i.test(html)) {
          showToast('Pasted images are not supported — use images from the template', 'error');
          return true;
        }
        return false;
      },
    },
  });

  // ── Fetch templates ────────────────────────────────────────────────────────

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchTemplates = async () => {
      try {
        setLoading(true);
        let fetched: typeof templates = [];

        if (resolvedIds.length === 1) {
          const res = await emailTemplateApi.getEmailTemplateById(resolvedIds[0]);
          if (res.success && res.data) fetched = [res.data];
          else showToast(res.message || 'Failed to load email template', 'error');
        } else if (resolvedIds.length > 1) {
          const res = await emailTemplateApi.getEmailTemplatesByIds(resolvedIds);
          if (res.success && res.data) fetched = res.data;
          else showToast(res.message || 'Failed to load email templates', 'error');
        }

        setTemplates(fetched);
        if (fetched.length > 0) {
          const first = fetched[0];
          setSelectedId(first.templateId);
          setTemplateName(first.templateName);
          setSubject(first.subject);
          let content = resolveImagePaths(first.body);
          if (/<!DOCTYPE|<html/i.test(content)) {
            content = new DOMParser().parseFromString(content, 'text/html').body.innerHTML;
          }
          setFetchedContent(content);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        showToast(err?.response?.data?.message ?? err?.message ?? 'Failed to load email template', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [resolvedIds]);

  // Apply content once BOTH the editor instance and the fetched content are ready.
  useEffect(() => {
    if (!editor || !fetchedContent) return;
    editor.commands.setContent(fetchedContent, { emitUpdate: false });
    setFetchedContent(null);
  }, [editor, fetchedContent]);

  // ── Template selection change ─────────────────────────────────────────────

  const handleTemplateChange = useCallback((id: number) => {
    const t = templates.find(tmpl => tmpl.templateId === id);
    if (!t) return;
    setSelectedId(id);
    setTemplateName(t.templateName);
    setSubject(t.subject);
    let content = resolveImagePaths(t.body);
    if (/<!DOCTYPE|<html/i.test(content)) {
      content = new DOMParser().parseFromString(content, 'text/html').body.innerHTML;
    }
    if (editor) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [templates, editor]);

  // ── File attachment helpers ───────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = ''; // reset so same file can be re-selected
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!subject.trim())             return showToast('Subject is required', 'error');
    if (!editor || editor.isEmpty)   return showToast('Body is required', 'error');
    if (emailIds.length === 0)       return showToast('No recipients specified', 'error');

    const body = editor.getHTML();

    const form = new FormData();
    form.append(
      'request',
      new Blob(
        [JSON.stringify({ templateId: selectedId, templateName, subject: subject.trim(), body, emailIds })],
        { type: 'application/json' },
      ),
    );
    attachments.forEach((f) => form.append('attachments', f));

    setSending(true);
    try {
      const res = await emailTemplateApi.sendBulkEmail(form);
      if (res.success && res.data) {
        const { successCount, skippedCount } = res.data;
        showToast(
          `Emails sent! ${successCount} delivered${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
          'success',
        );
        onBack?.();
      } else {
        showToast(res.message || 'Failed to send emails', 'error');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(err?.response?.data?.message ?? err?.message ?? 'Failed to send emails', 'error');
    } finally {
      setSending(false);
    }
  };

  // ── Image insert helpers ─────────────────────────────────────────────────

  const insertImage = useCallback((src: string) => {
    setImageMenuAnchor(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor?.chain().focus().setImage({ src, width: '100', height: '100' } as any).run();
  }, [editor]);

  // ── Derived values (memoized) ─────────────────────────────────────────────

  const visibleEmails = useMemo(() => emailIds.slice(0, VISIBLE_CHIPS), [emailIds]);
  const hiddenCount   = useMemo(() => emailIds.length - VISIBLE_CHIPS, [emailIds]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box className="t-page">
      <Card className="t-card">
        {/* Header */}
        <Box className="t-header">
          <Stack direction="row" alignItems="center" className="se-header-left">
            <BackButton onClick={onBack} variant="header" />
            <Box className="t-icon-box">
              <EmailIcon className="se-header-icon" />
            </Box>
            <Stack className="se-title-stack">
              <Typography className="t-page-title">Send Email</Typography>
              <Typography className="t-page-subtitle">
                {loading
                  ? 'Loading template...'
                  : templates.length > 1
                    ? `${templates.length} templates available • ${emailIds.length} recipient${emailIds.length !== 1 ? 's' : ''}`
                    : `${templateName} • ${emailIds.length} recipient${emailIds.length !== 1 ? 's' : ''}`
                }
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className="t-separator" />

        {/* Body — se-body overrides t-body padding so the card fills edge-to-edge */}
        <Box className="t-body se-body">
          {loading ? (
            <Box className="se-loading-box">
              <CircularProgress size={32} className="se-spinner" />
              <Typography className="t-loading-text">Loading template...</Typography>
            </Box>
          ) : (
            <Card className="se-editor-card">
              <Box className="se-two-col-layout">

                {/* ── Left Panel: Template Selector + Subject + TipTap editor ── */}
                <Box className="se-left-panel">
                  <Box className="se-template-subject-row">
                    {templates.length > 1 && (
                      <FormControl size="small" className="se-template-select">
                        <InputLabel>Template</InputLabel>
                        <Select
                          label="Template"
                          value={selectedId}
                          onChange={(e) => handleTemplateChange(Number(e.target.value))}
                        >
                          {templates.map((t) => (
                            <MenuItem key={t.templateId} value={t.templateId}>
                              {t.templateName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    <TextField
                      size="small"
                      label="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      className="se-subject-field"
                    />
                  </Box>

                  <Box className="se-body-editor">
                    <Typography className="se-editor-label">Email Body (Editable)</Typography>

                    {/* TipTap toolbar */}
                    <Box className="se-tiptap-toolbar">
                      <Tooltip title="Bold"><IconButton size="small" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Italic"><IconButton size="small" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Underline"><IconButton size="small" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive('underline') ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatUnderlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Box className="se-toolbar-divider" />
                      <Tooltip title="Bullet list"><IconButton size="small" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Numbered list"><IconButton size="small" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
                      <Box className="se-toolbar-divider" />
                      <Tooltip title="Align left"><IconButton size="small" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={editor?.isActive({ textAlign: 'left' }) ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatAlignLeftIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Align center"><IconButton size="small" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={editor?.isActive({ textAlign: 'center' }) ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatAlignCenterIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Align right"><IconButton size="small" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={editor?.isActive({ textAlign: 'right' }) ? 'se-toolbar-btn-active' : 'se-toolbar-btn'}><FormatAlignRightIcon fontSize="small" /></IconButton></Tooltip>
                      <Box className="se-toolbar-divider" />
                      <Tooltip title="Insert image">
                        <IconButton
                          size="small"
                          onClick={(e) => setImageMenuAnchor(e.currentTarget)}
                          className="se-toolbar-btn"
                        >
                          <InsertPhotoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Menu
                        anchorEl={imageMenuAnchor}
                        open={Boolean(imageMenuAnchor)}
                        onClose={() => setImageMenuAnchor(null)}
                        classes={{ paper: 'se-image-menu' }}
                      >
                        <MenuItem onClick={() => insertImage('/right-logo.png')} className="se-image-menu-item">
                          <img src="/right-logo.png" alt="Company Logo" className="se-image-menu-preview" />
                          <Typography className="se-image-menu-label">Company Logo</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => insertImage('/siganture.png')} className="se-image-menu-item">
                          <img src="/siganture.png" alt="Signature" className="se-image-menu-preview" />
                          <Typography className="se-image-menu-label">Signature</Typography>
                        </MenuItem>
                      </Menu>
                    </Box>

                    {/* TipTap content area */}
                    <Box className="se-tiptap-editor">
                      <EditorContent editor={editor} />
                    </Box>
                  </Box>
                </Box>

                {/* ── Right Panel: Send + Attachments + Recipients ── */}
                <Box className="se-right-panel">

                  {/* Send button */}
                  <Box className="se-right-send">
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={sending ? <CircularProgress size={16} className="se-btn-spinner" /> : <SendIcon />}
                      onClick={handleSend}
                      disabled={sending}
                      className="t-btn-primary"
                    >
                      {sending ? 'Sending...' : `Send to ${emailIds.length} Recipient${emailIds.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Typography className="t-meta-text">
                      Edits here are for this send only — the saved template is not changed
                    </Typography>
                  </Box>

                  {/* Attachments */}
                  <Box className="se-attachments-section">
                    <Stack direction="row" alignItems="center" className="se-attachments-header">
                      <AttachFileIcon className="se-attach-icon" />
                      <Typography className="t-section-label">Attachments</Typography>
                    </Stack>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="se-file-input"
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<AttachFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      className="se-attach-btn"
                    >
                      Attach Files
                    </Button>
                    {attachments.length > 0 && (
                      <Box className="se-attachment-list">
                        {attachments.map((f, i) => (
                          <Chip
                            key={i}
                            label={f.name}
                            size="small"
                            onDelete={() => removeAttachment(i)}
                            deleteIcon={<CloseIcon />}
                            className="se-attachment-chip"
                          />
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* Recipients */}
                  <Box className="se-recipients-section">
                    <Stack direction="row" alignItems="center" className="se-recipients-header">
                      <PeopleAltIcon className="se-people-icon" />
                      <Typography className="t-section-label se-recipients-label">
                        Sending to {emailIds.length} recipient{emailIds.length !== 1 ? 's' : ''}
                      </Typography>
                      <Tooltip title={copied ? 'Copied!' : 'Copy all emails'} arrow classes={{ tooltip: 'g-tooltip', arrow: 'g-tooltip-arrow' }}>
                        <IconButton size="small" onClick={handleCopyEmails} className={copied ? 'se-copy-btn-copied' : 'se-copy-btn'}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Box className="se-chips-container">
                      {visibleEmails.map((email) => (
                        <Chip key={email} label={email} size="small" className="se-recipient-chip" />
                      ))}
                      {hiddenCount > 0 && (
                        <Chip label={`+${hiddenCount} more`} size="small" className="se-more-chip" />
                      )}
                    </Box>
                  </Box>

                </Box>

              </Box>
            </Card>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default SendEmail;

