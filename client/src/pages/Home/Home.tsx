import { FC, useContext,  useEffect,  useState } from "react";
import { AppContainer } from "../../App-styles";

import axios from "axios";
import { Header } from "../../components/header/Header";
import { useLocation, useNavigate } from "react-router-dom";
import gameContext from "../../contexts/gameContext";
import { sendRequestToExtension, serverUrl } from "../../App";

import { NotificationContext } from "../../contexts/notificationContext";

import { TradeOffers } from "../../components/Grids/TradeOffers";
import { OngoingTrades } from "../../components/Grids/OngoingTrades";
import { Button } from "@mui/material";

interface IsInstalledReturn {
  success: boolean;
  message: string;
  userInfo: any | null;
}
interface IsInstalledProps {
  connectSocket: () => void;
  isSocketUp: boolean;
  isInstalledFunc: () => Promise<IsInstalledReturn>;
}

export const HomePage: FC<IsInstalledProps> = ({
  connectSocket,
  isSocketUp,
  isInstalledFunc,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { qortBalance, ltcBalance, userInfo} = useContext(gameContext);
  const { setNotification } = useContext(NotificationContext);
  

  const [OAuthLoading, setOAuthLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);


  // OAuth logic
  const oAuthFunc = async () => {
    setOAuthLoading(true);
    try {
      const userInfoResponse = await isInstalledFunc();
      console.log({userInfoResponse})
      if (!userInfoResponse.success) {
        setNotification({
          alertType: "alertError",
          msg: userInfoResponse.message,
        });
        return;
      } else {
        const res = await axios.post(
          `${serverUrl}/api/auth/oauth`,
          {
            qortAddress: userInfoResponse.userInfo?.address,
            publicKey: userInfoResponse.userInfo?.publicKey,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = res.data;
        const response = await sendRequestToExtension(
          "REQUEST_OAUTH",
          {
            nodeBaseUrl: data.validApi,
            senderAddress: data.creatorAddress,
            senderPublicKey: data.senderPublicKey,
            timestamp: data.timestamp,
          },
          300000
        );
        const tokenRes = await axios.post(
          `${serverUrl}/api/auth/oauth/verify`,
          {
            qortAddress: userInfoResponse.userInfo?.address,
            code: response,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log({tokenRes})
        if (tokenRes.data) {
          localStorage.setItem("token", tokenRes.data);
          setIsAuthenticated(true)
        }
        setNotification({
          alertType: "alertSuccess",
          msg: userInfoResponse.message,
        });
      }
    } catch (error) {
      console.error(error);
      setNotification({
        alertType: "alertError",
        msg: "Error when trying to authenticate, please try again!",
      });
    } finally {
      setOAuthLoading(false);
      
    }
  };

  const checkIfAuthenticated = async()=> {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${serverUrl}/api/auth/isAuthenticated?qortAddress=${userInfo.address}`,
        {
          headers: {
            "Content-Type": "application/json",
            'Authorization': `Bearer ${token}`
          },
        }
      );
      setIsAuthenticated(true)
    } catch (error) {
      
    }
  }
  useEffect(()=> {
    if(!userInfo?.address) return
    checkIfAuthenticated()
  }, [userInfo?.address])

  return (
    <AppContainer>
      {userInfo && !isAuthenticated && (
            
                <Button onClick={oAuthFunc}>
                  Login To Qortal Extension To Play
                </Button>
          
            )}
      {/* <Header /> */}
      {qortBalance !== null && (
              <p>{qortBalance}</p>

      )}
      {ltcBalance !== null && (
              <p>{ltcBalance}</p>

      )}
      <OngoingTrades />
      <TradeOffers />
    </AppContainer>
  );
};
