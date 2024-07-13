import { Box, Button, Typography, keyframes } from "@mui/material";
import { styled } from "@mui/system";
import { CloseSVG } from "../common/icons/CloseSVG";

const leaderBoardAnimation = keyframes`
  0% {
    transform: translateY(100%);
  }
  100% {
    transform: translateX(0);
  }
`;

export const LeaderboardButton = styled(Button)({
  position: "fixed",
  right: "20px",
  bottom: "20px",
  width: "auto",
  padding: "0 15px",
  height: "35px",
  borderRadius: "30px",
  backgroundColor: "transparent",
  border: "1px solid #464646",
  color: "#464646",
  fontFamily: "Fira Sans",
  fontSize: "16px",
  lineHeight: "19.2px",
  fontWeight: 700,
  transition: "all 0.3s ease-in-out",
  zIndex: 101,
  "&:hover": {
    cursor: "pointer",
    border: `1px solid #d8d8d8`,
  },
});

export const LeaderboardContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  right: 0,
  top: 0,
  width: "100%",
  height: "100%",
  backgroundColor: theme.palette.background.default,
  borderRadius: 0,
  borderLeft: "1px solid #464646",
  boxShadow:
    "0px 4px 5px 0px hsla(0,0%,0%,0.14), 0px 1px 10px 0px hsla(0,0%,0%,0.12), 0px 2px 4px -1px hsla(0,0%,0%,0.2)",
  padding: "55px 25px 20px 25px",
  animation: `${leaderBoardAnimation} 0.5s ease-in-out`,
  zIndex: 101,
  overflowY: "auto",
}));

export const LeaderboardColumn = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  alignItems: "flex-start",
  justifyContent: "center",
  width: "100%",
});

export const LeaderboardRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "3px",
  width: "100%",
});

export const LeaderboardText = styled(Typography)(({ theme }) => ({
  fontFamily: "Inter",
  fontSize: "14px",
  fontWeight: "400",
  lineHeight: "16.94px",
  textAlign: "left",
  color: theme.palette.text.primary,
  userSelect: "none",
  justifyContent: "space-between",
}));

export const CloseLeaderboardButton = styled(CloseSVG)({
  position: "absolute",
  top: "10px",
  right: "10px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.05)",
  },
});