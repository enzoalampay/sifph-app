// =============================================================================
// Player Domain Types
// =============================================================================

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerMatchRecord {
  tournamentId: string;
  tournamentName: string;
  roundNumber: number;
  opponentId: string;
  opponentName: string;
  result: "win" | "loss" | "draw" | "bye";
  vpScored: number;
  vpAllowed: number;
  tpEarned: number;
  faction: string;
  date: string;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  tournamentsPlayed: number;
  favoriteFaction: string | null;
  factionBreakdown: Record<string, { games: number; wins: number }>;
}

export function createPlayer(name: string, nickname?: string): Player {
  return {
    id: crypto.randomUUID(),
    name,
    nickname,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
