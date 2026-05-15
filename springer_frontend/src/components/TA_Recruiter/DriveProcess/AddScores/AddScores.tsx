import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import CodeIcon from "@mui/icons-material/Code";
import BackButton from "../../../Common/BackButton";
import "../../../../css/TA_Recruiter/DriveProcess/AddScores/AddScores.css";

const scoreCards = [
  {
    title: "Upload Aptitude Score",
    description: "Upload aptitude test results from an external file",
    icon: <UploadFileIcon className="as-card-icon" />,
    className: "as-icon-aptitude",
    route: "round1",
  },
  {
    title: "Add Communication Score",
    description: "Enter communication round evaluation scores",
    icon: <RecordVoiceOverIcon className="as-card-icon" />,
    className: "as-icon-communication",
    route: "round2",
  },
  {
    title: "Add Technical Score",
    description: "Enter technical round evaluation scores",
    icon: <CodeIcon className="as-card-icon" />,
    className: "as-icon-technical",
    route: "round3",
  },
];

const AddScores: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();

  return (
    <Box className="as-container">
      <Card className="as-header">
        <BackButton variant="header" />
        <Typography variant="h6" className="as-title">
          Add Scores
        </Typography>
      </Card>

      <Box className="as-cards-grid">
        {scoreCards.map((card) => (
          <Card key={card.title} className="as-card" onClick={() => navigate(`/drive-process/add-scores/${driveId}/${card.route}`)}>
            <Box className={`as-card-icon-wrap ${card.className}`}>
              {card.icon}
            </Box>
            <Typography className="as-card-title">{card.title}</Typography>
            <Typography className="as-card-desc">{card.description}</Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default AddScores;
