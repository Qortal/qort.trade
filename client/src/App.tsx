import React, { useEffect, useState } from "react";
import ReactGA from "react-ga4";
import "./App.css";
import socketService from "./services/socketService";
import GameContext, {
  IContextProps,
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
import axios from "axios";
import { executeEvent } from "./utils/events";
import { getMainEndpoint } from "./utils/findUsableApi";
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
const currentHost = window.location.host;
console.log({currentHost})
if (import.meta.env.MODE === "production") {
  if (currentHost === "www.qort.trade") {
    serverUrl = "https://www.qort.trade";
  } else if (currentHost === "qort.trade") {
    serverUrl = "https://qort.trade";
  } else {
    serverUrl = "https://www.qort.trade";
  }
} else {
  serverUrl = "http://localhost:3001";
}

function App() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [qortBalance, setQortBalance] = useState<any>(null);
  const [ltcBalance, setLtcBalance] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [OAuthLoading, setOAuthLoading] = useState<boolean>(false);


  const [isSocketUp, setIsSocketUp] = useState<boolean>(false);
  const [onGoingTrades, setOngoingTrades] = useState([])
  const [userNameAvatar, setUserNameAvatar] = useState<
    Record<string, UserNameAvatar>
  >({});
  const [avatar, setAvatar] = useState<string>("");
  const [notification, setNotification] = useState<NotificationProps>({
    alertType: "",
    msg: "",
  });
  const [loadingSlider, setLoadingSlider] = useState<boolean>(false);

  const loadingContextValue = {
    loadingSlider,
    setLoadingSlider,
  };

  const requestUserInfo = async () => {
    setLoadingSlider(true);
    try {
      const response = await sendRequestToExtension("REQUEST_USER_INFO");
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

  
  const userContextValue: UserContextProps = {
    avatar,
    setAvatar,
  };

  const notificationContextValue = {
    notification,
    setNotification,
    resetNotification,
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

  const fetchOngoingTransactions = async()=> {
    try {
      const token = localStorage.getItem("token");

        const response = await axios.get(`${serverUrl}/api/transaction/fetch-qortAddress?qortAddress=${userInfo?.address}`, {
          
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${token}`
            },
          

        })
        setOngoingTrades((response?.data || []).sort((a: any, b: any) => new Date(b?.updatedAt).getTime() - new Date(a?.updatedAt).getTime()));
      } catch (error) {
      
    }
  }
  useEffect(() => {
    if(userInfo?.address){
      fetchOngoingTransactions()

    }
  }, [userInfo?.address]);


  const getQortBalance = async ()=> {
    const balanceUrl: string = `${getMainEndpoint()}/addresses/balance/${userInfo?.address}`;
    const balanceResponse = await axios(balanceUrl);
    setQortBalance(balanceResponse.data?.value)
  }

  const getLTCBalance = async () => {
    try {

      const response = await sendRequestToExtension(
        "REQUEST_LTC_BALANCE"
      );
      
      if(!response.error){
        setLtcBalance(response)
      }
    } catch (error) {

    }
  }

  useEffect(() => {
    if(!userInfo?.address) return
    const intervalGetTradeInfo = setInterval(() => {
      fetchOngoingTransactions()
      getLTCBalance()
      getQortBalance()
    }, 150000)
    getLTCBalance()
      getQortBalance()
    return () => {
      clearInterval(intervalGetTradeInfo)
    }
  }, [userInfo?.address, isAuthenticated])


  const handleMessage = async (event: any) => {
    if (event.data.type === "LOGOUT") {
      console.log("Logged out from extension");
      setUserInfo(null);
      setAvatar("");
      setIsAuthenticated(false);
      setQortBalance(null)
      setLtcBalance(null)
      localStorage.setItem("token", "");
    } else if(event.data.type === "RESPONSE_FOR_TRADES"){
    

      const response = event.data.payload
      if (response?.extra?.atAddresses
        ) {
        try {
          const status = response.callResponse === true ? 'trade-ongoing' : 'trade-failed'
          const token = localStorage.getItem("token");
          const res = await axios.post(
            `${serverUrl}/api/transaction/updatetx`,
            {
              qortalAtAddresses: response?.extra.atAddresses
              , qortAddress:userInfo.address, status, message: response.extra.message
            },
            {
              headers: {
                "Content-Type": "application/json",
                 'Authorization': `Bearer ${token}`
              },
            }
          );
          fetchOngoingTransactions()
          executeEvent("execute-get-new-block-trades", {})
        } catch (error) {
          console.log({error})
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [userInfo?.address]);

  const gameContextValue: IContextProps = {
    userInfo,
    setUserInfo,
    userNameAvatar,
    setUserNameAvatar,
    setOngoingTrades,
    onGoingTrades,
    fetchOngoingTransactions,
    ltcBalance,
    qortBalance,
    isAuthenticated, 
    setIsAuthenticated,
    OAuthLoading, 
    setOAuthLoading
  };

  
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
