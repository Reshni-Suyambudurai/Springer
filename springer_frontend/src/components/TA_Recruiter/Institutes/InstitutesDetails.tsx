import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { instituteApi, instituteTPOApi, programApi } from "../../../services/hiring.api";
import type { InstituteWithTPOsResponse } from "../../../types/TA_Recruiter/Hiring/institute.types";
import type { ProgramResponse } from "../../../types/TA_Recruiter/Hiring/program.types";
import { showToast } from "../../../utils/toast";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import InstituteFormDialog from "./InstituteFormDialog";
import type { InstituteBasicForm, TpoForm, ExistingTpoForm } from "./InstituteFormDialog";
import "../../../css/TA_Recruiter/Institutes/InstitutesDetails.css";

const InstitutesDetails: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const [data, setData] = useState<InstituteWithTPOsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [allPrograms, setAllPrograms] = useState<ProgramResponse[]>([]);

  const [editInstDialog, setEditInstDialog] = useState(false);
  const [editInstForm, setEditInstForm] = useState<InstituteBasicForm>({
    instituteName: "", instituteTier: "", city: "", state: "", isActive: true,
  });
  const [editSelectedProgramIds, setEditSelectedProgramIds] = useState<number[]>([]);
  const [editTpoForms, setEditTpoForms] = useState<(TpoForm | ExistingTpoForm)[]>([]);

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

  const getTierClassName = (tier: string) => {
    switch (tier) {
      case "TIER_1": return "id-tier-badge id-tier-1";
      case "TIER_2": return "id-tier-badge id-tier-2";
      case "TIER_3": return "id-tier-badge id-tier-3";
      default: return "id-tier-badge";
    }
  };

  const handleToggleTpoStatus = async (tpoId: number) => {
    try {
      await instituteTPOApi.deleteContact(tpoId);
      const updated = await instituteApi.getInstituteWithTPOsById(Number(instituteId));
      setData(updated.data);
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast(err.message || "Failed to toggle TPO status", "error");
    }
  };

  const handleOpenEditInst = () => {    if (!data) return;
    setEditInstForm({ 
      instituteName: data.instituteName, 
      instituteTier: data.instituteTier, 
      city: data.city, 
      state: data.state, 
      isActive: data.isActive,
    });
    setEditSelectedProgramIds(data.programs.map(p => p.programId));
    setEditTpoForms(data.tpoDetails.map(t => ({ tpoId: t.tpoId, tpoName: t.tpoName, tpoEmail: t.tpoEmail, tpoMobile: t.tpoMobile, tpoDesignation: t.tpoDesignation || "", isPrimary: t.isPrimary })));
    setEditInstDialog(true);
  };

  const handleEditInstSave = async () => {
    if (!editInstForm.instituteName || !editInstForm.city || !editInstForm.state || !editInstForm.instituteTier) {
      showToast("Please fill all required fields", "error"); return;
    }
    try {
      const existingForms = editTpoForms.filter(
        (f): f is ExistingTpoForm => (f as ExistingTpoForm).tpoId !== undefined
      );
      const newForms = editTpoForms.filter(
        (f) => (f as ExistingTpoForm).tpoId === undefined
      );

      const result = await instituteApi.fullUpdateInstitute(Number(instituteId), {
        ...editInstForm,
        programIds: editSelectedProgramIds,
        tpoContacts: existingForms.map((f) => ({
          tpoId: f.tpoId,
          tpoName: f.tpoName,
          tpoEmail: f.tpoEmail,
          tpoMobile: f.tpoMobile,
          tpoDesignation: f.tpoDesignation,
          isPrimary: f.isPrimary,
        })),
        newTpoContacts: newForms
          .filter((f) => f.tpoName && f.tpoEmail)
          .map((f) => ({
            tpoName: f.tpoName,
            tpoEmail: f.tpoEmail,
            tpoMobile: f.tpoMobile,
            tpoDesignation: f.tpoDesignation,
            isPrimary: f.isPrimary,
          })),
      });
      setData(result.data);
      showToast("Institute updated successfully", "success");
      setEditInstDialog(false);
      setEditTpoForms([]);
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast(err.message || "Failed to update institute", "error");
    }
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
                <Box className="id-tpo-email-row">
                  <Typography className="id-cell-value">{tpo.tpoEmail || "—"}</Typography>
                  <label
                    className="id-tpo-toggle"
                    title={tpo.tpoStatus === "ACTIVE" ? "Active — click to deactivate" : "Inactive — click to activate"}
                    onClick={() => handleToggleTpoStatus(tpo.tpoId)}
                  >
                    <span className={`id-tpo-toggle__track ${tpo.tpoStatus === "ACTIVE" ? "id-tpo-toggle__track--on" : "id-tpo-toggle__track--off"}`}>
                      <span className="id-tpo-toggle__thumb" />
                    </span>
                  </label>
                </Box>
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

  

      <InstituteFormDialog
        open={editInstDialog}
        mode="edit"
        basicForm={editInstForm}
        tpoForms={editTpoForms}
        selectedProgramIds={editSelectedProgramIds}
        allPrograms={allPrograms}
        onClose={() => { setEditInstDialog(false); setEditTpoForms([]); }}
        onSave={handleEditInstSave}
        onBasicChange={(field, value) => setEditInstForm((prev) => ({ ...prev, [field]: value }))}
        onTpoChange={(idx, field, value) =>
          setEditTpoForms((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f))
        }
        onTpoAdd={() =>
          setEditTpoForms((prev) => [...prev, { tpoName: "", tpoEmail: "", tpoMobile: "", tpoDesignation: "", isPrimary: false }])
        }
        onTpoRemove={(idx) => setEditTpoForms((prev) => prev.filter((_, i) => i !== idx))}
        onProgramToggle={(id) =>
          setEditSelectedProgramIds((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
          )
        }
        onClearPrograms={() => setEditSelectedProgramIds([])}
      />

    </Box>
  );
};

export default InstitutesDetails;

