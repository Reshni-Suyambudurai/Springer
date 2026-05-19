import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography } from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import '../../../css/TA_Recruiter/Settings/Settings.css';

const CARDS = [
  {
    title: 'Skills Management',
    desc: 'Manage technical and soft skills for candidate assessment',
    icon: <SchoolOutlinedIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/skills',
  },
  {
    title: 'Eligibility Management',
    desc: 'Define and configure candidate eligibility criteria',
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/eligibility',
  },
  {
    title: 'Round Template Management',
    desc: 'Create and manage interview round templates',
    icon: <AssignmentOutlinedIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/round-templates',
  },
  {
    title: 'Email Template Management',
    desc: 'Manage email templates for notifications and communications',
    icon: <MailOutlineIcon sx={{ fontSize: 22 }} />,
    path: '/ta-recruiter/settings/email-templates',
  },
];

const Settings = () => {
  const navigate = useNavigate();

  return (
    <Box className="t-page settings-page-override">
      <Card className="t-card settings-card-override">

        <Box className="t-body settings-body-override">
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
