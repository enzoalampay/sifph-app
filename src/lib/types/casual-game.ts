import { FactionId } from "./game-data";
import { GameMode } from "./tournament";

export interface CasualGame {
  id: string;
  loggedByUserId: string; // AuthUser.id

  // Game details
  date: string; // ISO date (YYYY-MM-DD)
  faction: FactionId;
  armyListId?: string; // optional reference to ArmyList.id
  location: string;
  gameMode: GameMode;

  // Opponent
  opponentPlayerId?: string; // references Player.id (if registered)
  opponentName: string; // always populated

  // Scores
  playerScore: number;
  opponentScore: number;
  result: "win" | "loss" | "draw";

  // Optional
  remarks?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export function createCasualGame(
  params: Omit<CasualGame, "id" | "result" | "createdAt" | "updatedAt">
): CasualGame {
  const now = new Date().toISOString();
  let result: CasualGame["result"];
  if (params.playerScore > params.opponentScore) result = "win";
  else if (params.playerScore < params.opponentScore) result = "loss";
  else result = "draw";

  return {
    ...params,
    id: crypto.randomUUID(),
    result,
    createdAt: now,
    updatedAt: now,
  };
}
