import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { driveDashboardApi } from '../../services/drive.api';
import { showToast } from '../../utils/toast';
import type { CollegeAnalysisResponse } from '../../types/TA_Recruiter/Drive/dashboard.types';
import type { AppError } from '../../services/api.error';
import '../../css/TA_Recruiter/InstituteAnalytics.css';

const SORT_OPTIONS: { label: string; key: keyof CollegeAnalysisResponse; variant: string }[] = [
  { label: 'Applied', key: 'totalAppliedCount', variant: 'applied' },
  { label: 'Selected', key: 'selectedCount', variant: 'selected' },
  { label: 'Rejected', key: 'rejectedCount', variant: 'rejected' },
  { label: 'Dropped', key: 'droppedCount', variant: 'dropped' },
  { label: 'Accepted', key: 'acceptedCount', variant: 'accepted' },
  { label: 'Joined', key: 'joinedCount', variant: 'joined' },
];

interface InstituteAnalyticsProps {
  cycleId: number;
  selectedCollegeId: number | null;
  onSelectedCollegeIdChange: React.Dispatch<React.SetStateAction<number | null>>;
}

function InstituteAnalytics({ cycleId, selectedCollegeId, onSelectedCollegeIdChange }: InstituteAnalyticsProps) {
  const [colleges, setColleges] = useState<CollegeAnalysisResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<keyof CollegeAnalysisResponse | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const sortedColleges = useMemo(() => {
    if (!sortBy) return colleges;
    return [...colleges].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));
  }, [colleges, sortBy]);

  const loadCollegeAnalysis = useCallback(async () => {
      setLoading(true);
      try {
        const res = await driveDashboardApi.getCollegeAnalysis(cycleId);
        if (res.success && res.data) {
          setColleges(res.data);
          onSelectedCollegeIdChange((previousSelectedCollegeId) => {
            if (res.data.length === 0) return null;

            const hasPreviousSelection = previousSelectedCollegeId !== null &&
              res.data.some((college) => college.instituteId === previousSelectedCollegeId);

            return hasPreviousSelection ? previousSelectedCollegeId : res.data[0].instituteId;
          });
        } else {
          showToast(res.message || 'Failed to load college analysis', 'error');
        }
      } catch (err: unknown) {
        const error = err as AppError;
        showToast(error.message || 'Failed to load college analysis', 'error');
      } finally {
        setLoading(false);
      }
    }, [cycleId, onSelectedCollegeIdChange]);

  useEffect(() => {
    loadCollegeAnalysis();
  }, [loadCollegeAnalysis]);

  useEffect(() => {
    if (selectedCollegeId !== null && colleges.length > 0) {
      const element = cardRefs.current.get(selectedCollegeId);
      if (element) {
        const frameId = window.requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        return () => window.cancelAnimationFrame(frameId);
      }
    }
  }, [selectedCollegeId, colleges]);

  const selected = useMemo(
    () => colleges.find((college) => college.instituteId === selectedCollegeId) ?? null,
    [colleges, selectedCollegeId]
  );

  const funnelLayers = useMemo(
    () => selected
      ? [
          { label: 'Applied', value: selected.totalAppliedCount, variant: 'funnel-applied' },
          { label: 'Selected', value: selected.selectedCount, variant: 'funnel-selected' },
          { label: 'Rejected', value: selected.rejectedCount, variant: 'funnel-rejected' },
          { label: 'Dropped', value: selected.droppedCount, variant: 'funnel-dropped' },
          { label: 'Accepted', value: selected.acceptedCount, variant: 'funnel-accepted' },
          { label: 'Joined', value: selected.joinedCount, variant: 'funnel-joined' },
        ]
      : [],
    [selected]
  );

  const maxVal = selected ? Math.max(selected.totalAppliedCount, 1) : 1;

  return (
    <div className="institute-section">
      <div className="institute-header">
        <h3 className="institute-title">Institute Analytics</h3>
        <div className="institute-sort-chips">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`institute-sort-chip institute-sort-chip-${opt.variant}${sortBy === opt.key ? ' institute-sort-chip-active' : ''}`}
              onClick={() => setSortBy(prev => prev === opt.key ? null : opt.key)}
            >
              {opt.label}
              <svg className="institute-sort-arrow" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="institute-loading">Loading institute data...</div>}

      {!loading && colleges.length === 0 && (
        <div className="institute-empty">No institute data available for this cycle.</div>
      )}

      {!loading && colleges.length > 0 && (
        <div className="institute-layout">
          {/* Left: College cards */}
          <div className="institute-list">
            {sortedColleges.map(college => (
              <div
                key={college.instituteId}
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(college.instituteId, el);
                  } else {
                    cardRefs.current.delete(college.instituteId);
                  }
                }}
                className={`institute-card${selectedCollegeId === college.instituteId ? ' institute-card-active' : ''}`}
                onClick={() => onSelectedCollegeIdChange(college.instituteId)}
              >
                <div className="institute-card-name">{college.instituteName}</div>
                <div className="institute-card-stats">
                  <span className="institute-stat">
                    Applied: <strong>{college.totalAppliedCount}</strong>
                  </span>
                  <span className="institute-stat">
                    Selected: <strong>{college.selectedCount}</strong>
                  </span>
                  <span className="institute-stat">
                    Joined: <strong>{college.joinedCount}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Funnel for selected college */}
          <div className="institute-funnel-panel">
            {!selected ? (
              <div className="institute-funnel-empty">Select a college to view its funnel</div>
            ) : (
              <>
                <div className="institute-funnel-title">{selected.instituteName}</div>
                <div className="institute-funnel-extra">
                  <span className="institute-extra-chip">
                    Not Joined: <strong>{selected.notJoinedCount}</strong>
                  </span>
                  <span className="institute-extra-chip">
                    Offer Rejected: <strong>{selected.offerRejectedCount}</strong>
                  </span>
                </div>
                <div className="institute-funnel-bars">
                  {funnelLayers.map(layer => {
                    const pct = Math.max((layer.value / maxVal) * 100, 8);
                    return (
                      <div className={`institute-funnel-layer ${layer.variant}`} key={layer.label}>
                        <div className="institute-funnel-label">{layer.label}</div>
                        <div className="institute-funnel-bar-track">
                          <div className="institute-funnel-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="institute-funnel-bar-value">{layer.value}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InstituteAnalytics;
