import { useState, useEffect, useRef, useContext } from "react";
import ReactGA from "react-ga4";
import {
  AvatarCircle,
  CaretDownIcon,
  DropdownContainer,
  GameSelectDropdown,
  GameSelectDropdownMenu,
  GameSelectDropdownMenuItem,
  HeaderNav,
  HeaderText,
  HomeIcon,
  LogoColumn,
  NameRow,
  QortalLogoIcon,
  RightColumn,
  Username,
} from "./Header-styles";
import gameContext from "../../contexts/gameContext";
import { findUsableApi } from "../../utils/findUsableApi";
import { UserContext } from "../../contexts/userContext";
import { cropAddress } from "../../utils/cropAddress";
import { BubbleCardColored1 } from "../../pages/Home/Home-Styles";
import logoSVG from '../../assets/SVG/LOGO.svg'

export const Header = ({qortBalance, ltcBalance}: any) => {
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const { userInfo } = useContext(gameContext);
  const { avatar, setAvatar } = useContext(UserContext);

  const getAvatar = async () => {
    const validApi: string = await findUsableApi();
    type Base64String = string;
    try {
      const avatarUrl: string = `${validApi}/arbitrary/THUMBNAIL/${userInfo?.name}/qortal_avatar?encoding=base64&rebuild=false`;

      const avatarResponse = await fetch(avatarUrl);
      const avatar: string | Base64String = await avatarResponse.text();

      setAvatar(avatar);
    } catch (error) {
      console.error(error);
      setAvatar("No Avatar");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Fetch avatar on userInfo change
  useEffect(() => {
    if (userInfo?.name) {
      getAvatar();
    }
  }, [userInfo]);


  return (
    <HeaderNav>
      <LogoColumn>
    <img src={logoSVG} />
      </LogoColumn>
      <RightColumn>
        <HeaderText>Balance: {qortBalance} QORT | {ltcBalance === null ? 'N/A': ltcBalance} LTC</HeaderText>
      <NameRow>
        {userInfo?.name ? (
          <Username>{userInfo?.name}</Username>
        ) : userInfo?.address ? (
          <Username>{cropAddress(userInfo?.address)}</Username>
        ) : null}
     
        {avatar ? (
          <AvatarCircle
            src={`data:image/jpeg;base64,${avatar}`}
            alt={`${userInfo?.name}'s Avatar`}
          />
        ) : !avatar && userInfo?.address ? (
          <BubbleCardColored1 style={{ height: "35px", width: "35px" }} />
        ) : (
          <QortalLogoIcon height="35" width="35" color="none" onClickFunc={() => {
            window.open("https://www.qortal.dev", "_blank")?.focus();
            }
          } />
        )}
      </NameRow>
      </RightColumn>
    </HeaderNav>
  );
};
