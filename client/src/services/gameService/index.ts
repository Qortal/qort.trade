import { Socket } from "socket.io-client";
import { Player } from "../../contexts/gameContext";
import { Board } from "../../components/qonnect-four/QonnectFour";

export interface IStartGame {
  start: boolean;
  symbol: "R" | "B";
}

class GameService {
  public async joinGameRoom(
    socket: Socket,
    roomId: string,
    userAddress: string
  ): Promise<any> {
    return new Promise((rs, rj) => {
      socket.emit("join_game", { roomId, userAddress });
      socket.on("room_joined", (message) => {
        rs(message);
      });
      socket.on("room_join_error", ({ error }) => rj(error));
    });
  }
  public async generateGame(socket: Socket, userAddress: string): Promise<any> {
    return new Promise((rs, rj) => {
      socket.emit("generate_game", { userAddress });
      socket.on("on_generate_game_response", (message) => {
        rs(message);
      });
      socket.on("room_join_error", ({ error }) => rj(error));
    });
  }

  public async getListOfBannedAddresses(socket: Socket): Promise<any> {
    return new Promise((rs, rj) => {
      socket.emit("get_list_banned_addresses");
      socket.on("on_list_banned_addresses", (message) => {
        rs(message);
      });
    });
  }

  public async updateGame(
    socket: Socket,
    gameMatrix: {
      column: number;
      row: number;
      symbol: "R" | "B";
    }
  ) {
    socket.emit("update_game", { matrix: gameMatrix });
  }

  public async leaveRoom(
    socket: Socket,
    roomId: string
  ) {
    socket.emit("leave_room", { roomId });
  }

  public async paymentMade(socket: Socket, payment: any) {
    socket.emit("payment_made", payment);
  }

  public async onGameUpdate(
    socket: Socket,
    listiner: (props: {
      matrix: Board;
      currColumns: number[];
      timeRed: number;
      timeBlue: number;
    }) => void
  ) {
    socket.on("on_game_update", (props) => listiner(props));
  }

  public async onTurnUpdate(
    socket: Socket,
    listiner: (isTurn: boolean) => void
  ) {
    socket.on("on_turn_update", (isTurn) => listiner(isTurn));
  }

  public async onSetFullGameData(
    socket: Socket,
    listiner: (gameData: any) => void
  ) {
    socket.on("on_set_full_game_data", (message) => listiner(message));
  }
  public async onPaymentNotMade(
    socket: Socket,
    listiner: (gameData: any) => void
  ) {
    socket.on("payment_not_made", (message) => listiner(message));
  }
  

  public async onStartGame(
    socket: Socket,
    listiner: (options: IStartGame) => void
  ) {
    socket.on("start_game", listiner);
  }

  public async onGameWin(socket: Socket, listiner: (message: any) => void) {
    socket.on("on_game_win", (message) => listiner(message));
  }
  public async onGameTie(socket: Socket, listiner: (message: any) => void) {
    socket.on("on_game_tie", (message) => listiner(message));
  }

  public async onResumeGame(
    socket: Socket,
    listiner: (data: {
      matrix: any[][];
      symbol: "R" | "B";
      timeRed: number;
      timeBlue: number;
      players: Record<string, Player>;
    }) => void
  ) {
    socket.on("on_resume_game", (data) => listiner(data));
  }

  public async onPlayersInfo(
    socket: Socket,
    listiner: (data: Record<string, Player>) => void
  ) {
    socket.on("on_players_info", (data) => {
      listiner(data);
    });
  }
}

export default new GameService();
