import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import type { CandidateRequest } from "../../types/TA_Recruiter/Drive/candidate.types";

interface ErrorOverlayProps {
  errorMessages: string[];
  errorEmailMap: Map<number, string>;
  bulkData: CandidateRequest[];
  onClose: () => void;
  onRemoveByEmail: (email: string, errorIndex: number) => void;
}

const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  errorMessages,
  errorEmailMap,
  bulkData,
  onClose,
  onRemoveByEmail,
}) => {
  return (
    <Box className="error-overlay" onClick={onClose}>
      <Box className="error-overlay-content" onClick={(e) => e.stopPropagation()}>
        <Box className="error-overlay-header">
          <Typography variant="h6" className="error-overlay-title">
            Validation Errors ({errorMessages.length})
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box className="error-overlay-messages">
          {errorMessages.map((error, index) => {
            const candidateMatch = error.match(/^Candidate\s*#(\d+):/i);
            const candidateNum = candidateMatch ? parseInt(candidateMatch[1], 10) : null;
            const email = candidateNum !== null ? errorEmailMap.get(candidateNum) : undefined;
            const stillExists = email
              ? bulkData.some((c) => c.email.toLowerCase() === email)
              : false;

            return (
              <Box key={index} className="error-message-item">
                <Typography className="error-message-number">{index + 1}.</Typography>
                <Typography className="error-message-text">{error}</Typography>
                {candidateNum !== null && stillExists && email && (
                  <Tooltip title="Remove this candidate from table">
                    <IconButton
                      size="small"
                      className="error-message-delete-btn"
                      onClick={() => onRemoveByEmail(email, index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default ErrorOverlay;
