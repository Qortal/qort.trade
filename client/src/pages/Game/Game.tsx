import { useParams } from "react-router-dom";
import { AppContainer, MainContainer } from "../../App-styles";
import { useContext, useEffect, useMemo } from "react";
import gameContext from "../../contexts/gameContext";
import socketService from "../../services/socketService";
import gameService from "../../services/gameService";
import { QonnectFour } from "../../components/qonnect-four/QonnectFour";
import { LoadingContext } from "../../contexts/loadingContext";
import { NotificationContext } from "../../contexts/notificationContext";

export const GamePage = () => {
  const { userInfo, setInRoom, setGame } = useContext(gameContext);
  const { setLoadingGame } = useContext(LoadingContext);
  const { setNotification } = useContext(NotificationContext);
  const { id } = useParams();

  const userAddress = useMemo(() => {
    return userInfo?.address;
  }, [userInfo]);

  const joinRoom = async (roomId: string, userAddress: string) => {
    try {
      if (!userAddress) return;
      const socket = socketService.socket;
      if (!roomId || roomId.trim() === "" || !socket) return;
      setLoadingGame(true);
      const joined = await gameService
        .joinGameRoom(socket, roomId, userAddress)
        .catch((err) => {
          console.error(err);
          setNotification({
            alertType: "alertError",
            msg: err.toString(),
          });
        });
      if (joined) {
        setInRoom(true);
        if (joined?.game) {
          setGame(joined.game);
        }
      }
    } catch (error: any) {
      console.error(error);
      setNotification({
        alertType: "alertError",
        msg: error.toString(),
      });
    }
  };

  useEffect(() => {
    if (id && userAddress) {
      joinRoom(id, userAddress);
    }
  }, [id, userAddress]);

  return (
    <AppContainer>
      <MainContainer>
        <QonnectFour />
      </MainContainer>
    </AppContainer>
  );
};
