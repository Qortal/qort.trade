import { Box } from "@mui/material";
import { styled } from "@mui/system";

export const AppContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "1em 0",
  paddingBottom: '50px'
}));

export const MainContainer = styled(Box)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
