import React from "react";
import type { RoundEvaluationResponse } from "../../../../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import "../../../../css/TA_Recruiter/DriveProcess/Scores/Round1.css";

interface Round1Props {
  data: RoundEvaluationResponse;
}

const Round1: React.FC<Round1Props> = ({ data }) => {
  const { roundTemplate, evaluations } = data;

  // Extract section names from the roundTemplate sections array
  const sectionNames: string[] = Array.isArray(roundTemplate.sections)
    ? (roundTemplate.sections as { sectionName: string; outOf: number }[]).map(
        (s) => s.sectionName
      )
    : [];

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "PASS":   return "r1-color-pass";
      case "FAIL":   return "r1-color-fail";
      default:       return "";
    }
  };

  return (
    <Box className="r1-container">
      {/* Round info summary bar */}
      <Box className="r1-summary">
        <Box className="r1-summary-item">
          <Typography className="r1-summary-label">Round</Typography>
          <Typography className="r1-summary-value">{roundTemplate.roundName}</Typography>
        </Box>
        <Box className="r1-summary-item">
          <Typography className="r1-summary-label">Out Of</Typography>
          <Typography className="r1-summary-value">{roundTemplate.outoffScore}</Typography>
        </Box>
        <Box className="r1-summary-item">
          <Typography className="r1-summary-label">Min Score</Typography>
          <Typography className="r1-summary-value">{roundTemplate.minScore}</Typography>
        </Box>
        <Box className="r1-summary-item">
          <Typography className="r1-summary-label">Weightage</Typography>
          <Typography className="r1-summary-value">{roundTemplate.weightage}%</Typography>
        </Box>
      </Box>

      {/* Evaluations table */}
      {evaluations.length === 0 ? (
        <Box className="r1-empty">
          <Typography className="r1-empty-text">No evaluations recorded for this round yet.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} className="r1-table-container">
          <Table className="r1-table">
            <TableHead>
              <TableRow className="r1-thead-row">
                <TableCell className="r1-th">#</TableCell>
                <TableCell className="r1-th">Candidate Name</TableCell>
                <TableCell className="r1-th">Total Score</TableCell>
                {sectionNames.map((name) => (
                  <TableCell key={name} className="r1-th">
                    {name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((evalItem, index) => {
                const sectionScore = evalItem.sectionScore as Record<string, number> | null;
                const colorClass = getStatusColorClass(evalItem.evaluationStatus);
                return (
                  <TableRow key={evalItem.scoreId} className="r1-tbody-row">
                    <TableCell className="r1-td">{index + 1}</TableCell>
                    <TableCell className={`r1-td r1-td-name ${colorClass}`}>{evalItem.candidateName}</TableCell>
                    <TableCell className={`r1-td r1-td-score ${colorClass}`}>{evalItem.score}</TableCell>
                    {sectionNames.map((name) => (
                      <TableCell key={name} className="r1-td">
                        {sectionScore?.[name] ?? "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Round1;
