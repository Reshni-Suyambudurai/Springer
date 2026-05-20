import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { instituteApi, instituteTPOApi, programApi } from "../../../services/hiring.api";
import type { InstituteResponse, InstituteRequest } from "../../../types/TA_Recruiter/Hiring/institute.types";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import { EMAIL_TEMPLATE_IDS } from "../../../config/emailTemplateConfig";
import * as XLSX from "xlsx";
import {
  Box,
  CircularProgress,
  Typography,
  MenuItem,
  Select,
  FormControl,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Button,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import "../../../css/TA_Recruiter/Institutes/InstitutesList.css";
import "../../../css/TA_Recruiter/Institutes/AddInstitute.css";

interface Filters {
  instituteName: string;
  state: string;
  cities: string[];
  instituteTier: string;
  status: string;
  programs: string[];
}

interface AddTpoForm {
  tpoName: string;
  tpoEmail: string;
  tpoMobile: string;
  tpoDesignation: string;
}

const EMPTY_TPO_FORM: AddTpoForm = { tpoName: "", tpoEmail: "", tpoMobile: "", tpoDesignation: "" };

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', right: 8, pointerEvents: 'none' }}>
    <path d="M4 6L8 10L12 6" stroke="var(--color-filter-arrow)" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InstitutesList: React.FC = () => {
  const navigate = useNavigate();
  const [allInstitutes, setAllInstitutes] = useState<InstituteResponse[]>([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState<InstituteResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showAcademicDropdown, setShowAcademicDropdown] = useState(false);
  const moreFiltersRef = useRef<HTMLDivElement>(null);
  const academicDropdownRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<Filters>({
    instituteName: "",
    state: "",
    cities: [],
    instituteTier: "",
    status: "",
    programs: [],
  });
  const [addInstituteDialog, setAddInstituteDialog] = useState(false);
  const [addActiveTab, setAddActiveTab] = useState<"basic" | "contact" | "academic">("basic");
  const [addForm, setAddForm] = useState({ instituteName: "", instituteTier: "", city: "", state: "", isActive: true });
  const [addSelectedProgramIds, setAddSelectedProgramIds] = useState<number[]>([]);
  const [allPrograms, setAllPrograms] = useState<{ programId: number; programName: string }[]>([]);
  const [addTpoForms, setAddTpoForms] = useState<AddTpoForm[]>([]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<InstituteRequest[]>([]);
  const [uploadDuplicateIndices, setUploadDuplicateIndices] = useState<Set<number>>(new Set());
  const [uploadBatchDuplicateIndices, setUploadBatchDuplicateIndices] = useState<Set<number>>(new Set());
  const [uploadErrorMessages, setUploadErrorMessages] = useState<string[]>([]);
  const [showUploadErrorOverlay, setShowUploadErrorOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [sendingEmail, setSendingEmail] = useState<number | null>(null);

  const uniqueStates = Array.from(new Set(allInstitutes.map((inst) => inst.state))).filter(Boolean);
  const uniqueTiers = Array.from(new Set(allInstitutes.map((inst) => inst.instituteTier))).filter(Boolean);

  const uniquePrograms = useMemo(() => {
    const programSet = new Set<string>();
    allInstitutes.forEach((inst) => {
      inst.programs?.forEach((p) => { if (p.programName) programSet.add(p.programName); });
    });
    return Array.from(programSet).sort();
  }, [allInstitutes]);

  const stateToCitiesMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    allInstitutes.forEach((inst) => {
      if (inst.state && inst.city) {
        if (!map[inst.state]) map[inst.state] = new Set();
        map[inst.state].add(inst.city);
      }
    });
    return map;
  }, [allInstitutes]);

  const citiesForSelectedState = useMemo(() => {
    if (!filters.state || !stateToCitiesMap[filters.state]) return [];
    return Array.from(stateToCitiesMap[filters.state]).sort();
  }, [filters.state, stateToCitiesMap]);

  useEffect(() => {
    fetchInstitutes();
    programApi.getAllPrograms().then((r) => { if (r.data) setAllPrograms(r.data); }).catch(() => {});
    const savedFilters = tokenstore.getInstituteFilters();
    if (savedFilters) setFilters(savedFilters);
  }, []);

  // Close more filters panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(e.target as Node)) {
        setShowMoreFilters(false);
      }
      if (academicDropdownRef.current && !academicDropdownRef.current.contains(e.target as Node)) {
        setShowAcademicDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await instituteApi.getAllInstitutes();
      if (response.data) {
        setAllInstitutes(response.data);
        setFilteredInstitutes(response.data);
      }
    } catch (error) {
      showToast("Failed to fetch institutes", "error");
      console.error("Error fetching institutes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...allInstitutes];
    if (filters.instituteName)
      filtered = filtered.filter((i) => i.instituteName.toLowerCase().includes(filters.instituteName.toLowerCase()));
    if (filters.state) filtered = filtered.filter((i) => i.state === filters.state);
    if (filters.cities.length > 0) filtered = filtered.filter((i) => filters.cities.includes(i.city));
    if (filters.instituteTier) filtered = filtered.filter((i) => i.instituteTier === filters.instituteTier);
    if (filters.status) {
      const isActive = filters.status === "active";
      filtered = filtered.filter((i) => i.isActive === isActive);
    }
    if (filters.programs.length > 0)
      filtered = filtered.filter((i) => i.programs?.some((p) => filters.programs.includes(p.programName)));
    setFilteredInstitutes(filtered);
    setPage(1);
  }, [filters, allInstitutes]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page * pageSize < filteredInstitutes.length)
          setPage((p) => p + 1);
      },
      { threshold: 1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, filteredInstitutes.length]);



  const handleFilterChange = (field: keyof Filters, value: string | string[]) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "state") updated.cities = [];
      tokenstore.saveInstituteFilters(updated);
      return updated;
    });
  };

  const handleProgramToggle = (program: string) => {
    setFilters((prev) => {
      const updated = { ...prev, programs: prev.programs.includes(program) ? prev.programs.filter((p) => p !== program) : [...prev.programs, program] };
      tokenstore.saveInstituteFilters(updated);
      return updated;
    });
  };

  const clearFilters = () => {
    const empty = { instituteName: "", state: "", cities: [], instituteTier: "", status: "", programs: [] };
    setFilters(empty);
    tokenstore.clearInstituteFilters();
    showToast("All filters cleared", "success");
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["instituteName *", "city *", "state *", "instituteTier *"],
      ["Anna University", "Chennai", "Tamil Nadu", "TIER_1"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Institutes");
    XLSX.writeFile(wb, "Institute_Template.xlsx");
  };

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array", raw: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
      const institutes: InstituteRequest[] = rows.map((row) => {
        const tpoName = (row["tpo_name"] || "") as string;
        const tpoEmail = (row["tpo_email"] || "") as string;
        const tpoMobile = String(row["tpo_mobile"] || row["tpoMobile"] || "").replace(/\D/g, "");
        const tpoDesignation = (row["tpo_designation"] || row["tpoDesignation"] || "") as string;
        const inst: InstituteRequest = {
          instituteName: (row["instituteName *"] || row["instituteName"] || "") as string,
          instituteTier: (row["instituteTier *"] || row["Tier"] || row["instituteTier"] || "TIER_1") as string,
          state: (row["state *"] || row["State"] || row["state"] || "") as string,
          city: (row["city *"] || row["City"] || row["city"] || "") as string,
          isActive: true,
        };
        if (tpoName && tpoEmail) inst.tpoContact = { tpoName, tpoEmail, tpoMobile, tpoDesignation };
        return inst;
      });

      const errors: string[] = [];
      institutes.forEach((inst, idx) => {
        if (!inst.instituteName) errors.push(`Row ${idx + 1}: Missing Institute Name`);
        if (!inst.city) errors.push(`Row ${idx + 1}: Missing City`);
        if (!inst.state) errors.push(`Row ${idx + 1}: Missing State`);
      });
      if (errors.length > 0) { showToast(`Validation errors: ${errors.join(", ")}`, "error"); return; }

      setPreviewData(institutes);
      setSelectedFile(file);

      // Batch duplicate check
      const batchDups = new Set<number>();
      const nameCountMap = new Map<string, number[]>();
      institutes.forEach((inst, idx) => {
        const key = inst.instituteName.toLowerCase().trim();
        if (!nameCountMap.has(key)) nameCountMap.set(key, []);
        nameCountMap.get(key)!.push(idx);
      });
      nameCountMap.forEach((indices) => { if (indices.length > 1) indices.slice(1).forEach(idx => batchDups.add(idx)); });
      setUploadBatchDuplicateIndices(batchDups);

      // DB duplicate check
      try {
        const response = await instituteApi.getAllInstituteNames();
        const existingNames = new Set(response.data.map(inst => inst.instituteName.toLowerCase()));
        const dups = new Set<number>();
        institutes.forEach((inst, idx) => { if (existingNames.has(inst.instituteName.toLowerCase())) dups.add(idx); });
        setUploadDuplicateIndices(dups);
        if (dups.size > 0 || batchDups.size > 0) {
          const msgs: string[] = [];
          if (dups.size > 0) msgs.push(`${dups.size} DB duplicate(s)`);
          if (batchDups.size > 0) msgs.push(`${batchDups.size} batch duplicate(s)`);
          showToast(`${institutes.length} institutes loaded. ${msgs.join(", ")} found`, "error");
        } else {
          showToast(`${institutes.length} institutes loaded`, "success");
        }
      } catch { showToast(`${institutes.length} institutes loaded (duplicate check failed)`, "success"); }
    } catch { showToast("Failed to read file", "error"); }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleUploadRemoveRow = (index: number) => {
    const updated = previewData.filter((_, idx) => idx !== index);
    setPreviewData(updated);
    const newDups = new Set<number>();
    uploadDuplicateIndices.forEach(i => { if (i < index) newDups.add(i); else if (i > index) newDups.add(i - 1); });
    setUploadDuplicateIndices(newDups);
    const batchDups = new Set<number>();
    const nameCountMap = new Map<string, number[]>();
    updated.forEach((inst, idx) => {
      const key = inst.instituteName.toLowerCase().trim();
      if (!nameCountMap.has(key)) nameCountMap.set(key, []);
      nameCountMap.get(key)!.push(idx);
    });
    nameCountMap.forEach((indices) => { if (indices.length > 1) indices.slice(1).forEach(idx => batchDups.add(idx)); });
    setUploadBatchDuplicateIndices(batchDups);
    showToast("Row removed", "success");
  };

  const handleUploadRemoveDuplicates = () => {
    const allDups = new Set([...uploadDuplicateIndices, ...uploadBatchDuplicateIndices]);
    if (allDups.size === 0) return;
    const count = allDups.size;
    setPreviewData(previewData.filter((_, idx) => !allDups.has(idx)));
    setUploadDuplicateIndices(new Set());
    setUploadBatchDuplicateIndices(new Set());
    showToast(`Removed ${count} duplicate row(s)`, "success");
  };

  const handleUploadProcess = async () => {
    if (!previewData.length) { showToast("Please select a file", "error"); return; }
    setUploading(true);
    try {
      await instituteApi.bulkCreateInstitutes(previewData);
      showToast(`Successfully uploaded ${previewData.length} institutes`, "success");
      setUploadDialog(false);
      setSelectedFile(null);
      setPreviewData([]);
      setUploadDuplicateIndices(new Set());
      setUploadBatchDuplicateIndices(new Set());
      fetchInstitutes();
    } catch (error: unknown) {
      const err = error as { message?: string; data?: { errorMessages?: string[] } };
      if (err.data?.errorMessages?.length) {
        setUploadErrorMessages(err.data.errorMessages);
        setShowUploadErrorOverlay(true);
      } else {
        showToast(err.message || "Failed to upload institutes", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const resetAddInstituteState = () => {
    setAddInstituteDialog(false);
    setAddActiveTab("basic");
    setAddForm({ instituteName: "", instituteTier: "", city: "", state: "", isActive: true });
    setAddSelectedProgramIds([]);
    setAddTpoForms([]);
  };

  const handleAddInstituteSave = async () => {
    if (!addForm.instituteName || !addForm.city || !addForm.state || !addForm.instituteTier) {
      showToast("Please fill all required fields", "error"); return;
    }
    const validTpoForms = addTpoForms.filter((form) => form.tpoName.trim() && form.tpoEmail.trim());
    const primaryTpo = validTpoForms[0];
    try {
      const createResponse = await instituteApi.createInstitute({
        ...addForm,
        ...(addSelectedProgramIds.length > 0 ? { programIds: addSelectedProgramIds } : {}),
        ...(primaryTpo ? { tpoContact: primaryTpo } : {}),
      });

      if (validTpoForms.length > 1 && createResponse.data?.instituteId) {
        for (const form of validTpoForms.slice(1)) {
          await instituteTPOApi.createContact({
            instituteId: createResponse.data.instituteId,
            tpoName: form.tpoName,
            tpoEmail: form.tpoEmail,
            tpoMobile: form.tpoMobile,
            tpoDesignation: form.tpoDesignation,
            tpoStatus: "ACTIVE",
            isPrimary: false,
          });
        }
      }

      showToast("Institute added successfully", "success");
      resetAddInstituteState();
      fetchInstitutes();
    } catch (error) {
      console.error(error);
      showToast("Failed to add institute", "error");
    }
  };

  const handleInstituteClick = (instituteId: number) => navigate(`/ta-recruiter/institutes/${instituteId}`);
  const handleAddInstitute = () => {
    setAddInstituteDialog(true);
    setAddActiveTab("basic");
    setAddTpoForms([]);
  };

  const handleInvite = async (instituteId: number) => {
    setSendingEmail(instituteId);
    try {
      const res = await instituteApi.getInstituteWithTPOsById(instituteId);
      if (!res.success || !res.data) {
        showToast(res.message || 'Failed to load institute contacts', 'error');
        return;
      }
      const emailIds: string[] = (res.data.tpoDetails ?? [])
        .map((tpo: { tpoEmail: string }) => tpo.tpoEmail)
        .filter(Boolean);

      if (emailIds.length === 0) {
        showToast('No TPO contacts found for this institute', 'error');
        return;
      }
      navigate('/ta-recruiter/send-email', {
        state: {
          templateIds: [EMAIL_TEMPLATE_IDS.INSTITUTE_INVITE_ONCAMPUS, EMAIL_TEMPLATE_IDS.INSTITUTE_INVITE_OFFCAMPUS],
          emailIds,
        },
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(err?.response?.data?.message ?? err?.message ?? 'Failed to load institute contacts', 'error');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleToggleStatus = async (institute: InstituteResponse) => {
    try {
      await instituteApi.deleteInstitute(institute.instituteId);
      showToast(`Institute ${institute.isActive ? "deactivated" : "activated"} successfully`, "success");
      fetchInstitutes();
    } catch (error) {
      console.error(error);
      showToast("Failed to toggle institute status", "error");
    }
  };

  const getTierClassName = (tier: string): string => {
    switch (tier) {
      case "TIER_1": return "il-badge il-tier-1";
      case "TIER_2": return "il-badge il-tier-2";
      case "TIER_3": return "il-badge il-tier-3";
      default: return "il-badge";
    }
  };

  const getStatusClassName = (isActive: boolean): string =>
    isActive ? "g-status-active" : "g-status-inactive";

  if (loading) {
    return (
      <Box className="t-loading">
        <CircularProgress />
        <Typography>Loading institutes...</Typography>
      </Box>
    );
  }

  return (
    <Box className="institutes-container">
      {/* Top Filter Bar */}
      <Box className="institutes-filter-bar">
        {/* Search */}
        <Box className="institutes-search-wrap">
          <span className="institutes-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            className="institutes-search-input"
            placeholder="Search institutes by name"
            value={filters.instituteName}
            onChange={(e) => handleFilterChange("instituteName", e.target.value)}
          />
        </Box>

        {/* Location Filter */}
        <FormControl size="small" className="institutes-mui-select">
          <Select
            value={filters.state}
            onChange={(e) => handleFilterChange("state", e.target.value)}
            displayEmpty
            IconComponent={ChevronIcon}
          >
            <MenuItem value="">All Locations</MenuItem>
            {uniqueStates.map((state) => (
              <MenuItem key={state} value={state}>{state}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* City Filter — shown only when a state is selected */}
        {filters.state && citiesForSelectedState.length > 0 && (
          <FormControl size="small" className="institutes-mui-select">
            <Select
              value={filters.cities[0] || ""}
              onChange={(e) => handleFilterChange("cities", e.target.value ? [e.target.value] : [])}
              displayEmpty
              IconComponent={ChevronIcon}
            >
              <MenuItem value="">All Cities</MenuItem>
              {citiesForSelectedState.map((city) => (
                <MenuItem key={city} value={city}>{city}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Academic Filter */}
        <div className="institutes-academic-wrap" ref={academicDropdownRef}>
          <button
            className={`institutes-academic-btn${filters.programs.length > 0 ? " institutes-academic-btn--active" : ""}`}
            onClick={() => setShowAcademicDropdown(!showAcademicDropdown)}
          >
            {filters.programs.length > 0 ? `Academic (${filters.programs.length})` : "Academic"}
            <ChevronIcon />
          </button>
          {showAcademicDropdown && (
            <Box className="institutes-academic-panel">
              <Box className="institutes-academic-grid">
                {uniquePrograms.map((program) => (
                  <FormControlLabel
                    key={program}
                    control={
                      <Checkbox
                        checked={filters.programs.includes(program)}
                        onChange={() => handleProgramToggle(program)}
                        size="small"
                      />
                    }
                    label={program.replace(/_/g, " ")}
                    className="institutes-academic-check"
                  />
                ))}
              </Box>
            </Box>
          )}
        </div>

        {/* Funnel Filter Icon */}
        <div className="institutes-more-filters-wrap" ref={moreFiltersRef}>
          <button
            className={`institutes-funnel-btn${(filters.instituteTier || filters.status) ? " institutes-funnel-btn--active" : ""}`}
            onClick={() => setShowMoreFilters(!showMoreFilters)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {(filters.instituteTier || filters.status) && <span className="institutes-funnel-dot" />}
          </button>

          {showMoreFilters && (
            <Box className="institutes-more-panel">
              <Box className="institutes-more-panel-header">
                <Typography className="institutes-more-panel-title">Filters</Typography>
                <IconButton size="small" onClick={() => setShowMoreFilters(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Tier */}
              <Box className="institutes-more-section">
                <Typography className="institutes-more-label">Tier</Typography>
                <FormControl size="small" fullWidth className="institutes-mui-select">
                  <Select value={filters.instituteTier} onChange={(e) => handleFilterChange("instituteTier", e.target.value)} displayEmpty IconComponent={ChevronIcon}>
                    <MenuItem value="">All Tiers</MenuItem>
                    {uniqueTiers.map((tier) => <MenuItem key={tier} value={tier}>{tier.replace("_", " ")}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              {/* Status */}
              <Box className="institutes-more-section">
                <Typography className="institutes-more-label">Status</Typography>
                <FormControl size="small" fullWidth className="institutes-mui-select">
                  <Select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} displayEmpty IconComponent={ChevronIcon}>
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box className="institutes-more-footer">
                {(filters.instituteTier || filters.status) && (
                  <button className="institutes-clear-btn" onClick={() => setFilters(prev => ({ ...prev, instituteTier: "", status: "" }))}>Clear</button>
                )}
              </Box>
            </Box>
          )}
        </div>

        {/* Refresh/Clear filters button */}
        <button className="institutes-icon-action-btn" onClick={clearFilters} title="Clear filters">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        <Box className="institutes-filter-spacer" />

        <Box className="institutes-action-btns">
          <button className="institutes-upload-btn" onClick={() => setUploadDialog(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </button>
          <button className="institutes-add-btn" onClick={handleAddInstitute}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        </Box>
      </Box>

      {/* Card Grid */}
      {filteredInstitutes.length === 0 ? (
        <Box className="no-results-card">
          <Box className="no-results-content">
            <SchoolIcon className="no-results-icon" />
            <Typography variant="h6">No institutes found</Typography>
            <Typography variant="body2">Try adjusting your filters or add a new institute</Typography>
          </Box>
        </Box>
      ) : (
        <Box className="institutes-grid-wrap">
          <Box className="institutes-grid">
            {filteredInstitutes.slice(0, page * pageSize).map((institute) => (
              <Box
                key={institute.instituteId}
                className="institute-card"
                onClick={() => handleInstituteClick(institute.instituteId)}
              >
                <Box className="institute-card-top">
                  <Box className="institute-card-icon-wrap">
                    <img src="/InstituteIcon2.svg" alt="Institute" className="institute-card-icon-img" />
                  </Box>
                  <Box className="institute-card-info">
                    <Typography className="institute-card-name t-row-primary">{institute.instituteName}</Typography>
                    <Box className="institute-card-bottom">
                      <Typography className={getTierClassName(institute.instituteTier)}>
                        {institute.instituteTier.replace("_", " ")}
                      </Typography>
                      <Box className="institute-card-location">
                        <PlaceOutlinedIcon className="institute-card-location-icon" />
                        <Typography className="institute-card-location-text t-meta-text">
                          {institute.city}, {institute.state}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <Typography
                      className={getStatusClassName(institute.isActive)}
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(institute); }}
                    >
                      {institute.isActive ? "Active" : "Inactive"}
                    </Typography>
                    <Tooltip
                      title="Send Email to TPO"
                      arrow
                      classes={{ tooltip: 'g-tooltip', arrow: 'g-tooltip-arrow' }}
                    >
                      <span>
                        <IconButton
                          size="small"
                          className="t-action-btn g-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvite(institute.instituteId);
                          }}
                          disabled={sendingEmail === institute.instituteId}
                        >
                          {sendingEmail === institute.instituteId
                            ? <CircularProgress size={14} />
                            : <EmailIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
          <div ref={sentinelRef} className="il-sentinel" />
        </Box>
      )}

      {/* Add Institute Dialog */}
      <Dialog open={addInstituteDialog} onClose={resetAddInstituteState} maxWidth={false}
        PaperProps={{ className: 'ai-dialog-paper' }}>
        <DialogTitle className="ai-dialog-title-wrap">
          <Box className="ai-dialog-title-box">
            <Box>
              <Typography className="ai-dialog-heading">Add New Institute</Typography>
              <Typography className="ai-dialog-subheading">Enter all the details about the institute. All fields marked with * are required.</Typography>
            </Box>
            <IconButton size="small" onClick={resetAddInstituteState}><CloseIcon fontSize="small" /></IconButton>
          </Box>
          <Box className="ai-tabs">
            {(["basic", "contact", "academic"] as const).map((tab) => (
              <button key={tab} className={`ai-tab${addActiveTab === tab ? " ai-tab--active" : ""}`} onClick={() => setAddActiveTab(tab)}>
                {tab === "basic" ? "Basic Information" : tab === "contact" ? "Contact Details" : "Academic"}
              </button>
            ))}
          </Box>
        </DialogTitle>
        <DialogContent className="ai-dialog-content-wrap">
          {addActiveTab === "basic" && (
            <Box className="ai-form">
              <Box className="ai-row-2">
                <Box className="ai-field"><label className="ai-label">Institute Name <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="Enter institute name" value={addForm.instituteName} onChange={(e) => setAddForm({ ...addForm, instituteName: e.target.value })} /></Box>
                <Box className="ai-field"><label className="ai-label">Tier <span className="ai-req">*</span></label>
                  <select className="ai-select" value={addForm.instituteTier} onChange={(e) => setAddForm({ ...addForm, instituteTier: e.target.value })}>
                    <option value="">Select tier</option>
                    <option value="TIER_1">TIER 1</option>
                    <option value="TIER_2">TIER 2</option>
                    <option value="TIER_3">TIER 3</option>
                  </select></Box>
              </Box>
              <Box className="ai-row-3">
                <Box className="ai-field"><label className="ai-label">City <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="Enter city" value={addForm.city} onChange={(e) => setAddForm({ ...addForm, city: e.target.value })} /></Box>
                <Box className="ai-field"><label className="ai-label">State <span className="ai-req">*</span></label>
                  <input className="ai-input" placeholder="Enter state" value={addForm.state} onChange={(e) => setAddForm({ ...addForm, state: e.target.value })} /></Box>
              </Box>
              <Box className="ai-row-2">
                <Box className="ai-field"><label className="ai-label">Status <span className="ai-req">*</span></label>
                  <select className="ai-select" value={addForm.isActive ? "active" : "inactive"} onChange={(e) => setAddForm({ ...addForm, isActive: e.target.value === "active" })}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select></Box>
              </Box>
            </Box>
          )}
          {addActiveTab === "contact" && (
            <Box className="ai-form">
              <Box className="ai-contact-card">
                <Box className="ai-contact-card-header">
                  <Typography className="ai-contact-card-title">TPO Contacts</Typography>
                  <button className="ai-add-contact-btn" onClick={() => setAddTpoForms((prev) => [...prev, { ...EMPTY_TPO_FORM }])}>+ Add</button>
                </Box>
              </Box>
              {addTpoForms.map((form, idx) => (
                <Box key={idx} className="ai-contact-card">
                  <Box className="ai-contact-card-header">
                    <Typography className="ai-contact-card-title">{idx === 0 ? "Primary Contact Person" : `TPO Contact ${idx + 1}`}</Typography>
                    {idx > 0 && (
                      <button className="ai-add-contact-btn ai-remove-contact-btn" onClick={() => setAddTpoForms((prev) => prev.filter((_, i) => i !== idx))}>✕ Remove</button>
                    )}
                  </Box>
                  <Box className="ai-row-2">
                    <Box className="ai-field"><label className="ai-label">TPO Name <span className="ai-req">*</span></label>
                      <input className="ai-input" placeholder="Enter contact person name" value={form.tpoName} onChange={(e) => setAddTpoForms((prev) => prev.map((f, i) => i === idx ? { ...f, tpoName: e.target.value } : f))} /></Box>
                    <Box className="ai-field"><label className="ai-label">Phone <span className="ai-req">*</span></label>
                      <input className="ai-input" placeholder="+91 98765 43210" value={form.tpoMobile} onChange={(e) => setAddTpoForms((prev) => prev.map((f, i) => i === idx ? { ...f, tpoMobile: e.target.value.replace(/\D/g, "").slice(0, 10) } : f))} /></Box>
                  </Box>
                  <Box className="ai-row-2">
                    <Box className="ai-field"><label className="ai-label">Email <span className="ai-req">*</span></label>
                      <input className="ai-input" placeholder="person@institute.edu" type="email" value={form.tpoEmail} onChange={(e) => setAddTpoForms((prev) => prev.map((f, i) => i === idx ? { ...f, tpoEmail: e.target.value } : f))} /></Box>
                    <Box className="ai-field"><label className="ai-label">Designation</label>
                      <input className="ai-input" placeholder="e.g., Placement Officer" value={form.tpoDesignation} onChange={(e) => setAddTpoForms((prev) => prev.map((f, i) => i === idx ? { ...f, tpoDesignation: e.target.value } : f))} /></Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
          {addActiveTab === "academic" && (
            <Box className="ai-form">
              <Typography className="ai-academic-title">Academic Information</Typography>
              <Typography className="ai-academic-subtitle">Add all departments available in the institute</Typography>
              <Box className="ai-program-chips-wrap">
                {allPrograms.map((program) => {
                  const selected = addSelectedProgramIds.includes(program.programId);
                  return (
                    <button
                      key={program.programId}
                      type="button"
                      className={`ai-program-chip${selected ? ' ai-program-chip--active' : ''}`}
                      onClick={() => setAddSelectedProgramIds((prev) =>
                        prev.includes(program.programId) ? prev.filter((id) => id !== program.programId) : [...prev, program.programId]
                      )}
                    >
                      <span className="ai-chip-checkbox">{selected && <span className="ai-chip-check" />}</span>
                      {program.programName}
                    </button>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="ai-dialog-actions-wrap">
          {addActiveTab === "academic" ? (
            <>
              <button className="ai-clear-btn" onClick={() => setAddSelectedProgramIds([])}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Clear
              </button>
              <button className="ai-save-btn" onClick={handleAddInstituteSave}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                Save
              </button>
            </>
          ) : (
            <>
              <button className="ai-cancel-btn" onClick={resetAddInstituteState}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Cancel
              </button>
              <button className="ai-save-btn" onClick={handleAddInstituteSave}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                Save
              </button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialog}
        onClose={() => { setUploadDialog(false); setSelectedFile(null); setPreviewData([]); setUploadDuplicateIndices(new Set()); setUploadBatchDuplicateIndices(new Set()); }}
        maxWidth="md"
        fullWidth={false}
        PaperProps={{ className: 'iu-dialog-paper' }}>
        <DialogTitle className="iu-dialog-title-wrap">
          <Box className="iu-dialog-title-box">
            <Box>
              <Typography className="iu-dialog-heading">Upload Institutes via Excel</Typography>
              <Typography className="iu-dialog-subheading">Upload multiple institutes at once using our Excel template</Typography>
            </Box>
            <IconButton size="small" onClick={() => { setUploadDialog(false); setSelectedFile(null); setPreviewData([]); setUploadDuplicateIndices(new Set()); setUploadBatchDuplicateIndices(new Set()); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="iu-dialog-content-wrap">

          {/* Dropzone — hide when data loaded */}
          {previewData.length === 0 && (
            <>
              <Box className="iu-step-card">
                <Box className="iu-step-header">
                  <Box className="iu-step-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </Box>
                  <Box>
                    <Typography className="iu-step-title">Step 1: Download Template</Typography>
                    <Typography className="iu-step-desc">Download our Excel template with all required fields.</Typography>
                  </Box>
                </Box>
                <button className="iu-download-btn" onClick={handleDownloadTemplate}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Excel Template
                </button>
              </Box>
              <Typography className="iu-step-title">Step 2: Upload Filled Template</Typography>
              <Box
                className={`iu-dropzone${dragOver ? " iu-dropzone--active" : ""}${selectedFile ? " iu-dropzone--selected" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                <Box className="iu-drop-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </Box>
                <Typography className="iu-drop-text">{selectedFile ? selectedFile.name : "Drag and drop your Excel file here"}</Typography>
                <Typography className="iu-or">or</Typography>
                <button className="iu-browse-btn" onClick={() => fileInputRef.current?.click()}>Browse Files</button>
                <Typography className="iu-formats">Supported formats: .xlsx, .xls (Max size: 10MB)</Typography>
                <input ref={fileInputRef} type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} />
              </Box>
            </>
          )}

          {/* Preview Table with duplicate detection */}
          {previewData.length > 0 && (
            <Box>
              <Box className="iu-preview-header">
                <Typography className="iu-preview-title">
                  Uploaded Data ({previewData.length} institutes)
                </Typography>
                <Box className="iu-preview-actions">
                  {(uploadDuplicateIndices.size > 0 || uploadBatchDuplicateIndices.size > 0) && (
                    <Button variant="contained" size="small" onClick={handleUploadRemoveDuplicates}
                      className="iu-remove-dup-btn">
                      Remove Duplicates
                    </Button>
                  )}
                  <button className="iu-browse-btn" onClick={() => { setPreviewData([]); setSelectedFile(null); setUploadDuplicateIndices(new Set()); setUploadBatchDuplicateIndices(new Set()); }}>
                    Change File
                  </button>
                </Box>
              </Box>
              <Box className="iu-table-wrap">
                <table className="iu-table">
                  <thead>
                    <tr>
                      <th>Institute Name</th>
                      <th>Tier</th>
                      <th>City</th>
                      <th>State</th>
                      <th>TPO</th>
                      <th className="center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((inst, index) => (
                      <tr key={index}>
                        <td>
                          {uploadDuplicateIndices.has(index) ? (
                            <Box className="duplicate-name-container"><span className="warning-dot" /><span className="duplicate-name-text">{inst.instituteName}</span></Box>
                          ) : uploadBatchDuplicateIndices.has(index) ? (
                            <Box className="batch-duplicate-name-container"><span className="batch-warning-dot" /><span className="batch-duplicate-name-text">{inst.instituteName}</span></Box>
                          ) : <span className="iu-cell-text">{inst.instituteName}</span>}
                        </td>
                        <td>{inst.instituteTier}</td>
                        <td>{inst.city}</td>
                        <td>{inst.state}</td>
                        <td>{inst.tpoContact?.tpoName || "—"}</td>
                        <td className="center">
                          <IconButton size="small" onClick={() => handleUploadRemoveRow(index)} className="iu-delete-btn">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="iu-dialog-actions-wrap">
          <button className="iu-cancel-btn" onClick={() => { setUploadDialog(false); setSelectedFile(null); setPreviewData([]); setUploadDuplicateIndices(new Set()); setUploadBatchDuplicateIndices(new Set()); }}>Cancel</button>
          <button className="iu-process-btn" onClick={handleUploadProcess}
            disabled={uploading || !previewData.length || uploadDuplicateIndices.size > 0 || uploadBatchDuplicateIndices.size > 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Processing..." : "Upload to Database"}
          </button>
        </DialogActions>
      </Dialog>

      {/* Upload Error Overlay */}
      {showUploadErrorOverlay && (
        <Box className="iu-error-overlay" onClick={() => setShowUploadErrorOverlay(false)}>
          <Box className="iu-error-box" onClick={(e) => e.stopPropagation()}>
            <Box className="iu-error-header">
              <Typography variant="h6" className="iu-error-title">Validation Errors ({uploadErrorMessages.length})</Typography>
              <IconButton onClick={() => setShowUploadErrorOverlay(false)} size="small"><CloseIcon /></IconButton>
            </Box>
            <Box className="iu-error-list">
              {uploadErrorMessages.map((error, index) => (
                <Box key={index} className="iu-error-item">
                  <Typography className="iu-error-num">{index + 1}.</Typography>
                  <Typography className="iu-error-msg">{error}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

    </Box>
  );
};

export default InstitutesList;
