import { Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/system";

export const BubbleBoard = styled(Box)({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "repeat(9, 1fr)",
  gridTemplateRows: "repeat(4, 1fr)",
  gap: "15px",
  width: "815px",
  height: "353px",
});

export const BubbleCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "77px",
  width: "77px",
  background: "#ffffff05",
  borderRadius: "50%",
  fontFamily: "Fredoka One, sans-serif",
  fontWeight: 500,
  fontSize: "40px",
  lineHeight: "48.4px",
  textAlign: "center",
  color: theme.palette.text.primary,
}));


export const BubbleCardColored1 = styled(Box)({
  height: "77px",
  width: "77px",
  background: "linear-gradient(124.49deg, #70BAFF 7.03%, #F29999 94.22%)",
  boxShadow: "0px 0px 25.8px -1px #1C5A93",
  borderRadius: "50%",
});

export const BubbleCardColored2 = styled(Box)({
  height: "77px",
  width: "77px",
  background: "linear-gradient(36.5deg, #70BAFF 19.69%, #F29999 90.73%)",
  boxShadow: "0px 0px 25.8px -1px #1C5A93",
  borderRadius: "50%",
});

export const BubbleCardColored3 = styled(Box)({
  height: "77px",
  width: "77px",
  background: "linear-gradient(180deg, #70BAFF -24.68%, #ACABD0 25.49%, #F29999 74.03%)",
  boxShadow: "0px 0px 25.8px -1px #1C5A93",
  borderRadius: "50%",
});

export const BubbleCardColored4 = styled(Box)({
  height: "77px",
  width: "77px",
  background: "linear-gradient(275.71deg, #70BAFF 35.99%, #F29999 95.61%)",
  boxShadow: "0px 0px 25.8px -1px #1C5A93",
  borderRadius: "50%",
});

export const MainCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
});

export const MainRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "25px",
});

export const PreventPlayingText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fira Sans",
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: "18px",
  lineHeight: "17px",
  textAlign: "center",
  userSelect: "none",
}));

// OAuth Button

export const OAuthButtonRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
});

export const OAuthButton = styled(Button)(({ theme }) => ({
  background: theme.palette.primary.main,
  color: theme.palette.text.primary,
  fontFamily: "Fira Sans",
  fontWeight: 600,
  fontSize: "22px",
  lineHeight: "17px",
  padding: "25px 20px",
  borderRadius: "5px",
  cursor: "pointer",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    background: theme.palette.primary.dark,
  },
}));

export const HomeWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "100px",
  height: "90vh",
  width: "100%",
});