import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { instituteApi, instituteTPOApi, programApi } from "../../../services/hiring.api";
import type { InstituteWithTPOsResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { ProgramResponse } from "../../../types/TA_Recruiter/Hiring/program.types";
import { showToast } from "../../../utils/toast";
import {
  Box, CircularProgress, Typography, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import "../../../css/TA_Recruiter/Institutes/InstitutesDetails.css";
import "../../../css/TA_Recruiter/Institutes/AddInstitute.css";

const InstitutesDetails: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const [data, setData] = useState<InstituteWithTPOsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPrograms, setAllPrograms] = useState<ProgramResponse[]>([]);

  const [editInstDialog, setEditInstDialog] = useState(false);
  const [editInstTab, setEditInstTab] = useState<"basic" | "contact" | "academic">("basic");
  const [editInstForm, setEditInstForm] = useState({ instituteName: "", instituteTier: "", city: "", state: "", isActive: true });
  const [editSelectedProgramIds, setEditSelectedProgramIds] = useState<number[]>([]);
  const [editTpoForms, setEditTpoForms] = useState<{ tpoId: number; tpoName: string; tpoEmail: string; tpoMobile: string; tpoDesignation: string; isPrimary: boolean }[]>([]);
  const [extraTpoForms, setExtraTpoForms] = useState<{ tpoName: string; tpoEmail: string; tpoMobile: string; tpoDesignation: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [instituteResponse, programsResponse] = await Promise.all([
          instituteApi.getInstituteWithTPOsById(Number(instituteId)),
          programApi.getAllPrograms()
        ]);
        setData(instituteResponse.data);
        setAllPrograms(programsResponse.data);
      } catch (error) {
        console.error(error);
        showToast("Failed to load institute details", "error");
      } finally {
        setLoading(false);
      }
    };
    if (instituteId) fetchData();
  }, [instituteId]);

  const refreshData = async () => {
    try {
      const [instituteResponse, programsResponse] = await Promise.all([
        instituteApi.getInstituteWithTPOsById(Number(instituteId)),
        programApi.getAllPrograms()
      ]);
      setData(instituteResponse.data);
      setAllPrograms(programsResponse.data);
    } catch (error) { console.error(error); }
  };

  const getTierClassName = (tier: string) => {
    switch (tier) {
      case "TIER_1": return "id-tier-badge id-tier-1";
      case "TIER_2": return "id-tier-badge id-tier-2";
      case "TIER_3": return "id-tier-badge id-tier-3";
      default: return "id-tier-badge";
    }
  };

  const handleOpenEditInst = () => {
    if (!data) return;
    setEditInstForm({ 
      instituteName: data.instituteName, 
      instituteTier: data.instituteTier, 
      city: data.city, 
      state: data.state, 
      isActive: data.isActive,
    });
    setEditSelectedProgramIds(data.programs.map(p => p.programId));
    setEditTpoForms(data.tpoDetails.map(t => ({ tpoId: t.tpoId, tpoName: t.tpoName, tpoEmail: t.tpoEmail, tpoMobile: t.tpoMobile, tpoDesignation: t.tpoDesignation || "", isPrimary: t.isPrimary })));
    setEditInstTab("basic");
    setEditInstDialog(true);
  };

  const handleEditInstSave = async () => {
    if (!editInstForm.instituteName || !editInstForm.city || !editInstForm.state || !editInstForm.instituteTier) {
      showToast("Please fill all required fields", "error"); return;
    }
    try {
      await instituteApi.updateInstitute(Number(instituteId), { ...editInstForm });
    } catch (error) {
      console.error(error);
      showToast("Failed to update institute", "error"); return;
    }
    // Update all existing TPO contacts
    for (const form of editTpoForms) {
      if (form.tpoName && form.tpoEmail) {
        try {
          await instituteTPOApi.updateContact(form.tpoId, {
            tpoName: form.tpoName, tpoEmail: form.tpoEmail,
            tpoMobile: form.tpoMobile, tpoDesignation: form.tpoDesignation,
          });
        } catch (error: unknown) {
          const err = error as { message?: string };
          showToast(err.message || "Failed to update TPO contact", "error"); return;
        }
      }
    }
    // Save extra TPO contacts
    for (const form of extraTpoForms) {
      if (form.tpoName && form.tpoEmail) {
        try {
          await instituteTPOApi.createContact({
            instituteId: Number(instituteId),
            tpoName: form.tpoName,
            tpoEmail: form.tpoEmail,
            tpoMobile: form.tpoMobile,
            tpoDesignation: form.tpoDesignation,
            tpoStatus: "ACTIVE",
            isPrimary: false,
          });
        } catch (error: unknown) {
          const err = error as { message?: string };
          showToast(err.message || "Failed to save additional TPO contact", "error"); return;
        }
      }
    }
    showToast("Institute updated successfully", "success");
    setEditInstDialog(false);
    setExtraTpoForms([]);
    setEditTpoForms([]);
    await refreshData();
  };

  if (loading) return <Box className="t-loading"><CircularProgress /></Box>;
  if (!data) return <Box className="id-not-found"><Typography variant="h6">Institute not found</Typography></Box>;

  return (
    <Box className="id-page">

      {/* Institute Info Card */}
      <Box className="id-info-card">
        <Box className="id-info-top">
          {/* Icon */}
          <Box className="id-icon-wrap">
            <img src="/Institute_Icon.svg" alt="Institute" className="id-icon-img" />
          </Box>

          {/* Name + Location */}
          <Box className="id-info-main">
            <Box className="id-name-row">
              <Typography className="id-name t-row-primary">{data.instituteName}</Typography>
              <span className={getTierClassName(data.instituteTier)}>
                {data.instituteTier.replace("_", " ")}
              </span>
            </Box>
            <Box className="id-location-row">
              <PlaceOutlinedIcon className="id-location-icon" />
              <Typography className="id-location-text t-meta-text">{data.city}, {data.state}, India</Typography>
            </Box>
          </Box>

          {/* Edit Button */}
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            className="g-btn g-btn-primary"
            onClick={handleOpenEditInst}
            size="small"
          >
            Edit
          </Button>
        </Box>

        {/* Info Grid Row 1: Email | Academic */}
        <Box className="id-info-grid">
          <Box className="id-info-cell">
            <Box className="id-info-cell-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </Box>
            <Box>
              <Typography className="id-cell-label t-section-label">Email</Typography>
              <Typography className="id-cell-value t-meta-text">
                {data.tpoDetails[0]?.tpoEmail || "contact@institute.edu"}
              </Typography>
            </Box>
          </Box>

          <Box className="id-info-cell">
            <Box className="id-info-cell-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>
            </Box>
            <Box>
              <Typography className="id-cell-label t-section-label">Academic</Typography>
              <Box className="id-program-chips">
                {data.programs.length > 0 ? data.programs.map((p) => (
                  <span key={p.instituteProgramId} className="id-program-chip">
                    {p.programName.replace(/_/g, " ")}
                  </span>
                )) : <Typography className="id-cell-value">—</Typography>}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Info Grid Row 2: TPO Details */}
        {data.tpoDetails.length > 0 ? data.tpoDetails.map((tpo) => (
          <Box key={tpo.tpoId} className="id-info-grid">
            <Box className="id-info-cell">
              <Box className="id-info-cell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Box>
              <Box>
                <Typography className="id-cell-label">TPO Name {tpo.isPrimary && <span className="id-tpo-primary-badge">PRIMARY</span>}</Typography>
                <Typography className="id-cell-value">{tpo.tpoName || "—"}</Typography>
              </Box>
            </Box>
            <Box className="id-info-cell">
              <Box className="id-info-cell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
              </Box>
              <Box>
                <Typography className="id-cell-label">TPO Phone</Typography>
                <Typography className="id-cell-value">{tpo.tpoMobile ? `+91 ${tpo.tpoMobile}` : "—"}</Typography>
              </Box>
            </Box>
            <Box className="id-info-cell">
              <Box className="id-info-cell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </Box>
              <Box>
                <Typography className="id-cell-label">Email</Typography>
                <Typography className="id-cell-value">{tpo.tpoEmail || "—"}</Typography>
              </Box>
            </Box>
          </Box>
        )) : (
          <Box className="id-info-grid">
            <Box className="id-info-cell">
              <Box className="id-info-cell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Box>
              <Box>
                <Typography className="id-cell-label">TPO Name</Typography>
                <Typography className="id-cell-value">—</Typography>
              </Box>
            </Box>
            <Box className="id-info-cell">
              <Box className="id-info-cell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
              </Box>
              <Box>
                <Typography className="id-cell-label">TPO Phone</Typography>
                <Typography className="id-cell-value">—</Typography>
              </Box>
            </Box>
            <Box className="id-info-cell">
              <Box className="id-info-cell-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </Box>
              <Box>
                <Typography className="id-cell-label">Email</Typography>
                <Typography className="id-cell-value">—</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

  

      {/* Edit Institute Dialog — same style as Add Institute */}
      <Dialog open={editInstDialog} onClose={() => setEditInstDialog(false)} maxWidth={false}
        PaperProps={{ className: 'ai-dialog-paper' }}>
        <DialogTitle className="id-dialog-title-wrap">
          <Box className="id-dialog-title-box">
            <Box>
              <Typography className="id-dialog-heading">Edit Institute</Typography>
              <Typography className="id-dialog-subheading">Update the details about the institute.</Typography>
            </Box>
            <IconButton size="small" className="g-icon-btn" onClick={() => setEditInstDialog(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <Box className="ai-tabs">
            {(["basic", "contact", "academic"] as const).map((tab) => (
              <button key={tab} className={`ai-tab${editInstTab === tab ? " ai-tab--active" : ""}`} onClick={() => setEditInstTab(tab)}>
                {tab === "basic" ? "Basic Information" : tab === "contact" ? "Contact Details" : "Academic"}
              </button>
            ))}
          </Box>
        </DialogTitle>
        <DialogContent className="id-dialog-content-wrap">
          {editInstTab === "basic" && (
            <Box className="ai-form">
              <Box className="ai-row-2">
                <Box className="ai-field"><label className="ai-label">Institute Name <span className="ai-req">*</span></label>
                  <input className="ai-input" value={editInstForm.instituteName} onChange={(e) => setEditInstForm({ ...editInstForm, instituteName: e.target.value })} /></Box>
                <Box className="ai-field"><label className="ai-label">Tier <span className="ai-req">*</span></label>
                  <select className="ai-select" value={editInstForm.instituteTier} onChange={(e) => setEditInstForm({ ...editInstForm, instituteTier: e.target.value })}>
                    <option value="TIER_1">TIER 1</option>
                    <option value="TIER_2">TIER 2</option>
                    <option value="TIER_3">TIER 3</option>
                  </select></Box>
              </Box>
              <Box className="ai-row-3">
                <Box className="ai-field"><label className="ai-label">City <span className="ai-req">*</span></label>
                  <input className="ai-input" value={editInstForm.city} onChange={(e) => setEditInstForm({ ...editInstForm, city: e.target.value })} /></Box>
                <Box className="ai-field"><label className="ai-label">State <span className="ai-req">*</span></label>
                  <input className="ai-input" value={editInstForm.state} onChange={(e) => setEditInstForm({ ...editInstForm, state: e.target.value })} /></Box>
              </Box>
              <Box className="ai-field"><label className="ai-label">Status <span className="ai-req">*</span></label>
                <select className="ai-select" value={editInstForm.isActive ? "active" : "inactive"} onChange={(e) => setEditInstForm({ ...editInstForm, isActive: e.target.value === "active" })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select></Box>
            </Box>
          )}
          {editInstTab === "contact" && (
            <Box className="ai-form">
              {editTpoForms.map((form, idx) => (
                <Box key={form.tpoId} className="ai-contact-card">
                  <Box className="ai-contact-card-header">
                    <Typography className="ai-contact-card-title">{form.isPrimary ? "Primary Contact Person" : `TPO Contact ${idx + 1}`}</Typography>
                    {!form.isPrimary && (
                      <button className="ai-add-contact-btn id-remove-contact-btn" onClick={() => setEditTpoForms(prev => prev.filter((_, i) => i !== idx))}>✕ Remove</button>
                    )}
                  </Box>
                  <Box className="ai-row-2">
                    <Box className="ai-field"><label className="ai-label">TPO Name</label>
                      <input className="ai-input" value={form.tpoName} onChange={(e) => setEditTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoName: e.target.value } : f))} /></Box>
                    <Box className="ai-field"><label className="ai-label">Phone</label>
                      <input className="ai-input" value={form.tpoMobile} onChange={(e) => setEditTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoMobile: e.target.value.replace(/\D/g, "").slice(0, 10) } : f))} /></Box>
                  </Box>
                  <Box className="ai-row-2">
                    <Box className="ai-field"><label className="ai-label">Email</label>
                      <input className="ai-input" type="email" value={form.tpoEmail} onChange={(e) => setEditTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoEmail: e.target.value } : f))} /></Box>
                    <Box className="ai-field"><label className="ai-label">Designation</label>
                      <input className="ai-input" value={form.tpoDesignation} onChange={(e) => setEditTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoDesignation: e.target.value } : f))} /></Box>
                  </Box>
                </Box>
              ))}
              {extraTpoForms.map((form, idx) => (
                <Box key={idx} className="ai-contact-card">
                  <Box className="ai-contact-card-header">
                    <Typography className="ai-contact-card-title">New TPO Contact</Typography>
                    <button className="ai-add-contact-btn id-remove-contact-btn" onClick={() => setExtraTpoForms(prev => prev.filter((_, i) => i !== idx))}>✕ Remove</button>
                  </Box>
                  <Box className="ai-row-2">
                    <Box className="ai-field"><label className="ai-label">TPO Name <span className="ai-req">*</span></label>
                      <input className="ai-input" placeholder="Enter contact person name" value={form.tpoName} onChange={(e) => setExtraTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoName: e.target.value } : f))} /></Box>
                    <Box className="ai-field"><label className="ai-label">Phone</label>
                      <input className="ai-input" placeholder="+91 98765 43210" value={form.tpoMobile} onChange={(e) => setExtraTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoMobile: e.target.value.replace(/\D/g, "").slice(0, 10) } : f))} /></Box>
                  </Box>
                  <Box className="ai-row-2">
                    <Box className="ai-field"><label className="ai-label">Email <span className="ai-req">*</span></label>
                      <input className="ai-input" placeholder="person@institute.edu" type="email" value={form.tpoEmail} onChange={(e) => setExtraTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoEmail: e.target.value } : f))} /></Box>
                    <Box className="ai-field"><label className="ai-label">Designation</label>
                      <input className="ai-input" placeholder="e.g., Placement Officer" value={form.tpoDesignation} onChange={(e) => setExtraTpoForms(prev => prev.map((f, i) => i === idx ? { ...f, tpoDesignation: e.target.value } : f))} /></Box>
                  </Box>
                </Box>
              ))}
              <button className="ai-add-contact-btn id-add-contact-ml" onClick={() => setExtraTpoForms(prev => [...prev, { tpoName: "", tpoEmail: "", tpoMobile: "", tpoDesignation: "" }])}>+ Add</button>
            </Box>
          )}
          {editInstTab === "academic" && (
            <Box className="ai-form">
              <Typography className="ai-academic-title">Academic Information</Typography>
              <Typography className="ai-academic-subtitle">Add all departments available in the institute</Typography>
              <Box className="ai-program-chips-wrap">
                {allPrograms.map((program) => {
                  const selected = editSelectedProgramIds.includes(program.programId);
                  return (
                    <button
                      key={program.programId}
                      type="button"
                      className={`ai-program-chip${selected ? ' ai-program-chip--active' : ''}`}
                      onClick={() => setEditSelectedProgramIds((prev) =>
                        prev.includes(program.programId) ? prev.filter((id) => id !== program.programId) : [...prev, program.programId]
                      )}
                    >
                      <span className="ai-chip-checkbox">{selected && <span className="ai-chip-check" />}</span>
                      {program.programName.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="id-dialog-actions-wrap">
          {editInstTab === "academic" ? (
            <>
              <button className="ai-clear-btn" onClick={() => setEditSelectedProgramIds([])}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Clear
              </button>
              <button className="ai-save-btn" onClick={handleEditInstSave}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save
              </button>
            </>
          ) : (
            <>
              <button className="ai-cancel-btn" onClick={() => setEditInstDialog(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancel
              </button>
              <button className="ai-save-btn" onClick={handleEditInstSave}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save
              </button>
            </>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default InstitutesDetails;
