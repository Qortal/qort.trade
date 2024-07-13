import React, {
  createRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  QonnectFourAvatar,
  QonnectFourBoard,
  QonnectFourCell,
  QonnectFourContainer,
  QonnectFourPlayer,
  QonnectFourPlayerCol,
  QonnectFourPlayerText,
  QonnectFourPlayerTimer,
  QonnectFourRow,
  QonnectFourScoreboard,
  QonnectFourWrapperCol,
  WinsTypography,
  WinsCol,
  WinningCard,
  WinningCardRow,
  WinningCardSubTitleText,
  WinningCardTitleText,
  ResignModalButton,
  WinningCardSubContainer,
  MuteButton,
  UnmuteButton,
  QonnectFourBoardContainer,
  ResignButton,
  LoadingModalText,
  LoadingStarsContainer,
  LoadingStar,
  ResignButtonRow,
  QonnectFourVSText,
  QonnectFourBoardSubContainer,
  QonnectFourPlayerCard,
  QonnectFourPlayerCardRow,
  AnimatedPiece,
  QonnectFourDefaultAvatar,
  StyledWinIcon,
  BestOfFont,
  BestOfFontCol,
  ButtonRow,
  PlayAgainButton,
  OpponentFoundText,
  AwaitingPaymentText,
  OpponentLeftText,
  PlayersConnectedText,
  PlayersConnectedCard,
  CustomCircularProgress,
  ModalCol,
  PaymentTimerText,
} from "./QonnectFour-Styles";
import { StarSVG } from "../common/icons/StarSVG";
import gameContext, {
  Player,
  UserNameAvatar,
} from "../../contexts/gameContext";
import _ from "lodash";
import ReactGA from "react-ga4";
import { useParams } from "react-router-dom";
import socketService from "../../services/socketService";
import gameService from "../../services/gameService";
import { homeAddress, playingAmount } from "../../constants";
import { sendRequestToExtension, serverUrl } from "../../App";
import ShortUniqueId from "short-unique-id";
import { ReusableModal } from "../common/reusable-modal/ReusableModal";
import { QortalLogoWhiteSVG } from "../common/icons/QortalLogoWhiteSVG";
import { useNavigate } from "react-router-dom";
import PieceFallingSound from "../../assets/audio/QonnectFourPieceFallingSound.mp3";
import TimerEndingSound from "../../assets/audio/TimerEndingWarning.mp3";
import GameWinnerSound from "../../assets/audio/QonnectFourGameWinner.mp3";
import GameStartSound from "../../assets/audio/GameStartSound.mp3";
import GameTieSound from "../../assets/audio/GameTieSound.wav";
import GameRestartSound from "../../assets/audio/GameRestartSound.mp3";
import PlayersConnectedSound from "../../assets/audio/PlayersConnectedSound.mp3";
import PayQORTSound from "../../assets/audio/PayQORTSound.mp3";
import { formatTime } from "../../utils/formatTime";
import { findUsableApi } from "../../utils/findUsableApi";
import { getPlayerInfoBySymbol } from "../../utils/getPlayerNameBySymbol";
import { getPlayerWinCount } from "../../utils/getPlayerWinCount";
import { verifyBalance } from "../../utils/verifyBalance";
import { NotificationContext } from "../../contexts/notificationContext";
import { LoadingContext } from "../../contexts/loadingContext";
import { ReusableModalButton } from "../common/reusable-modal/ReusableModal-styles";
import { Leaderboard, LeaderboardData } from "../leaderboard/Leaderboard";
import { LeaderboardButton } from "../leaderboard/Leaderboard-styles";

// Define the Piece Colors interface for the QonnectFourCell component props
export interface PieceColors {
  player: string;
  isWinningCell?: boolean;
  isPlayerTurn?: boolean;
  winner?: string | null;
  delay?: number;
  animationDuration?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}
// Winning Info Interface
interface WinningInfo {
  player: "R" | "B" | null;
  winningCells: number[][] | null;
}

export interface AnimationInfo {
  top?: number;
  left?: number;
  key: string;
  dropHeight: number;
  duration: number;
  player: PlayerColor;
}
// Define the type for the board cell (each cell will hold a player's piece)
type PlayerColor = "R" | "B" | ""; // "R" for red, "B" for blue, "" for empty
// Define the type for the board, which is a 2D array of PlayerColor types
export type Board = PlayerColor[][];

export const QonnectFour = () => {
  const {
    gameWinner,
    setGameWinner,
    playerSymbol,
    setPlayerSymbol,
    setPlayerTurn,
    isPlayerTurn,
    setGameStarted,
    isGameStarted,
    players,
    setPlayers,
    setGame,
    game,
    userInfo,
    userNameAvatar,
    setUserNameAvatar,
    setInRoom,
  } = useContext(gameContext);
  const { id } = useParams();

  const { setNotification } = useContext(NotificationContext);
  const { loadingGame, setLoadingGame } = useContext(LoadingContext);

  // Qonnect Four Board
  const rows = 6;
  const columns = 7;
  const playerRed = "R";
  const playerBlue = "B";
  const initialBoard: Board = [];

  const hoverCellRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const hasFetchedUserNameAvatar = useRef(false);
  const timerRef = useRef<number | null>(null);
  const disconnectionTimerRef = useRef<number | null>(null);
  const paymentTimerRef = useRef<number | null>(null);

  // Initialize the board as a 2D array of Player types
  const [board, setBoard] = useState<Board>(() => {
    for (let i = 0; i < rows; i++) {
      initialBoard.push(Array(columns).fill(""));
    }
    return initialBoard;
  });
  const [hoverColumn, setHoverColumn] = useState<number>(-1);
  const [currColumns, setCurrColumns] = useState<number[]>([
    5, 5, 5, 5, 5, 5, 5,
  ]);
  const currentPlayer = isPlayerTurn
    ? playerSymbol
    : playerSymbol === playerRed
    ? playerBlue
    : playerRed;

  // Player info util functions
  const playerRedInfo = getPlayerInfoBySymbol(
    userNameAvatar,
    userInfo?.address,
    playerRed
  );

  const playerBlueInfo = getPlayerInfoBySymbol(
    userNameAvatar,
    userInfo?.address,
    playerBlue
  );

  // Get the win count for each player util function
  const playerWinCount = getPlayerWinCount(game!, players);

  const [gameStartedUx, setGameStartedUx] = useState<boolean>(false);
  const [gameWinningCells, setGameWinningCells] = useState<number[][] | null>(
    null
  );
  const [animationInfo, setAnimationInfo] = useState<AnimationInfo | null>(
    null
  );
  const [timeRed, setTimeRed] = useState<number>(120);
  const [timeBlue, setTimeBlue] = useState<number>(120);
  const [disconnectTimerRed, setDisconnectTimerRed] = useState<number>(60);
  const [disconnectTimerBlue, setDisconnectTimerBlue] = useState<number>(60);
  const [paymentTimer, setPaymentTimer] = useState<number>(90);
  const [redWarningPlayed, setRedWarningPlayed] = useState<boolean>(false);
  const [blueWarningPlayed, setBlueWarningPlayed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(
    localStorage.getItem("isMuted") === "true" ? true : false
  );
  const [toggleResignModal, setToggleResignModal] = useState<boolean>(false);
  const [openLeaderboard, setOpenLeaderboard] = useState<boolean>(false);
  const [bothPlayersConnected, setBothPlayersConnected] =
    useState<boolean>(false);
  const [playerDisconnected, setPlayerDisconnected] = useState<string[] | null>(
    null
  );
  const [gameWinnerLoading, setGameWinnerLoading] = useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = useState<
    LeaderboardData[] | null
  >(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [paymentsNotMade, setPaymentsNotMade] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    handleGameUpdate();
    handleTurnUpdate();
    handleGameStart();
    handleGameWin();
    handleGameResume();
    handlePlayersInfo();
    handleGameTie();
    handleFullGameData();
    handleOnPaymentNotMade();
  }, []);

  useEffect(() => {
    return () => {
      if (socketService.socket && id) {
        gameService.leaveRoom(socketService.socket, id);
      }
    };
  }, [id]);

  // useEffect to fetch user name & avatars if they have a name. Call it on game mount || if they refresh the page once the game has started
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (
        !hasFetchedUserNameAvatar.current &&
        players &&
        Object.keys(players).length > 1 &&
        userNameAvatar &&
        Object.keys(userNameAvatar).length === 0
      ) {
        await getUserInfo(players);
        hasFetchedUserNameAvatar.current = true; // Mark as fetched to prevent re-fetching
      }
    };
    fetchUserInfo();
  }, [players, userNameAvatar]);

  // Timer logic

  // useEffect to reduce the timer of each player when it's their turn
  useEffect(() => {
    // Check if the game has started or if there is a winner, if so, stop the timer
    if (
      !gameStartedUx ||
      gameWinner ||
      (playerDisconnected && playerDisconnected.length > 0) ||
      game?.status === "finished" ||
      game?.status === "finished-forfeit"
    )
      return;
    timerRef.current = setInterval(() => {
      if (gameWinner) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      if (currentPlayer === playerRed) {
        setTimeRed((prevTime) => {
          if (prevTime <= 16 && prevTime > 0 && !redWarningPlayed) {
            setRedWarningPlayed(true);
            playWarningSound();
          }
          return prevTime > 0 ? prevTime - 1 : 0;
        });
      } else {
        setTimeBlue((prevTime) => {
          if (prevTime <= 15 && prevTime > 0 && !blueWarningPlayed) {
            setBlueWarningPlayed(true);
            playWarningSound();
          }
          return prevTime > 0 ? prevTime - 1 : 0;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    currentPlayer,
    gameStartedUx,
    gameWinner,
    game,
    playerDisconnected,
    redWarningPlayed,
    blueWarningPlayed,
  ]);

  // useEffect(() => {
  //   // Check if the game has started or if there is a winner, if so, stop the timer
  //   if (
  //     !gameStartedUx ||
  //     gameWinner ||
  //     (playerDisconnected && playerDisconnected.length > 0) ||
  //     game?.status === "finished" ||
  //     game?.status === "finished-forfeit"
  //   ) {
  //     return;
  //   }

  //   let hiddenTime: number | null = null;

  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "hidden") {
  //       hiddenTime = Date.now();
  //       if (timerRef.current !== null) {
  //         clearInterval(timerRef.current);
  //         timerRef.current = null;
  //       }
  //     } else if (
  //       document.visibilityState === "visible" &&
  //       hiddenTime !== null
  //     ) {
  //       const now = Date.now();
  //       const elapsed = Math.floor((now - hiddenTime) / 1000); // Calculate elapsed time in seconds
  //       hiddenTime = null;

  //       if (currentPlayer === playerRed) {
  //         setTimeRed((prevTime) => {
  //           const newTime = prevTime > 0 ? prevTime - elapsed : 0;
  //           return newTime > 0 ? newTime : 0;
  //         });
  //       } else {
  //         setTimeBlue((prevTime) => {
  //           const newTime = prevTime > 0 ? prevTime - elapsed : 0;
  //           return newTime > 0 ? newTime : 0;
  //         });
  //       }

  //       startTimer();
  //     }
  //   };

  //   const startTimer = () => {
  //     timerRef.current = setInterval(() => {
  //       if (gameWinner) {
  //         if (timerRef.current !== null) {
  //           clearInterval(timerRef.current);
  //           timerRef.current = null;
  //         }
  //         return;
  //       }
  //       if (currentPlayer === playerRed) {
  //         setTimeRed((prevTime) => {
  //           if (prevTime <= 16 && prevTime > 0 && !redWarningPlayed) {
  //             setRedWarningPlayed(true);
  //             playWarningSound();
  //           }
  //           return prevTime > 0 ? prevTime - 1 : 0;
  //         });
  //       } else {
  //         setTimeBlue((prevTime) => {
  //           if (prevTime <= 15 && prevTime > 0 && !blueWarningPlayed) {
  //             setBlueWarningPlayed(true);
  //             playWarningSound();
  //           }
  //           return prevTime > 0 ? prevTime - 1 : 0;
  //         });
  //       }
  //     }, 1000);
  //   };

  //   // Start the timer
  //   startTimer();

  //   // Add event listener for visibility change
  //   document.addEventListener("visibilitychange", handleVisibilityChange);

  //   return () => {
  //     if (timerRef.current !== null) {
  //       clearInterval(timerRef.current);
  //       timerRef.current = null;
  //     }
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // }, [
  //   currentPlayer,
  //   gameStartedUx,
  //   gameWinner,
  //   game,
  //   playerDisconnected,
  //   redWarningPlayed,
  //   blueWarningPlayed,
  // ]);

  // Handle timer hitting 0
  useEffect(() => {
    if (gameWinner) return;
    if (timeRed === 0) {
      setGameWinner(playerBlue);
    } else if (timeBlue === 0) {
      setGameWinner(playerRed);
    }
  }, [timeRed, timeBlue]);

  // Initialize each ref in the array to a new ref object
  useEffect(() => {
    hoverCellRefs.current = Array(columns)
      .fill(null)
      .map((_, i) => hoverCellRefs.current[i] || createRef<HTMLDivElement>());
  }, [columns]);

  // useEffect when an opponent is found to open the send QORT extension modal right away
  // useEffect(() => {
  //   async function fetchData() {
  //     if (
  //       game?.status === "active" &&
  //       !game?.playerPayments.find(
  //         (item) => item?.player?.qortAddress === userInfo?.address
  //       )
  //     ) {
  //       console.log("sendQort passing here");
  //       await sendQort();
  //     }
  //   }
  //   fetchData();
  // }, [game?.status, game?.playerPayments]);

  // useEffect to get rid of the loader if they refresh the page and the game is already started
  useEffect(() => {
    if (
      loadingGame &&
      game?.status === "active" &&
      game?.playerPayments.find(
        (item) => item?.player?.qortAddress === userInfo?.address
      )
    ) {
      setLoadingGame(false);
    }
  }, [loadingGame, game?.status, game?.playerPayments, userInfo?.address]);

  // useEffect to trigger a warning to be called when both players have connected to the game and paid
  useEffect(() => {
    let timeoutId: number;
    const playersConnectedKey = "playersConnected";
    // Check if the action has already been performed
    const hasPlayersConnected = localStorage.getItem(playersConnectedKey);

    if (!hasPlayersConnected && game && game?.playerPayments.length === 2) {
      playPlayersConnectedSound();
      setBothPlayersConnected(true);
      localStorage.setItem(playersConnectedKey, "true");

      ReactGA.event({
        category: "Both Players Connected",
        action: "Both players have connected and the game can begin",
        label: "Both players have connected and the game can begin",
      });

      // Set a timeout to remove the players connected message after 5 seconds
      timeoutId = setTimeout(() => {
        setBothPlayersConnected(false);
      }, 4000);
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [game?.playerPayments]);

  // Clear local storage when the game is over
  useEffect(() => {
    if (
      game &&
      (game?.status === "finished" || game?.status === "finished-forfeit")
    ) {
      localStorage.removeItem("playersConnected");
    }
  }, [game?.status]);

  // useEffect to trigger a warning when one player disconnects from the game,  to tell the other person that the opponent has left and how long they have to come back before winning by default
  useEffect(() => {
    if (
      game &&
      game?.status === "active" &&
      Object.keys(players).length === 2
    ) {
      let allConnected = true;
      const checkDisconnections = (players: Record<string, Player>) => {
        // Check if any player is disconnected. If so, set the playerDisconnected state and start the disconnect timer for them
        for (const playerId in players) {
          if (players[playerId].isConnected === false) {
            setPlayerDisconnected((prevState) => {
              if (!prevState) {
                return [players[playerId].symbol];
              }
              return [...prevState, players[playerId].symbol];
            });
            allConnected = false;
          }
        }
        // If both players are connected, reset the playerDisconnected state and reset the disconnect timer
        if (allConnected) {
          setPlayerDisconnected(null);
          setDisconnectTimerRed(60);
          setDisconnectTimerBlue(60);
        }
      };
      checkDisconnections(players);
    }
    // Dependency is the player connections object, to avoid unnecessary re-renders
  }, [game, players]);

  // useEffect to begin the countdown for the players who disconnected
  useEffect(() => {
    if (playerDisconnected) {
      disconnectionTimerRef.current = setInterval(() => {
        if (
          game?.status === "finished" ||
          game?.status === "finished-forfeit"
        ) {
          if (disconnectionTimerRef.current !== null) {
            clearInterval(disconnectionTimerRef.current);
            disconnectionTimerRef.current = null;
          }
          return;
        }
        if (
          playerDisconnected.includes(playerRed) &&
          !playerDisconnected.includes(playerBlue)
        ) {
          setDisconnectTimerRed((prevTime) => {
            return prevTime > 0 ? prevTime - 1 : 0;
          });
        } else if (
          playerDisconnected.includes(playerBlue) &&
          !playerDisconnected.includes(playerRed)
        ) {
          setDisconnectTimerBlue((prevTime) => {
            return prevTime > 0 ? prevTime - 1 : 0;
          });
        } else if (
          playerDisconnected.includes(playerRed) &&
          playerDisconnected.includes(playerBlue)
        ) {
          setDisconnectTimerRed((prevTime) => {
            return prevTime > 0 ? prevTime - 1 : 0;
          });
          setTimeBlue((prevTime) => {
            return prevTime > 0 ? prevTime - 1 : 0;
          });
        }
      }, 1000);

      return () => {
        if (disconnectionTimerRef.current !== null) {
          clearInterval(disconnectionTimerRef.current);
          disconnectionTimerRef.current = null;
        }
      };
    }
  }, [playerDisconnected]);

  // useEffect to trigger 90 second payment timer

  useEffect(() => {
    if (
      loadingGame &&
      game?.status === "active" &&
      !game?.playerPayments.find(
        (item) => item?.player?.qortAddress === userInfo?.address
      )
    ) {
      paymentTimerRef.current = setInterval(() => {
        setPaymentTimer((prevState) => {
          if (prevState === 0) {
            return 0;
          }
          return prevState - 1;
        });
      }, 1000);
    }
    return () => {
      if (paymentTimerRef.current !== null) {
        clearTimeout(paymentTimerRef.current);
        paymentTimerRef.current = null;
      }
    };
  }, [loadingGame, game?.status, game?.playerPayments]);

  // useEffect to redirect to home page if the user hasn't paid in time
  useEffect(() => {
    if (
      !game?.playerPayments.find(
        (item) => item?.player?.qortAddress === userInfo?.address
      ) &&
      paymentsNotMade.includes(userInfo?.address)
    ) {
      ReactGA.event({
        category: "Payment Timer Expired",
        action: "User has not paid in time",
        label: "User has not paid in time",
      });
      setNotification({
        alertType: "alertError",
        msg: "You have not paid in time. You have been banned from playing for 24 hours.",
      });
      console.log("redirecting to home");
      navigate("/");
      return;
    }
  }, [game?.playerPayments, paymentsNotMade]);

  // useEffect to trigger Google Analytics Event If Opponent Leaves Before Paying

  useEffect(() => {
    if (
      game?.playerPayments.find(
        (item) => item?.player?.qortAddress === userInfo?.address
      ) &&
      paymentsNotMade.includes(
        game?.players.filter(
          (player) => player?.qortAddress !== userInfo?.address
        )[0]?.qortAddress
      )
    ) {
      ReactGA.event({
        category: "Opponent Left Before Paying",
        action: "Opponent has left before paying",
        label: "Opponent has left before paying",
      });
    }
  }, [game?.playerPayments, paymentsNotMade]);

  // useEffect to trigger Pay QORT Sound if opponent is found
  useEffect(() => {
    if (
      loadingGame &&
      game?.status === "active" &&
      !game?.playerPayments.find(
        (item) => item?.player?.qortAddress === userInfo?.address
      )
    ) {
      playUserMustPaySound();
    }
  }, [loadingGame, game?.status, game?.playerPayments]);

  // Get users' info func
  const getUserInfo = async (players: Record<string, Player>) => {
    type Base64String = string;
    const validApi: string = await findUsableApi();
    try {
      const updatedUsersNameAvatar: Record<string, UserNameAvatar> = {};
      for (const address of Object.keys(players)) {
        let name: string = "";
        const nameUrl: string = `${validApi}/names/address/${address}`;
        const nameResponse = await fetch(nameUrl);
        const nameData = await nameResponse.json();

        if (nameData?.length > 0) {
          name = nameData[0].name;
        } else {
          const playerSymbol = players[address].symbol;
          if (playerSymbol === "R") {
            name = "Player Red";
          } else if (playerSymbol === "B") {
            name = "Player Blue";
          } else {
            name = "";
          }
        }

        if (
          name &&
          nameData?.length > 0 &&
          name !== "Player Red" &&
          name !== "Player Blue"
        ) {
          try {
            const avatarUrl: string = `${validApi}/arbitrary/THUMBNAIL/${name}/qortal_avatar?encoding=base64&rebuild=false`;

            const avatarResponse = await fetch(avatarUrl);
            const avatar: string | Base64String = await avatarResponse.text();

            updatedUsersNameAvatar[address] = {
              name,
              avatar,
              symbol: players[address].symbol,
            };
          } catch (error) {
            console.error(error);
            updatedUsersNameAvatar[address] = {
              name,
              avatar: "No Avatar",
              symbol: players[address].symbol,
            };
          }
        } else {
          updatedUsersNameAvatar[address] = {
            name,
            avatar: "No Avatar",
            symbol: players[address].symbol,
          };
        }
      }

      setUserNameAvatar(updatedUsersNameAvatar);
    } catch (error) {
      console.error({ error });
      const updatedUsersNameAvatar: Record<string, UserNameAvatar> = {};
      for (const address of Object.keys(players)) {
        updatedUsersNameAvatar[address] = {
          name: "Unknown Player",
          avatar: "No Avatar",
          symbol: players[address].symbol,
        };
      }
      setUserNameAvatar(updatedUsersNameAvatar);
    }
  };

  // Play start sound when the game starts
  const playStartSound = () => {
    if (isMuted) return;
    const audio = new Audio(GameStartSound);
    audio.play();
  };

  // Play players connected sound when both payments have been made
  const playPlayersConnectedSound = () => {
    if (isMuted) return;
    const audio = new Audio(PlayersConnectedSound);
    audio.play();
  };

  // Play restart sound when a new game is started
  const playRestartSound = () => {
    if (isMuted) return;
    const audio = new Audio(GameRestartSound);
    audio.play();
  };

  // Play warning sound when the timer has 15 seconds left
  const playWarningSound = () => {
    if (isMuted) return;
    const audio = new Audio(TimerEndingSound);
    audio.play();
  };

  // Play winning sound when a player wins
  const playWinningSound = () => {
    if (isMuted) return;
    const audio = new Audio(GameWinnerSound);
    audio.play();
  };

  // Play tie game sound
  const playTieGameSound = () => {
    if (isMuted) return;
    const audio = new Audio(GameTieSound);
    audio.play();
  };

  // Play piece falling sound when a piece is dropped
  const playPieceFallingSound = () => {
    if (isMuted) return;
    const audio = new Audio(PieceFallingSound);
    audio.play();
  };

  // Play user must pay sound when an opponent is found
  const playUserMustPaySound = () => {
    if (isMuted) return;
    const audio = new Audio(PayQORTSound);
    audio.play();
  }

  // Function to generate the hover row for the piece drop animation
  const generateHoverRow = () => {
    const hoverRow: JSX.Element[] = [];
    for (let j = 0; j < columns; j++) {
      hoverRow.push(
        <QonnectFourCell
          ref={hoverCellRefs.current[j]}
          key={`hover-${j}`}
          onClick={() => setPieceFunc(currColumns[j], j)}
          onMouseEnter={() => setHoverColumn(j)}
          onMouseLeave={() => setHoverColumn(-1)}
          winner={gameWinner}
          player={
            hoverColumn === j ? (currentPlayer === playerRed ? "R" : "B") : ""
          }
          isPlayerTurn={isPlayerTurn}
          className={hoverColumn === j ? "floatingPiece" : ""}
          style={{
            opacity:
              hoverColumn === j && !animationInfo && isPlayerTurn ? 1 : 0,
          }}
        />
      );
    }
    return (
      <QonnectFourRow style={{ opacity: gameWinner ? 0 : 1 }}>
        {hoverRow}
      </QonnectFourRow>
    );
  };

  // Function to generate the game board
  const generateBoard = () => {
    const newBoard: JSX.Element[] = [];
    for (let i = 0; i < rows; i++) {
      const row: JSX.Element[] = [];
      for (let j = 0; j < columns; j++) {
        const isWinningCell =
          gameWinningCells?.some(
            ([rowIndex, colIndex]) => rowIndex === i && colIndex === j
          ) || false;
        row.push(
          <QonnectFourCell
            onMouseEnter={() => setHoverColumn(j)}
            onMouseLeave={() => setHoverColumn(-1)}
            player={board[i][j]}
            isPlayerTurn={isPlayerTurn}
            isWinningCell={isWinningCell}
            winner={gameWinner}
            onClick={() => setPieceFunc(i, j)}
            key={`${i}-${j}`}
          >
            {isWinningCell && (
              <StarSVG color="#fff" height={"34"} width={"36"} />
            )}
          </QonnectFourCell>
        );
      }
      newBoard.push(
        <QonnectFourRow className={"hover-row"} key={i}>
          {row}
        </QonnectFourRow>
      );
    }
    return newBoard;
  };

  const generateAnimatedLayer = useMemo(() => {
    if (!animationInfo) return null;
    return (
      <AnimatedPiece
        key={animationInfo.key}
        style={{
          top: `${animationInfo.top}px`,
          left: `${animationInfo.left}px`,
        }}
        dropHeight={animationInfo.dropHeight}
        duration={animationInfo.duration}
        player={animationInfo.player}
        onAnimationEnd={() => {
          playPieceFallingSound();
          setAnimationInfo(null);
        }}
      />
    );
  }, [animationInfo]);

  const animatePieceDrop = (rowIndex: number, colIndex: number) => {
    const baseHeight = 100;
    const baseDuration = 0.11;
    const hoverCell = hoverCellRefs.current[colIndex].current;
    const boardContainer = boardContainerRef.current;

    if (hoverCell && boardContainer) {
      const hoverRect = hoverCell.getBoundingClientRect();
      const boardRect = boardContainer.getBoundingClientRect();
      const rowHeight = 77 + 15; // Cell height + gap
      const destinationTopRelativeToBoard = rowIndex * rowHeight;
      const hoverCellTopRelativeToBoard = hoverRect.top - boardRect.top;
      const dropHeight =
        destinationTopRelativeToBoard - hoverCellTopRelativeToBoard;
      const duration = (dropHeight / baseHeight) * baseDuration * 1000;
      const id: string = new ShortUniqueId().randomUUID(6);
      setAnimationInfo({
        key: id,
        top: hoverRect.top - boardRect.top, // Adjust for relative positioning
        left: hoverRect.left - boardRect.left,
        dropHeight: dropHeight,
        player: currentPlayer,
        duration: duration,
      });
      return duration;
    }
  };

  const setPieceFunc = (rowIndex: number, colIndex: number) => {
    if (
      gameWinner ||
      animationInfo ||
      rowIndex < 0 ||
      (game && game?.playerPayments.length < 2) ||
      (playerDisconnected && playerDisconnected?.length > 0) ||
      !isPlayerTurn
    )
      return;
    if (!gameStartedUx && isPlayerTurn) {
      setGameStartedUx(true);
    }

    rowIndex = currColumns[colIndex];
    if (rowIndex < 0) return;

    const animationDuration = animatePieceDrop(rowIndex, colIndex); // Wait for the animation to complete
    setTimeout(() => {
      // Update the board with the current player's piece
      const newBoard: Board = [...board];
      newBoard[rowIndex][colIndex] = currentPlayer;
      setBoard(newBoard);

      const newCurrColumns = [...currColumns];
      newCurrColumns[colIndex]--;
      setCurrColumns(newCurrColumns);
      // Update backend with the new board state
      if (socketService.socket) {
        gameService.updateGame(socketService.socket, {
          column: colIndex,
          row: rowIndex,
          symbol: currentPlayer,
        });
      }
      const winner = checkWinner();
      if (Object.values(winner).some((val) => val !== null)) {
        setGameWinner(winner.player);
        setGameWinningCells(winner.winningCells);
        playWinningSound();
        return;
      }
      checkTie();
    }, animationDuration);
  };

  // Check Winner Function
  const checkWinner = (): WinningInfo => {
    let winningInfo: WinningInfo = {
      player: null,
      winningCells: null,
    };

    // Check horizontally
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col <= columns - 4; col++) {
        const player = board[row][col];
        if (
          player !== "" &&
          player === board[row][col + 1] &&
          player === board[row][col + 2] &&
          player === board[row][col + 3]
        ) {
          winningInfo = {
            player,
            winningCells: [
              [row, col],
              [row, col + 1],
              [row, col + 2],
              [row, col + 3],
            ],
          };
          return winningInfo;
        }
      }
    }

    // Check vertically
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 0; col < columns; col++) {
        const player = board[row][col];
        if (
          player !== "" &&
          player === board[row + 1][col] &&
          player === board[row + 2][col] &&
          player === board[row + 3][col]
        ) {
          winningInfo = {
            player,
            winningCells: [
              [row, col],
              [row + 1, col],
              [row + 2, col],
              [row + 3, col],
            ],
          };
          return winningInfo;
        }
      }
    }

    // Check diagonally (top-left to bottom-right)
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 0; col <= columns - 4; col++) {
        const player = board[row][col];
        if (
          player !== "" &&
          player === board[row + 1][col + 1] &&
          player === board[row + 2][col + 2] &&
          player === board[row + 3][col + 3]
        ) {
          winningInfo = {
            player,
            winningCells: [
              [row, col],
              [row + 1, col + 1],
              [row + 2, col + 2],
              [row + 3, col + 3],
            ],
          };
          return winningInfo;
        }
      }
    }

    // Check diagonally (top-right to bottom-left)
    for (let row = 0; row <= rows - 4; row++) {
      for (let col = 3; col < columns; col++) {
        const player = board[row][col];
        if (
          player !== "" &&
          player === board[row + 1][col - 1] &&
          player === board[row + 2][col - 2] &&
          player === board[row + 3][col - 3]
        ) {
          winningInfo = {
            player,
            winningCells: [
              [row, col],
              [row + 1, col - 1],
              [row + 2, col - 2],
              [row + 3, col - 3],
            ],
          };
          return winningInfo;
        }
      }
    }
    // No winner found
    return winningInfo;
  };

  // Display winning cards
  const displayFinalWinnerCard = () => {
    ReactGA.event({
      category: "Game Finished Winner Card Shown",
      action: "The game finished and there is a winner",
      label: "The game finished and there is a winner",
    });
    return (
      <WinningCard>
        <WinningCardSubContainer>
          {game?.winner.qortAddress === userInfo?.address ? (
            <WinningCardRow>
              <WinningCardTitleText>You Won!</WinningCardTitleText>
              <WinningCardSubTitleText winner={"B"}>
                +0.50 QORT
              </WinningCardSubTitleText>
              <QortalLogoWhiteSVG color="#fffff" width="20px" height="23px" />
            </WinningCardRow>
          ) : (
            <WinningCardRow>
              <WinningCardTitleText>You Lost </WinningCardTitleText>
              <WinningCardSubTitleText winner={"R"}>
                0.25 QORT
              </WinningCardSubTitleText>
              <QortalLogoWhiteSVG color="#fffff" width="20px" height="23px" />
            </WinningCardRow>
          )}
          <ButtonRow>
            <PlayAgainButton onClick={playAgainFunc}>
              Play Again
            </PlayAgainButton>
            <PlayAgainButton onClick={returnHomeFunc}>
              Back Home
            </PlayAgainButton>
          </ButtonRow>
        </WinningCardSubContainer>
      </WinningCard>
    );
  };

  const displayWinningCard = () => {
    // Make sure the game winner is set from handleGameWin before displaying the winning card
    if (gameWinner) {
      return (
        <WinningCard>
          <WinningCardSubContainer style={{ justifyContent: "center" }}>
            {gameWinner === players[userInfo?.address].symbol ? (
              <WinningCardRow>
                <WinningCardTitleText>
                  You <span style={{ color: "#70BAFF" }}>Won!</span>
                </WinningCardTitleText>
              </WinningCardRow>
            ) : gameWinner === "TIE" ? (
              <WinningCardRow>
                <WinningCardTitleText>It's A Tie!</WinningCardTitleText>
              </WinningCardRow>
            ) : (
              <WinningCardRow>
                <WinningCardTitleText>
                  You <span style={{ color: "#F29999" }}>Lost!</span>
                </WinningCardTitleText>
              </WinningCardRow>
            )}
          </WinningCardSubContainer>
        </WinningCard>
      );
    }
  };

  // Display the players connected card to let the players know they can start the game
  const displayBothPlayersConnectedCard = () => {
    return (
      <PlayersConnectedCard>
        <WinningCardSubContainer>
          <PlayersConnectedText>
            Both players connected! Game can now begin! Good luck! ✨
          </PlayersConnectedText>
        </WinningCardSubContainer>
      </PlayersConnectedCard>
    );
  };

  const displayPlayerDisconnectedCard = () => {
    return (
      <PlayersConnectedCard>
        <WinningCardSubContainer>
          <PlayersConnectedText>
            {playerDisconnected?.includes(playerRed) &&
            !playerDisconnected?.includes(playerBlue)
              ? `${playerRedInfo?.name} has disconnected from the game. ${playerBlueInfo?.name} wins by default in ${disconnectTimerRed} seconds.`
              : playerDisconnected?.includes(playerBlue) &&
                !playerDisconnected?.includes(playerRed)
              ? `${playerBlueInfo?.name} has disconnected from the game. ${playerRedInfo?.name} wins by default in ${disconnectTimerBlue} seconds.`
              : playerDisconnected?.includes(playerRed) &&
                playerDisconnected?.includes(playerBlue)
              ? `Both players have disconnected from the game. The game will end in ${
                  disconnectTimerRed > disconnectTimerBlue
                    ? disconnectTimerBlue
                    : disconnectTimerRed
                } seconds.`
              : ""}
          </PlayersConnectedText>
        </WinningCardSubContainer>
      </PlayersConnectedCard>
    );
  };

  // Check tie logic
  const checkTie = (): boolean => {
    // Iterate over the entire board
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        // If any cell is empty, the game is not a tie
        if (board[row][col] === "") {
          return false;
        }
      }
    }
    // If all cells are filled and no winner is found, the game is a tie
    setGameWinner("TIE");
    return true;
  };

  // Play Again Functionality
  const playAgainFunc = async () => {
    setGame(null);
    setLoadingGame(true);
    setGameStarted(false);
    setPlayers({});
    setPlayerTurn(false);
    setInRoom(false);
    setGameStarted(false);
    setPlayerSymbol("R");
    setUserNameAvatar({});
    navigate(`/`);
    const userAddress = userInfo?.address;
    if (!userAddress) {
      setNotification({
        alertType: "alertError",
        msg: "Please connect your wallet",
      });
      return;
    }
    const hasBalance = await verifyBalance(
      userInfo,
      setNotification,
      setLoadingGame
    );
    if (!hasBalance) {
      return;
    }
    const socket = socketService.socket;
    if (!socket) return;
    const newGame = await gameService
      .generateGame(socket, userAddress)
      .catch((err) => {
        alert(err);
      });
    const roomId = newGame.roomId;
    ReactGA.event({
      category: "Play Again Button Clicked After Game Finished",
      action: "The game finished and the user clicked play again button",
      label: "The game finished and the user clicked play again button",
    });
    playRestartSound();
    navigate(`/game/${roomId}`);
  };

  const returnHomeFunc = () => {
    setPlayers({});
    setPlayerTurn(false);
    setInRoom(false);
    setGameStarted(false);
    setPlayerSymbol("R");
    setUserNameAvatar({});
    ReactGA.event({
      category: "Return Home Button Clicked After Game Finished",
      action: "The game finished and the user clicked return home button",
      label: "The game finished and the user clicked return home button",
    });
    navigate("/");
    setLoadingGame(false);
    setGame(null); // Reset game
  };

  // Mute Volume Functionality
  const toggleMute = () => {
    const newIsMuted = !isMuted;
    setIsMuted(newIsMuted);
    localStorage.setItem("isMuted", String(newIsMuted));
  };

  // Resign Functionality
  const resignFunc = () => {
    if (gameWinner) return;
    setToggleResignModal(true);
  };

  const displayResignModal = () => {
    return (
      <ReusableModal backdrop={true}>
        <WinningCardTitleText style={{ textAlign: "center" }}>
          Are you sure you want to resign?
        </WinningCardTitleText>
        <ResignButtonRow>
          <ResignModalButton
            onClick={() => {
              setToggleResignModal(false);
              setGameWinner(
                currentPlayer === playerRed ? playerBlue : playerRed
              );
              playWinningSound();
            }}
          >
            Yes, I'm sure!
          </ResignModalButton>
          <ResignModalButton
            style={{ backgroundColor: "#F29999", color: "#000000" }}
            onClick={() => {
              setToggleResignModal(false);
            }}
          >
            No, take me back
          </ResignModalButton>
        </ResignButtonRow>
      </ReusableModal>
    );
  };

  // Leaderboard logic in here
  const displayLeaderboard = () => {
    return (
      <Leaderboard
        leaderboardData={leaderboardData}
        leaderboardLoading={leaderboardLoading}
        setOpenLeaderboard={(props: boolean) => {
          setOpenLeaderboard(props);
        }}
      />
    );
  };

  const handleGameUpdate = () => {
    if (socketService.socket)
      gameService.onGameUpdate(socketService.socket, (props) => {
        setBoard(props.matrix);
        setCurrColumns(props.currColumns);
        setGameStartedUx(true);
        if (props.timeRed !== undefined) {
          setTimeRed(props.timeRed);
        }
        if (props.timeBlue !== undefined) {
          setTimeBlue(props.timeBlue);
        }
        // checkGameState(newMatrix);
        // setPlayerTurn(true);
      });
  };

  const handleTurnUpdate = () => {
    if (socketService.socket)
      gameService.onTurnUpdate(socketService.socket, (isTurn) => {
        // checkGameState(newMatrix);
        setPlayerTurn(isTurn);
      });
  };

  const handleGameStart = () => {
    if (socketService.socket)
      gameService.onStartGame(socketService.socket, (options) => {
        setGameStarted(true);
        setPlayerSymbol(options.symbol);
        if (options.start) setPlayerTurn(true);
        else setPlayerTurn(false);
      });
  };

  const handleGameResume = () => {
    if (socketService.socket)
      gameService.onResumeGame(socketService.socket, (options) => {
        setBoard(options.matrix);
        setPlayerSymbol(options.symbol);
        setPlayers(options.players);
        setGameStarted(true);
        setTimeRed(options.timeRed);
        setTimeBlue(options.timeBlue);
        // Check if the board coming from BE is different from the initial board state. If so, that means the game has started, therefore when resuming, set the gameStartedUx to true
        if (!_.isEqual(initialBoard, options.matrix)) {
          setGameStartedUx(true);
        }
      });
  };

  const handleGameWin = async () => {
    if (socketService.socket)
      try {
        gameService.onGameWin(
          socketService.socket,
          ({
            matrix,
            players: newPlayers,
            game: gameFromBack,
            currColumns: currColumnsFromBack,
            winnerSymbol,
            winningCells,
          }: any) => {
            setGameWinner(winnerSymbol);
            setGameWinnerLoading(true);
            setGameWinningCells(winningCells);
            if (newPlayers) {
              setPlayers(newPlayers);
            }
            setTimeout(() => {
              // Reset game here after a player wins
              handleResetGame();
              if (matrix) {
                setBoard(matrix);
                setCurrColumns(currColumnsFromBack);
              }

              setGame(gameFromBack);
              setGameWinnerLoading(false);
            }, 4000);
          }
        );
      } catch (error) {
        console.log({ error });
      }
  };

  const handleGameTie = () => {
    if (socketService.socket)
      try {
        gameService.onGameTie(
          socketService.socket,
          ({
            matrix,
            players,
            game: gameFromBack,
            currColumns: currColumnsFromBack,
          }: any) => {
            playTieGameSound();
            setGameWinner("TIE");
            setGameWinnerLoading(true);
            setTimeout(() => {
              setBoard(matrix);
              setPlayers(players);
              setGame(gameFromBack);
              setCurrColumns(currColumnsFromBack);
              handleResetGame();
              setGameWinnerLoading(false);
            }, 4000);
          }
        );
      } catch (error) {
        console.error({ error });
      }
  };

  const handlePlayersInfo = () => {
    if (socketService.socket)
      gameService.onPlayersInfo(socketService.socket, (message) => {
        setPlayers(message);
      });
  };

  const handleFullGameData = () => {
    if (socketService.socket)
      gameService.onSetFullGameData(socketService.socket, (fullGameData) => {
        setGame(fullGameData);
      });
  };

  const handleOnPaymentNotMade = () => {
    if (socketService.socket)
      gameService.onPaymentNotMade(socketService.socket, (qortAddress) => {
        // const hasCurrentUserNotPaid = qortAddress === userInfo?.address;
        // if (hasCurrentUserNotPaid) {
        // this is only to confirm that the timer is out. but there should be a timer in the front that does it. so ignore this.

        const newPaymentsNotMade = [...paymentsNotMade];
        newPaymentsNotMade.push(qortAddress);
        setPaymentsNotMade(newPaymentsNotMade);
      });
  };


  async function requestSendQort(address: string, amount: number) {
    try {
      const response = await sendRequestToExtension(
        "REQUEST_SEND_QORT",
        {
          description: "Send Qort to participate in the game",
          amount: amount,
          address: address,
        },
        60000
      );
      return response;
    } catch (error) {
      console.error("Error requesting user info:", error);
    }
  }

  const sendQort = useCallback(async () => {
    // No sending QORT once game is started
    if (gameStartedUx) return;
    // No sending QORT once 90 second timer has expired
    if (paymentTimer === 0) return;
    try {
      if (!socketService.socket) return;
      const address = homeAddress;
      const amount = Number(playingAmount);
      const payment = await requestSendQort(address, amount + 0.01);
      if (!payment?.res?.success) {
        setNotification({
          alertType: "alertError",
          msg: "Payment failed! Please try again!",
        });
        return;
      }
      gameService.paymentMade(socketService.socket, payment?.res?.data);
      setNotification({
        alertType: "alertSuccess",
        msg: "Payment successful!",
      });
      playStartSound();
      setPaymentTimer(90);
      setLoadingGame(false);
    } catch (error) {
      console.error({ error });
    } finally {
      ReactGA.event({
        category: "Payment",
        action: "User clicked the send QORT button after finding opponent",
        label: "User clicked the send QORT button after finding opponent",
      });
    }
  }, [homeAddress, playingAmount, gameStartedUx]);

  // Restart a new game (but only for the first to 2 wins)
  const handleResetGame = () => {
    setGameWinner(null);
    setGameStartedUx(false);
    setGameWinningCells(null);
    setTimeRed(120);
    setTimeBlue(120);
  };

  const handleShowLeaderboard = async () => {
    if (leaderboardData && leaderboardData.length > 0) {
      setOpenLeaderboard(true);
      return;
    }
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/game/weeklystanding`);
      const data = await res.json();
      setLeaderboardData(data);
      setOpenLeaderboard(true);
    } catch (error) {
      console.error(error);
      setNotification({
        alertType: "alertError",
        msg: "Error when fetching the leaderboard! Please try again!",
      });
    } finally {
      setLeaderboardLoading(false);
      ReactGA.event({
        category: "Leaderboard",
        action: "Clicked the leaderboard button on the Qonnect Four page",
        label: "Clicked the leaderboard button on the Qonnect Four page",
      });
    }
  };

  // Found opponent modal
  if (
    loadingGame &&
    game?.status === "active" &&
    !game?.playerPayments.find(
      (item) => item?.player?.qortAddress === userInfo?.address
    )
  )
    return (
      <ReusableModal backdrop={false}>
        <OpponentFoundText>OPPONENT FOUND 🥳</OpponentFoundText>
        <AwaitingPaymentText>Awaiting payment</AwaitingPaymentText>
        <ReusableModalButton disabled={paymentTimer === 0} onClick={sendQort}>
          Send QORT
        </ReusableModalButton>
        <ModalCol>
          <PaymentTimerText>
            ⌛Time left to pay before being banned for 24 hours:
          </PaymentTimerText>
          <CustomCircularProgress
            size={115}
            thickness={12}
            variant="determinate"
            value={(paymentTimer / 90) * 100}
            time={paymentTimer}
          />
        </ModalCol>
      </ReusableModal>
    );

  // Opponent left modal but current user paid
  if (
    game?.playerPayments.find(
      (item) => item?.player?.qortAddress === userInfo?.address
    ) &&
    paymentsNotMade.includes(
      game?.players.filter(
        (player) => player?.qortAddress !== userInfo?.address
      )[0]?.qortAddress
    )
  )
    return (
      <ReusableModal backdrop={false}>
        <OpponentLeftText>OPPONENT LEFT 😢</OpponentLeftText>
        <AwaitingPaymentText>
          Your QORT will be returned by end of the current day!
        </AwaitingPaymentText>
        <ReusableModalButton onClick={playAgainFunc}>
          Play Again
        </ReusableModalButton>
      </ReusableModal>
    );

  return (
    <QonnectFourContainer
      winner={gameWinner === "R" || gameWinner === "B" ? "true" : ""}
      style={{ justifyContent: loadingGame ? "center" : "" }}
    >
      {loadingGame &&
      !isGameStarted &&
      players[userInfo?.address]?.isConnected &&
      Object.keys(players).length < 2 ? (
        <ReusableModal backdrop={false}>
          <LoadingModalText>Looking for an opponent...</LoadingModalText>
          <LoadingStarsContainer>
            {[...Array(4)].map((_, i) => (
              <LoadingStar
                onMouseEnter={() => {
                  return;
                }}
                onMouseLeave={() => {
                  return;
                }}
                player={"B"}
                isWinningCell={true}
                winner={"true"}
                onClick={() => {
                  return;
                }}
                delay={i * 0.5}
                key={i}
              >
                <StarSVG color="#fff" height={"34"} width={"36"} />
              </LoadingStar>
            ))}
          </LoadingStarsContainer>
        </ReusableModal>
      ) : !loadingGame ? (
        <>
          {!isMuted ? (
            <MuteButton
              onClickFunc={toggleMute}
              color="#464646"
              height="30px"
              width="30px"
            />
          ) : (
            <UnmuteButton
              onClickFunc={toggleMute}
              color="#464646"
              height="30px"
              width="30px"
            />
          )}
          <ResignButton onClick={resignFunc}>RESIGN</ResignButton>
          {toggleResignModal && displayResignModal()}
          <LeaderboardButton onClick={handleShowLeaderboard}>
            LEADERBOARD
          </LeaderboardButton>
          {/* Scoreboard only shown on smaller screens */}
          <QonnectFourScoreboard>
            <QonnectFourWrapperCol
              playerTurn={
                currentPlayer === playerRed &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? playerRed
                  : ""
              }
              ownUser={
                playerRedInfo?.ownUser &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? true
                  : false
              }
              awaitingPayment={
                !game?.playerPayments.find(
                  (item) => item?.player?.qortAddress === playerRedInfo?.address
                )
              }
            >
              <QonnectFourPlayer>
                <QonnectFourPlayerCol>
                  <QonnectFourPlayerText>
                    {playerRedInfo?.name || "Player Red"}
                  </QonnectFourPlayerText>
                  {!gameWinner &&
                    !gameWinnerLoading &&
                    game?.status !== "finished" &&
                    game?.status !== "finished-forfeit" && (
                      <QonnectFourPlayerTimer
                        className={
                          timeRed <= 15 &&
                          currentPlayer === playerRed &&
                          !gameWinner
                            ? "timer-warning"
                            : ""
                        }
                      >
                        {formatTime(timeRed)}
                      </QonnectFourPlayerTimer>
                    )}
                </QonnectFourPlayerCol>
                {playerRedInfo?.avatar &&
                playerRedInfo?.avatar !== "No Avatar" ? (
                  <QonnectFourAvatar
                    src={`data:image/jpeg;base64,${playerRedInfo?.avatar}`}
                    alt={`${playerRedInfo?.name}'s avatar`}
                  />
                ) : (
                  <QonnectFourDefaultAvatar color="R" />
                )}
              </QonnectFourPlayer>
              <WinsCol>
                <WinsTypography>{`${
                  playerRedInfo?.name || "Player Red"
                } Wins`}</WinsTypography>
                <StyledWinIcon
                  name="player-red-win-count"
                  defaultValue={0}
                  max={2}
                  readOnly
                  icon={<StarSVG color="#ffffff" height="19" width="20" />}
                  emptyIcon={<StarSVG color="#3F3F3F" height="19" width="20" />}
                  value={playerWinCount?.redWins || 0}
                />
              </WinsCol>
            </QonnectFourWrapperCol>
            <QonnectFourVSText>VS</QonnectFourVSText>
            <QonnectFourWrapperCol
              playerTurn={
                currentPlayer === playerBlue &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? playerBlue
                  : ""
              }
              ownUser={
                playerBlueInfo?.ownUser &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? true
                  : false
              }
              awaitingPayment={
                !game?.playerPayments.find(
                  (item) =>
                    item?.player?.qortAddress === playerBlueInfo?.address
                )
              }
            >
              <QonnectFourPlayer>
                <QonnectFourPlayerCol>
                  <QonnectFourPlayerText>
                    {playerBlueInfo?.name || "Player Blue"}
                  </QonnectFourPlayerText>
                  {!gameWinner &&
                    !gameWinnerLoading &&
                    game?.status !== "finished" &&
                    game?.status !== "finished-forfeit" && (
                      <QonnectFourPlayerTimer
                        className={
                          timeBlue <= 15 &&
                          currentPlayer === playerBlue &&
                          !gameWinner
                            ? "timer-warning"
                            : ""
                        }
                      >
                        {formatTime(timeBlue)}
                      </QonnectFourPlayerTimer>
                    )}
                </QonnectFourPlayerCol>
                {playerBlueInfo?.avatar &&
                playerBlueInfo?.avatar !== "No Avatar" ? (
                  <QonnectFourAvatar
                    src={`data:image/jpeg;base64,${playerBlueInfo?.avatar}`}
                    alt={`${playerBlueInfo?.name}'s avatar`}
                  />
                ) : (
                  <QonnectFourDefaultAvatar color="B" />
                )}
              </QonnectFourPlayer>
              <WinsCol>
                <WinsTypography>
                  {`${playerBlueInfo?.name || "Player Blue"} Wins`}
                </WinsTypography>
                <StyledWinIcon
                  name="player-blue-win-count"
                  defaultValue={0}
                  max={2}
                  readOnly
                  icon={<StarSVG color="#ffffff" height="19" width="20" />}
                  emptyIcon={<StarSVG color="#3F3F3F" height="19" width="20" />}
                  value={playerWinCount?.blueWins || 0}
                />
              </WinsCol>
            </QonnectFourWrapperCol>
          </QonnectFourScoreboard>
          <QonnectFourBoardContainer>
            <QonnectFourPlayerCard
              playerTurn={
                currentPlayer === playerRed &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? playerRed
                  : ""
              }
              ownUser={
                playerRedInfo?.ownUser &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? true
                  : false
              }
              awaitingPayment={
                !game?.playerPayments.find(
                  (item) => item?.player?.qortAddress === playerRedInfo?.address
                )
              }
            >
              <QonnectFourPlayerCardRow>
                <QonnectFourPlayerCol>
                  <QonnectFourPlayerText>
                    {playerRedInfo?.name || "Player Red"}
                  </QonnectFourPlayerText>
                  {!gameWinner &&
                    !gameWinnerLoading &&
                    game?.status !== "finished" &&
                    game?.status !== "finished-forfeit" && (
                      <QonnectFourPlayerTimer
                        className={
                          timeRed <= 15 &&
                          currentPlayer === playerRed &&
                          !gameWinner
                            ? "timer-warning"
                            : ""
                        }
                      >
                        {formatTime(timeRed)}
                      </QonnectFourPlayerTimer>
                    )}
                </QonnectFourPlayerCol>
                {playerRedInfo?.avatar &&
                playerRedInfo?.avatar !== "No Avatar" ? (
                  <QonnectFourAvatar
                    src={`data:image/jpeg;base64,${playerRedInfo?.avatar}`}
                    alt={`${playerRedInfo?.name}'s avatar`}
                  />
                ) : (
                  <QonnectFourDefaultAvatar color="R" />
                )}
              </QonnectFourPlayerCardRow>
              <WinsCol>
                <WinsTypography>
                  {`${playerRedInfo?.name || "Player Red"} Wins`}
                </WinsTypography>
                <StyledWinIcon
                  name="player-red-win-count"
                  defaultValue={0}
                  max={2}
                  readOnly
                  icon={<StarSVG color="#ffffff" height="19" width="20" />}
                  emptyIcon={<StarSVG color="#3F3F3F" height="19" width="20" />}
                  value={playerWinCount?.redWins || 0}
                />
              </WinsCol>
            </QonnectFourPlayerCard>
            <QonnectFourBoardSubContainer>
              {gameWinner &&
              game &&
              game?.status !== "finished" &&
              game?.status !== "finished-forfeit" ? (
                <>{displayWinningCard()}</>
              ) : game &&
                (game?.status === "finished" ||
                  game?.status === "finished-forfeit") ? (
                <>{displayFinalWinnerCard()}</>
              ) : (
                <>{generateHoverRow()}</>
              )}
              {bothPlayersConnected && displayBothPlayersConnectedCard()}
              {playerDisconnected &&
                playerDisconnected.length > 0 &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit" &&
                displayPlayerDisconnectedCard()}
              <QonnectFourBoard ref={boardContainerRef}>
                {animationInfo && generateAnimatedLayer}
                {generateBoard()}
                {openLeaderboard && displayLeaderboard()}
              </QonnectFourBoard>
              <BestOfFontCol>
                <BestOfFont>BEST OUT OF 3</BestOfFont>
                {game?.series?.totalGames &&
                  game?.status !== "finished" &&
                  game?.status !== "finished-forfeit" && (
                    <BestOfFont>{`ROUND ${
                      game?.history.length + 1
                    }`}</BestOfFont>
                  )}
              </BestOfFontCol>
            </QonnectFourBoardSubContainer>
            <QonnectFourPlayerCard
              playerTurn={
                currentPlayer === playerBlue &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? playerBlue
                  : ""
              }
              ownUser={
                playerBlueInfo?.ownUser &&
                !gameWinner &&
                game?.status !== "finished" &&
                game?.status !== "finished-forfeit"
                  ? true
                  : false
              }
              awaitingPayment={
                !game?.playerPayments.find(
                  (item) =>
                    item?.player?.qortAddress === playerBlueInfo?.address
                )
              }
            >
              <QonnectFourPlayerCardRow>
                {playerBlueInfo?.avatar &&
                playerBlueInfo?.avatar !== "No Avatar" ? (
                  <QonnectFourAvatar
                    src={`data:image/jpeg;base64,${playerBlueInfo?.avatar}`}
                    alt={`${playerBlueInfo?.name}'s avatar`}
                  />
                ) : (
                  <QonnectFourDefaultAvatar color="B" />
                )}
                <QonnectFourPlayerCol>
                  <QonnectFourPlayerText>
                    {playerBlueInfo?.name || "Player Blue"}
                  </QonnectFourPlayerText>
                  {!gameWinner &&
                    !gameWinnerLoading &&
                    game?.status !== "finished" &&
                    game?.status !== "finished-forfeit" && (
                      <QonnectFourPlayerTimer
                        className={
                          timeBlue <= 15 &&
                          currentPlayer === playerBlue &&
                          !gameWinner
                            ? "timer-warning"
                            : ""
                        }
                      >
                        {formatTime(timeBlue)}
                      </QonnectFourPlayerTimer>
                    )}
                </QonnectFourPlayerCol>
              </QonnectFourPlayerCardRow>
              <WinsCol>
                <WinsTypography>
                  {`${playerBlueInfo?.name || "Player Blue"} Wins`}
                </WinsTypography>
                <StyledWinIcon
                  name="player-blue-win-count"
                  defaultValue={0}
                  max={2}
                  readOnly
                  icon={<StarSVG color="#ffffff" height="19" width="20" />}
                  emptyIcon={<StarSVG color="#3F3F3F" height="19" width="20" />}
                  value={playerWinCount?.blueWins || 0}
                />
              </WinsCol>
            </QonnectFourPlayerCard>
          </QonnectFourBoardContainer>
        </>
      ) : (
        <ReusableModal backdrop={false}>
          <LoadingModalText>Looking for an opponent...</LoadingModalText>
          <LoadingStarsContainer>
            {[...Array(4)].map((_, i) => (
              <LoadingStar
                onMouseEnter={() => {
                  return;
                }}
                onMouseLeave={() => {
                  return;
                }}
                player={"B"}
                isWinningCell={true}
                winner={"true"}
                onClick={() => {
                  return;
                }}
                delay={i * 0.5}
                key={i}
              >
                <StarSVG color="#fff" height={"34"} width={"36"} />
              </LoadingStar>
            ))}
          </LoadingStarsContainer>
        </ReusableModal>
      )}
    </QonnectFourContainer>
  );
};
