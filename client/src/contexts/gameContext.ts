import React from "react";
import { NULL } from "sass";


export interface User {
  _id: string;
  qortAddress: string;
}


export interface UserNameAvatar {
  name: string;
  avatar: string;
}

export interface IContextProps {
  ltcBalance: number | null;
  qortBalance: number | null;
  userInfo: any;
  setUserInfo: (val: any) => void;
  userNameAvatar: Record<string, UserNameAvatar>;
  setUserNameAvatar: (userNameAvatar: Record<string, UserNameAvatar>) => void;
  setOngoingTrades: (val: any) => void;
  onGoingTrades: any[];
  fetchOngoingTransactions: ()=> void
}

const defaultState: IContextProps = {
  qortBalance: null,
  ltcBalance: null,
  userInfo: null,
  setUserInfo: () => {},
  userNameAvatar: {},
  setUserNameAvatar: () => {},
  onGoingTrades: [],
  setOngoingTrades: ()=> {},
  fetchOngoingTransactions: ()=> {}
};

export default React.createContext(defaultState);
