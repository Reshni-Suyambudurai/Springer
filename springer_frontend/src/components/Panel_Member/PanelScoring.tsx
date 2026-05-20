import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Card, Typography, Stack, Chip, Button, FormControl, Select, MenuItem } from "@mui/material";
import {
  Grading as GradingIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import type { DriveAssignmentResponse } from "../../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import type { RoundTemplateResponse } from "../../types/TA_Recruiter/Drive/roundTemplate.types";
import type { CandidateEvaluationResponse } from "../../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";
import { candidateEvaluationApi } from "../../services/driveschedule.api";
import { tokenstore } from "../../auth/tokenstore";
import { showToast } from "../../utils/toast";
import type { AppError } from "../../services/api.error";
import "../../css/Panel_Member/PanelScoring.css";

interface SectionConfig {
  sectionName: string;
  outOf: number;
}

interface PanelScoringState {
  assignment: DriveAssignmentResponse;
  roundTemplate: RoundTemplateResponse;
  evaluation?: CandidateEvaluationResponse;
}

const PanelScoring = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PanelScoringState | null;

  const existingEval = state?.evaluation;
  const isReadOnly = !!existingEval && state?.assignment.status !== "PLANNED" && state?.assignment.status !== "DRAFT" && state?.assignment.status !== "HOLD";

  // Parse sections array from roundTemplate
  const sections: SectionConfig[] = useMemo(() => {
    if (!state?.roundTemplate?.sections) return [];
    const raw = state.roundTemplate.sections;
    if (Array.isArray(raw)) return raw as SectionConfig[];
    return [];
  }, [state]);

  // Pre-fill scores from existing evaluation's sectionScore if available
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    if (existingEval?.sectionScore && sections.length > 0) {
      const ss = existingEval.sectionScore as Record<string, number>;
      sections.forEach((sec, i) => { init[i] = ss[sec.sectionName] ?? 0; });
    } else {
      sections.forEach((_, i) => { init[i] = 0; });
    }
    return init;
  });

  const [review, setReview] = useState(existingEval?.review ?? "");
  const [reviewTouched, setReviewTouched] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<string>(existingEval?.evaluationStatus ?? "");
  const [submitting, setSubmitting] = useState(false);

  const totalScore = useMemo(
    () => Object.values(scores).reduce((sum, v) => sum + v, 0),
    [scores]
  );

  const maxTotal = useMemo(
    () => sections.reduce((sum, s) => sum + s.outOf, 0),
    [sections]
  );

  const [rawScores, setRawScores] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    sections.forEach((_, i) => { init[i] = String(scores[i]); });
    return init;
  });

  const handleScoreChange = (idx: number, value: number) => {
    setScores((prev) => ({ ...prev, [idx]: value }));
  };

  const isReviewValid = review.trim().length > 0;

  const handleSubmit = async (submitStatus: "SUBMIT" | "DRAFT") => {
    if (!state || !evaluationStatus) return;
    if (submitStatus === "SUBMIT" && !isReviewValid) return;
    const { assignment, roundTemplate } = state;
    if (assignment.status !== "PLANNED" && assignment.status !== "DRAFT" && assignment.status !== "HOLD") {
      showToast("Evaluation can only be saved for PLANNED, DRAFT, or HOLD assignments", "error");
      return;
    }
    const user = tokenstore.getUser();
    if (!user) {
      showToast("User session not found. Please log in again.", "error");
      return;
    }
    const sectionScore: Record<string, number> = {};
    sections.forEach((sec, idx) => {
      sectionScore[sec.sectionName] = scores[idx];
    });
    setSubmitting(true);
    try {
      const res = await candidateEvaluationApi.createEvaluation({
        applicationId: assignment.applicationId,
        roundConfigId: roundTemplate.roundConfigId,
        score: totalScore,
        sectionScore,
        review: review.trim(),
        evaluationStatus,
        reviewedBy: user.userId,
        status: submitStatus,
      });
      showToast(res.message, "success");
      navigate(-1);
    } catch (err) {
      showToast((err as AppError).message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!state) {
    return (
      <Box className="t-page">
        <Card className="t-card">
          <Box className="t-loading">
            <GradingIcon className="t-empty-icon" />
            <Typography className="t-empty-text">
              No assignment data found. Please go back and select an assignment.
            </Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  const { assignment, roundTemplate } = state;

  return (
    <Box className="t-page">
      <Card className="t-card">
        <Box className="t-header">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box className="t-icon-box">
              <GradingIcon className="ps-header-icon" />
            </Box>
            <Stack>
              <Typography className="t-page-title">Panel Scoring</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className="t-separator" />

        <Box className="t-body">
          <Box className="ps-layout">
            {/* LEFT COLUMN — Wrapped in one card */}
            <Box className="ps-col-left">
              <Box className="ps-left-card">
                {/* Candidate Info */}
                <Box className="ps-section">
                  <Typography className="ps-section-title">Candidate Details</Typography>
                  <Box className="ps-candidate-header">
                    <Box className="ps-avatar">
                      <PersonIcon className="ps-avatar-icon" />
                    </Box>
                    <Stack>
                      <Typography className="ps-candidate-name">{assignment.candidateName}</Typography>
                    </Stack>
                  </Box>
                  <Box className="ps-detail-grid">
                    <Box className="ps-detail-item">
                      <Typography className="ps-detail-label">Drive</Typography>
                      <Typography className="ps-detail-value">{assignment.driveName}</Typography>
                    </Box>
                    <Box className="ps-detail-item">
                      <Typography className="ps-detail-label">Round</Typography>
                      <Chip label={roundTemplate.roundName} size="small" className="ps-round-chip" />
                    </Box>
                    <Box className="ps-detail-item">
                      <Typography className="ps-detail-label">Status</Typography>
                      <Chip label={assignment.status} size="small" className="t-chip-info ps-chip-contained" />
                    </Box>
                    <Box className="ps-detail-item">
                      <Typography className="ps-detail-label">Assigned By</Typography>
                      <Typography className="ps-detail-value">{assignment.createdByName || "—"}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box className="ps-divider" />

                {/* Round Configuration */}
                <Box className="ps-section">
                  <Typography className="ps-section-title">Round Configuration</Typography>
                  <Box className="ps-stats-row">
                    <Box className="ps-stat-card">
                      <Typography className="ps-stat-value">{roundTemplate.roundNo}</Typography>
                      <Typography className="ps-stat-label">Round No</Typography>
                    </Box>
                    <Box className="ps-stat-card">
                      <Typography className="ps-stat-value">{roundTemplate.outoffScore}</Typography>
                      <Typography className="ps-stat-label">Max Score</Typography>
                    </Box>
                    <Box className="ps-stat-card">
                      <Typography className="ps-stat-value">{roundTemplate.minScore}</Typography>
                      <Typography className="ps-stat-label">Min Score</Typography>
                    </Box>
                    <Box className="ps-stat-card">
                      <Typography className="ps-stat-value">{roundTemplate.weightage}%</Typography>
                      <Typography className="ps-stat-label">Weightage</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* RIGHT COLUMN — Scoring */}
            <Box className="ps-col-right">
              <Box className="ps-right-card">
                {/* Title + Total Score inline */}
                <Box className="ps-right-header">
                  <Typography className="ps-section-title">Score Allocation</Typography>
                  <Box className="ps-total-badge">
                    <Typography className="ps-total-value">{totalScore}</Typography>
                    <Typography className="ps-total-outof">/ {maxTotal}</Typography>
                  </Box>
                </Box>

                {sections.length > 0 ? (
                  <>
                    {/* Compact section sliders */}
                    <Box className="ps-scoring-list">
                      {sections.map((sec, idx) => (
                        <Box key={idx} className="ps-score-row">
                          <Typography className="ps-score-name">{sec.sectionName}</Typography>
                          <Box className="ps-score-input-wrap">
                            <input
                              type="text"
                              inputMode="numeric"
                              className="ps-score-input"
                              value={rawScores[idx] ?? "0"}
                              disabled={isReadOnly}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, "");
                                const cleaned = raw === "" ? "" : String(parseInt(raw, 10));
                                setRawScores((prev) => ({ ...prev, [idx]: cleaned }));
                                const val = cleaned === "" ? 0 : parseInt(cleaned, 10);
                                handleScoreChange(idx, Math.min(val, sec.outOf));
                              }}
                              onBlur={() => {
                                setRawScores((prev) => ({ ...prev, [idx]: String(scores[idx]) }));
                              }}
                            />
                          </Box>
                          <Typography className="ps-score-badge">
                            <span className="ps-score-outof">/ {sec.outOf}</span>
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Status dropdown — inline */}
                    <Box className="ps-status-section">
                      <Typography className="ps-status-label">Evaluation Status *</Typography>
                      <FormControl size="small" className="ps-status-select">
                        <Select
                          value={evaluationStatus}
                          onChange={(e) => setEvaluationStatus(e.target.value)}
                          displayEmpty
                          disabled={isReadOnly}
                        >
                          <MenuItem value="" disabled>Select status</MenuItem>
                          <MenuItem value="PASS">Pass</MenuItem>
                          <MenuItem value="FAIL">Fail</MenuItem>
                        
                          <MenuItem value="HOLD">Hold</MenuItem>
                          <MenuItem value="ABSENT">Absent</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Review textarea — bottom */}
                    <Box className="ps-review-section">
                      <Typography className="ps-review-label">Review Comments *</Typography>
                      <textarea
                        className={`ps-review-textarea ${reviewTouched && !isReviewValid ? "ps-review-error" : ""}`}
                        placeholder="Enter your evaluation review here..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        onBlur={() => setReviewTouched(true)}
                        rows={3}
                        readOnly={isReadOnly}
                      />
                    </Box>

                    {/* Action Buttons */}
                    {!isReadOnly && (
                    <Box className="ps-action-btns">
                      <Button
                        className="ps-btn-draft"
                        disabled={!evaluationStatus || submitting}
                        onClick={() => handleSubmit("DRAFT")}
                      >
                        {submitting ? "Saving..." : "Draft"}
                      </Button>
                      <Button
                        className="ps-btn-submit"
                        disabled={!isReviewValid || !evaluationStatus || submitting}
                        onClick={() => handleSubmit("SUBMIT")}
                      >
                        {submitting ? "Submitting..." : "Submit"}
                      </Button>
                    </Box>
                    )}
                  </>
                ) : (
                  <Box className="ps-sections-empty">
                    <GradingIcon className="ps-empty-icon" />
                    <Typography className="ps-empty-text">No sections configured</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default PanelScoring;
