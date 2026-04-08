
import { useEffect, useState, useMemo } from 'react';
import { hiringCycleApi } from '../../services/hiring.api';
import { driveDashboardApi } from '../../services/drive.api';
import { showToast } from '../../utils/toast';
import type { HiringCycleSummaryResponse } from '../../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { DriveDashboardResponse, InstituteSummary } from '../../types/TA_Recruiter/Drive/dashboard.types';
import '../../css/TA_Recruiter/DashboardTAR.css';

type SortKey = 'totalCandidates' | 'selectedCount' | 'joinedCount' | 'rejectedCount';

function DashboardTAR() {
  const [cycles, setCycles] = useState<HiringCycleSummaryResponse[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<DriveDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInstituteId, setSelectedInstituteId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('totalCandidates');

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

  // Fetch dashboard when cycle changes
  useEffect(() => {
    if (!selectedCycleId) return;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await driveDashboardApi.getDriveSummary(selectedCycleId);
        if (res.success && res.data) {
          setDashboard(res.data);
          setSelectedInstituteId(null);
        } else {
          showToast(res.message || 'Failed to load drive summary', 'error');
          setDashboard(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load drive summary';
        showToast(msg, 'error');
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedCycleId]);

  const sortedInstitutes = useMemo(() => {
    if (!dashboard?.instituteSummaries) return [];
    return [...dashboard.instituteSummaries].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [dashboard, sortKey]);

  const activeInstitute: InstituteSummary | null = useMemo(() => {
    if (!sortedInstitutes.length) return null;
    if (selectedInstituteId != null) {
      return sortedInstitutes.find(i => i.instituteId === selectedInstituteId) || sortedInstitutes[0];
    }
    return sortedInstitutes[0];
  }, [sortedInstitutes, selectedInstituteId]);

  const selectedCycle = cycles.find(c => c.cycleId === selectedCycleId);

  const funnelStages = useMemo(() => {
    if (!activeInstitute) return [];
    const total = activeInstitute.totalCandidates || 1;
    return [
      { label: 'Total Applied', value: activeInstitute.totalCandidates, pct: 100, className: 'dashboard-funnel-applied' },
      { label: 'Selected', value: activeInstitute.selectedCount, pct: Math.round((activeInstitute.selectedCount / total) * 100), className: 'dashboard-funnel-selected' },
      { label: 'Accepted', value: activeInstitute.acceptedCount, pct: Math.round((activeInstitute.acceptedCount / total) * 100), className: 'dashboard-funnel-accepted' },
      { label: 'Joined', value: activeInstitute.joinedCount, pct: Math.round((activeInstitute.joinedCount / total) * 100), className: 'dashboard-funnel-joined' },
      { label: 'Rejected', value: activeInstitute.rejectedCount, pct: Math.round((activeInstitute.rejectedCount / total) * 100), className: 'dashboard-funnel-rejected' },
      { label: 'Dropped', value: activeInstitute.droppedCount, pct: Math.round((activeInstitute.droppedCount / total) * 100), className: 'dashboard-funnel-dropped' },
    ];
  }, [activeInstitute]);

  const funnelMax = useMemo(() => {
    if (!funnelStages.length) return 1;
    return Math.max(...funnelStages.map(s => s.value), 1);
  }, [funnelStages]);

  const locationEntries = useMemo(() => {
    if (!dashboard?.driveLocationMap) return [];
    return Object.entries(dashboard.driveLocationMap);
  }, [dashboard]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Drive Dashboard</h2>
        <div className="dashboard-header-right">
          <select
            className="dashboard-cycle-select"
            value={selectedCycleId ?? ''}
            onChange={e => setSelectedCycleId(Number(e.target.value))}
          >
            {cycles.map(c => (
              <option key={c.cycleId} value={c.cycleId}>
                {c.cycleName} ({c.cycleYear})
              </option>
            ))}
          </select>
          {selectedCycle && (
            <span className={`dashboard-cycle-status dashboard-cycle-status-${selectedCycle.status.toLowerCase()}`}>
              {selectedCycle.status}
            </span>
          )}
        </div>
      </div>

      {loading && <div className="dashboard-loading">Loading dashboard...</div>}

      {!loading && dashboard && (
        <div className="dashboard-content">
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

          <div className="dashboard-body">
            <div className="dashboard-body-main">
              {locationEntries.length > 0 && (
                <div className="dashboard-locations-section">
                  <h3 className="dashboard-section-title">Drives by Location</h3>
                  <div className="dashboard-locations-grid">
                    {locationEntries.map(([loc, count]) => (
                      <div className="dashboard-location-chip" key={loc}>
                        <span className="dashboard-location-name">{loc}</span>
                        <span className="dashboard-location-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeInstitute && (
                <div className="dashboard-funnel-section">
                  <div className="dashboard-funnel-header">
                    <h3 className="dashboard-section-title">Institute Funnel</h3>
                    <span className="dashboard-funnel-institute-name">{activeInstitute.instituteName}</span>
                  </div>
                  <div className="dashboard-funnel-chart">
                    {funnelStages.map((stage) => {
                      const widthPct = Math.max((stage.value / funnelMax) * 100, 16);
                      return (
                        <div className="dashboard-funnel-row" key={stage.label}>
                          <span className="dashboard-funnel-label">{stage.label}</span>
                          <div className="dashboard-funnel-bar-wrap">
                            <div
                              className={`dashboard-funnel-bar ${stage.className}`}
                              style={{ width: `${widthPct}%` }}
                            >
                              <span className="dashboard-funnel-bar-value">{stage.value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="dashboard-college-sidebar">
              <div className="dashboard-college-top">
                <h3 className="dashboard-section-title">Institutes</h3>
                <div className="dashboard-college-sort">
                  <label className="dashboard-college-sort-label">Sort by</label>
                  <select
                    className="dashboard-college-sort-select"
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value as SortKey)}
                  >
                    <option value="totalCandidates">Total Applied</option>
                    <option value="selectedCount">Selected</option>
                    <option value="joinedCount">Joined</option>
                    <option value="rejectedCount">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="dashboard-college-table-wrap">
                <table className="dashboard-college-table">
                  <thead>
                    <tr>
                      <th className="dashboard-college-th">Institute Name</th>
                      <th className="dashboard-college-th dashboard-college-th-count">Count</th>
                    </tr>
                  </thead>
                </table>
                <div className="dashboard-college-tbody-scroll">
                  <table className="dashboard-college-table">
                    <tbody>
                      {sortedInstitutes.map(inst => (
                        <tr
                          key={inst.instituteId}
                          className={`dashboard-college-tr ${activeInstitute?.instituteId === inst.instituteId ? 'dashboard-college-tr-active' : ''}`}
                          onClick={() => setSelectedInstituteId(inst.instituteId)}
                        >
                          <td className="dashboard-college-td-name">{inst.instituteName}</td>
                          <td className="dashboard-college-td-count">{inst[sortKey]}</td>
                        </tr>
                      ))}
                      {sortedInstitutes.length === 0 && (
                        <tr>
                          <td className="dashboard-college-empty" colSpan={2}>No institutes found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !dashboard && selectedCycleId && (
        <div className="dashboard-empty">No data available for this cycle.</div>
      )}
    </div>
  );
}

export default DashboardTAR;