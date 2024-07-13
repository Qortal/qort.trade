import React, { useContext, useState } from "react";
import {
  AppBar,
  Button,
  Toolbar,
  Typography,
  Box,
  TextField,
  InputLabel,
} from "@mui/material";
import { styled } from "@mui/system";
import gameContext from "../../contexts/gameContext";
import gameService from "../../services/gameService";
import socketService from "../../services/socketService";
import { useNavigate } from "react-router-dom";

interface IJoinRoomProps {
  userAddress: "";
}

const JoinRoomContainer = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 2em;
`;

const RoomIdInput = styled("input")`
  height: 30px;
  width: 20em;
  font-size: 17px;
  outline: none;
  border: 1px solid #8e44ad;
  border-radius: 3px;
  padding: 0 10px;
`;

const JoinButton = styled("button")`
  outline: none;
  background-color: #8e44ad;
  color: #fff;
  font-size: 17px;
  border: 2px solid transparent;
  border-radius: 5px;
  padding: 4px 18px;
  transition: all 230ms ease-in-out;
  margin-top: 1em;
  cursor: pointer;

  &:hover {
    background-color: transparent;
    border: 2px solid #8e44ad;
    color: #8e44ad;
  }
`;

export function JoinRoom(props: IJoinRoomProps) {
  const navigate = useNavigate();

  const [roomName, setRoomName] = useState("");
  const [isJoining, setJoining] = useState(false);

  const { setInRoom, isInRoom, setGame } = useContext(gameContext);

  const handleRoomNameChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setRoomName(value);
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!props.userAddress) return;
    const socket = socketService.socket;
    if (!roomName || roomName.trim() === "" || !socket) return;
    setJoining(true);

    const joined = await gameService
      .joinGameRoom(socket, roomName, props.userAddress)
      .catch((err) => {
        alert(err);
      });
    console.log(joined);
    if (joined) {
      setInRoom(true);
      if (joined?.game) {
        setGame(joined.game);
      }
      navigate("/game");
    }
    setJoining(false);
  };

  return (
    <form onSubmit={joinRoom}>
      <JoinRoomContainer>
        <h4>Enter Room ID to Join the Game</h4>
        <RoomIdInput
          placeholder="Room ID"
          value={roomName}
          onChange={handleRoomNameChange}
        />
        <JoinButton type="submit" disabled={isJoining}>
          {isJoining ? "Joining..." : "Join"}
        </JoinButton>
      </JoinRoomContainer>
    </form>
  );
}
