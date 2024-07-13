import { Game, Player } from "../contexts/gameContext";

interface GameSummary {
  redWins: number;
  blueWins: number;
}

export const getPlayerWinCount = (game: Game, players: Record<string, Player>): GameSummary | undefined => {
  if (game && Object.keys(players).length > 1 && game.series.scores.length > 1) {
    let redWins = 0;
    let blueWins = 0;

    game.series.scores.forEach((scoreEntry) => {
      const playerAddress: string = scoreEntry.player.qortAddress;
      const player: Player = players[playerAddress];

      if (player.symbol === "R") {
        redWins += scoreEntry.score;
      } else if (player.symbol === "B") {
        blueWins += scoreEntry.score;
      }
    });
  
    return {
      redWins,
      blueWins,
    };
  }

  return undefined;
};