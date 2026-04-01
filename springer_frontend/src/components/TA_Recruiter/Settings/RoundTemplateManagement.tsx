import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import CloseIcon from "@mui/icons-material/Close";
import { roundTemplateApi } from "../../../services/drive.api";
import { showToast } from "../../../utils/toast";
import { tokenstore } from "../../../auth/tokenstore";
import BackButton from "../../Common/BackButton";
import type {
  RoundTemplateRequest,
  RoundTemplateResponse,
  RoundTemplateUpdateRequest,
} from "../../../types/TA_Recruiter/Drive/roundTemplate.types";
import "../../../css/TA_Recruiter/Settings/RoundTemplateManagement.css";

interface Section {
  sectionName: string;
  outOf: number;
}

interface RoundTemplateExtended extends Omit<RoundTemplateResponse, 'sections'> {
  sections: Section[];
}

const RoundTemplateManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<RoundTemplateExtended[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<RoundTemplateExtended[]>([]);
  
  // Filters
  const [filterRoundName, setFilterRoundName] = useState("");
  const [filterRoundNo, setFilterRoundNo] = useState("");
  const [filterIsActive, setFilterIsActive] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<RoundTemplateExtended | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    roundNo: "",
    roundName: "",
    outoffScore: "",
    minScore: "",
    weightage: "",
  });
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRoundName, filterRoundNo, filterIsActive, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await roundTemplateApi.getAllRoundTemplates();
      if (response.success && response.data) {
        const templatesWithSections = response.data.map((template) => ({
          ...template,
          sections: Array.isArray(template.sections) ? template.sections as Section[] : [],
        }));
        setTemplates(templatesWithSections);
        setFilteredTemplates(templatesWithSections);
      }
    } catch (error) {
      console.error("Error fetching round templates:", error);
      showToast("Failed to load round templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    if (filterRoundName.trim()) {
      filtered = filtered.filter((t) =>
        t.roundName.toLowerCase().includes(filterRoundName.toLowerCase())
      );
    }

    if (filterRoundNo.trim()) {
      const roundNo = parseInt(filterRoundNo);
      if (!isNaN(roundNo)) {
        filtered = filtered.filter((t) => t.roundNo === roundNo);
      }
    }

    if (filterIsActive !== "all") {
      const isActive = filterIsActive === "true";
      filtered = filtered.filter((t) => t.isActive === isActive);
    }

    setFilteredTemplates(filtered);
  };

  const handleAddClick = () => {
    setEditMode(false);
    setCurrentTemplate(null);
    setFormData({
      roundNo: "",
      roundName: "",
      outoffScore: "",
      minScore: "",
      weightage: "",
    });
    setSections([]);
    setDialogOpen(true);
  };

  const handleEditClick = (template: RoundTemplateExtended) => {
    setEditMode(true);
    setCurrentTemplate(template);
    setFormData({
      roundNo: template.roundNo.toString(),
      roundName: template.roundName,
      outoffScore: template.outoffScore.toString(),
      minScore: template.minScore.toString(),
      weightage: template.weightage.toString(),
    });
    setSections(template.sections.length > 0 ? [...template.sections] : []);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (template: RoundTemplateExtended) => {
    try {
      const response = await roundTemplateApi.deleteRoundTemplate(template.roundConfigId);
      if (response.success) {
        showToast(`Template ${template.isActive ? 'deactivated' : 'activated'} successfully`, "success");
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error toggling template status:", error);
      showToast("Failed to update template status", "error");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({
      roundNo: "",
      roundName: "",
      outoffScore: "",
      minScore: "",
      weightage: "",
    });
    setSections([]);
    setCurrentTemplate(null);
    setEditMode(false);
  };

  const handleAddSection = () => {
    setSections([...sections, { sectionName: "", outOf: 0 }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof Section, value: string | number) => {
    const updated = [...sections];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSections(updated);
  };

  const validateForm = (): boolean => {
    if (!formData.roundNo || !formData.roundName || !formData.outoffScore || !formData.minScore || !formData.weightage) {
      showToast("All fields except sections are required", "error");
      return false;
    }

    const outoffScore = parseFloat(formData.outoffScore);
    const minScore = parseFloat(formData.minScore);
    const weightage = parseFloat(formData.weightage);

    if (isNaN(outoffScore) || isNaN(minScore) || isNaN(weightage)) {
      showToast("Score and weightage must be valid numbers", "error");
      return false;
    }

    if (minScore > outoffScore) {
      showToast("Minimum score cannot exceed total score", "error");
      return false;
    }

    // Validate sections if provided
    if (sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        if (!sections[i].sectionName.trim()) {
          showToast(`Section ${i + 1}: Name is required`, "error");
          return false;
        }
        if (sections[i].outOf <= 0) {
          showToast(`Section ${i + 1}: Out of score must be greater than 0`, "error");
          return false;
        }
      }

      // Check if total section scores match outoffScore
      const totalSectionScore = sections.reduce((sum, s) => sum + s.outOf, 0);
      if (totalSectionScore !== outoffScore) {
        showToast(`Total section scores (${totalSectionScore}) must equal total score (${outoffScore})`, "error");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const user = tokenstore.getUser();
    if (!user) {
      showToast("Please log in to continue", "error");
      return;
    }

    try {
      setSaving(true);

      if (editMode && currentTemplate) {
        // Update existing template
        const updateData: RoundTemplateUpdateRequest = {
          roundNo: parseInt(formData.roundNo),
          roundName: formData.roundName,
          outoffScore: parseFloat(formData.outoffScore),
          minScore: parseFloat(formData.minScore),
          weightage: parseFloat(formData.weightage),
          sections: sections.length > 0 ? (sections as unknown as Record<string, unknown>) : undefined,
        };

        const response = await roundTemplateApi.updateRoundTemplate(currentTemplate.roundConfigId, updateData);
        if (response.success) {
          showToast("Template updated successfully", "success");
          fetchTemplates();
          handleDialogClose();
        }
      } else {
        // Create new template
        const createData: RoundTemplateRequest = {
          roundNo: parseInt(formData.roundNo),
          roundName: formData.roundName,
          outoffScore: parseFloat(formData.outoffScore),
          minScore: parseFloat(formData.minScore),
          weightage: parseFloat(formData.weightage),
          sections: sections.length > 0 ? (sections as unknown as Record<string, unknown>) : [] as unknown as Record<string, unknown>,
          isActive: true,
          createdBy: user.userId,
        };

        const response = await roundTemplateApi.createRoundTemplate(createData);
        if (response.success) {
          showToast("Template created successfully", "success");
          fetchTemplates();
          handleDialogClose();
        }
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showToast(editMode ? "Failed to update template" : "Failed to create template", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="round-loading-container">
        <CircularProgress />
        <Typography className="round-loading-text">Loading round templates...</Typography>
      </Box>
    );
  }

  return (
    <Box className="round-template-container">
      {/* Header with Filters */}
      <Card className="round-header-card">
        <Box className="round-header-content">
          <Box className="round-header-left">
            <BackButton inline />
          </Box>
          
          <Box className="round-header-filters">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filter by Name"
                  value={filterRoundName}
                  onChange={(e) => setFilterRoundName(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Filter by Round No"
                  type="number"
                  value={filterRoundNo}
                  onChange={(e) => setFilterRoundNo(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterIsActive}
                    label="Status"
                    onChange={(e) => setFilterIsActive(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box className="round-header-right">
            <IconButton
              onClick={handleAddClick}
              className="round-add-button"
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>

      {/* Scrollable Content */}
      <Box className="round-content-wrapper">
        {/* Templates List */}
        <Box className="round-templates-list">
          {filteredTemplates.length === 0 ? (
            <Alert severity="info">
              No round templates found. Click the + button to create one.
            </Alert>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.roundConfigId} className="round-template-card">
                <CardContent>
                <Box className="round-template-card-header">
                  <Box className="round-template-title-section">
                    <Typography variant="h6" className="round-template-title">
                      Round {template.roundNo}: {template.roundName}
                    </Typography>
                    <Chip
                      label={template.isActive ? "Active" : "Inactive"}
                      color={template.isActive ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Box className="round-template-actions">
                    <IconButton
                      size="small"
                      onClick={() => handleEditClick(template)}
                      className="round-edit-button"
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(template)}
                      className={template.isActive ? "round-toggle-active" : "round-toggle-inactive"}
                      title={template.isActive ? "Deactivate" : "Activate"}
                    >
                      {template.isActive ? (
                        <ToggleOnIcon fontSize="small" />
                      ) : (
                        <ToggleOffIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                </Box>

                <Box className="round-template-details">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" className="round-detail-label">
                        Total Score
                      </Typography>
                      <Typography variant="body1" className="round-detail-value">
                        {template.outoffScore}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" className="round-detail-label">
                        Min Score
                      </Typography>
                      <Typography variant="body1" className="round-detail-value">
                        {template.minScore}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" className="round-detail-label">
                        Weightage
                      </Typography>
                      <Typography variant="body1" className="round-detail-value">
                        {template.weightage}%
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant="caption" className="round-detail-label">
                        Created By
                      </Typography>
                      <Typography variant="body1" className="round-detail-value">
                        {template.createdByName}
                      </Typography>
                    </Grid>
                  </Grid>

                  {template.sections.length > 0 && (
                    <Box className="round-sections-container">
                      <Divider className="round-sections-divider" />
                      <Typography variant="subtitle2" className="round-sections-title">
                        Sections:
                      </Typography>
                      <Box className="round-sections-list">
                        {template.sections.map((section, idx) => (
                          <Chip
                            key={idx}
                            label={`${section.sectionName}: ${section.outOf}`}
                            variant="outlined"
                            size="small"
                            className="round-section-chip"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
        )}
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        className="round-dialog"
      >
        <DialogTitle className="round-dialog-title">
          <Box className="round-dialog-title-container">
            <Typography variant="h6">
              {editMode ? "Edit Round Template" : "Create Round Template"}
            </Typography>
            <IconButton onClick={handleDialogClose} size="small" className="round-dialog-close-btn">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="round-dialog-content">
          <Grid container spacing={2} className="round-dialog-grid">
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Round Number"
                type="number"
                value={formData.roundNo}
                onChange={(e) => setFormData({ ...formData, roundNo: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Round Name"
                value={formData.roundName}
                onChange={(e) => setFormData({ ...formData, roundName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                label="Total Score"
                type="number"
                value={formData.outoffScore}
                onChange={(e) => setFormData({ ...formData, outoffScore: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                label="Minimum Score"
                type="number"
                value={formData.minScore}
                onChange={(e) => setFormData({ ...formData, minScore: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                label="Weightage (%)"
                type="number"
                value={formData.weightage}
                onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
              />
            </Grid>

            {/* Sections */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Sections (Optional)
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddSection}
                  variant="outlined"
                >
                  Add Section
                </Button>
              </Box>

              {sections.map((section, index) => (
                <Box key={index} className="section-input-row" mb={2}>
                  <TextField
                    label="Section Name"
                    value={section.sectionName}
                    onChange={(e) => handleSectionChange(index, "sectionName", e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Out Of"
                    type="number"
                    value={section.outOf || ""}
                    onChange={(e) => handleSectionChange(index, "outOf", parseFloat(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveSection(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              {sections.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Total section scores: {sections.reduce((sum, s) => sum + s.outOf, 0)} / {formData.outoffScore || 0}
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? "Saving..." : editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoundTemplateManagement;