
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ViewListIcon from "@mui/icons-material/ViewList";
import DescriptionIcon from "@mui/icons-material/Description";
import "../../../css/TA_Recruiter/Settings/Settings.css";

interface SettingsCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();

  const settingsCards: SettingsCard[] = [
    {
      title: "Skills Management",
      description: "Manage and configure technical and soft skills for assessment",
      icon: <SchoolIcon sx={{ fontSize: 50 }} />,
      path: "/ta-recruiter/settings/skills",
      color: "#1976d2",
    },
    {
      title: "Eligibility Management",
      description: "Define and manage candidate eligibility criteria",
      icon: <CheckCircleIcon sx={{ fontSize: 50 }} />,
      path: "/ta-recruiter/settings/eligibility",
      color: "#2e7d32",
    },
    {
      title: "Round Template Management",
      description: "Create and manage interview round templates",
      icon: <ViewListIcon sx={{ fontSize: 50 }} />,
      path: "/ta-recruiter/settings/round-templates",
      color: "#ed6c02",
    },
    {
      title: "Documents Management",
      description: "Manage required documents and verification settings",
      icon: <DescriptionIcon sx={{ fontSize: 50 }} />,
      path: "/ta-recruiter/settings/documents",
      color: "#9c27b0",
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Container maxWidth="lg" className="settings-container">
      <Box className="settings-header">
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure and manage system settings
        </Typography>
      </Box>

      <Grid container spacing={3} className="settings-grid">
        {settingsCards.map((card,index) => (
         <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
            <Card
              className="settings-card"
              onClick={() => handleCardClick(card.path)}
              sx={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent className="settings-card-content">
                <Box
                  className="settings-card-icon"
                  sx={{ color: card.color }}
                >
                  {card.icon}
                </Box>
                <Typography
                  variant="h5"
                  component="h2"
                  className="settings-card-title"
                  gutterBottom
                >
                  {card.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="settings-card-description"
                >
                  {card.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Settings;