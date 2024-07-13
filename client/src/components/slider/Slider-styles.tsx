import { Box, CircularProgress, Slider, Typography, keyframes } from "@mui/material";
import { styled } from "@mui/system";
import { DoubleCaretRightSVG } from "../common/icons/DoubleCaretRightSVG";
import { InfoSVG } from "../common/icons/InfoSVG";
import { CloseSVG } from "../common/icons/CloseSVG";

const doubleCaretRightAnimation = keyframes`
    0%, 100% {
      fill: #ffffff05;
    }
    50% {
      fill: #0085ff;
  }
  `

const InfoBoxAnimation = keyframes`
  0% {
    transform: translateY(100px);
  }
  100% {
    transform: translateY(0);
  }
`;

export const StyledSlider = styled(Slider)(({ theme }) => ({
  " & .MuiSlider-thumb": {
    width: "77px",
    height: "77px",
    zIndex: 2,
    background: theme.palette.primary.main,
  },
  "& .MuiSlider-rail": {
    width: "378px",
    height: "87px",
    background: "#2B2B2B",
    borderRadius: "50px",
    boxShadow: "0px 0px 12.8px -1px #1C5A93"
  },
  "& .MuiSlider-track": {
    display: "none",
  },
}));

export const SliderContainer = styled(Box)({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "42px",
  width: "378px"
});

export const SliderDiv = styled(Box)({
  position: "relative",
  display: "flex",
  alignSelf: "flex-start",
});

export const SliderRow = styled(Box)({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
});

export const SliderText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "16px",
  fontWeight: "400",
  lineHeight: "19.36px",
  textAlign: "left",
  color: theme.palette.text.primary,
}));

export const DoubleCaretRightIcon = styled(DoubleCaretRightSVG)({
  position: "absolute",
  top: "55px",
  left: "60px",
  userSelect: "none",
  animation: `${doubleCaretRightAnimation} 6s infinite`,
  animationDelay: "0s"
});

export const DoubleCaretRightIcon2 = styled(DoubleCaretRightSVG)({
  position: "absolute",
  top: "55px",
  left: "165px",
  userSelect: "none",
  animation: `${doubleCaretRightAnimation} 6s infinite`,
  animationDelay: '2s'
});

export const DoubleCaretRightIcon3 = styled(DoubleCaretRightSVG)({
  position: "absolute",
  top: "55px",
  left: "270px",
  userSelect: "none",
  animation: `${doubleCaretRightAnimation} 6s infinite`,
  animationDelay: '4s'
});

export const InfoIcon = styled(InfoSVG)({
  cursor: "pointer",
});

export const InfoBox = styled(Box)({
  padding: "25px",
  position: "absolute",
  top: "-190px",
  width: "292px",
  height: "auto",
  gap: "0px",
  boxShadow: "0px 4.27px 14.93px 0px #00000026",
  backgroundColor: "#222222",
  borderRadius: "3px",
  zIndex: 1,
  animation: `${InfoBoxAnimation} 0.5s ease-in-out`,
});

export const InfoBoxError = styled(Box)({
  boxShadow: "0px 4.27px 14.93px 0px #00000026",
  backgroundColor: "#222222",
  width: "419px",
  padding: "20px",
  position: "absolute",
  animation: `${InfoBoxAnimation} 0.5s ease-in-out`,
});

export const InfoBoxCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "15px",
});

export const InfoBoxRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  gap: "5px",
});

export const InfoBoxTextInnerCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "5px",
});

export const InfoBoxText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka",
  fontSize: "16px",
  fontWeight: 400,
  lineHeight: "19.36px",
  color: theme.palette.text.primary,
  userSelect: "none",
}));

export const InfoBoxHighlightedText = styled("a")({
  fontFamily: "Fredoka",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "19.36px",
  color: "#0085FF",
  textDecoration: "underline",
  cursor: "pointer",
  "&:focus": {
    outline: "2px solid #0085FF",
  }
});

export const TimesIcon = styled(CloseSVG)({
  cursor: "pointer",
  position: "absolute",
  top: "10px",
  right: "10px",
});

export const CustomLoader = styled(CircularProgress)({
  color: "#0085FF"
});