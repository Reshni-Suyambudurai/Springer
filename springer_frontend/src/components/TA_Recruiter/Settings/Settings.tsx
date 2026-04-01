
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
      icon: <SchoolIcon />,
      path: "/ta-recruiter/settings/skills",
      color: "skills",
    },
    {
      title: "Eligibility Management",
      description: "Define and manage candidate eligibility criteria",
      icon: <CheckCircleIcon />,
      path: "/ta-recruiter/settings/eligibility",
      color: "eligibility",
    },
    {
      title: "Round Template Management",
      description: "Create and manage interview round templates",
      icon: <ViewListIcon />,
      path: "/ta-recruiter/settings/round-templates",
      color: "rounds",
    },
    {
      title: "Documents Management",
      description: "Manage required documents and verification settings",
      icon: <DescriptionIcon />,
      path: "/ta-recruiter/settings/documents",
      color: "documents",
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
        {settingsCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
            <Card
              className={`settings-card settings-card-${card.color}`}
              onClick={() => handleCardClick(card.path)}
            >
              <CardContent className="settings-card-content">
                <Box className="settings-card-icon">
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