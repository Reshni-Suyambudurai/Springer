import React from "react";
import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import "../../css/Common/BackButton.css";

interface BackButtonProps {
  /** Optional custom onClick handler. If not provided, defaults to navigate(-1) */
  onClick?: () => void;
  /** Optional aria label for accessibility */
  ariaLabel?: string;
  /** Optional custom className for additional styling */
  className?: string;
  /** If true, uses inline positioning instead of absolute positioning */
  inline?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  ariaLabel = "Go back",
  className = "",
  inline = false,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <IconButton
      onClick={handleClick}
      className={`back-button ${inline ? 'back-button-inline' : ''} ${className}`}
      aria-label={ariaLabel}
    >
      <ArrowBackIcon />
    </IconButton>
  );
};

export default BackButton;
