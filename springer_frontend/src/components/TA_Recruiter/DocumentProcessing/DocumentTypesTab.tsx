import { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, CircularProgress, Stack,
  IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, TextField,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Description as DocIcon } from '@mui/icons-material';
import { documentTypeApi } from '../../../services/document.api';
import { showToast } from '../../../utils/toast';
import type { DocumentTypeResponse } from '../../../types/DocumentCollection/document.types';
import '../../../css/TA_Recruiter/DocumentProcessing/DocumentTypesTab.css';

const DOCUMENT_TYPE_OPTIONS = [
  'RESUME', 'PHOTO', 'ID_PROOF', 'MARKSHEET',
  'PROVISIONAL_CERT', 'DEGREE_CERT', 'EXPERIENCE_LETTER', 'RELIEVING_LETTER',
];

const DocumentTypesTab = () => {
  const [types, setTypes] = useState<DocumentTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleAdd = async () => {
    if (!selected) { showToast('Select a document type', 'error'); return; }
    try {
      setSubmitting(true);
      const res = await documentTypeApi.createType({ documentType: selected });
      if (res.success) {
        showToast('Document type added successfully', 'success');
        setDialogOpen(false);
        setSelected('');
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

  const availableOptions = DOCUMENT_TYPE_OPTIONS.filter(
    opt => !types.some(t => t.documentType === opt)
  );

  return (
    <Box className="dtt-page">
      <Card className="dtt-card">

        {/* Table */}
        <Box className="dtt-table-section">
          {loading ? (
            <Box className="dtt-loading-state">
              <CircularProgress size={32} sx={{ color: 'var(--color-primary)' }} />
              <Typography className="dtt-empty-text">Loading document types...</Typography>
            </Box>
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
                          onClick={() => { setSelected(''); setDialogOpen(true); }}
                          className="dtt-add-button"
                          disabled={availableOptions.length === 0}
                        >
                          Add Document Type
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {types.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="dtt-empty-cell">
                        <DocIcon className="dtt-empty-icon" />
                        <Typography className="dtt-empty-text">No document types configured yet</Typography>
                        <Typography className="dtt-empty-sub">Click "Add Document Type" to get started</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    types.map((t, idx) => (
                      <TableRow
                        key={t.documentTypeId}
                        hover
                        className={`dtt-table-row ${idx % 2 === 0 ? 'dtt-table-row--even' : 'dtt-table-row--odd'}`}
                      >
                        <TableCell className="dtt-table-cell">
                          <Box className="dtt-name-cell">
                            <Box className="dtt-name-icon-box">
                              <DocIcon className="dtt-name-icon" />
                            </Box>
                            <Typography className="dtt-row-primary">
                              {t.documentType.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
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
        <DialogTitle className="dtt-dialog-title">Add Document Type</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Document Type *"
              size="small"
              fullWidth
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="dtt-dialog-field"
            >
              {availableOptions.length === 0 ? (
                <MenuItem disabled>All types already added</MenuItem>
              ) : (
                availableOptions.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt.replace(/_/g, ' ')}</MenuItem>
                ))
              )}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} className="dtt-dialog-cancel-btn">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={submitting || !selected}
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
