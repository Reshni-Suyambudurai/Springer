import { useEffect, useState } from 'react';
import { hiringCycleApi } from '../../services/hiring.api';
import { driveDashboardApi } from '../../services/drive.api';
import { showToast } from '../../utils/toast';
import type { HiringCycleSummaryResponse } from '../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { DriveDetailsAnalysisResponse, DriveBreakdown } from '../../types/TA_Recruiter/Drive/dashboard.types';
import InstituteAnalytics from './InstituteAnalytics';
import '../../css/TA_Recruiter/DashboardTAR.css';

function DashboardTAR() {
  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DriveDetailsAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDriveId, setExpandedDriveId] = useState<number | null>(null);
  const [modeFilter, setModeFilter] = useState<'ALL' | 'ON_CAMPUS' | 'OFF_CAMPUS'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'funnel'>('table');
  const [selectedFunnelDriveId, setSelectedFunnelDriveId] = useState<number | null>(null);
  const [showInstitute, setShowInstitute] = useState(false);
  const [selectedInstituteId, setSelectedInstituteId] = useState<number | null>(null);

  const handleModeFilter = (mode: 'ALL' | 'ON_CAMPUS' | 'OFF_CAMPUS') => {
    setModeFilter(mode);
    setSelectedFunnelDriveId(null);
  };

  // Fetch cycles on mount
  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const res = await hiringCycleApi.getAllCycleSummaries();
        if (res.success && res.data) {
          setCycles(res.data);
          const openCycle = res.data.find(c => c.status === 'OPEN');
          const defaultCycle = openCycle || res.data[0];
          if (defaultCycle) setSelectedCycleId(defaultCycle.cycleId);
        } else {
          showToast(res.message || 'Failed to load cycles', 'error');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load hiring cycles';
        showToast(msg, 'error');
      }
    };
    fetchCycles();
  }, []);

  // Fetch drive details analysis when cycle changes
  useEffect(() => {
  
    if (!selectedCycleId) return;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await driveDashboardApi.getDriveDetailsAnalysis(selectedCycleId);
        if (res.success && res.data) {
          setDashboard(res.data);
          setExpandedDriveId(null);
        } else {
          showToast(res.message || 'Failed to load drive analysis', 'error');
          setDashboard(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load drive analysis';
        showToast(msg, 'error');
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedCycleId]);

  const selectedCycle = cycles.find(c => c.cycleId === selectedCycleId);

  const filteredDrives = dashboard?.drives
    ? modeFilter === 'ALL'
      ? dashboard.drives
      : dashboard.drives.filter(d => d.driveMode === modeFilter)
    : [];

  const toggleDriveExpand = (driveId: number) => {
    setExpandedDriveId(prev => (prev === driveId ? null : driveId));
  };

  const formatBatchTime = (iso: string): string => {
    if (iso === 'Unscheduled') return iso;
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statClass = (count: number, variant: string): string => {
    return count > 0 ? `dashboard-stat-${variant}` : 'dashboard-stat-zero';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Drive Dashboard</h2>
        <div className="dashboard-header-right">
          <span
            className={`dashboard-cycle-icon${selectedCycle ? ` dashboard-cycle-icon-${selectedCycle.status.toLowerCase()}` : ''}${showInstitute ? ' dashboard-cycle-icon-active' : ''}`}
            onClick={() => setShowInstitute(prev => !prev)}
            title="Toggle Institute Analytics"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          <select
            className={`dashboard-cycle-select${selectedCycle ? ` dashboard-cycle-select-${selectedCycle.status.toLowerCase()}` : ''}`}
            value={selectedCycleId ?? ''}
            onChange={e => setSelectedCycleId(Number(e.target.value))}
          >
            {cycles.map(c => (
              <option key={c.cycleId} value={c.cycleId} className={`dashboard-cycle-option-${c.status.toLowerCase()}`}>
                {c.cycleName} ({c.cycleYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="dashboard-loading">Loading dashboard...</div>}

      {!loading && dashboard && (
        <div className="dashboard-content">
          {/* ===== Summary Cards ===== */}
          <div className="dashboard-cards-row">
            <div className="dashboard-card dashboard-card-total">
              <span className="dashboard-card-label">Total Candidates</span>
              <span className="dashboard-card-value">{dashboard.totalCandidates}</span>
            </div>
            <div className="dashboard-card dashboard-card-selected">
              <span className="dashboard-card-label">Selected</span>
              <span className="dashboard-card-value">{dashboard.selectedCount}</span>
            </div>
            <div className="dashboard-card dashboard-card-accepted">
              <span className="dashboard-card-label">Accepted</span>
              <span className="dashboard-card-value">{dashboard.acceptedCount}</span>
            </div>
            <div className="dashboard-card dashboard-card-joined">
              <span className="dashboard-card-label">Joined</span>
              <span className="dashboard-card-value">{dashboard.joinedCount}</span>
            </div>
            <div className="dashboard-card dashboard-card-rejected">
              <span className="dashboard-card-label">Rejected</span>
              <span className="dashboard-card-value">{dashboard.rejectedCount}</span>
            </div>
            <div className="dashboard-card dashboard-card-dropped">
              <span className="dashboard-card-label">Dropped</span>
              <span className="dashboard-card-value">{dashboard.droppedCount}</span>
            </div>
          </div>

          {/* ===== Toggle: Drive View vs Institute Analytics ===== */}
          {showInstitute && selectedCycleId ? (
            <InstituteAnalytics
              cycleId={selectedCycleId}
              selectedCollegeId={selectedInstituteId}
              onSelectedCollegeIdChange={setSelectedInstituteId}
            />
          ) : (
            <>
              {/* ===== Drive Mode Counts ===== */}
              <div className="dashboard-mode-section">
            <div
              className={`dashboard-mode-card${modeFilter === 'ON_CAMPUS' ? ' dashboard-mode-card-active' : ''}`}
              onClick={() => handleModeFilter(modeFilter === 'ON_CAMPUS' ? 'ALL' : 'ON_CAMPUS')}
            >
              <div className="dashboard-mode-icon dashboard-mode-icon-oncampus">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="dashboard-mode-info">
                <span className="dashboard-mode-count">{dashboard.onCampusDriveCount}</span>
                <span className="dashboard-mode-label">On-Campus Drives</span>
              </div>
            </div>
            <div
              className={`dashboard-mode-card${modeFilter === 'OFF_CAMPUS' ? ' dashboard-mode-card-active' : ''}`}
              onClick={() => handleModeFilter(modeFilter === 'OFF_CAMPUS' ? 'ALL' : 'OFF_CAMPUS')}
            >
              <div className="dashboard-mode-icon dashboard-mode-icon-offcampus">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <div className="dashboard-mode-info">
                <span className="dashboard-mode-count">{dashboard.offCampusDriveCount}</span>
                <span className="dashboard-mode-label">Off-Campus Drives</span>
              </div>
            </div>
          </div>

          {/* ===== Drive Breakdown / Summary Funnel ===== */}
          {dashboard.drives && dashboard.drives.length > 0 && (
            <div className="dashboard-drives-section">
              <div className="dashboard-drives-header">
                <h3 className="dashboard-section-title">
                  {modeFilter === 'ALL' ? 'Overall Funnel' : 'Drive Breakdown'}
                </h3>
                <div className="dashboard-drives-header-actions">
                  {modeFilter !== 'ALL' && (
                    <>
                      <div className="dashboard-view-toggle">
                        <button
                          className={`dashboard-view-toggle-btn${viewMode === 'table' ? ' dashboard-view-toggle-btn-active' : ''}`}
                          onClick={() => setViewMode('table')}
                          title="Table View"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 2h14v2H1V2zm0 4h14v2H1V6zm0 4h14v2H1v-2zm0 4h14v2H1v-2z" fill="currentColor"/></svg>
                        </button>
                        <button
                          className={`dashboard-view-toggle-btn${viewMode === 'funnel' ? ' dashboard-view-toggle-btn-active' : ''}`}
                          onClick={() => setViewMode('funnel')}
                          title="Funnel View"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 1h14L10 7v5l-4 3V7L1 1z" fill="currentColor"/></svg>
                        </button>
                      </div>
                      <span className="dashboard-drives-count-badge">{filteredDrives.length} drive{filteredDrives.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>

              {modeFilter === 'ALL' ? (
                /* ===== Overall Summary Funnel ===== */
                <div className="dashboard-summary-funnel">
                  {(() => {
                    const maxVal = Math.max(dashboard.totalCandidates, 1);
                    const layers = [
                      { label: 'Applied', value: dashboard.totalCandidates, className: 'funnel-applied' },
                      { label: 'Selected', value: dashboard.selectedCount, className: 'funnel-selected' },
                      { label: 'Rejected', value: dashboard.rejectedCount, className: 'funnel-rejected' },
                      { label: 'Dropped', value: dashboard.droppedCount, className: 'funnel-dropped' },
                      { label: 'Accepted', value: dashboard.acceptedCount, className: 'funnel-accepted' },
                      { label: 'Joined', value: dashboard.joinedCount, className: 'funnel-joined' },
                    ];
                    return layers.map(layer => {
                      const pct = Math.max((layer.value / maxVal) * 100, 6);
                      return (
                        <div className={`dashboard-funnel-layer ${layer.className}`} key={layer.label}>
                          <div className="dashboard-funnel-label">{layer.label}</div>
                          <div className="dashboard-funnel-bar-track">
                            <div className="dashboard-funnel-bar-fill" style={{ width: `${pct}%` }}>
                              <span className="dashboard-funnel-bar-value">{layer.value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : viewMode === 'table' ? (
              <div className="dashboard-drives-table-wrap">
                <table className="dashboard-drives-table">
                  <thead>
                    <tr>
                      <th>Drive Name</th>
                      <th>Mode</th>
                      <th>Location</th>
                      <th>Start Date</th>
                      <th>Batches</th>
                      <th>Applied</th>
                      <th>Selected</th>
                      <th>Dropped</th>
                      <th>Rejected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrives.map((drive: DriveBreakdown) => {
                      const isExpanded = expandedDriveId === drive.driveId;
                      const batchEntries = drive.batchApplicationCounts ? Object.entries(drive.batchApplicationCounts) : [];
                      return (
                        <>
                          <tr
                            key={drive.driveId}
                            className="dashboard-drive-row-expandable"
                            onClick={() => toggleDriveExpand(drive.driveId)}
                          >
                            <td>
                              <span className="dashboard-drive-name">{drive.driveName}</span>
                              {drive.instituteName && (
                                <div className="dashboard-drive-institute">{drive.instituteName}</div>
                              )}
                            </td>
                            <td>
                              <span className={`dashboard-drive-mode-chip ${drive.driveMode === 'ON_CAMPUS' ? 'dashboard-drive-mode-oncampus' : 'dashboard-drive-mode-offcampus'}`}>
                                {drive.driveMode === 'ON_CAMPUS' ? 'On-Campus' : 'Off-Campus'}
                              </span>
                            </td>
                            <td className="dashboard-drive-location">{drive.location || '—'}</td>
                            <td className="dashboard-drive-location">{drive.startDate ? new Date(drive.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                            <td className="dashboard-batch-count">{drive.distinctBatchCount}</td>
                            <td className={`dashboard-col-applied ${statClass(drive.appliedCount, 'applied')}`}>{drive.appliedCount}</td>
                            <td className={`dashboard-col-selected ${statClass(drive.selectedCount, 'selected')}`}>{drive.selectedCount}</td>
                            <td className={`dashboard-col-dropped ${statClass(drive.droppedCount, 'dropped')}`}>{drive.droppedCount}</td>
                            <td className={`dashboard-col-rejected ${statClass(drive.rejectedCount, 'rejected')}`}>{drive.rejectedCount}</td>
                          </tr>
                          {isExpanded && batchEntries.length > 0 && (
                            <tr key={`${drive.driveId}-batch`}>
                              <td className="dashboard-drive-expand-cell" colSpan={9}>
                                <div className="dashboard-batch-detail">
                                  {batchEntries.map(([time, count]) => (
                                    <span className="dashboard-batch-chip" key={time}>
                                      {formatBatchTime(time)}
                                      <span className="dashboard-batch-chip-count">{count}</span>
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              ) : (
              <div className="dashboard-funnel-panel-layout">
                {/* Left: Drive cards list */}
                <div className="dashboard-funnel-drives-list">
                  {filteredDrives.map((drive: DriveBreakdown) => (
                    <div
                      key={drive.driveId}
                      className={`dashboard-funnel-drive-card${(selectedFunnelDriveId ?? filteredDrives[0]?.driveId) === drive.driveId ? ' dashboard-funnel-drive-card-active' : ''}`}
                      onClick={() => setSelectedFunnelDriveId(prev => prev === drive.driveId ? null : drive.driveId)}
                    >
                      <div className="dashboard-funnel-drive-card-header">
                        <span className="dashboard-funnel-drive-name">
                          {drive.driveName}
                          {drive.driveMode === 'ON_CAMPUS' && drive.instituteName && (
                            <span className="dashboard-funnel-drive-college"> — {drive.instituteName}</span>
                          )}
                        </span>
                        <span className={`dashboard-funnel-drive-mode ${drive.driveMode === 'ON_CAMPUS' ? 'dashboard-drive-mode-oncampus' : 'dashboard-drive-mode-offcampus'}`}>
                          {drive.driveMode === 'ON_CAMPUS' ? 'On-Campus' : 'Off-Campus'}
                        </span>
                      </div>
                      <div className="dashboard-funnel-drive-meta">
                        <span className="dashboard-funnel-drive-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {drive.location || '—'}</span>
                        <span className="dashboard-funnel-drive-meta-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {drive.startDate ? new Date(drive.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                      </div>
                    </div>
                  ))}
                  {filteredDrives.length === 0 && (
                    <div className="dashboard-empty">No drives match filter.</div>
                  )}
                </div>

                {/* Right: Selected drive funnel */}
                <div className="dashboard-funnel-detail-panel">
                  {(() => {
                    const activeDriveId = selectedFunnelDriveId ?? (filteredDrives.length > 0 ? filteredDrives[0].driveId : null);
                    const selectedDrive = filteredDrives.find(d => d.driveId === activeDriveId);
                    if (!selectedDrive) {
                      return <div className="dashboard-funnel-detail-empty">Select a drive to view its funnel</div>;
                    }
                    const batchEntries = selectedDrive.batchApplicationCounts ? Object.entries(selectedDrive.batchApplicationCounts) : [];
                    const maxVal = Math.max(selectedDrive.appliedCount, 1);
                    const layers = [
                      { label: 'Applied', value: selectedDrive.appliedCount, className: 'funnel-applied' },
                      { label: 'Selected', value: selectedDrive.selectedCount, className: 'funnel-selected' },
                      { label: 'Dropped', value: selectedDrive.droppedCount, className: 'funnel-dropped' },
                      { label: 'Rejected', value: selectedDrive.rejectedCount, className: 'funnel-rejected' },
                    ];
                    return (
                      <>
                        <div className="dashboard-funnel-detail-title">
                          {selectedDrive.driveName}
                          {selectedDrive.instituteName && (
                            <span className="dashboard-funnel-drive-college"> — {selectedDrive.instituteName}</span>
                          )}
                        </div>
                        {batchEntries.length > 0 && (
                          <div className="dashboard-funnel-batch-row">
                            {batchEntries.map(([time, count]) => (
                              <span className="dashboard-batch-chip" key={time}>
                                {formatBatchTime(time)}
                                <span className="dashboard-batch-chip-count">{count}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="dashboard-funnel-bars">
                          {layers.map(layer => {
                            const pct = Math.max((layer.value / maxVal) * 100, 8);
                            return (
                              <div className={`dashboard-funnel-layer ${layer.className}`} key={layer.label}>
                                <div className="dashboard-funnel-label">{layer.label}</div>
                                <div className="dashboard-funnel-bar-track">
                                  <div className="dashboard-funnel-bar-fill" style={{ width: `${pct}%` }}>
                                    <span className="dashboard-funnel-bar-value">{layer.value}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              )}
            </div>
          )}

          {dashboard.drives && dashboard.drives.length === 0 && (
            <div className="dashboard-empty">No drives found for this cycle.</div>
          )}
            </>
          )}
        </div>
      )}

      {!loading && !dashboard && selectedCycleId && (
        <div className="dashboard-empty">No data available for this cycle.</div>
      )}
    </div>
  );
}

export default DashboardTAR;
