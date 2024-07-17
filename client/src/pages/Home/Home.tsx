import { FC, useContext,  useState } from "react";
import { AppContainer } from "../../App-styles";

import axios from "axios";
import { Header } from "../../components/header/Header";
import { useLocation, useNavigate } from "react-router-dom";
import gameContext from "../../contexts/gameContext";
import { sendRequestToExtension, serverUrl } from "../../App";

import { NotificationContext } from "../../contexts/notificationContext";

import { TradeOffers } from "../../components/Grids/TradeOffers";
import { OngoingTrades } from "../../components/Grids/OngoingTrades";

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
  const { qortBalance, ltcBalance} = useContext(gameContext);
  const { setNotification } = useContext(NotificationContext);


  const [OAuthLoading, setOAuthLoading] = useState<boolean>(false);


  // OAuth logic
  const oAuthFunc = async () => {
    setOAuthLoading(true);
    try {
      const userInfoResponse = await isInstalledFunc();
      if (!userInfoResponse.success) {
        setNotification({
          alertType: "alertError",
          msg: userInfoResponse.message,
        });
        return;
      } else {
        const res = await axios.post(
          `${serverUrl}/api/game/oauth`,
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
          `${serverUrl}/api/game/oauth/verify`,
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
        if (tokenRes.data) {
          localStorage.setItem("token", tokenRes.data);
          connectSocket();
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

  console.log({qortBalance})
  return (
    <AppContainer>
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
