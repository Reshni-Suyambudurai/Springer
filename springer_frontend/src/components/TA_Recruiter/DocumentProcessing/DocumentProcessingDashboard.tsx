import { useState, useEffect } from 'react';
import { Box, Typography, MenuItem, TextField, CircularProgress } from '@mui/material';
import { hiringCycleApi } from '../../../services/hiring.api';
import { showToast } from '../../../utils/toast';
import type { DocProcessingContextProps } from '../../../types/DocumentCollection/document.types';
import type { HiringCycleResponse } from '../../../types/TA_Recruiter/Hiring/hiringCycle.types';
import DocumentTypesTab from './DocumentTypesTab';
import SendDocumentsTab from './SendDocumentsTab';
import VerifyDocumentsTab from './VerifyDocumentsTab';
import OffersTab from './OffersTab';
import '../../../css/TA_Recruiter/DocumentProcessing/DocumentProcessingDashboard.css';

const TABS = [
  { key: 'doc-types',        label: 'Document Types' },
  { key: 'send-documents',   label: 'Request Documents' },
  { key: 'verify-documents', label: 'Review & Verify' },
  { key: 'offers',           label: 'Offer Responses' },
];

const DocumentProcessingDashboard = () => {
  const [activeTab, setActiveTab] = useState('doc-types');
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number>(0);
  const [loadingCycles, setLoadingCycles] = useState(true);
  useEffect(() => {
    hiringCycleApi.getAllCycles().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setCycles(res.data);
        const open = res.data.find(c => c.status === 'OPEN');
        setSelectedCycleId(open ? open.cycleId : res.data[0].cycleId);
      }
    }).catch(err => showToast(err.message || 'Failed to load cycles', 'error'))
      .finally(() => setLoadingCycles(false));
  }, []);

  const selectedCycle = cycles.find(c => c.cycleId === selectedCycleId);
  const ctx: DocProcessingContextProps = {
    cycleId: selectedCycleId,
    cycleName: selectedCycle?.cycleName ?? '',
  };

  const renderContent = () => {
    if (!selectedCycleId && activeTab !== 'doc-types') {
      return (
        <Box className="dp-empty-state">
          <Typography className="dp-empty-text">Select a hiring cycle to continue</Typography>
        </Box>
      );
    }
    switch (activeTab) {
      case 'doc-types':        return <DocumentTypesTab />;
      case 'send-documents':   return <SendDocumentsTab context={ctx} />;
      case 'verify-documents': return <VerifyDocumentsTab context={ctx} />;
      case 'offers':           return <OffersTab context={ctx} />;
      default:                 return <DocumentTypesTab />;
    }
  };

  return (
    <Box className="dp-page">

      {/* Header */}
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
          <Box className="dp-cycle-selector">
            <Typography className="dp-cycle-label">Cycle</Typography>
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
                    {c.cycleName} ({c.cycleYear}) {c.status === 'OPEN' ? '🟢' : '🔴'}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </Box>

        {/* Tab Bar removed from here — merged into top row */}
      </Box>

      {/* Content */}
      <Box className="dp-content">
        {renderContent()}
      </Box>
    </Box>
  );
};

export default DocumentProcessingDashboard;
