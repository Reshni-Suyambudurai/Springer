import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ViewListIcon from '@mui/icons-material/ViewList';
import DescriptionIcon from '@mui/icons-material/Description';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import '../../../css/TA_Recruiter/Settings/Settings.css';

const CARDS = [
  {
    title: 'Skills Management',
    desc: 'Manage technical and soft skills for candidate assessment',
    icon: <SchoolIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/skills',
  },
  {
    title: 'Eligibility Management',
    desc: 'Define and configure candidate eligibility criteria',
    icon: <CheckCircleIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/eligibility',
  },
  {
    title: 'Round Template Management',
    desc: 'Create and manage interview round templates',
    icon: <ViewListIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/round-templates',
  },
  {
    title: 'Documents Management',
    desc: 'Manage required documents and verification settings',
    icon: <DescriptionIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/documents',
  },
];

const Settings = () => {
  const navigate = useNavigate();

  return (
    <Box className="t-page">
      <Card className="t-card">

        <Box className="t-header">
          <Typography className="t-page-title">Manage</Typography>
          <Typography className="t-page-subtitle">Configure system settings and preferences</Typography>
        </Box>

        <Box className="t-separator" />

        <Box className="t-body">
          <Box className="settings-grid">
            {CARDS.map((card) => (
              <Card
                key={card.path}
                className="settings-item-card"
                onClick={() => navigate(card.path)}
              >
                <Box className="settings-item-icon-box">{card.icon}</Box>
                <Box className="settings-item-body">
                  <Typography className="t-row-primary">{card.title}</Typography>
                  <Typography className="t-body-text">{card.desc}</Typography>
                </Box>
                <ChevronRightIcon className="settings-item-arrow" fontSize="small" />
              </Card>
            ))}
          </Box>
        </Box>

      </Card>
    </Box>
  );
};

export default Settings;
