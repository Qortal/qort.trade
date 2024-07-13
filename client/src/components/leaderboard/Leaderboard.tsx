import { FC } from "react";
import {
  CloseLeaderboardButton,
  LeaderboardColumn,
  LeaderboardContainer,
  LeaderboardRow,
  LeaderboardText,
} from "./Leaderboard-styles";
import {
  LoadingStar,
  LoadingStarsContainer,
} from "../qonnect-four/QonnectFour-Styles";
import { StarSVG } from "../common/icons/StarSVG";

export interface LeaderboardData {
  numberOfWins: number;
  winnerQortAddress: string;
  winnerName?: string;
  winnerId: string;
}

interface LeaderboardProps {
  leaderboardData: LeaderboardData[] | null;
  leaderboardLoading: boolean;
  setOpenLeaderboard: (open: boolean) => void;
}

export const Leaderboard: FC<LeaderboardProps> = ({
  leaderboardData,
  leaderboardLoading,
  setOpenLeaderboard,
}) => {
  if (leaderboardLoading) {
    return (
      <LeaderboardContainer>
        <LoadingStarsContainer>
          {[...Array(4)].map((_, i) => (
            <LoadingStar
              onMouseEnter={() => {
                return;
              }}
              onMouseLeave={() => {
                return;
              }}
              player={"B"}
              isWinningCell={true}
              winner={"true"}
              onClick={() => {
                return;
              }}
              delay={i * 0.5}
              key={i}
            >
              <StarSVG color="#fff" height={"34"} width={"36"} />
            </LoadingStar>
          ))}
        </LoadingStarsContainer>
      </LeaderboardContainer>
    );
  } else {
    return (
      <LeaderboardContainer>
        <CloseLeaderboardButton
          color="#fff"
          height="28px"
          width="28px"
          onClickFunc={() => setOpenLeaderboard(false)}
        />
        <LeaderboardColumn>
          {leaderboardData &&
            leaderboardData
              .sort(
                (a: LeaderboardData, b: LeaderboardData) =>
                  b.numberOfWins - a.numberOfWins
              )
              .map((item: LeaderboardData, index: number) => {
                return (
                  <LeaderboardRow key={index}>
                    <LeaderboardText>{`${index + 1}. ${
                      item?.winnerName ?? item?.winnerQortAddress
                    }`}</LeaderboardText>
                    <LeaderboardText>{item?.numberOfWins}</LeaderboardText>
                  </LeaderboardRow>
                );
              })}
        </LeaderboardColumn>
      </LeaderboardContainer>
    );
  }
};
