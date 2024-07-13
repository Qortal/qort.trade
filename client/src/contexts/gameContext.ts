import React from "react";

export interface Player {
  isConnected: boolean;
  symbol: "R" | "B";
  socketId: string;
  mongoId: string;
  hasWon?: boolean;
  address?: string;
}

export interface User {
  _id: string;
  qortAddress: string;
}

interface Score {
  player: {
    _id: string;
    qortAddress: string;
  };
  score: number;
  _id: string;
}

export interface Series {
  totalGames: number;
  scores: Score[];
}

export interface UserNameAvatar {
  name: string;
  avatar: string;
  symbol: "R" | "B";
}

export interface Game {
  status: "waiting" | "active" | "finished" | "finished-forfeit";
  players: User[];
  winner: {
    qortAddress: string;
    _id: string;
  };
  playerPayments: {
    player: {
      qortAddress: string;
      _id: string;
    };
    payment: string;
  }[];
  series: Series;
  roomId: string;
  history: {
    state: [[string]]; // 2D array representing the game's final state
    winner: {
      qortAddress: string;
      _id: string;
    }; // Game winner
    startedAt: Date;
    tie: boolean; // Indicates if the game ended in a tie
  }[];
}
export interface IGameContextProps {
  gameWinner: "R" | "B" | "TIE" | null;
  setGameWinner: (val: "R" | "B" | "TIE" | null) => void;
  isInRoom: boolean;
  setInRoom: (inRoom: boolean) => void;
  playerSymbol: "R" | "B";
  setPlayerSymbol: (symbol: "R" | "B") => void;
  isPlayerTurn: boolean;
  setPlayerTurn: (turn: boolean) => void;
  isGameStarted: boolean;
  setGameStarted: (started: boolean) => void;
  setPlayers: (players: Record<string, Player>) => void;
  players: Record<string, Player>;
  game: Game | null;
  setGame: (val: Game | null) => void;
  userInfo: any;
  setUserInfo: (val: any) => void;
  userNameAvatar: Record<string, UserNameAvatar>;
  setUserNameAvatar: (userNameAvatar: Record<string, UserNameAvatar>) => void;
}

const defaultState: IGameContextProps = {
  gameWinner: null,
  setGameWinner: () => {},
  isInRoom: false,
  setInRoom: () => {},
  playerSymbol: "R",
  setPlayerSymbol: () => {},
  isPlayerTurn: false,
  setPlayerTurn: () => {},
  isGameStarted: false,
  setGameStarted: () => {},
  players: {},
  setPlayers: () => {},
  game: null,
  setGame: () => {},
  userInfo: null,
  setUserInfo: () => {},
  userNameAvatar: {},
  setUserNameAvatar: () => {},
};

export default React.createContext(defaultState);
