import React from "react";
import { useParams } from "react-router-dom";
import { Box, Card, Typography } from "@mui/material";
import BackButton from "../../../Common/BackButton";

const AddRound3: React.FC = () => {
  const { driveId } = useParams<{ driveId: string }>();

  return (
    <Box sx={{ padding: 2 }}>
      <Card sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, mb: 3, borderRadius: 3 }}>
        <BackButton variant="header" />
        <Typography variant="h6" fontWeight={600}>Add Technical Score — Drive #{driveId}</Typography>
      </Card>
    </Box>
  );
};

export default AddRound3;
