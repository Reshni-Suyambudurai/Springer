import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Box, Typography, Card, Select, MenuItem, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BackButton from "../../Common/BackButton";
import { userApi } from "../../../services/hiring.api";
import { driveAssignmentApi } from "../../../services/driveschedule.api";
import { tokenstore } from "../../../auth/tokenstore";
import { showToast } from "../../../utils/toast";
import type { UserResponse } from "../../../types/auth.types";
import type { PanelAllocationStatusResponse } from "../../../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import "../../../css/TA_Recruiter/DriveProcess/PanelAllocation.css";

interface PanelCandidateNav {
  applicationId: number;
  candidateName: string;
  score: number;
  evaluationStatus: string;
}

interface PanelAllocationState {
  candidates: PanelCandidateNav[];
  roundNo: number;
  batchTime: string;
  driveName: string;
}

const PanelAllocation: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const location = useLocation();
  const navState = location.state as PanelAllocationState | null;

  const candidates = navState?.candidates || [];
  const roundNo = navState?.roundNo;
  const batchTime = navState?.batchTime;
  const driveName = navState?.driveName;

  const [panelMembers, setPanelMembers] = useState<UserResponse[]>([]);
  const [assignments, setAssignments] = useState<Record<number, number | "">>({});
  const [allocationStatus, setAllocationStatus] = useState<Record<number, PanelAllocationStatusResponse>>({});
  const [globalPanel, setGlobalPanel] = useState<number | "">("")
  const [submitting, setSubmitting] = useState(false);
  const [reassignFrom, setReassignFrom] = useState<number | "">("")
  const [reassignTo, setReassignTo] = useState<number | "">("")
  const [reassigning, setReassigning] = useState(false);

  // Track which panel row is being edited: key = "appId_panelIndex", value = {oldUserId, newUserId}
  const [editingPanel, setEditingPanel] = useState<Record<string, { oldUserId: number; newUserId: number | "" }>>({}); 

  // Extra panel allocations: per candidate, array of selected panel member IDs
  const [extraPanels, setExtraPanels] = useState<Record<number, (number | "")[]>>({});
  const [submittingExtra, setSubmittingExtra] = useState(false);

  // For round 3 (last round), don't increment; for others, +1
  const allocRoundNo = roundNo != null ? (roundNo === 3 ? roundNo : roundNo + 1) : undefined;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [panelRes, statusRes] = await Promise.all([
          userApi.getUsersByRoles([4]),
          driveId && roundNo && candidates.length > 0
            ? driveAssignmentApi.getAllocationStatus(
                Number(driveId),
                allocRoundNo!,
                candidates.map((c) => c.applicationId)
              )
            : Promise.resolve(null),
        ]);

        if (panelRes.data) setPanelMembers(panelRes.data.filter((u) => u.isActive));

        if (statusRes?.data) {
          const statusMap: Record<number, PanelAllocationStatusResponse> = {};
          for (const s of statusRes.data) {
            statusMap[s.applicationId] = s;
          }
          setAllocationStatus(statusMap);
        }
      } catch (err) {
        console.error("Failed to fetch panel data", err);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveId, roundNo, candidates.length]);

  const handleAssign = (applicationId: number, userId: number | "") => {
    setAssignments((prev) => ({ ...prev, [applicationId]: userId }));
  };

  const noneAllocated = candidates.length > 0 && candidates.every(
    (c) => !allocationStatus[c.applicationId]?.additionalPanels?.length
  );

  const handleGlobalAssign = (userId: number | "") => {
    setGlobalPanel(userId);
    if (userId === "") return;
    const updated: Record<number, number | ""> = {};
    for (const c of candidates) {
      updated[c.applicationId] = userId;
    }
    setAssignments(updated);
  };

  const newAssignedCount = Object.entries(assignments).filter(([appId, userId]) => {
    if (userId === "") return false;
    const status = allocationStatus[Number(appId)];
    const primaryUserId = status?.additionalPanels?.[0]?.userId;
    return !primaryUserId || primaryUserId !== userId;
  }).length;

  const handleSubmit = async () => {
    const user = tokenstore.getUser();
    if (!user || !driveId) return;

    const entries = Object.entries(assignments)
      .filter(([appId, userId]) => {
        if (userId === "") return false;
        const status = allocationStatus[Number(appId)];
        const primaryUserId = status?.additionalPanels?.[0]?.userId;
        return !primaryUserId || primaryUserId !== userId;
      })
      .map(([appId, userId]) => ({
        applicationId: Number(appId),
        userId: Number(userId),
      }));

    if (entries.length === 0) return;

    setSubmitting(true);
    try {
      const result = await driveAssignmentApi.bulkCreateAssignments({
        driveId: Number(driveId),
        roundNo: allocRoundNo,
        entries,
        status: "PLANNED",
        isActive: true,
        createdBy: user.userId,
      });
      const { successCount, failureCount } = result.data ?? { successCount: 0, failureCount: 0 };
      showToast(`Assigned: ${successCount} succeeded, ${failureCount} failed`, failureCount > 0 ? "error" : "success");
      if (successCount > 0) {
        // Refresh allocation status
        const statusRes = await driveAssignmentApi.getAllocationStatus(
          Number(driveId),
          allocRoundNo!,
          candidates.map((c) => c.applicationId)
        );
        if (statusRes?.data) {
          const statusMap: Record<number, PanelAllocationStatusResponse> = {};
          for (const s of statusRes.data) statusMap[s.applicationId] = s;
          setAllocationStatus(statusMap);
        }
        setAssignments({});
        setGlobalPanel("");
      }
    } catch {
      showToast("Failed to submit assignments", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Distinct panel members with PENDING status across all candidates (for reassign "From" dropdown)
  const assignedPanelMembers = panelMembers.filter((m) =>
    candidates.some((c) => {
      const panels = allocationStatus[c.applicationId]?.additionalPanels || [];
      return panels.some((p) => p.userId === m.userId && !p.evaluated);
    })
  );

  // Count how many PENDING assignments for reassignFrom across all candidates
  const reassignableCount = reassignFrom
    ? candidates.filter((c) => {
        const panels = allocationStatus[c.applicationId]?.additionalPanels || [];
        return panels.some((p) => p.userId === reassignFrom && !p.evaluated);
      }).length
    : 0;

  // Find conflict candidates: have reassignFrom PENDING but reassignTo already assigned
  const conflictIndices: number[] = [];
  const validReassignEntries: { applicationId: number; userId: number; replaceUserId: number }[] = [];
  if (reassignFrom && reassignTo && reassignFrom !== reassignTo) {
    candidates.forEach((c, idx) => {
      const panels = allocationStatus[c.applicationId]?.additionalPanels || [];
      const hasPendingFrom = panels.some((p) => p.userId === reassignFrom && !p.evaluated);
      if (!hasPendingFrom) return;
      const hasToAlready = panels.some((p) => p.userId === reassignTo);
      if (hasToAlready) {
        conflictIndices.push(idx + 1);
      } else {
        validReassignEntries.push({
          applicationId: c.applicationId,
          userId: Number(reassignTo),
          replaceUserId: Number(reassignFrom),
        });
      }
    });
  }

  const handleBulkReassign = async () => {
    if (!reassignFrom || !reassignTo || reassignFrom === reassignTo) return;
    const user = tokenstore.getUser();
    if (!user || !driveId) return;

    if (validReassignEntries.length === 0) {
      showToast("All candidates already have this panel assigned", "error");
      return;
    }

    setReassigning(true);
    try {
      const result = await driveAssignmentApi.bulkCreateAssignments({
        driveId: Number(driveId),
        roundNo: allocRoundNo,
        entries: validReassignEntries,
        status: "PLANNED",
        isActive: true,
        createdBy: user.userId,
      });
      const { successCount, failureCount } = result.data ?? { successCount: 0, failureCount: 0 };
      showToast(
        `Reassigned: ${successCount} succeeded, ${failureCount} failed`,
        failureCount > 0 ? "error" : "success"
      );
      if (successCount > 0) {
        setReassignFrom("");
        setReassignTo("");
        // Refresh allocation status
        const statusRes = await driveAssignmentApi.getAllocationStatus(
          Number(driveId),
          allocRoundNo!,
          candidates.map((c) => c.applicationId)
        );
        if (statusRes?.data) {
          const statusMap: Record<number, PanelAllocationStatusResponse> = {};
          for (const s of statusRes.data) statusMap[s.applicationId] = s;
          setAllocationStatus(statusMap);
        }
      }
    } catch {
      showToast("Failed to reassign", "error");
    } finally {
      setReassigning(false);
    }
  };

  // Extra panel allocation logic
  const handleAddExtraPanel = (applicationId: number) => {
    setExtraPanels((prev) => ({
      ...prev,
      [applicationId]: [...(prev[applicationId] || []), ""],
    }));
  };

  const handleRemoveExtraPanel = (applicationId: number, index: number) => {
    setExtraPanels((prev) => {
      const arr = [...(prev[applicationId] || [])];
      arr.splice(index, 1);
      return { ...prev, [applicationId]: arr };
    });
  };

  const handleExtraPanelChange = (applicationId: number, index: number, userId: number | "") => {
    setExtraPanels((prev) => {
      const arr = [...(prev[applicationId] || [])];
      arr[index] = userId;
      return { ...prev, [applicationId]: arr };
    });
  };

  const extraAssignedCount = Object.values(extraPanels)
    .flat()
    .filter((v) => v !== "").length;

  // Count pending edits that actually changed
  const editedCount = Object.values(editingPanel).filter(
    (e) => e.newUserId !== "" && e.newUserId !== e.oldUserId
  ).length;

  const handleEditSubmit = async () => {
    const user = tokenstore.getUser();
    if (!user || !driveId) return;

    const entries: { applicationId: number; userId: number; replaceUserId: number }[] = [];
    for (const [key, edit] of Object.entries(editingPanel)) {
      if (edit.newUserId !== "" && edit.newUserId !== edit.oldUserId) {
        const appId = Number(key.split("_")[0]);
        entries.push({ applicationId: appId, userId: Number(edit.newUserId), replaceUserId: edit.oldUserId });
      }
    }

    if (entries.length === 0) return;

    setSubmitting(true);
    try {
      const result = await driveAssignmentApi.bulkCreateAssignments({
        driveId: Number(driveId),
        roundNo: allocRoundNo,
        entries,
        status: "PLANNED",
        isActive: true,
        createdBy: user.userId,
      });
      const { successCount, failureCount } = result.data ?? { successCount: 0, failureCount: 0 };
      showToast(`Updated: ${successCount} succeeded, ${failureCount} failed`, failureCount > 0 ? "error" : "success");
      if (successCount > 0) {
        setEditingPanel({});
        // Refresh
        const statusRes = await driveAssignmentApi.getAllocationStatus(
          Number(driveId),
          allocRoundNo!,
          candidates.map((c) => c.applicationId)
        );
        if (statusRes?.data) {
          const statusMap: Record<number, PanelAllocationStatusResponse> = {};
          for (const s of statusRes.data) statusMap[s.applicationId] = s;
          setAllocationStatus(statusMap);
        }
      }
    } catch {
      showToast("Failed to update panel assignment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // No longer block entirely — conflicts are skipped

  const handleExtraSubmit = async () => {
    const user = tokenstore.getUser();
    if (!user || !driveId) return;

    const entries: { applicationId: number; userId: number }[] = [];
    for (const [appId, panels] of Object.entries(extraPanels)) {
      for (const userId of panels) {
        if (userId !== "") {
          entries.push({ applicationId: Number(appId), userId: Number(userId) });
        }
      }
    }

    if (entries.length === 0) return;

    setSubmittingExtra(true);
    try {
      const result = await driveAssignmentApi.bulkCreateAssignments({
        driveId: Number(driveId),
        roundNo: allocRoundNo,
        entries,
        status: "PLANNED",
        isActive: true,
        createdBy: user.userId,
      });
      const { successCount, failureCount } = result.data ?? { successCount: 0, failureCount: 0 };
      showToast(`Extra Allocation: ${successCount} succeeded, ${failureCount} failed`, failureCount > 0 ? "error" : "success");
      if (successCount > 0) {
        setExtraPanels({});
        // Refresh allocation status
        const statusRes = await driveAssignmentApi.getAllocationStatus(
          Number(driveId),
          allocRoundNo!,
          candidates.map((c) => c.applicationId)
        );
        if (statusRes?.data) {
          const statusMap: Record<number, PanelAllocationStatusResponse> = {};
          for (const s of statusRes.data) statusMap[s.applicationId] = s;
          setAllocationStatus(statusMap);
        }
      }
    } catch {
      showToast("Failed to submit extra panel allocation", "error");
    } finally {
      setSubmittingExtra(false);
    }
  };

  const getCardClass = (appId: number) => {
    const status = allocationStatus[appId];
    const panels = status?.additionalPanels || [];
    const allEvaluated = panels.length > 0 && panels.every((p) => p.evaluated);
    if (allEvaluated) return "pa-card pa-card-evaluated";
    if (panels.length > 0) return "pa-card pa-card-allocated";
    if (assignments[appId]) return "pa-card pa-card-assigned";
    return "pa-card";
  };

  return (
    <Box className="pa-container">
      {/* Header */}
      <Card className="pa-header">
        <Box className="pa-header-left">
          <BackButton variant="header" />
          <Box className="pa-header-info">
            <Typography className="pa-title">
              Panel Allocation — {driveName}
            </Typography>
            <Typography className="pa-subtitle">
              Round {allocRoundNo ?? "—"} | Batch: {batchTime} | Drive ID: {driveId} | Passed: {candidates.length}
            </Typography>
          </Box>
        </Box>

        <Box className="pa-header-actions">
          {noneAllocated && (
            <Box className="pa-global-assign">
              <Select
                value={globalPanel}
                onChange={(e) => handleGlobalAssign(e.target.value as number | "")}
                displayEmpty
                size="small"
                className="pa-global-select"
              >
                <MenuItem value="" disabled>Assign to all</MenuItem>
                {panelMembers.map((m) => (
                  <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
                ))}
              </Select>
            </Box>
          )}
          <Typography className="pa-assigned-count">
            {newAssignedCount} / {candidates.length} to submit
          </Typography>
          <Button
            variant="contained"
            size="small"
            className="pa-submit-btn"
            disabled={newAssignedCount === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </Box>
      </Card>

      {/* Scrollable content area */}
      <Box className="pa-scroll-area">
      {/* Bulk Reassignment Bar */}
      {candidates.some(c => allocationStatus[c.applicationId]?.additionalPanels?.length > 0) && (
        <Card className="pa-reassign-bar">
          <SwapHorizIcon className="pa-reassign-icon" />
          <Typography className="pa-reassign-label">Reassign</Typography>
          <Box className="pa-reassign-field">
            <Typography className="pa-reassign-field-label">From</Typography>
            <Select
              value={reassignFrom}
              onChange={(e) => { setReassignFrom(e.target.value as number | ""); setReassignTo(""); }}
              displayEmpty
              size="small"
              className="pa-reassign-select"
            >
              <MenuItem value="" disabled>Select panel</MenuItem>
              {assignedPanelMembers.map((m) => (
                <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box className="pa-reassign-field">
            <Typography className="pa-reassign-field-label">To</Typography>
            <Select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value as number | "")}
              displayEmpty
              size="small"
              className={`pa-reassign-select${conflictIndices.length > 0 ? " pa-reassign-select-error" : ""}`}
              disabled={!reassignFrom}
            >
              <MenuItem value="" disabled>Select panel</MenuItem>
              {panelMembers
                .filter((m) => m.userId !== reassignFrom)
                .map((m) => (
                  <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
                ))}
            </Select>
          </Box>
          {conflictIndices.length > 0 && (
            <Typography className="pa-reassign-error-text">
              Skiping {conflictIndices.join(", #")} (already evaluated)
            </Typography>
          )}
          {reassignFrom && reassignableCount > 0 && (
            <Typography className="pa-reassign-count">
              {validReassignEntries.length} of {reassignableCount} candidate{reassignableCount > 1 ? "s" : ""}
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            className="pa-reassign-btn"
            disabled={!reassignFrom || !reassignTo || reassignFrom === reassignTo || validReassignEntries.length === 0 || reassigning}
            onClick={handleBulkReassign}
          >
            {reassigning ? "Reassigning..." : "Reassign"}
          </Button>
          {extraAssignedCount > 0 && (
            <Button
              variant="contained"
              size="small"
              className="pa2-submit-btn"
              disabled={submittingExtra}
              onClick={handleExtraSubmit}
            >
              {submittingExtra ? "Submitting..." : `Submit Extra (${extraAssignedCount})`}
            </Button>
          )}
          {editedCount > 0 && (
            <Button
              variant="contained"
              size="small"
              className="pa-edit-submit-btn"
              disabled={submitting}
              onClick={handleEditSubmit}
            >
              {submitting ? "Saving..." : `Save Edits (${editedCount})`}
            </Button>
          )}
        </Card>
      )}

      {/* Candidate Cards */}
      {candidates.length === 0 ? (
        <Card className="pa-empty">
          <Typography className="pa-empty-text">No PASS candidates to allocate.</Typography>
        </Card>
      ) : (
        <Box className="pa-cards-scroll">
          <Box className="pa-cards-grid">
            {candidates.map((c, idx) => {
              const status = allocationStatus[c.applicationId];
              const panels = status?.additionalPanels || [];
              const allocated = panels.length > 0;
              const allEvaluated = panels.length > 0 && panels.every((p) => p.evaluated);
              const hasHold = panels.some((p) => p.evaluationStatus === "HOLD");

              return (
                <Card key={c.applicationId} className={getCardClass(c.applicationId)}>
                  {/* Card Header */}
                  <Box className="pa-card-top">
                    <Typography className="pa-card-index">{idx + 1}</Typography>
                    <Typography className="pa-card-name">{c.candidateName}</Typography>
                    {allEvaluated && !hasHold && (
                      <IconButton
                        className="pa2-add-btn"
                        size="small"
                        onClick={() => handleAddExtraPanel(c.applicationId)}
                        title="Add panel member"
                      >
                        <AddIcon className="pa2-add-icon" />
                      </IconButton>
                    )}
                  </Box>

                  {/* Panel Members List */}
                  {panels.length > 0 && (
                    <Box className="pa-panels-list">
                      {panels.map((panel, pIdx) => {
                        const editKey = `${c.applicationId}_${pIdx}`;
                        const editState = editingPanel[editKey];
                        const isEditingThis = !!editState;
                        const usedInRow = new Set(panels.map((p) => p.userId));

                        return (
                          <Box key={panel.userId} className={`pa-panel-row ${panel.evaluated ? "pa-panel-row-evaluated" : ""}`}>
                            <Typography className="pa-panel-index">{pIdx + 1}</Typography>
                            {isEditingThis ? (
                              <Select
                                value={editState.newUserId || panel.userId}
                                onChange={(e) => {
                                  const newUserId = e.target.value as number;
                                  setEditingPanel((prev) => ({ ...prev, [editKey]: { oldUserId: panel.userId, newUserId } }));
                                }}
                                displayEmpty
                                size="small"
                                className="pa-panel-edit-select"
                              >
                                <MenuItem value="" disabled>Select panel</MenuItem>
                                {panelMembers
                                  .filter((m) => m.userId === panel.userId || !usedInRow.has(m.userId))
                                  .map((m) => (
                                    <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
                                  ))}
                              </Select>
                            ) : (
                              <Typography className="pa-panel-name">{panel.panelName}</Typography>
                            )}
                            {panel.evaluated && panel.score != null && (
                              <Typography className="pa-panel-score">Score: {panel.score}</Typography>
                            )}
                            <span className={`pa-eval-badge pa-eval-${panel.evaluationStatus?.toLowerCase() || "pending"}`}>
                              {panel.evaluationStatus || "PENDING"}
                            </span>
                            {!panel.evaluated && !isEditingThis && (
                              <IconButton
                                className="pa-panel-edit-btn"
                                size="small"
                                onClick={() => setEditingPanel((prev) => ({ ...prev, [editKey]: { oldUserId: panel.userId, newUserId: "" } }))}
                                title="Reassign panel"
                              >
                                <EditIcon className="pa-panel-edit-icon" />
                              </IconButton>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {/* Initial assign dropdown — only when no panels allocated yet */}
                  {!allocated && (
                    <Box className="pa-assign-row">
                      <Select
                        value={assignments[c.applicationId] ?? ""}
                        onChange={(e) => handleAssign(c.applicationId, e.target.value as number | "")}
                        displayEmpty
                        size="small"
                        className="pa-card-select"
                      >
                        <MenuItem value="" disabled>Assign panel member</MenuItem>
                        {panelMembers.map((m) => (
                          <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                  )}

                  {/* Extra panel dropdowns (new additions) */}
                  {extraPanels[c.applicationId]?.map((panelVal, pIdx) => {
                    const usedIds = new Set<number>();
                    panels.forEach((p) => usedIds.add(p.userId));
                    const extras = extraPanels[c.applicationId] || [];
                    extras.forEach((id, i) => { if (i !== pIdx && id !== "") usedIds.add(id as number); });

                    return (
                      <Box key={pIdx} className="pa2-extra-row">
                        <Typography className="pa2-extra-label">New Panel {pIdx + 1}:</Typography>
                        <Select
                          value={panelVal}
                          onChange={(e) => handleExtraPanelChange(c.applicationId, pIdx, e.target.value as number | "")}
                          displayEmpty
                          size="small"
                          className="pa2-select"
                        >
                          <MenuItem value="" disabled>Select panel</MenuItem>
                          {panelMembers
                            .filter((m) => !usedIds.has(m.userId))
                            .map((m) => (
                              <MenuItem key={m.userId} value={m.userId}>{m.username}</MenuItem>
                            ))}
                        </Select>
                        <IconButton
                          className="pa2-remove-btn"
                          size="small"
                          onClick={() => handleRemoveExtraPanel(c.applicationId, pIdx)}
                        >
                          <RemoveCircleOutlineIcon className="pa2-remove-icon" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Card>
              );
            })}
          </Box>
        </Box>
      )}
      </Box>
    </Box>
  );
};

export default PanelAllocation;
