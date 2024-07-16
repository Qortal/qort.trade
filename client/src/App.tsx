import React, { useEffect, useState } from "react";
import ReactGA from "react-ga4";
import "./App.css";
import socketService from "./services/socketService";
import GameContext, {
  IGameContextProps,
  Player,
  UserNameAvatar,
} from "./contexts/gameContext";
import { Route, Routes } from "react-router-dom";

import { ThemeProvider } from "@mui/material";
import { darkTheme } from "./styles/theme";
import { HomePage } from "./pages/Home/Home";
import { UserContext, UserContextProps } from "./contexts/userContext";
import {
  NotificationProps,
  NotificationContext,
} from "./contexts/notificationContext";
import { Notification } from "./components/common/notification/Notification";
import { LoadingContext } from "./contexts/loadingContext";

// Initialize Google Analytics
// ReactGA.initialize("G-J3QYNDDK5N");

export const isExtensionInstalledFunc = async () => {
  try {
    const response = await sendRequestToExtension(
      "REQUEST_IS_INSTALLED",
      {},
      750
    );
    return response;
  } catch (error) {
    console.log({ error });
  }
};

export async function requestConnection() {
  try {
    const response = await sendRequestToExtension("REQUEST_CONNECTION");
    console.log("User info response:", response);
    return response;
  } catch (error) {
    console.error("Error requesting user info:", error);
  }
}

export async function requestAuthentication() {
  try {
    const response = await sendRequestToExtension(
      "REQUEST_AUTHENTICATION",
      {},
      90000
    );
    console.log("AUTH info response:", response);
    return response;
  } catch (error) {
    console.error("Error requesting user info:", error);
  }
}

export async function sendRequestToExtension(
  requestType: string,
  payload?: any,
  timeout: number = 20000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).substring(2, 15); // Generate a unique ID for the request
    const detail = {
      type: requestType,
      payload,
      requestId,
      timeout: timeout / 1000,
    };

    // Store the timeout ID so it can be cleared later
    const timeoutId = setTimeout(() => {
      document.removeEventListener("qortalExtensionResponses", handleResponse);
      reject(new Error("Request timed out"));
    }, timeout); // Adjust timeout as necessary

    function handleResponse(event: any) {
      const { requestId: responseId, data } = event.detail;
      if (requestId === responseId) {
        // Match the response with the request
        document.removeEventListener(
          "qortalExtensionResponses",
          handleResponse
        );
        clearTimeout(timeoutId); // Clear the timeout upon successful response
        resolve(data);
      }
    }

    document.addEventListener("qortalExtensionResponses", handleResponse);
    document.dispatchEvent(
      new CustomEvent("qortalExtensionRequests", { detail })
    );
  });
}

export let serverUrl: string;
if (import.meta.env.MODE === "production") {
  serverUrl = "https://www.qort.games";
} else {
  serverUrl = "http://localhost:3001";
}

function App() {
  const [gameWinner, setGameWinner] = useState<"R" | "B" | "TIE" | null>(null);
  const [isInRoom, setInRoom] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<"R" | "B">("R");
  const [isPlayerTurn, setPlayerTurn] = useState(false);
  const [isGameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [game, setGame] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSocketUp, setIsSocketUp] = useState<boolean>(false);
  const [userNameAvatar, setUserNameAvatar] = useState<
    Record<string, UserNameAvatar>
  >({});
  const [avatar, setAvatar] = useState<string>("");
  const [notification, setNotification] = useState<NotificationProps>({
    alertType: "",
    msg: "",
  });
  const [loadingSlider, setLoadingSlider] = useState<boolean>(false);
  const [loadingGame, setLoadingGame] = useState<boolean>(false);

  const requestUserInfo = async () => {
    setLoadingSlider(true);
    try {
      const response = await sendRequestToExtension("REQUEST_USER_INFO");
      console.log("User info response:", response);
      return response;
    } catch (error) {
      console.error("Error requesting user info:", error);
    } finally {
      setLoadingSlider(false);
    }
  };

  const connectSocket = async () => {
    // If there's no token in local storage, do not connect the socket and hence show oauth button
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = await socketService
      .connect(serverUrl, token)
      .then(() => {
        setIsSocketUp(true);
      })
      .catch((err) => {
        console.log("Error: ", err);
      })
  };

  const resetNotification = () => {
    setNotification({ alertType: "", msg: "" });
  };

  const gameContextValue: IGameContextProps = {
    gameWinner,
    setGameWinner,
    isInRoom,
    setInRoom,
    playerSymbol,
    setPlayerSymbol,
    isPlayerTurn,
    setPlayerTurn,
    isGameStarted,
    setGameStarted,
    setPlayers,
    players,
    game,
    setGame,
    userInfo,
    setUserInfo,
    userNameAvatar,
    setUserNameAvatar,
  };

  const userContextValue: UserContextProps = {
    avatar,
    setAvatar,
  };

  const notificationContextValue = {
    notification,
    setNotification,
    resetNotification,
  };

  const loadingContextValue = {
    loadingSlider,
    setLoadingSlider,
    loadingGame,
    setLoadingGame,
  };

  const isInstalledFunc = async () => {
    try {
      const res = await isExtensionInstalledFunc();
      if (!res?.version) {
        return {
          success: false,
          message: "Extension not installed",
          userInfo: null,
        };
      }
      const res2 = await requestConnection();
      if (res2 === true) {
        const res3 = await requestAuthentication();
        if (res3 === true) {
          const res4 = await requestUserInfo();
          if (res4?.address) {
            setUserInfo(res4);
            return {
              success: true,
              message: "Logged in successfully!",
              userInfo: res4,
            };
          } else {
            return {
              success: false,
              message: "Error requesting user info",
              userInfo: null,
            };
          }
        } else {
          return {
            success: false,
            message: "Error authenticating user",
            userInfo: null,
          };
        }
      } else {
        return {
          success: false,
          message: "Error requesting user info",
          userInfo: null,
        };
      }
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: "Error requesting user info",
        userInfo: null,
      };
    }
  };

  // useEffect(() => {
  //   connectSocket();
  //   return () => {
  //     socketService.disconnect(); // You would need to implement this method
  //   };
  // }, []);

  useEffect(() => {
    setTimeout(() => {
      isInstalledFunc();
    }, 750);
  }, []);

  const handleMessage = (event: any) => {
    if (event.data.type === "LOGOUT") {
      console.log("Logged out from extension");
      setUserInfo(null);
      setAvatar("");
      setIsSocketUp(false);
      localStorage.setItem("token", "");
    } else if(event.data.type === "RESPONSE_FOR_TRADES"){
      console.log('message', event.data.payload)
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <NotificationContext.Provider value={notificationContextValue}>
      <LoadingContext.Provider value={loadingContextValue}>
        <UserContext.Provider value={userContextValue}>
          <GameContext.Provider value={gameContextValue}>
            <Notification />
            <ThemeProvider theme={darkTheme}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <HomePage
                      connectSocket={() => connectSocket()}
                      isSocketUp={isSocketUp}
                      isInstalledFunc={isInstalledFunc}
                    />
                  }
                />
              </Routes>
            </ThemeProvider>
          </GameContext.Provider>
        </UserContext.Provider>
      </LoadingContext.Provider>
    </NotificationContext.Provider>
  );
}

export default App;
