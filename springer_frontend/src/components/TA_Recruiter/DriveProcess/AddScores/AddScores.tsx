import React from "react";
import { Box, Button, Card, Typography } from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import TerminalOutlinedIcon from "@mui/icons-material/TerminalOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useNavigate, useParams } from "react-router-dom";
import "../../../../css/TA_Recruiter/DriveProcess/AddScores/AddScores.css";

const rounds = [
  {
    number: 1,
    title: "Aptitude Round",
    description: "Upload and review aptitude assessment scores.",
    icon: AssessmentOutlinedIcon,
    iconClass: "as-icon-aptitude",
  },
  {
    number: 2,
    title: "Communication Round",
    description: "Upload and review communication assessment scores.",
    icon: ForumOutlinedIcon,
    iconClass: "as-icon-communication",
  },
  {
    number: 3,
    title: "Technical Round",
    description: "Upload and review technical assessment scores.",
    icon: TerminalOutlinedIcon,
    iconClass: "as-icon-technical",
  },
];

const AddScores: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();
  const navigate = useNavigate();
  const navigateToRound = (roundNumber: number) => {
    navigate(`/drive-process/add-scores/${driveId}/round${roundNumber}`);
  };

  return (
    <Box className="as-container">
      <Box className="as-header">
        <Typography component="h2" className="as-title">
          Select a round to add scores
        </Typography>
      </Box>

      <Box className="as-cards-grid">
        {rounds.map((round) => {
          const RoundIcon = round.icon;
          return (
            <Card
              key={round.number}
              className="as-card"
              role="button"
              tabIndex={0}
              aria-label={`Add scores for ${round.title}`}
              onClick={() => navigateToRound(round.number)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigateToRound(round.number);
                }
              }}
            >
              <Box className={`as-card-icon-wrap ${round.iconClass}`}>
                <RoundIcon className="as-card-icon" />
              </Box>
              <Typography component="h3" className="as-card-title">
                {round.title}
              </Typography>
              <Typography className="as-card-desc">
                {round.description}
              </Typography>
              <Button
                variant="contained"
                className="as-upload-btn"
                startIcon={<CloudUploadOutlinedIcon />}
                onClick={(event) => {
                  event.stopPropagation();
                  navigateToRound(round.number);
                }}
              >
                Upload
              </Button>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default AddScores;