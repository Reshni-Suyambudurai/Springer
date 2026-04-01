import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { skillsApi } from "../../../services/hiring.api";
import { showToast } from "../../../utils/toast";
import type {
  SkillRequest,
  SkillResponse,
  SkillCategory,
} from "../../../types/TA_Recruiter/Hiring/skill.types";
import BackButton from "../../Common/BackButton";
import "../../../css/TA_Recruiter/Settings/SkillsManagement.css";

const SkillsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<SkillResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<SkillResponse | null>(null);
  const [skillName, setSkillName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    // Filter skills based on search term
    if (searchTerm.trim() === "") {
      setFilteredSkills(skills);
    } else {
      const filtered = skills.filter((skill) =>
        skill.skillName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSkills(filtered);
    }
  }, [searchTerm, skills]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await skillsApi.getAllSkills();
      if (response.success && response.data) {
        setSkills(response.data);
        setFilteredSkills(response.data);
      } else {
        showToast(response.message || "Failed to load skills", "error");
      }
    } catch (error: unknown) {
      console.error("Error fetching skills:", error);
      let errorMessage = "Failed to load skills";
      
      // API returns ApiResponse<T> structure even for errors
      if (error && typeof error === 'object') {
        // Check if error object directly has ApiResponse structure (message, success, data)
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // Otherwise check nested in axios response
        else if ('response' in error) {
          const axiosError = error as { 
            response?: { 
              data?: { success?: boolean; message?: string; data?: unknown } 
            } 
          };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      }
      
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = (category: SkillCategory) => {
    setEditMode(false);
    setCurrentSkill(null);
    setSkillName("");
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleEditClick = (skill: SkillResponse) => {
    setEditMode(true);
    setCurrentSkill(skill);
    setSkillName(skill.skillName);
    setSelectedCategory(skill.category);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSkillName("");
    setCurrentSkill(null);
    setEditMode(false);
    setSelectedCategory(null);
  };

  const handleSubmit = async () => {
    if (!skillName.trim()) {
      showToast("Skill name is required", "error");
      return;
    }

    if (!selectedCategory) {
      showToast("Skill category is required", "error");
      return;
    }

    try {
      setSaving(true);
      const data: SkillRequest = { 
        skillName: skillName.trim(),
        category: selectedCategory
      };

      if (editMode && currentSkill) {
        // Update existing skill
        const response = await skillsApi.updateSkill(currentSkill.skillId, data);
        if (response.success) {
          showToast("Skill updated successfully", "success");
          fetchSkills();
          handleDialogClose();
        } else {
          showToast(response.message || "Failed to update skill", "error");
        }
      } else {
        // Create new skill
        const response = await skillsApi.createSkill(data);
        if (response.success) {
          showToast("Skill created successfully", "success");
          fetchSkills();
          handleDialogClose();
        } else {
          showToast(response.message || "Failed to create skill", "error");
        }
      }
    } catch (error: unknown) {
      console.error("Error saving skill:", error);
      let errorMessage = editMode ? "Failed to update skill" : "Failed to create skill";
      
      // API returns ApiResponse<T> structure even for errors
      if (error && typeof error === 'object') {
        // Check if error object directly has ApiResponse structure (message, success, data)
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // Otherwise check nested in axios response
        else if ('response' in error) {
          const axiosError = error as { 
            response?: { 
              data?: { success?: boolean; message?: string; data?: unknown } 
            } 
          };
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message;
          }
        }
      }
      
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  // Group skills by category
  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    const category = skill.category || "TECHNICAL"; // Default fallback
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<SkillCategory, SkillResponse[]>);

  // Get category display name
  const getCategoryDisplayName = (category: SkillCategory): string => {
    switch (category) {
      case "TECHNICAL":
        return "Technical Skills";
      case "SOFT_SKILL":
        return "Soft Skills";
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" className="skills-loading-container">
        <CircularProgress />
        <Typography className="skills-loading-text">Loading skills...</Typography>
      </Container>
    );
  }

  return (
    <Box className="skills-management-container">
      {/* Unified Header */}
      <Card className="skills-header-card">
        <Box className="skills-header-content">
          <Box className="skills-header-left">
            <BackButton inline />
          </Box>
          
          <Box className="skills-header-center">
            <Typography variant="h5" component="h1">
              Skills Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage technical and soft skills
            </Typography>
          </Box>

          <Box className="skills-header-right">
            <TextField
              placeholder="Filter by skill name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon className="skills-search-icon" />,
              }}
              size="small"
              className="skills-search-field"
            />
          </Box>
        </Box>
      </Card>

      {/* Scrollable Skills Content */}
      <Box className="skills-content-wrapper">
        {filteredSkills.length === 0 ? (
          <Alert severity="info">
            {searchTerm
              ? `No skills found matching "${searchTerm}"`
              : "No skills available. Click the + button in any category to add a new skill."}
          </Alert>
        ) : (
          <>
            {(["TECHNICAL", "SOFT_SKILL"] as SkillCategory[]).map((category) => {
              const categorySkills = groupedSkills[category] || [];
              
              if (categorySkills.length === 0 && searchTerm) {
                // Skip empty categories when filtering
                return null;
              }

              return (
                <Box key={category} className="skills-category-section">
                  {/* Category Header */}
                  <Box className="skills-category-header">
                    <Typography variant="h5" component="h2" className="category-title">
                      {getCategoryDisplayName(category)}
                    </Typography>
                    <IconButton
                      onClick={() => handleAddClick(category)}
                      className="skills-category-add-button"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>

                  {/* Skills Grid for this category */}
                  {categorySkills.length === 0 ? (
                    <Alert severity="info" className="skills-category-empty-alert">
                      No {category.toLowerCase().replace("_", " ")} skills yet. Click the + button to add one.
                    </Alert>
                  ) : (
                    <Grid container spacing={2} className="skills-category-grid">
                      {categorySkills.map((skill) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={skill.skillId}>
                          <Card className="skill-card">
                            <CardContent className="skill-card-content">
                              <Box className="skill-card-inner">
                                <Typography variant="body1" className="skill-name">
                                  {skill.skillName}
                                </Typography>
                                <IconButton
                                  onClick={() => handleEditClick(skill)}
                                  className="edit-icon"
                                >
                                  <EditIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}

                  <Divider className="skills-category-divider" />
                </Box>
              );
            })}
          </>
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        className="skills-dialog"
      >
        <DialogTitle>
          <Box className="dialog-title-container">
            <Typography variant="h6">
              {editMode ? "Edit Skill" : `Add New ${selectedCategory ? getCategoryDisplayName(selectedCategory).slice(0, -1) : "Skill"}`}
            </Typography>
            <IconButton onClick={handleDialogClose} className="dialog-close-btn">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editMode ? (
            // Edit mode: Show dropdown to change category
            <FormControl fullWidth margin="normal">
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={selectedCategory || ""}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
              >
                <MenuItem value="TECHNICAL">Technical Skills</MenuItem>
                <MenuItem value="SOFT_SKILL">Soft Skills</MenuItem>
              </Select>
            </FormControl>
          ) : (
            // Add mode: Show disabled field with pre-selected category
            <TextField
              disabled
              fullWidth
              label="Category"
              value={selectedCategory ? getCategoryDisplayName(selectedCategory) : ""}
              margin="normal"
              variant="filled"
            />
          )}
          <TextField
            autoFocus
            fullWidth
            label="Skill Name"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            margin="normal"
            placeholder="e.g., Java, Python, Communication"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
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

export default SkillsManagement;
