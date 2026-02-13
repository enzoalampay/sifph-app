import {
  Tournament,
  TournamentPlayer,
  Round,
  Pairing,
  MatchResult,
  GameMode,
} from "../types/tournament";
import { calculateStandings, calculateTP } from "./standings";
import { generateSwissPairings, generateRandomPairings } from "./swiss";

export function addPlayer(
  tournament: Tournament,
  playerId: string,
  armyListId?: string
): Tournament {
  if (tournament.players.some((p) => p.playerId === playerId)) {
    return tournament; // Already registered
  }

  const player: TournamentPlayer = {
    playerId,
    armyListId,
    dropped: false,
  };

  return {
    ...tournament,
    players: [...tournament.players, player],
    updatedAt: new Date().toISOString(),
  };
}

export function removePlayer(
  tournament: Tournament,
  playerId: string
): Tournament {
  return {
    ...tournament,
    players: tournament.players.filter((p) => p.playerId !== playerId),
    updatedAt: new Date().toISOString(),
  };
}

export function dropPlayer(
  tournament: Tournament,
  playerId: string
): Tournament {
  return {
    ...tournament,
    players: tournament.players.map((p) =>
      p.playerId === playerId ? { ...p, dropped: true } : p
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function undropPlayer(
  tournament: Tournament,
  playerId: string
): Tournament {
  return {
    ...tournament,
    players: tournament.players.map((p) =>
      p.playerId === playerId ? { ...p, dropped: false } : p
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function setPlayerList(
  tournament: Tournament,
  playerId: string,
  armyListId: string
): Tournament {
  return {
    ...tournament,
    players: tournament.players.map((p) =>
      p.playerId === playerId ? { ...p, armyListId } : p
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function startTournament(tournament: Tournament): Tournament {
  return {
    ...tournament,
    status: "active",
    updatedAt: new Date().toISOString(),
  };
}

export function completeTournament(tournament: Tournament): Tournament {
  return {
    ...tournament,
    status: "completed",
    updatedAt: new Date().toISOString(),
  };
}

export function generatePairingsForRound(
  tournament: Tournament,
  roundNumber: number
): Tournament {
  const standings = calculateStandings(tournament);

  let pairings: Pairing[];
  if (roundNumber === 1 && tournament.rounds.length === 0) {
    pairings = generateRandomPairings(
      tournament.players,
      tournament.scoringScheme.byeTP
    );
  } else {
    pairings = generateSwissPairings(
      tournament.players,
      tournament.rounds,
      standings,
      tournament.scoringScheme.byeTP
    );
  }

  const newRound: Round = {
    roundNumber,
    pairings,
    status: "in_progress",
  };

  // Replace round if it already exists, otherwise add
  const existingIdx = tournament.rounds.findIndex(
    (r) => r.roundNumber === roundNumber
  );
  let rounds: Round[];
  if (existingIdx >= 0) {
    rounds = [...tournament.rounds];
    rounds[existingIdx] = newRound;
  } else {
    rounds = [...tournament.rounds, newRound];
  }

  return {
    ...tournament,
    rounds,
    updatedAt: new Date().toISOString(),
  };
}

export interface RecordMatchExtras {
  notes?: string;
  gameMode?: GameMode;
  player1PointsKilled?: number;
  player2PointsKilled?: number;
  player1ListId?: string;
  player2ListId?: string;
}

export function recordMatchResult(
  tournament: Tournament,
  roundNumber: number,
  pairingId: string,
  winnerId: string | null,
  player1VP: number,
  player2VP: number,
  extras?: RecordMatchExtras
): Tournament {
  const scheme = tournament.scoringScheme;

  const isDraw = winnerId === null;

  const rounds = tournament.rounds.map((round) => {
    if (round.roundNumber !== roundNumber) return round;

    const pairings = round.pairings.map((pairing) => {
      if (pairing.id !== pairingId) return pairing;

      const isP1Winner = winnerId === pairing.player1Id;
      const isP2Winner = winnerId === pairing.player2Id;

      const result: MatchResult = {
        winnerId,
        player1VP,
        player2VP,
        player1TP: calculateTP(scheme, isP1Winner, isDraw, player1VP, player2VP),
        player2TP: pairing.player2Id
          ? calculateTP(scheme, isP2Winner, isDraw, player2VP, player1VP)
          : 0,
        notes: extras?.notes,
        gameMode: extras?.gameMode,
        player1PointsKilled: extras?.player1PointsKilled,
        player2PointsKilled: extras?.player2PointsKilled,
        player1ListId: extras?.player1ListId,
        player2ListId: extras?.player2ListId,
      };

      return { ...pairing, result };
    });

    // Check if all pairings have results
    const allComplete = pairings.every((p) => p.result);

    return {
      ...round,
      pairings,
      status: allComplete ? ("completed" as const) : ("in_progress" as const),
    };
  });

  return {
    ...tournament,
    rounds,
    updatedAt: new Date().toISOString(),
  };
}

export function getCurrentRound(tournament: Tournament): Round | null {
  const activeRound = tournament.rounds.find((r) => r.status === "in_progress");
  if (activeRound) return activeRound;

  // Return the latest round
  if (tournament.rounds.length === 0) return null;
  return tournament.rounds[tournament.rounds.length - 1];
}

export function getNextRoundNumber(tournament: Tournament): number {
  if (tournament.rounds.length === 0) return 1;
  return Math.max(...tournament.rounds.map((r) => r.roundNumber)) + 1;
}

export function canGenerateNextRound(tournament: Tournament): boolean {
  if (tournament.status !== "active") return false;
  const nextRound = getNextRoundNumber(tournament);
  if (nextRound > tournament.numberOfRounds) return false;

  // All previous rounds must be completed
  const lastRound = tournament.rounds[tournament.rounds.length - 1];
  if (lastRound && lastRound.status !== "completed") return false;

  return true;
}
