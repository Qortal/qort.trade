import { styled } from "@mui/system";
import { Box, Typography } from "@mui/material";

export const TextTableTitle = styled(Typography)(({ theme }) => ({
    fontFamily: "Inter",
    color: theme.palette.text.primary,
    fontWeight: 400,
    fontSize: "20px",
    lineHeight: "40px",
    userSelect: "none",
  }));