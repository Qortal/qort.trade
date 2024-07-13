import { FC, useContext, useState } from "react";
import ReactGA from "react-ga4";
import { useNavigate } from "react-router-dom";
import {
  CustomLoader,
  DoubleCaretRightIcon,
  DoubleCaretRightIcon2,
  DoubleCaretRightIcon3,
  InfoBox,
  InfoBoxCol,
  InfoBoxError,
  InfoBoxHighlightedText,
  InfoBoxRow,
  InfoBoxText,
  InfoBoxTextInnerCol,
  InfoIcon,
  SliderContainer,
  SliderRow,
  SliderText,
  StyledSlider,
  TimesIcon,
} from "./Slider-styles";
import gameService from "../../services/gameService";
import socketService from "../../services/socketService";
import gameContext from "../../contexts/gameContext";
import SlideUnlockSound from "../../assets/audio/SlideUnlockSound.mp3";
import { NotificationContext } from "../../contexts/notificationContext";
import { verifyBalance } from "../../utils/verifyBalance";
import { LoadingContext } from "../../contexts/loadingContext";

interface CustomSliderProps {
  preventPlaying: boolean;
}

export const CustomSlider: FC<CustomSliderProps> = ({ preventPlaying }) => {
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [displayInfoBox, setDisplayInfoBox] = useState<boolean>(false);
  const [displayInfoError, setDisplayInfoError] = useState<boolean>(false);

  const { userInfo } = useContext(gameContext);
  const navigate = useNavigate();

  const { setNotification } = useContext(NotificationContext);
  const { loadingSlider, setLoadingSlider, setLoadingGame } =
    useContext(LoadingContext);

  const handleSlideChange = async (event: any, value: number | number[]) => {
    if (preventPlaying) {
      setNotification({
        alertType: "alertError",
        msg: "You are banned from playing for 24 hours because you failed to make a payment.",
      });
      setDisplayInfoError(true);
      setDisplayInfoBox(false);
      setSliderValue(0);
      return;
    }
    if (loadingSlider) {
      setSliderValue(0);
      return;
    }
    const audio = new Audio(SlideUnlockSound);
    const newValue = typeof value === "number" ? value : value[0];
    if (sliderValue < 95) {
      setSliderValue(0);
    } else {
      // CHANGE THIS LOGIC IN PROD TO CHECK IF USER IS CONNECTED
      setLoadingSlider(true);
      setSliderValue(newValue as number);
      const userAddress = userInfo?.address;
      console.log({ userAddress });
      if (!userAddress) {
        setNotification({
          alertType: "alertError",
          msg: "Please connect your wallet",
        });
        setDisplayInfoError(true);
        setDisplayInfoBox(false);
        setLoadingSlider(false);
        setTimeout(() => {
          setSliderValue(0);
          return;
        }, 2000);
      }
      // Check if user has enough balance to play
      const hasBalance = await verifyBalance(
        userInfo,
        setNotification,
        setLoadingSlider
      );
      if (!hasBalance) {
        setDisplayInfoError(true);
        setDisplayInfoBox(false);
        ReactGA.event({
          category: "Insufficient Balance Error",
          action: "Slid the slider but without enough balance",
          label: "Slid the slider but without enough balance",
        });
        setTimeout(() => {
          setSliderValue(0);
          return;
        }, 2000);
        return
      }
      const socket = socketService.socket;
      if (!socket) return;
      const game = await gameService
        .generateGame(socket, userAddress)
        .catch((err) => {
          setLoadingSlider(false);
          setNotification({
            alertType: "alertError",
            msg: "Error generating game",
          });
          console.error(err);
        });
      const roomId = game.roomId;
      ReactGA.event({
        category: "Game Room Generated",
        action: "Slid the slider and game room was generated",
        label: "Slid the slider and game room was generated",
      });
      setLoadingSlider(false);
      setLoadingGame(true);
      navigate(`/game/${roomId}`);
      audio.play();
    }
  };

  return (
    <SliderContainer>
      <SliderRow>
        {displayInfoError && (
          <InfoBoxError
            style={{
              height: preventPlaying ? "auto" : "59px",
              top: preventPlaying ? "-90px" : "-80px",
            }}
          >
            {preventPlaying ? (
              <InfoBoxRow>
                <InfoBoxText style={{ fontWeight: 600 }}>
                  You are banned from playing for 24 hours because you failed to
                  make a payment.
                </InfoBoxText>
              </InfoBoxRow>
            ) : (
              <InfoBoxRow>
                <InfoBoxText style={{ fontWeight: 600 }}>
                  Unable to start game. Please check
                </InfoBoxText>
                <InfoBoxHighlightedText
                  onClick={() => {
                    setDisplayInfoError(false);
                    setDisplayInfoBox(true);
                  }}
                >
                  How to play
                </InfoBoxHighlightedText>
              </InfoBoxRow>
            )}
            <TimesIcon
              color={"#ffffff"}
              height="18"
              width="18"
              onClickFunc={() => {
                if (preventPlaying) {
                  setDisplayInfoError(false);
                  return;
                }
                setDisplayInfoError(false);
                setDisplayInfoBox(true);
              }}
            />
          </InfoBoxError>
        )}
        {displayInfoBox && (
          <InfoBox>
            <InfoBoxCol>
              <InfoBoxText style={{ fontWeight: 600 }}>
                How to play:
              </InfoBoxText>
              <InfoBoxTextInnerCol>
                <InfoBoxRow>
                  <InfoBoxText>1. Install the </InfoBoxText>
                  <InfoBoxHighlightedText
                    href="https://bit.ly/qortal-chrome-extension"
                    aria-label="Visit the chrome store to download the Qortal Chrome Extension"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Qortal Extension
                  </InfoBoxHighlightedText>{" "}
                </InfoBoxRow>
                <InfoBoxText>2. Connect within the extension</InfoBoxText>
                <InfoBoxRow>
                  <InfoBoxText>3.</InfoBoxText>
                  <InfoBoxHighlightedText
                    href="https://www.youtube.com/watch?v=TnDrrbpRCDk"
                    aria-label="Watch a Youtube video explaining how to acquire QORT"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Acquire QORT
                  </InfoBoxHighlightedText>
                  <InfoBoxText>in order to play</InfoBoxText>
                </InfoBoxRow>
                <InfoBoxText>4. Play and win QORT!</InfoBoxText>
              </InfoBoxTextInnerCol>
            </InfoBoxCol>
            <TimesIcon
              color={"#ffffff"}
              height="18"
              width="18"
              onClickFunc={() => setDisplayInfoBox(false)}
            />
          </InfoBox>
        )}
        <SliderText>SWIPE TO PLAY</SliderText>
        {loadingSlider ? (
          <CustomLoader size="22px" />
        ) : (
          <InfoIcon
            onClickFunc={() => setDisplayInfoBox(true)}
            color={"#464646"}
            height={"14px"}
            width={"14px"}
          />
        )}
      </SliderRow>
      {/* <SliderDiv> */}
      <StyledSlider
        value={sliderValue}
        onChange={(event, value) =>
          setSliderValue(typeof value === "number" ? value : value[0])
        }
        onChangeCommitted={handleSlideChange}
        aria-labelledby="continuous-slider"
      />
      <DoubleCaretRightIcon height="38px" width="38px" color="none" />
      <DoubleCaretRightIcon2 height="38px" width="38px" color="none" />
      <DoubleCaretRightIcon3 height="38px" width="38px" color="none" />
      {/* </SliderDiv>  */}
    </SliderContainer>
  );
};
