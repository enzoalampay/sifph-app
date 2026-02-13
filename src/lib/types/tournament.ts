// =============================================================================
// Tournament Domain Types
// =============================================================================

export type TournamentStatus = "draft" | "active" | "completed";
export type RoundStatus = "pending" | "in_progress" | "completed";

export interface Tournament {
  id: string;
  name: string;
  date: string; // ISO date
  pointLimit: number;
  numberOfRounds: number;
  status: TournamentStatus;
  players: TournamentPlayer[];
  rounds: Round[];
  scoringScheme: ScoringScheme;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentPlayer {
  playerId: string; // references Player.id
  armyListId?: string; // references ArmyList.id
  dropped: boolean;
}

export interface Round {
  roundNumber: number;
  pairings: Pairing[];
  status: RoundStatus;
}

export interface Pairing {
  id: string;
  player1Id: string;
  player2Id: string | null; // null = bye
  result?: MatchResult;
}

export type GameMode =
  | "A Game of Thrones"
  | "A Clash of Kings"
  | "A Storm of Swords"
  | "A Feast for Crows"
  | "A Dance with Dragons"
  | "Custom";

export const ALL_GAME_MODES: GameMode[] = [
  "A Game of Thrones",
  "A Clash of Kings",
  "A Storm of Swords",
  "A Feast for Crows",
  "A Dance with Dragons",
  "Custom",
];

export interface MatchResult {
  winnerId: string | null; // null = draw
  player1VP: number;
  player2VP: number;
  player1TP: number;
  player2TP: number;
  notes?: string;
  // Optional extended fields
  gameMode?: GameMode;
  player1PointsKilled?: number;
  player2PointsKilled?: number;
  player1ListId?: string; // references ArmyList.id
  player2ListId?: string; // references ArmyList.id
}

export interface ScoringScheme {
  winTP: number;
  drawTP: number;
  lossBaseTP: number;
  byeTP: number;
  // Loss TP can scale: lossBaseTP + bonus based on VP margin
  lossCloseMarginsTP: number; // if VP diff <= 2
  lossMediumMarginsTP: number; // if VP diff <= 5
}

export const DEFAULT_SCORING_SCHEME: ScoringScheme = {
  winTP: 10,
  drawTP: 5,
  lossBaseTP: 1,
  byeTP: 5,
  lossCloseMarginsTP: 3,
  lossMediumMarginsTP: 2,
};

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  faction?: string;
  tournamentPoints: number;
  vpScored: number;
  vpAllowed: number;
  vpDiff: number;
  wins: number;
  draws: number;
  losses: number;
  sos: number; // strength of schedule
  rank: number;
  opponents: string[];
}

export function createTournament(
  name: string,
  date: string,
  pointLimit: number,
  numberOfRounds: number
): Tournament {
  return {
    id: crypto.randomUUID(),
    name,
    date,
    pointLimit,
    numberOfRounds,
    status: "draft",
    players: [],
    rounds: [],
    scoringScheme: { ...DEFAULT_SCORING_SCHEME },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
