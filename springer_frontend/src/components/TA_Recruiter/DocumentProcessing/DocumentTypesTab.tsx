import { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { TableSkeleton } from '../../Common/TableSkeleton';
import {
  Box, Card, Typography, Button, CircularProgress, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, InputAdornment, Tooltip,
} from '@mui/material';
import { Description as DocIcon, HelpOutline as HelpIcon } from '@mui/icons-material';
import { FigmaEditIcon as EditIcon, FigmaDeleteIcon as DeleteIcon, FigmaAddIcon as AddIcon, FigmaSearchIcon as SearchIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { documentTypeApi } from '../../../services/document.api';
import { showToast } from '../../../utils/toast';
import type { DocumentTypeResponse } from '../../../types/DocumentCollection/document.types';
import '../../../css/TA_Recruiter/DocumentProcessing/DocumentTypesTab.css';

const DocumentTypesTab = () => {
  const [types, setTypes] = useState<DocumentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ typeId: number | null }>({ typeId: null });
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await documentTypeApi.getAllTypes();
      if (res.success && res.data) setTypes(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load document types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateDocumentType = () => {
    const type = newType.trim();
    if (!type) {
      setErrors(prev => ({ ...prev, documentType: 'Document type is required' }));
      return false;
    }
    if (type.length < 3) {
      setErrors(prev => ({ ...prev, documentType: 'Must be at least 3 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, documentType: '' }));
    return true;
  };

  const handleAdd = async () => {
    if (!validateDocumentType()) {
      return;
    }
    const trimmed = newType.trim();
    try {
      setSubmitting(true);
      const res = await documentTypeApi.createType({ documentType: trimmed });
      if (res.success) {
        showToast('Document type added successfully', 'success');
        setDialogOpen(false);
        setNewType('');
        fetchTypes();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add document type', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      const res = await documentTypeApi.deleteType(id);
      if (res.success) {
        showToast(`"${name.replace(/_/g, ' ')}" removed`, 'success');
        fetchTypes();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove document type', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleInlineEdit = (type: DocumentTypeResponse) => {
    setEditingCell({ typeId: type.documentTypeId });
    setEditValue(type.documentType);
  };

  const handleInlineSave = async () => {
    if (!editingCell.typeId) return;
    const type = types.find(t => t.documentTypeId === editingCell.typeId);
    if (!type) return;

    const trimmed = editValue.trim();
    if (!trimmed || trimmed.length < 3) {
      showToast('Document type must be at least 3 characters', 'error');
      return;
    }

    try {
      const res = await documentTypeApi.updateType(type.documentTypeId, { documentType: trimmed });
      if (res.success) {
        showToast('Updated successfully', 'success');
        fetchTypes();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setEditingCell({ typeId: null });
    }
  };

  const handleInlineCancel = () => {
    setEditingCell({ typeId: null });
    setEditValue('');
  };

  const filteredTypes = types.filter(t =>
    debouncedSearch.trim() === '' ||
    t.documentType.replace(/_/g, ' ').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <Box className="dtt-page">
      <Card className="dtt-card">

        {/* Filter Section */}
        <Box className="dtt-filter-section">
          <Box className="dtt-filter-row">
            <TextField
              placeholder="Search document types..."
              size="small"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="dtt-search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" className="dtt-search-icon" />
                  </InputAdornment>
                ),
              }}
            />
            <Box className="dtt-filter-spacer" />
          </Box>
        </Box>

        <Box className="dtt-separator" />

        {/* Table */}
        <Box className="dtt-table-section">
          {loading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : (
            <TableContainer className="dtt-table-container">
              <Table stickyHeader>
                <TableHead>
                  <TableRow className="dtt-table-head-row">
                    <TableCell className="dtt-table-head-cell">Document Type</TableCell>
                    <TableCell className="dtt-table-head-cell">Created At</TableCell>
                    <TableCell className="dtt-table-head-cell dtt-table-head-cell--actions">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => { setNewType(''); setDialogOpen(true); }}
                          className="dtt-add-button"
                        >
                          Add Document Type
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="dtt-empty-cell">
                        <DocIcon className="dtt-empty-icon" />
                        <Typography className="dtt-empty-text">
                          {types.length === 0 ? 'No document types configured yet' : 'No document types match your search'}
                        </Typography>
                        {types.length === 0 && (
                          <Typography className="dtt-empty-sub">Click "Add Document Type" to get started</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTypes.map((t, idx) => (
                      <TableRow
                        key={t.documentTypeId}
                        hover
                        className={`dtt-table-row ${idx % 2 === 0 ? 'dtt-table-row--even' : 'dtt-table-row--odd'}`}
                      >
                        <TableCell className="dtt-table-cell" onDoubleClick={() => handleInlineEdit(t)}>
                          {editingCell.typeId === t.documentTypeId ? (
                            <TextField
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleInlineSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineSave();
                                if (e.key === 'Escape') handleInlineCancel();
                              }}
                              autoFocus
                              size="small"
                              fullWidth
                              sx={{ '& .MuiInputBase-root': { fontSize: 'var(--text-sm)' } }}
                            />
                          ) : (
                            <Box className="dtt-name-cell" sx={{ cursor: 'pointer', '&:hover .edit-hint': { opacity: 0.5 } }}>
                              <Box className="dtt-name-icon-box">
                                <DocIcon className="dtt-name-icon" />
                              </Box>
                              <Typography className="dtt-row-primary">
                                {t.documentType.replace(/_/g, ' ')}
                              </Typography>
                              <EditIcon className="edit-hint" style={{ fontSize: 14, marginLeft: 4, opacity: 0, transition: 'opacity 0.2s' }} />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell className="dtt-table-cell">
                          <Typography className="dtt-row-secondary">
                            {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell className="dtt-table-cell dtt-table-cell--actions">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              className="dtt-action-button"
                              title="Remove"
                              disabled={deletingId === t.documentTypeId}
                              onClick={(e) => handleDelete(t.documentTypeId, t.documentType, e)}
                            >
                              {deletingId === t.documentTypeId
                                ? <CircularProgress size={14} />
                                : <DeleteIcon className="dtt-action-icon" />}
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className="dtt-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Add Document Type
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography component="label" sx={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                Document Type Name *
              </Typography>
              <Tooltip 
                title="Use UPPERCASE with underscores (e.g., OFFER_LETTER, NOC_CERTIFICATE). This name will be shown to candidates when requesting documents."
                arrow
                placement="top"
              >
                <HelpIcon sx={{ fontSize: 16, color: 'var(--color-text-secondary)', cursor: 'help' }} />
              </Tooltip>
            </Box>
            <TextField
              size="small"
              fullWidth
              value={newType}
              onChange={e => setNewType(e.target.value)}
              onBlur={validateDocumentType}
              error={!!errors.documentType}
              helperText={errors.documentType || 'Letters, numbers, spaces, hyphens and underscores only. Max 50 characters.'}
              placeholder="e.g. OFFER_LETTER, NOC_CERTIFICATE"
              inputProps={{ maxLength: 50 }}
              className="dtt-dialog-field"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} className="dtt-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={submitting || !newType.trim()}
            className="dtt-dialog-submit-btn"
          >
            {submitting ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentTypesTab;
