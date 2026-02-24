// =============================================================================
// Tournament Domain Types
// =============================================================================

import { FactionId } from "./game-data";

export type TournamentStatus = "draft" | "active" | "completed";
export type RoundStatus = "pending" | "in_progress" | "completed";
export type TournamentPlayerStatus = "pending" | "accepted" | "rejected";

export interface Tournament {
  id: string;
  name: string;
  description: string;
  date: string; // ISO date
  pointLimit: number;
  numberOfRounds: number;
  maxPlayers: number;
  requiredLists: number;
  adminUserId: string;
  listsRevealed: boolean;
  status: TournamentStatus;
  players: TournamentPlayer[];
  rounds: Round[];
  scoringScheme: ScoringScheme;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentPlayer {
  playerId: string; // references Player.id
  status: TournamentPlayerStatus;
  faction?: FactionId;
  armyListIds: string[]; // references ArmyList.id[]
  armyListId?: string; // legacy — single list reference
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
  player1SP: number; // secondary points
  player2SP: number; // secondary points
  notes?: string;
  // Optional extended fields
  gameMode?: GameMode;
  player1PointsKilled?: number;
  player2PointsKilled?: number;
  player1ListId?: string; // references ArmyList.id
  player2ListId?: string; // references ArmyList.id
}

export interface ScoringScheme {
  winTP: number;     // 3
  drawTP: number;    // 2
  lossTP: number;    // 1
  forfeitTP: number; // 0
  byeTP: number;     // 3 (win)
  byeSP: number;     // 4 (crushing victory)
}

export const DEFAULT_SCORING_SCHEME: ScoringScheme = {
  winTP: 3,
  drawTP: 2,
  lossTP: 1,
  forfeitTP: 0,
  byeTP: 3,
  byeSP: 4,
};

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  faction?: string;
  tournamentPoints: number;
  secondaryPoints: number; // accumulated SP
  pointsDestroyed: number; // accumulated enemy points killed
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

export interface CreateTournamentParams {
  name: string;
  date: string;
  pointLimit: number;
  numberOfRounds: number;
  description?: string;
  maxPlayers?: number;
  requiredLists?: number;
  adminUserId: string;
}

export function createTournament(params: CreateTournamentParams): Tournament {
  return {
    id: crypto.randomUUID(),
    name: params.name,
    description: params.description ?? "",
    date: params.date,
    pointLimit: params.pointLimit,
    numberOfRounds: params.numberOfRounds,
    maxPlayers: params.maxPlayers ?? 32,
    requiredLists: params.requiredLists ?? 1,
    adminUserId: params.adminUserId,
    listsRevealed: false,
    status: "draft",
    players: [],
    rounds: [],
    scoringScheme: { ...DEFAULT_SCORING_SCHEME },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Normalize a tournament loaded from localStorage.
 * Fills in new fields with sensible defaults for backward compatibility.
 */
export function normalizeTournament(raw: Record<string, unknown>): Tournament {
  const t = raw as unknown as Tournament;
  // Normalize scoring scheme — old tournaments may have legacy fields
  const scheme = t.scoringScheme ?? ({} as Record<string, unknown>);
  const normalizedScheme: ScoringScheme = {
    winTP: (scheme as ScoringScheme).winTP ?? DEFAULT_SCORING_SCHEME.winTP,
    drawTP: (scheme as ScoringScheme).drawTP ?? DEFAULT_SCORING_SCHEME.drawTP,
    lossTP: (scheme as ScoringScheme).lossTP ?? DEFAULT_SCORING_SCHEME.lossTP,
    forfeitTP: (scheme as ScoringScheme).forfeitTP ?? DEFAULT_SCORING_SCHEME.forfeitTP,
    byeTP: (scheme as ScoringScheme).byeTP ?? DEFAULT_SCORING_SCHEME.byeTP,
    byeSP: (scheme as ScoringScheme).byeSP ?? DEFAULT_SCORING_SCHEME.byeSP,
  };
  return {
    ...t,
    description: t.description ?? "",
    maxPlayers: t.maxPlayers ?? 32,
    requiredLists: t.requiredLists ?? 1,
    adminUserId: t.adminUserId ?? "",
    listsRevealed: t.listsRevealed ?? false,
    scoringScheme: normalizedScheme,
    players: (t.players ?? []).map((p) => ({
      ...p,
      status: p.status ?? "accepted",
      faction: p.faction,
      armyListIds: p.armyListIds ?? (p.armyListId ? [p.armyListId] : []),
    })),
  };
}
