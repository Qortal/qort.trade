// Qonnect Four Styles
import { Box, Button, CircularProgress, Rating, Typography, keyframes } from "@mui/material";
import { styled } from "@mui/system";
import { AnimationInfo, PieceColors } from "./QonnectFour";
import { VolumeOnSVG } from "../common/icons/VolumeOnSVG";
import { VolumeOffSVG } from "../common/icons/VolumeOffSVG";

interface WinnerProps {
  winner: string;
}

interface PlayerTurnProps {
  playerTurn: string;
  ownUser: boolean;
  awaitingPayment: boolean;
}

interface AvatarProps {
  color: string;
}

interface CircleProps {
  time: number;
}

const pulse = keyframes`
    0% {
      transform: scale(1);
      color: red;
    }
    50% {
      transform: scale(1.1);
      color: orange;
    }
    100% {
      transform: scale(1);
      color: red;
    }
`;

const winnerModalAnimation = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
`;

export const QonnectFourContainer = styled(Box)<WinnerProps>(
  ({ winner, theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 0px 50px 0px",
    height: "100vh",
    gap: "100px",
    width: "100%",
    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
      justifyContent: "center",
      height: "auto",
      gap: "50px",
      paddingTop: "20px",
      paddingBottom: "70px",
    },
  })
);

export const QonnectFourBoardContainer = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-evenly",
  height: "100%",
  width: "100%",
  position: "relative",
});

export const QonnectFourBoardSubContainer = styled(Box)({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
});

export const QonnectFourBoard = styled(Box)({
  position: "relative",
  zIndex: 12,
  width: "669px",
  height: "auto",
  padding: "20px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0px",
  borderRadius: "20px",
  backgroundColor: "#3F3F3F",
});

export const QonnectFourScoreboard = styled(Box)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.down("md")]: {
    display: "flex",
    justifyContent: "center",
    gap: "26px",
    height: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
}));

export const QonnectFourPlayerCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "5px",
});

export const QonnectFourPlayerCard = styled(Box)<PlayerTurnProps>(
  ({ playerTurn, ownUser, awaitingPayment, theme }) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    width: "100%",
    backgroundColor:
      playerTurn === "R" || playerTurn === "B" ? "#232428" : "transparent",
    height: "454px",
    gap: "37px",
    ...(playerTurn === "R" || playerTurn === "B" || awaitingPayment
      ? {
          ":before": {
            content: awaitingPayment
              ? '"Awaiting User To Connect..."'
              : ownUser
              ? '"Your Turn"'
              : '"Opponent\'s Turn"',
            position: "absolute",
            fontFamily: "Inter",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.text.primary,
            fontSize: "20px",
            fontWeight: "700",
            lineHeight: "24.2px",
            top: "0px",
            width: "100%",
            height: "50px",
            background:
              playerTurn === "B"
                ? "linear-gradient(90deg, #232428 3.59%, #70BAFF 50%)"
                : playerTurn === "R"
                ? "linear-gradient(90deg, #F29999 -50%, #232428 96.41%)"
                : "transparent",
            left: "50%",
            WebkitTransform: "translateX(-50%)",
            MozTransform: "translateX(-50%)",
            msTransform: "translateX(-50%)",
            transform: "translateX(-50%)",
          },
        }
      : {}),
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  })
);

export const QonnectFourPlayerCardRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "30px",
  width: "100%",
});

export const QonnectFourPlayer = styled(Box)({
  display: "flex",
  alignItems: "center",
  flexDirection: "row",
  gap: "37px",
});

export const QonnectFourAvatar = styled("img")({
  width: "77px",
  height: "77px",
  backgroundColor: "#3F3F3F",
  borderRadius: "50%",
  objectFit: "cover",
});

export const QonnectFourDefaultAvatar = styled(Box)<AvatarProps>(
  ({ color }) => ({
    width: "77px",
    height: "77px",
    backgroundColor:
      color === "R" ? "#F29999" : color === "B" ? "#70BAFF" : "#3F3F3F",
    border:
      color === "R"
        ? "3px solid #e74545"
        : color === "B"
        ? "3px solid #2e97fa"
        : "none",
    borderRadius: "50%",
  })
);

export const QonnectFourWrapperCol = styled(Box)<PlayerTurnProps>(
  ({ playerTurn, ownUser, awaitingPayment, theme }) => ({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    backgroundColor:
      playerTurn === "R" || playerTurn === "B" ? "#232428" : "transparent",
    padding: "15px",
    borderRadius: "10px",
    ...(playerTurn === "R" || playerTurn === "B" || awaitingPayment
      ? {
          ":before": {
            content: awaitingPayment
              ? '"Awaiting User To Connect"'
              : ownUser
              ? '"Your Turn"'
              : '"Opponent\'s Turn"',
            position: "absolute",
            fontFamily: "Inter",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.text.primary,
            fontSize: "20px",
            fontWeight: "700",
            lineHeight: "24.2px",
            bottom: "-40px",
            width: "100%",
            height: "50px",
            background:
              playerTurn === "B"
                ? "linear-gradient(90deg, #232428 3.59%, #70BAFF 50%)"
                : playerTurn === "R"
                ? "linear-gradient(90deg, #F29999 -50%, #232428 96.41%)"
                : "transparent",
            left: "50%",
            WebkitTransform: "translateX(-50%)",
            MozTransform: "translateX(-50%)",
            msTransform: "translateX(-50%)",
            transform: "translateX(-50%)",
          },
        }
      : {
          ":before": {
            content: '""',
            position: "absolute",
            bottom: "-40px",
            width: "100%",
            height: "50px",
            background: "transparent",
            left: "50%",
            WebkitTransform: "translateX(-50%)",
            MozTransform: "translateX(-50%)",
            msTransform: "translateX(-50%)",
            transform: "translateX(-50%)",
          },
        }),
  })
);

export const QonnectFourPlayerText = styled(Typography)(({ theme }) => ({
  fontFamily: "Inter",
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: "24.2px",
  textAlign: "right",
  color: theme.palette.text.primary,
  userSelect: "none",
}));

export const QonnectFourVSText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "40px",
  fontWeight: "600",
  lineHeight: "48.4px",
  textAlign: "left",
  alignSelf: "center",
  color: theme.palette.text.primary,
  userSelect: "none",
}));

export const QonnectFourPlayerTimer = styled(Typography)(({ theme }) => ({
  fontFamily: "Inter",
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: "24.2px",
  textAlign: "right",
  color: theme.palette.text.primary,
  padding: "6px 18px 5px 22px",
  borderRadius: "10px",
  width: "80px",
  backgroundColor: "#3F3F3F",
  userSelect: "none",
  "&.timer-warning": {
    animation: `${pulse} 1s infinite`,
  },
}));

export const QonnectFourHoverRow = styled(Box)({
  position: "absolute",
  top: "-60px",
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
});

export const QonnectFourRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "15px",
  "&:not(:last-child)": {
    marginBottom: "15px",
  },
  "&.hover-row:hover .floatingPiece": {
    transform: " translateY(10px)",
  },
});

export const QonnectFourCell = styled(Box)<PieceColors>(
  ({ player, isPlayerTurn, isWinningCell, winner }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "77px",
    height: "77px",
    // animation: !isWinningCell ? `${keyframes(dropAnimation)} 0.5s` : "none",
    background:
      player === "R"
        ? "#F29999"
        : player === "B"
        ? "#70BAFF"
        : player === "TIE"
        ? "linear-gradient(to right, #F29999 0%, #F29999 50%, #70BAFF 50%, #70BAFF 100%)"
        : "#27282C",
    borderRadius: "50%",
    border:
      player === "R"
        ? "3px solid #F29999"
        : player === "B"
        ? "3px solid#70BAFF"
        : player === "TIE"
        ? "none"
        : "3px solid #272626",
    boxShadow:
      isWinningCell && player === "R"
        ? "0px 0px 23.1px 6px #9C4646"
        : isWinningCell && player === "B"
        ? "0px 0px 23.1px 6px #46739C"
        : "none",
    "&:hover": {
      cursor: (winner || !isPlayerTurn) ? "auto" : "pointer",
    },
    "&.floatingPiece": {
      transition: "transform 0.3s ease-in-out, opacity 0.3s ease-in-out",
      transform: winner ? "none" : "translateY(5px)",
    },
  })
);

export const WinnerText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "22px",
  fontWeight: "400",
  lineHeight: "19.36px",
  textAlign: "left",
  color: theme.palette.text.primary,
  userSelect: "none",
}));

export const ResignButtonRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "15px",
  width: "100%",
  height: "77px",
  marginTop: "40px",
});

export const ResignButton = styled(Button)({
  position: "fixed",
  left: "20px",
  bottom: "20px",
  width: "86px",
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



export const AnimatedPiece = styled(Box)<AnimationInfo>(
  ({ player, dropHeight, duration }) => {
    const animationName = `dropPiece-${Math.random()
      .toString(36)
      .substring(7)}`;
    return {
      position: "absolute",
      zIndex: 1,
      width: "77px",
      height: "77px",
      borderRadius: "50%",
      backgroundColor: player === "R" ? "#F29999" : "#70BAFF",
      transform: `translateY(${dropHeight}px)`,
      animation: `${animationName} ${duration / 1000}s linear forwards`, // use the unique animation name
      // Define the keyframes within the same context
      [`@keyframes ${animationName}`]: {
        "0%": { transform: "translateY(0)" },
        "100%": { transform: `translateY(${dropHeight}px)` },
      },
    };
  }
);

export const WinsCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
});

export const WinsTypography = styled(Typography)(({ theme }) => ({
  fontFamily: "Inter",
  fontSize: "17px",
  fontWeight: "400",
  lineHeight: "24.2px",
  textAlign: "right",
  color: theme.palette.text.primary,
  userSelect: "none",
}));

export const StyledWinIcon = styled(Rating)({
  gap: "5px",
});

export const WinningCard = styled(Box)(({ theme }) => ({
  display: "flex",
  backgroundColor: theme.palette.background.default,
  justifyContent: "center",
  marginBottom: "15px",
  zIndex: 100,
  width: "100%",
  height: "77px",
  padding: "15px 0",
  alignSelf: "center",
  borderRadius: "10px",
  border: "5px solid #3F3F3F",
  boxShadow:
    "0px 4px 5px 0px hsla(0, 0%, 0%, 0.14), 0px 1px 10px 0px hsla(0, 0%, 0%, 0.12), 0px 2px 4px -1px hsla(0, 0%, 0%, 0.2)",
  animation: `${winnerModalAnimation} 0.5s ease-in-out`,
}));

export const WinningCardCol = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "67px",
});

export const WinningCardSubContainer = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "0 20px",
  gap: "5px"
});

export const ButtonRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  gap: "20px",
});

export const PlayAgainButton = styled(Button)({
  width: "auto",
  height: "43px",
  borderRadius: "30px",
  backgroundColor: "transparent",
  border: "1px solid #ffffff",
  color: "#ffffff",
  fontFamily: "Fira Sans",
  fontSize: "16px",
  lineHeight: "19.2px",
  fontWeight: 700,
  padding: "12px 25px",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    border: `1px solid #d8d8d8`,
  },
});

export const WinningCardRow = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "9px",
});

export const WinningCardTitleText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "32px",
  fontWeight: 600,
  lineHeight: "38.72px",
  textAlign: "left",
  color: theme.palette.text.primary,
}));

export const WinningCardSubTitleText = styled(Typography)<WinnerProps>(
  ({ winner }) => ({
    fontFamily: "Fredoka One",
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: "38.72px",
    textAlign: "left",
    color: winner === "B" ? "#70BAFF" : "#F29999",
  })
);

export const WinningCardButtonCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "15px",
});

export const ResignModalButton = styled(Button)({
  fontFamily: "Fira Sans",
  lineHeight: "19.2px",
  fontSize: "16px",
  fontWeight: "600",
  width: "auto",
  height: "43px",
  padding: "5px 24px",
  borderRadius: "30px",
  backgroundColor: "transparent",
  border: "1px solid #464646",
  color: "#464646",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    border: `1px solid #d8d8d8`,
  },
});

export const MuteButton = styled(VolumeOnSVG)({
  position: "fixed",
  top: "15px",
  right: "20px",
  cursor: "pointer",
});

export const UnmuteButton = styled(VolumeOffSVG)({
  position: "fixed",
  top: "15px",
  right: "20px",
  cursor: "pointer",
});

// Loading modal

// Animation keyframes
const fadeIn = keyframes`
  0%, 100% {
    opacity: 0;
    transform: scale(0.5);
  }
  20%, 80% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const LoadingStarsContainer = styled(Box)({
  display: "flex",
  gap: "8px",
  flexDirection: "row",
  alignItems: "center",
});

export const LoadingModalText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "32px",
  fontWeight: 400,
  lineHeight: "38.72px",
  textAlign: "left",
  color: theme.palette.text.primary,
}));

export const LoadingStar = styled(QonnectFourCell)<PieceColors>(
  ({ delay }) => ({
    opacity: 0, // Start invisible
    animation: `${fadeIn} 4.5s ease infinite`,
    animationDelay: `${delay}s`,
  })
);

export const BestOfFontCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  marginTop: "40px",
  userSelect: "none",
});

export const BestOfFont = styled(Typography)(({ theme }) => ({
  fontFamily: "Fira Sans",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "19.2px",
  textAlign: "center",
  color: theme.palette.text.primary,
}));

// Opponent Found Modal

export const OpponentFoundText = styled(Typography)({
  fontFamily: "Fredoka One",
  fontSize: "32px",
  fontWeight: 600,
  lineHeight: "38.72px",
  color: "#0085FF",
});

export const AwaitingPaymentText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "24.2px",
  textAlign: "left",
  color: theme.palette.text.primary,
}));

export const OpponentLeftText = styled(Typography)({
  fontFamily: "Fredoka One",
  fontSize: "32px",
  fontWeight: 600,
  lineHeight: "24.2px",
  textAlign: "left",
  color: "#F29999",
});

export const PlayersConnectedCard = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "-12px",
  display: "flex",
  backgroundColor: theme.palette.background.default,
  justifyContent: "center",
  marginBottom: "15px",
  zIndex: 100,
  width: "auto",
  height: "100px",
  padding: "15px 0",
  alignSelf: "center",
  borderRadius: "10px",
  border: "5px solid #3F3F3F",
  boxShadow:
    "0px 4px 5px 0px hsla(0, 0%, 0%, 0.14), 0px 1px 10px 0px hsla(0, 0%, 0%, 0.12), 0px 2px 4px -1px hsla(0, 0%, 0%, 0.2)",
  animation: `${winnerModalAnimation} 0.5s ease-in-out`,
}));

export const PlayersConnectedText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fredoka One",
  fontSize: "30px",
  textAlign: "center",
  fontWeight: 600,
  lineHeight: "24.2px",
  color: theme.palette.text.primary,
}));

export const ModalCol = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "25px",
  justifyContent: "center",
  margin: "25px 0 0 0",
});

export const CustomCircularProgress = styled(CircularProgress)<CircleProps>(({ time, theme }) => ({
  position: "relative",
  color: "#0085FF",
  "&::before": {
    content: `"${time}"`,
    fontFamily: "Fredoka One",
    fontSize: "30px",
    color: theme.palette.text.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "calc(100% - 2px)",
    height: "calc(100% - 2px)",
    borderRadius: "50%",
    background:`radial-gradient(circle at center, transparent 34%, #fffffff0 34%)`,
    transform: "translate(-50%, -50%) rotate(90deg)",
    zIndex: -1,
  },

  "& .MuiCircularProgress-circle": {
    zIndex: 1,
  },
}));

export const PaymentTimerText = styled(Typography)(({ theme }) => ({
  fontFamily: "Fira Sans",
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: "18px",
  lineHeight: "17px",
  textAlign: "center",
  userSelect: "none",
}));