import { Box, Button } from "@mui/material";
import { styled } from "@mui/system";

export const ReusableModalContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.background.default,
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "629px",
  minHeight: "446px",
  maxWidth: '90vw',
  height: "auto",
  borderRadius: "20px",
  border: "20px solid #3F3F3F",
  zIndex: "100",
  boxShadow:
    "0px 4px 5px 0px hsla(0,0%,0%,0.14), \n\t\t0px 1px 10px 0px hsla(0,0%,0%,0.12), \n\t\t0px 2px 4px -1px hsla(0,0%,0%,0.2)",
}));

export const ReusableModalSubContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "20px",
  padding: "70px",
});

export const ReusableModalBackdrop = styled(Box)({
  position: "fixed",
  top: "0",
  left: "0",
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(1px)",
  zIndex: "99",
});

export const ReusableModalButton = styled(Button)(({ theme }) => ({
  width: "auto",
  height: "43px",
  padding: "10px 20px 10px 20px",
  gap: "10px",
  borderRadius: "30px",
  border: `1px solid ${theme.palette.text.primary}`,
  color: theme.palette.text.primary,
  boxShadow: "1px 4px 10.5px 0px #0000004D"
}));