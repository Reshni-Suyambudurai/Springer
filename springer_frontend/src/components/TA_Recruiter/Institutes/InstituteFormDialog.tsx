import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "../../../css/TA_Recruiter/Institutes/AddInstitute.css";
import { showToast } from "../../../utils/toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InstituteBasicForm {
  instituteName: string;
  instituteTier: string;
  state: string;
  city: string;
  isActive: boolean;
}

export interface TpoForm {
  tpoName: string;
  tpoEmail: string;
  tpoMobile: string;
  tpoDesignation: string;
  isPrimary: boolean;
}

export interface ExistingTpoForm extends TpoForm {
  tpoId: number;
}

interface InstituteFormDialogProps {
  open: boolean;
  mode: "add" | "edit";
  basicForm: InstituteBasicForm;
  tpoForms: TpoForm[] | ExistingTpoForm[];
  selectedProgramIds: number[];
  allPrograms: { programId: number; programName: string }[];
  onClose: () => void;
  onSave: () => void;
  onBasicChange: (field: keyof InstituteBasicForm, value: string | boolean) => void;
  onTpoChange: (idx: number, field: keyof TpoForm, value: string | boolean) => void;
  onTpoAdd: () => void;
  onTpoRemove: (idx: number) => void;
  onProgramToggle: (programId: number) => void;
  onClearPrograms: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATE_OPTIONS = [
  "Tamil Nadu", "Andhra Pradesh", "Kerala", "Karnataka",
  "Puducherry", "Telangana", "Maharashtra",
];

type TabKey = "basic" | "contact" | "academic";

const TABS: { key: TabKey; label: string }[] = [
  { key: "basic", label: "Basic Information" },
  { key: "contact", label: "Contact Details" },
  { key: "academic", label: "Academic" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

interface StatusToggleProps {
  isActive: boolean;
  onChange: (value: boolean) => void;
}

const StatusToggle: React.FC<StatusToggleProps> = ({ isActive, onChange }) => (
  <Box className="ai-toggle-wrap">
    <button
      type="button"
      className={`ai-toggle${isActive ? " ai-toggle--on" : ""}`}
      onClick={() => onChange(!isActive)}
      aria-pressed={isActive}
      aria-label="Toggle active status"
    >
      <span className="ai-toggle-thumb" />
    </button>
    <span className="ai-toggle-label">{isActive ? "Active" : "Inactive"}</span>
  </Box>
);

interface PrimaryToggleProps {
  isPrimary: boolean;
  onChange: (value: boolean) => void;
}

const PrimaryToggle: React.FC<PrimaryToggleProps> = ({ isPrimary, onChange }) => (
  <Box className="ai-toggle-wrap">
    <button
      type="button"
      className={`ai-toggle${isPrimary ? " ai-toggle--on" : ""}`}
      onClick={() => onChange(!isPrimary)}
      aria-pressed={isPrimary}
      aria-label="Toggle primary contact"
    >
      <span className="ai-toggle-thumb" />
    </button>
    <span className="ai-toggle-label">{isPrimary ? "Primary Contact" : "Secondary Contact"}</span>
  </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────────

const InstituteFormDialog: React.FC<InstituteFormDialogProps> = ({
  open,
  mode,
  basicForm,
  tpoForms,
  selectedProgramIds,
  allPrograms,
  onClose,
  onSave,
  onBasicChange,
  onTpoChange,
  onTpoAdd,
  onTpoRemove,
  onProgramToggle,
  onClearPrograms,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  const validateAndSave = () => {
    // Basic tab validation
    if (!basicForm.instituteName.trim()) {
      setActiveTab("basic");
      showToast("Institute name is required", "error"); return;
    }
    if (!basicForm.instituteTier) {
      setActiveTab("basic");
      showToast("Please select a tier", "error"); return;
    }
    if (!basicForm.state || basicForm.state === "Others") {
      setActiveTab("basic");
      showToast("Please enter the state name", "error"); return;
    }
    if (!basicForm.city.trim()) {
      setActiveTab("basic");
      showToast("City is required", "error"); return;
    }
    // Contact tab validation
    for (let i = 0; i < tpoForms.length; i++) {
      const tpo = tpoForms[i];
      if (!tpo.tpoName.trim()) {
        setActiveTab("contact");
        showToast(`TPO Contact ${i + 1}: Name is required`, "error"); return;
      }
      if (!tpo.tpoEmail.trim()) {
        setActiveTab("contact");
        showToast(`TPO Contact ${i + 1}: Email is required`, "error"); return;
      }
      if (!EMAIL_RE.test(tpo.tpoEmail)) {
        setActiveTab("contact");
        showToast(`TPO Contact ${i + 1}: Invalid email address`, "error"); return;
      }
      if (tpo.tpoMobile && !MOBILE_RE.test(tpo.tpoMobile)) {
        setActiveTab("contact");
        showToast(`TPO Contact ${i + 1}: Mobile must be a valid 10-digit Indian number`, "error"); return;
      }
    }
    onSave();
  };

  const isCustomState =
    basicForm.state !== "" &&
    !STATE_OPTIONS.includes(basicForm.state) &&
    basicForm.state !== "Others";

  const selectStateValue = STATE_OPTIONS.includes(basicForm.state)
    ? basicForm.state
    : basicForm.state
    ? "Others"
    : "";

  const handleStateSelectChange = (value: string) => {
    onBasicChange("state", value === "Others" ? "Others" : value);
  };

  const handleClose = () => {
    setActiveTab("basic");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={false} PaperProps={{ className: "ai-dialog-paper" }}>
      <DialogTitle className="ai-dialog-title-wrap">
        <Box className="ai-dialog-title-box">
          <Box>
            <Typography className="ai-dialog-heading">
              {mode === "add" ? "Add New Institute" : "Edit Institute"}
            </Typography>
            <Typography className="ai-dialog-subheading">
              {mode === "add"
                ? "Enter all the details about the institute. All fields marked with * are required."
                : "Update the details about the institute."}
            </Typography>
          </Box>
          <IconButton size="small" className="g-icon-btn" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box className="ai-tabs">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`ai-tab${activeTab === key ? " ai-tab--active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </Box>
      </DialogTitle>

      <DialogContent className="ai-dialog-content-wrap">
        {/* ── Basic Tab ── */}
        {activeTab === "basic" && (
          <Box className="ai-form">
            <Box className="ai-row-2">
              <Box className="ai-field">
                <label className="ai-label">Institute Name <span className="ai-req">*</span></label>
                <input
                  className="ai-input"
                  placeholder="Enter institute name"
                  value={basicForm.instituteName}
                  onChange={(e) => onBasicChange("instituteName", e.target.value)}
                />
              </Box>
              <Box className="ai-field">
                <label className="ai-label">Tier <span className="ai-req">*</span></label>
                <select
                  className="ai-select"
                  value={basicForm.instituteTier}
                  onChange={(e) => onBasicChange("instituteTier", e.target.value)}
                >
                  <option value="">Select tier</option>
                  <option value="TIER_1">TIER 1</option>
                  <option value="TIER_2">TIER 2</option>
                  <option value="TIER_3">TIER 3</option>
                </select>
              </Box>
            </Box>

            <Box className="ai-row-2">
              <Box className="ai-field">
                <label className="ai-label">State <span className="ai-req">*</span></label>
                <select
                  className="ai-select"
                  value={selectStateValue}
                  onChange={(e) => handleStateSelectChange(e.target.value)}
                >
                  <option value="">Select state</option>
                  {STATE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>
                {(basicForm.state === "Others" || isCustomState) && (
                  <input
                    className="ai-input ai-input--mt"
                    placeholder="Enter state name"
                    value={basicForm.state === "Others" ? "" : basicForm.state}
                    onChange={(e) => onBasicChange("state", e.target.value)}
                  />
                )}
              </Box>
              <Box className="ai-field">
                <label className="ai-label">City <span className="ai-req">*</span></label>
                <input
                  className="ai-input"
                  placeholder="Enter city"
                  value={basicForm.city}
                  onChange={(e) => onBasicChange("city", e.target.value)}
                />
              </Box>
            </Box>

            <Box className="ai-field">
              <label className="ai-label">Status</label>
              <StatusToggle isActive={basicForm.isActive} onChange={(v) => onBasicChange("isActive", v)} />
            </Box>
          </Box>
        )}

        {/* ── Contact Tab ── */}
        {activeTab === "contact" && (
          <Box className="ai-form">
            {tpoForms.map((form, idx) => {
              const isExisting = "tpoId" in form && (form as { tpoId?: number }).tpoId !== undefined;
              return (
              <Box key={idx} className="ai-contact-card">
                <Box className="ai-contact-card-header">
                  <Typography className="ai-contact-card-title">
                    {form.isPrimary ? "Primary Contact" : `TPO Contact ${idx + 1}`}
                  </Typography>
                  {!form.isPrimary && !isExisting && (
                    <button
                      className="ai-add-contact-btn ai-remove-contact-btn"
                      onClick={() => onTpoRemove(idx)}
                    >
                      ✕ Remove
                    </button>
                  )}
                </Box>
                <Box className="ai-row-2">
                  <Box className="ai-field">
                    <label className="ai-label">TPO Name <span className="ai-req">*</span></label>
                    <input
                      className="ai-input"
                      placeholder="Enter contact person name"
                      value={form.tpoName}
                      onChange={(e) => onTpoChange(idx, "tpoName", e.target.value)}
                    />
                  </Box>
                  <Box className="ai-field">
                    <label className="ai-label">Phone <span className="ai-req">*</span></label>
                    <input
                      className="ai-input"
                      placeholder="+91 98765 43210"
                      value={form.tpoMobile}
                      onChange={(e) => onTpoChange(idx, "tpoMobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                  </Box>
                </Box>
                <Box className="ai-row-2">
                  <Box className="ai-field">
                    <label className="ai-label">Email <span className="ai-req">*</span></label>
                    <input
                      className="ai-input"
                      type="email"
                      placeholder="person@institute.edu"
                      value={form.tpoEmail}
                      onChange={(e) => onTpoChange(idx, "tpoEmail", e.target.value)}
                    />
                  </Box>
                  <Box className="ai-field">
                    <label className="ai-label">Designation</label>
                    <input
                      className="ai-input"
                      placeholder="e.g., Placement Officer"
                      value={form.tpoDesignation}
                      onChange={(e) => onTpoChange(idx, "tpoDesignation", e.target.value)}
                    />
                  </Box>
                </Box>
                <PrimaryToggle
                  isPrimary={form.isPrimary}
                  onChange={(v) => onTpoChange(idx, "isPrimary", v)}
                />
              </Box>
              );
            })}
            <button className="ai-add-contact-btn" onClick={onTpoAdd}>+ Add Contact</button>
          </Box>
        )}

        {/* ── Academic Tab ── */}
        {activeTab === "academic" && (
          <Box className="ai-form">
            <Typography className="ai-academic-title">Academic Information</Typography>
            <Typography className="ai-academic-subtitle">Select programs offered by this institute</Typography>
            <Box className="ai-program-chips-wrap">
              {allPrograms.map((program) => {
                const selected = selectedProgramIds.includes(program.programId);
                return (
                  <button
                    key={program.programId}
                    type="button"
                    className={`ai-program-chip${selected ? " ai-program-chip--active" : ""}`}
                    onClick={() => onProgramToggle(program.programId)}
                  >
                    <span className="ai-chip-checkbox">
                      {selected && <span className="ai-chip-check" />}
                    </span>
                    {program.programName.replace(/_/g, " ")}
                  </button>
                );
              })}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions className="ai-dialog-actions-wrap">
        {activeTab === "academic" ? (
          <>
            <button className="g-btn g-btn-outline-danger" onClick={onClearPrograms}>
              Clear
            </button>
            <button className="g-btn g-btn-primary" onClick={validateAndSave}>
              Save
            </button>
          </>
        ) : (
          <>
            <button className="g-btn g-btn-outline-primary" onClick={handleClose}>
              Cancel
            </button>
            <button className="g-btn g-btn-primary" onClick={validateAndSave}>
              Save
            </button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InstituteFormDialog;
