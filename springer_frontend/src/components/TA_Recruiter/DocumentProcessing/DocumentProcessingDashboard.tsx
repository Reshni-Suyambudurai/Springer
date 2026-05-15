import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Box, Typography, MenuItem, TextField, CircularProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, IconButton,
} from '@mui/material';
import { FigmaDeleteIcon as DeleteIcon, FigmaAddIcon as AddIcon, FigmaCloseIcon as CloseIcon } from '../../Common/FigmaIcons';
import { documentTypeApi } from '../../../services/document.api';
import { showToast } from '../../../utils/toast';
import { DocumentProcessingProvider, useDocumentProcessing } from '../../../contexts/DocumentProcessingContext';
import type { DocProcessingContextProps } from '../../../types/DocumentCollection/document.types';
import SendDocumentsTab from './SendDocumentsTab';
import VerifyDocumentsTab from './VerifyDocumentsTab';
import OffersTab from './OffersTab';
import '../../../css/TA_Recruiter/DocumentProcessing/DocumentProcessingDashboard.css';

const TABS = [
  { key: 'send-documents',   label: 'Request Documents' },
  { key: 'verify-documents', label: 'Review & Verify' },
  { key: 'offers',           label: 'Offer Responses' },
];

const DocumentProcessingDashboardContent = () => {
  const { cycles, docTypes, loadingCycles, fetchCycles, fetchDocTypes } = useDocumentProcessing();
  const [activeTab, setActiveTab] = useState('send-documents');
  const [selectedCycleId, setSelectedCycleId] = useState<number>(0);

  // Document Types management
  const [docTypesDialog, setDocTypesDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [addingType, setAddingType] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => { fetchCycles(); }, []);

  useEffect(() => {
    if (cycles.length > 0 && selectedCycleId === 0) {
      const open = cycles.find(c => c.status === 'OPEN');
      setSelectedCycleId(open ? open.cycleId : cycles[0].cycleId);
    }
  }, [cycles, selectedCycleId]);

  const handleOpenDocTypes = () => {
    setDocTypesDialog(true);
    if (docTypes.length === 0) fetchDocTypes();
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) { showToast('Enter a document type name', 'error'); return; }
    const typeName = newTypeName.trim().toUpperCase().replace(/\s+/g, '_');
    if (docTypes.some(t => t.documentType === typeName)) {
      showToast('This document type already exists', 'error');
      return;
    }
    try {
      setAddingType(true);
      const res = await documentTypeApi.createType({ documentType: typeName });
      if (res.success) {
        showToast('Document type added', 'success');
        setNewTypeName('');
        await fetchDocTypes();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add document type', 'error');
    } finally {
      setAddingType(false);
    }
  };

  const handleDeleteType = async (id: number, name: string) => {
    try {
      setDeletingId(id);
      const res = await documentTypeApi.deleteType(id);
      if (res.success) {
        showToast(`"${name.replace(/_/g, ' ')}" removed`, 'success');
        await fetchDocTypes();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const selectedCycle = cycles.find(c => c.cycleId === selectedCycleId);
  const ctx: DocProcessingContextProps = {
    cycleId: selectedCycleId,
    cycleName: selectedCycle?.cycleName ?? '',
  };

  const renderContent = () => {
    if (!selectedCycleId) {
      return (
        <Box className="dp-empty-state">
          <Typography className="dp-empty-text">Select a hiring cycle to continue</Typography>
        </Box>
      );
    }
    switch (activeTab) {
      case 'send-documents':   return <SendDocumentsTab context={ctx} />;
      case 'verify-documents': return <VerifyDocumentsTab context={ctx} />;
      case 'offers':           return <OffersTab context={ctx} />;
      default:                 return <SendDocumentsTab context={ctx} />;
    }
  };

  return (
    <Box className="dp-page">

      {/* Cycle selector rendered into Navbar via portal */}
      {document.getElementById('navbar-actions-slot') && createPortal(
        <Box className="dp-cycle-selector">
          {loadingCycles ? (
            <CircularProgress size={18} sx={{ color: 'var(--color-primary)' }} />
          ) : (
            <TextField
              select size="small"
              value={selectedCycleId || ''}
              onChange={e => { setSelectedCycleId(Number(e.target.value)); }}
              className="dp-cycle-select"
            >
              {cycles.map(c => (
                <MenuItem key={c.cycleId} value={c.cycleId}>
                  {c.cycleName} ({c.cycleYear}) {c.status === 'OPEN' ? 'ðŸŸ¢' : 'ðŸ”´'}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>,
        document.getElementById('navbar-actions-slot')!
      )}

      {/* Tab Bar Row â€” Tabs + Conditional Button */}
      <Box className="dp-header">
        <Box className="dp-header-top">
          <Box className="dp-tab-bar" sx={{ flex: 1, padding: '0 !important' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`dp-tab-btn ${activeTab === tab.key ? 'dp-tab-btn--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className="dp-tab-label">{tab.label}</span>
              </button>
            ))}
          </Box>
          {activeTab === 'send-documents' && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenDocTypes}
              className="dp-doctype-btn"
              endIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21.4V2.6a.6.6 0 01.6-.6h11.652a.6.6 0 01.424.176l3.148 3.148A.6.6 0 0120 5.748V21.4a.6.6 0 01-.6.6H4.6a.6.6 0 01-.6-.6z" /><path d="M12 10.4l1.5 2.8 3.1.6-2.2 2.2.4 3.1L12 17.6l-2.8 1.5.4-3.1-2.2-2.2 3.1-.6L12 10.4z" /></svg>}
            >
              Select Document Types to Request
            </Button>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box className="dp-content">
        {renderContent()}
      </Box>

      {/* Document Types Dialog */}
      <Dialog open={docTypesDialog} onClose={() => setDocTypesDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="dp-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Manage Document Types
          <IconButton size="small" onClick={() => setDocTypesDialog(false)}><CloseIcon style={{ fontSize: '1.25rem' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Add new by typing */}
            <Box className="dp-doctype-add-row">
              <TextField
                placeholder="Type new document name..."
                size="small"
                fullWidth
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddType(); }}
                className="dp-doctype-input"
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddType}
                disabled={addingType || !newTypeName.trim()}
                className="dp-doctype-add-btn"
              >
                {addingType ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <AddIcon fontSize="small" />}
              </Button>
            </Box>

            {/* Current types list */}
            <Box className="dp-doctype-list">
              <Typography className="dp-doctype-list-label">
                Active Document Types ({docTypes.length})
              </Typography>
              {docTypes.length === 0 ? (
                <Typography className="dp-doctype-empty">No document types configured yet</Typography>
              ) : (
                <Stack spacing={1}>
                  {docTypes.map(t => (
                    <Box key={t.documentTypeId} className="dp-doctype-item">
                      <Typography className="dp-doctype-item-name">
                        {t.documentType.replace(/_/g, ' ')}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteType(t.documentTypeId, t.documentType)}
                        disabled={deletingId === t.documentTypeId}
                        className="dp-doctype-item-delete"
                      >
                        {deletingId === t.documentTypeId
                          ? <CircularProgress size={12} />
                          : <DeleteIcon fontSize="small" />}
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDocTypesDialog(false)} className="dp-dialog-close-btn">Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DocumentProcessingDashboard = () => {
  return (
    <DocumentProcessingProvider>
      <DocumentProcessingDashboardContent />
    </DocumentProcessingProvider>
  );
};

export default DocumentProcessingDashboard;
