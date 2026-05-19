import { useState } from 'react';
import type { InternDashboardData } from '../../../types/Academy/intern.types';
import { downloadScorecard } from '../../../utils/scorecardPdf';
import '../../../css/Academy/Intern/InternScores.css';

const scoreColor = (score: number | null, min?: number) => {
  if (score == null) return 'var(--color-text-secondary)';
  if (min != null) {
    if (score < min)           return 'var(--color-error)';
    if (score < min + 15)      return 'var(--color-warning-text)';
    if (score >= min + 15)     return 'var(--color-success-dark)';
  }
  // fallback when no minScore
  if (score >= 85) return 'var(--color-success-dark)';
  if (score >= 60) return 'var(--color-warning-text)';
  return 'var(--color-error)';
};

const rankLabel = (r: number) => {
  if (r % 100 >= 11 && r % 100 <= 13) return `${r}th`;
  switch (r % 10) {
    case 1: return `${r}st`;
    case 2: return `${r}nd`;
    case 3: return `${r}rd`;
    default: return `${r}th`;
  }
};

const rankMedal = (r: number) =>
  r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : null;

const PERF_CLASS: Record<string, string> = {
  EXCELLENT:     'ins-perf ins-perf--excellent',
  GOOD:          'ins-perf ins-perf--good',
  AVERAGE:       'ins-perf ins-perf--average',
  BELOW_AVERAGE: 'ins-perf ins-perf--below',
  NEED_LEARNING: 'ins-perf ins-perf--below',
};

type View = 'overview' | 'course-comparison' | 'leaderboard';

const InternScores = ({ data }: { data: InternDashboardData }) => {
  const { courseScores, overallWeightedScore, rank, totalInBatch,
          courseComparisons, detailedLeaderboard } = data;
  const [view, setView] = useState<View>('overview');

  const [lbSearch, setLbSearch] = useState('');
  const [lbCourse, setLbCourse] = useState('overall');
  const [lbSort, setLbSort]     = useState<'asc' | 'desc'>('desc');

  const courseOptions = detailedLeaderboard?.[0]?.courseScores ?? [];

  const filteredLb = (detailedLeaderboard ?? []).filter(bm =>
    !lbSearch.trim() || bm.candidateName.toLowerCase().includes(lbSearch.toLowerCase())
  );

  const sortedLb = [...filteredLb].sort((a, b) => {
    let aVal: number, bVal: number;
    if (lbCourse === 'overall') {
      aVal = a.weightedScore ?? 0;
      bVal = b.weightedScore ?? 0;
    } else {
      const cid = Number(lbCourse);
      aVal = a.courseScores.find(c => c.courseId === cid)?.score ?? 0;
      bVal = b.courseScores.find(c => c.courseId === cid)?.score ?? 0;
    }
    return lbSort === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Normalize a leaderboard course score for display (comm scores are raw sums)
  const normalizeLbScore = (score: number | null | undefined, courseId: number): number | null => {
    if (score == null) return null;
    const courseInfo = courseOptions.find(c => c.courseId === courseId);
    void courseInfo; // used for context only — actual normalization uses myCs below
    // Use courseScores from the intern's own data to get maxScore
    const myCs = data.courseScores.find(c => c.courseId === courseId);
    if (myCs?.isCommunication && myCs.maxScore) {
      return Math.round((score / myCs.maxScore) * 100);
    }
    return Math.round(score);
  };

  return (
    <div className="ins-page">

      {/* Header */}
      <div className="ins-header">
        <div>
          <h3 className="ins-title">My Scores</h3>
          <p className="ins-subtitle">
            Rank {rankLabel(rank)} out of {totalInBatch} &middot; Overall Score: {overallWeightedScore != null ? overallWeightedScore.toFixed(1) : '—'} / 100
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="ins-view-toggle">
            {(['overview', 'course-comparison', 'leaderboard'] as View[]).map(v => (
              <button key={v} className={`ins-toggle-btn ${view === v ? 'ins-toggle-btn--active' : ''}`}
                onClick={() => setView(v)}>
                {v === 'overview' ? 'My Scores' : v === 'course-comparison' ? 'Batch Comparison' : 'Leaderboard'}
              </button>
            ))}
          </div>
          <button className="ins-download-btn" onClick={() => downloadScorecard(data)}
            title="Download your scorecard as PDF">
            ⬇ Download Scorecard
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ins-cards-row">
        <div className="ins-card">
          <span className="ins-card-label">Your Rank</span>
          <span className="ins-card-value">{rankLabel(rank)}</span>
          <span className="ins-card-sub">out of {totalInBatch} students</span>
        </div>
        <div className="ins-card">
          <span className="ins-card-label">Overall Score</span>
          <span className="ins-card-value" style={{ color: scoreColor(overallWeightedScore) }}>
            {overallWeightedScore != null ? overallWeightedScore.toFixed(1) : '—'}
          </span>
          <span className="ins-card-sub">technical / 100</span>
        </div>
        <div className="ins-card">
          <span className="ins-card-label">Communication</span>
          <span className="ins-card-value">
            {(() => {
              const commScores = courseScores.filter(c => c.isCommunication && c.score != null && c.maxScore);
              if (commScores.length === 0) return '—';
              const avg = commScores.reduce((s, c) => s + Math.round((c.score! / c.maxScore) * 100), 0) / commScores.length;
              return avg.toFixed(1);
            })()}
          </span>
          <span className="ins-card-sub">avg / 100</span>
        </div>
        <div className="ins-card">
          <span className="ins-card-label">Courses Scored</span>
          <span className="ins-card-value">{courseScores.filter(c => c.score != null).length}</span>
          <span className="ins-card-sub">out of {courseScores.length}</span>
        </div>
        <div className="ins-card">
          <span className="ins-card-label">Batch Average</span>
          <span className="ins-card-value">
            {courseComparisons && courseComparisons.length > 0
              ? (courseComparisons.reduce((s, c) => s + c.batchAverage, 0) / courseComparisons.length).toFixed(1)
              : '—'}
          </span>
          <span className="ins-card-sub">across all courses</span>
        </div>
      </div>

      {/* VIEW: My Scores */}
      {view === 'overview' && (
        <div className="ins-section">
          <p className="ins-section-title">Course Scores</p>
          {courseScores.length === 0 ? (
            <div className="ins-empty">No courses linked to your batch yet.</div>
          ) : (
            <table className="ins-table">
              <thead>
                <tr className="ins-table-head">
                  <th className="ins-th">Course</th>
                  <th className="ins-th ins-th--center">Your Score</th>
                  <th className="ins-th ins-th--center">Min Score</th>
                  <th className="ins-th ins-th--center">Weight</th>
                  <th className="ins-th">Progress</th>
                  <th className="ins-th ins-th--center">Status</th>
                </tr>
              </thead>
              <tbody>
                {courseScores.map(c => {
                  const color = scoreColor(c.score, c.minScore);
                  // Bar %: use normalized score (0-100) for both technical and comm
                  const normalizedScore = c.score != null
                    ? c.isCommunication && c.maxScore
                      ? Math.round((c.score / c.maxScore) * 100)
                      : c.score
                    : 0;
                  const barPct = Math.min(normalizedScore, 100);
                  // Display: normalize comm score to /100, technical is already /100
                  const scoreDisplay = c.score != null
                    ? c.isCommunication && c.maxScore
                      ? `${Math.round((c.score / c.maxScore) * 100)} / 100`
                      : `${c.score} / 100`
                    : '—';
                  return (
                    <tr key={c.courseId} className="ins-table-row">
                      <td className="ins-td">
                        <span className="ins-course-name">{c.courseName}</span>
                        {c.isCommunication && (
                          <span className="ins-comm-badge">Communication</span>
                        )}
                        {c.review && <span className="ins-review">{c.review}</span>}
                        {/* Communication sub-score breakdown */}
                        {c.isCommunication && c.communicationBreakdown && (() => {
                          try {
                            const fields: { name: string; score: number; maxScore: number }[] =
                              JSON.parse(c.communicationBreakdown);
                            return (
                              <div className="ins-comm-breakdown">
                                {fields.map(f => (
                                  <span key={f.name} className="ins-comm-field">
                                    {f.name}: <strong>{f.score}/{f.maxScore}</strong>
                                  </span>
                                ))}
                              </div>
                            );
                          } catch { return null; }
                        })()}
                      </td>
                      <td className="ins-td ins-td--center">
                        <span className="ins-score-val" style={{ color }}>
                          {scoreDisplay}
                        </span>
                      </td>
                      <td className="ins-td ins-td--center"><span className="ins-muted">{c.minScore}</span></td>
                      <td className="ins-td ins-td--center">
                        <span className="ins-muted">
                          {c.isCommunication ? '—' : `${c.weightage}%`}
                        </span>
                      </td>
                      <td className="ins-td ins-td--bar">
                        <div className="ins-bar-bg">
                          <div className="ins-bar-fill" style={{ width: `${barPct}%`, background: color }} />
                        </div>
                      </td>
                      <td className="ins-td ins-td--center">
                        {c.status
                          ? <span className={PERF_CLASS[c.status] ?? 'ins-perf'}>{c.status.replace('_', ' ')}</span>
                          : <span className="ins-muted">Not scored</span>}
                        {(() => {
                          if (c.score == null) return null;
                          const normalized = c.isCommunication && c.maxScore
                            ? Math.round((c.score / c.maxScore) * 100)
                            : c.score;
                          return normalized < c.minScore
                            ? <span className="ins-warn-badge" style={{ display: 'block', marginTop: 2 }}>Below min</span>
                            : null;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VIEW: Batch Comparison */}
      {view === 'course-comparison' && (
        <div className="ins-section">
          <p className="ins-section-title">Course-wise Batch Comparison</p>
          <p className="ins-section-sub">See how you compare with your batchmates in each course.</p>
          {!courseComparisons || courseComparisons.length === 0 ? (
            <div className="ins-empty">No course comparison data available yet.</div>
          ) : (
            <table className="ins-table">
              <thead>
                <tr className="ins-table-head">
                  <th className="ins-th">Course</th>
                  <th className="ins-th ins-th--center">Your Score</th>
                  <th className="ins-th ins-th--center">Batch Avg</th>
                  <th className="ins-th ins-th--center">Batch Best</th>
                  <th className="ins-th ins-th--center">Your Rank</th>
                  <th className="ins-th">Gap to Best</th>
                </tr>
              </thead>
              <tbody>
                {courseComparisons.map(c => {
                  const gap = c.myScore != null ? c.batchHighest - c.myScore : null;
                  const aboveAvg = c.myScore != null && c.myScore >= c.batchAverage;
                  return (
                    <tr key={c.courseId} className="ins-table-row">
                      <td className="ins-td">
                        <span className="ins-course-name">{c.courseName}</span>
                        <span className="ins-muted">{c.weightage ? `${c.weightage}% weight` : 'Communication'}</span>
                      </td>
                      <td className="ins-td ins-td--center">
                        <span className="ins-score-val" style={{ color: scoreColor(c.myScore, c.minScore) }}>
                          {c.myScore != null ? c.myScore.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="ins-td ins-td--center">
                        <span className={`ins-score-val ${aboveAvg ? 'ins-above-avg' : 'ins-below-avg'}`}>
                          {c.batchAverage.toFixed(1)}
                        </span>
                      </td>
                      <td className="ins-td ins-td--center">
                        <span className="ins-score-val ins-best">{c.batchHighest.toFixed(1)}</span>
                      </td>
                      <td className="ins-td ins-td--center">
                        {c.myRankInCourse != null
                          ? <span className="ins-rank-badge">{rankLabel(c.myRankInCourse)} / {c.totalScoredInCourse}</span>
                          : <span className="ins-muted">Not scored</span>}
                      </td>
                      <td className="ins-td ins-td--bar">
                        {gap != null ? (
                          <div className="ins-gap-wrap">
                            <div className="ins-bar-bg">
                              <div className="ins-bar-fill"
                                style={{ width: `${Math.min((c.myScore! / c.batchHighest) * 100, 100)}%`, background: scoreColor(c.myScore, c.minScore) }} />
                            </div>
                            {gap > 0
                              ? <span className="ins-gap-text ins-gap-text--behind">-{gap.toFixed(1)}</span>
                              : <span className="ins-gap-text ins-gap-text--top">Top!</span>}
                          </div>
                        ) : <span className="ins-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {courseComparisons && courseComparisons.some(c => c.myScore != null && c.myScore < c.batchAverage) && (
            <div className="ins-tips-card">
              <p className="ins-tips-title">Areas to Improve</p>
              {courseComparisons
                .filter(c => c.myScore != null && c.myScore < c.batchAverage)
                .sort((a, b) => (a.batchAverage - (a.myScore ?? 0)) - (b.batchAverage - (b.myScore ?? 0)))
                .map(c => (
                  <div key={c.courseId} className="ins-tip-row">
                    <span className="ins-tip-course">{c.courseName}</span>
                    <span className="ins-tip-detail">
                      Your score {c.myScore?.toFixed(1)} is {(c.batchAverage - c.myScore!).toFixed(1)} below batch average ({c.batchAverage.toFixed(1)})
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: Leaderboard */}
      {view === 'leaderboard' && (
        <div className="ins-section">
          <p className="ins-section-title">Batch Leaderboard</p>

          <div className="ins-lb-controls">
            <input className="ins-lb-search" placeholder="Search by name..."
              value={lbSearch} onChange={e => setLbSearch(e.target.value)} />
            <select className="ins-lb-select" value={lbCourse} onChange={e => setLbCourse(e.target.value)}>
              <option value="overall">Sort by: Overall Score</option>
              {courseOptions.map(c => (
                <option key={c.courseId} value={String(c.courseId)}>{c.courseName}</option>
              ))}
            </select>
            <button className="ins-lb-sort-btn" onClick={() => setLbSort(s => s === 'desc' ? 'asc' : 'desc')}>
              {lbSort === 'desc' ? '↓ High to Low' : '↑ Low to High'}
            </button>
            <span className="ins-lb-count">{sortedLb.length} intern{sortedLb.length !== 1 ? 's' : ''}</span>
          </div>

          {!detailedLeaderboard || detailedLeaderboard.length === 0 ? (
            <div className="ins-empty">No leaderboard data available yet.</div>
          ) : sortedLb.length === 0 ? (
            <div className="ins-empty">No results found for "{lbSearch}".</div>
          ) : (
            <div className="ins-lb-cards">
              {sortedLb.map((bm, idx) => {
                const medal = rankMedal(bm.rank);
                const displayScore = lbCourse === 'overall'
                  ? bm.weightedScore
                  : (() => {
                      const raw = bm.courseScores.find(c => c.courseId === Number(lbCourse))?.score ?? null;
                      return normalizeLbScore(raw, Number(lbCourse));
                    })();
                const barPct = Math.min(displayScore ?? 0, 100);
                return (
                  <div key={idx} className={`ins-lb-card ${bm.isMe ? 'ins-lb-card--me' : ''}`}>
                    <div className="ins-lb-card-header">
                      <div className="ins-lb-card-rank">
                        {medal
                          ? <span className="ins-lb-medal">{medal}</span>
                          : <span className="ins-lb-rank-num">{bm.rank}</span>}
                        {bm.isMe && <span className="ins-you-badge">You</span>}
                      </div>
                      <div className="ins-lb-card-name">{bm.candidateName}</div>
                      {bm.performance && (
                        <span className={PERF_CLASS[bm.performance] ?? 'ins-perf'}>
                          {bm.performance.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="ins-lb-card-score-row">
                      <div className="ins-lb-card-score-block">
                        <span className="ins-lb-card-score-label">
                          {lbCourse === 'overall' ? 'Overall' : courseOptions.find(c => String(c.courseId) === lbCourse)?.courseName ?? 'Score'}
                        </span>
                        <span className="ins-lb-card-score-val" style={{ color: scoreColor(displayScore) }}>
                          {displayScore != null ? Math.round(displayScore) : '—'}
                        </span>
                        <div className="ins-bar-bg" style={{ marginTop: 4 }}>
                          <div className="ins-bar-fill"
                            style={{ width: `${barPct}%`, background: scoreColor(displayScore) }} />
                        </div>
                      </div>
                      <div className="ins-lb-card-att">
                        <span className="ins-lb-card-score-label">Attendance</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)',
                          color: bm.attendancePercentage < 75 ? 'var(--color-error)' : 'var(--color-success-dark)' }}>
                          {bm.attendancePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {bm.courseScores.length > 0 && (
                      <div className="ins-lb-course-grid">
                        {bm.courseScores.map(cs => {
                          const normScore = normalizeLbScore(cs.score, cs.courseId);
                          return (
                            <div key={cs.courseId}
                              className={`ins-lb-course-chip ${lbCourse === String(cs.courseId) ? 'ins-lb-course-chip--active' : ''}`}>
                              <span className="ins-lb-course-name">{cs.courseName}</span>
                              <span className="ins-lb-course-score" style={{ color: scoreColor(normScore) }}>
                                {normScore != null ? normScore : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default InternScores;
