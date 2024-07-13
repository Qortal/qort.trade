import { UserNameAvatar } from "../contexts/gameContext";

export const getPlayerInfoBySymbol = (
  userNameAvatar: Record<string, UserNameAvatar>,
  userInfoAddress: string,
  symbol: string
): {
  name: string;
  avatar: string;
  ownUser: boolean;
  symbol: string;
  address?: string;
} | undefined => {
  if (userNameAvatar && Object.keys(userNameAvatar).length > 0) {
    const playerEntry = Object.entries(userNameAvatar).find(
      ([, player]) => player.symbol === symbol
    );

    if (!playerEntry) {
      if (symbol === "R") return { name: "Player Red", avatar: "", ownUser: false, symbol: "R"};
      if (symbol === "B") return { name: "Player Blue", avatar: "", ownUser: false, symbol: "B"};
    }

    const [playerAddress, playerInfo] = playerEntry ?? [];

    return {
      name: playerInfo?.name || "Unknown Player",
      avatar: playerInfo?.avatar || "",
      ownUser: playerAddress === userInfoAddress,
      symbol: symbol,
      address: playerAddress,
    };
  }
};
