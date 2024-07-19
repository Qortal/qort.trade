import { FC, useContext, useEffect, useState } from "react";
import { AppContainer } from "../../App-styles";

import axios from "axios";
import { Header } from "../../components/header/Header";
import { useLocation, useNavigate } from "react-router-dom";
import gameContext from "../../contexts/gameContext";
import { sendRequestToExtension, serverUrl } from "../../App";

import { NotificationContext } from "../../contexts/notificationContext";

import { TradeOffers } from "../../components/Grids/TradeOffers";
import { OngoingTrades } from "../../components/Grids/OngoingTrades";
import { Box, Button, CircularProgress } from "@mui/material";
import { TextTableTitle } from "../../components/Grids/Table-styles";
import { Spacer } from "../../components/common/Spacer";
import { ReusableModal } from "../../components/common/reusable-modal/ReusableModal";
import { OAuthButton, OAuthButtonRow } from "./Home-Styles";

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
  const { qortBalance, ltcBalance, userInfo, isAuthenticated, setIsAuthenticated,   OAuthLoading, 
    setOAuthLoading} = useContext(gameContext);
  const { setNotification } = useContext(NotificationContext);




  // OAuth logic
  const oAuthFunc = async () => {
    try {
      const userInfoResponse = await isInstalledFunc();
      if (!userInfoResponse.success) {
        setNotification({
          alertType: "alertError",
          msg: userInfoResponse.message,
        });
        return;
      } else {
        setOAuthLoading(true)
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
      setOAuthLoading(false)
    }
  };

  const checkIfAuthenticated = async () => {
    try {
      setOAuthLoading(true)
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

    } finally {
      setOAuthLoading(false)
    }
  }
  useEffect(() => {
    if (!userInfo?.address) return
    checkIfAuthenticated()
  }, [userInfo?.address])



  return (
    <AppContainer>

      {!isAuthenticated && (

        <ReusableModal backdrop={true}>
          <>
            {OAuthLoading ? (
              <CircularProgress color="success" size={25} />

            ) : (
              <OAuthButtonRow>
                <OAuthButton onClick={oAuthFunc}>
                  Login
                </OAuthButton>
              </OAuthButtonRow>
            )}
          </>

        </ReusableModal>


      )}
      <Header qortBalance={qortBalance} ltcBalance={ltcBalance} />
      <Spacer height="40px" />
      <Box sx={{
        padding: "0 30px",
        width: '100%'
      }}>
        <TextTableTitle>My Pending Orders</TextTableTitle>

      </Box>
      <Spacer height="20px" />
      <OngoingTrades />
      <Spacer height="40px" />
      <Box sx={{
        padding: "0 30px",
        width: '100%'
      }}>
        <TextTableTitle>Open Market Sell Orders</TextTableTitle>

      </Box>
      <Spacer height="20px" />
      <TradeOffers />
    </AppContainer>
  );
};
