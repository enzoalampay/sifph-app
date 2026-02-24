import {
  Tournament,
  PlayerStanding,
  ScoringScheme,
} from "../types/tournament";

export function calculateStandings(tournament: Tournament): PlayerStanding[] {
  const standings = new Map<string, PlayerStanding>();

  // Initialize accepted players only
  for (const tp of tournament.players.filter((p) => p.status === "accepted")) {
    standings.set(tp.playerId, {
      playerId: tp.playerId,
      playerName: "", // resolved by the caller
      tournamentPoints: 0,
      secondaryPoints: 0,
      pointsDestroyed: 0,
      vpScored: 0,
      vpAllowed: 0,
      vpDiff: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      sos: 0,
      rank: 0,
      opponents: [],
    });
  }

  // Accumulate results from all completed rounds
  for (const round of tournament.rounds) {
    for (const pairing of round.pairings) {
      if (!pairing.result) continue;

      const r = pairing.result;

      // Player 1
      const s1 = standings.get(pairing.player1Id);
      if (s1) {
        s1.tournamentPoints += r.player1TP;
        s1.secondaryPoints += r.player1SP ?? 0;
        s1.vpScored += r.player1VP;
        s1.vpAllowed += r.player2VP;
        s1.pointsDestroyed += r.player1PointsKilled ?? 0;
        if (pairing.player2Id) {
          s1.opponents.push(pairing.player2Id);
          if (r.winnerId === pairing.player1Id) s1.wins++;
          else if (r.winnerId === null) s1.draws++;
          else s1.losses++;
        } else {
          // Bye
          s1.wins++; // Bye counts as a win
        }
      }

      // Player 2 (skip if bye)
      if (pairing.player2Id) {
        const s2 = standings.get(pairing.player2Id);
        if (s2) {
          s2.tournamentPoints += r.player2TP;
          s2.secondaryPoints += r.player2SP ?? 0;
          s2.vpScored += r.player2VP;
          s2.vpAllowed += r.player1VP;
          s2.pointsDestroyed += r.player2PointsKilled ?? 0;
          s2.opponents.push(pairing.player1Id);
          if (r.winnerId === pairing.player2Id) s2.wins++;
          else if (r.winnerId === null) s2.draws++;
          else s2.losses++;
        }
      }
    }
  }

  // Calculate VP diff and SoS
  for (const [, standing] of standings) {
    standing.vpDiff = standing.vpScored - standing.vpAllowed;

    // Strength of Schedule = average TP of opponents
    if (standing.opponents.length > 0) {
      const oppTPs = standing.opponents
        .map((oppId) => standings.get(oppId)?.tournamentPoints ?? 0);
      standing.sos = oppTPs.reduce((a, b) => a + b, 0) / oppTPs.length;
    }
  }

  // Sort: TP desc -> SP desc -> Points destroyed desc -> SoS desc
  const sorted = [...standings.values()].sort((a, b) => {
    if (b.tournamentPoints !== a.tournamentPoints) return b.tournamentPoints - a.tournamentPoints;
    if (b.secondaryPoints !== a.secondaryPoints) return b.secondaryPoints - a.secondaryPoints;
    if (b.pointsDestroyed !== a.pointsDestroyed) return b.pointsDestroyed - a.pointsDestroyed;
    return b.sos - a.sos;
  });

  // Assign ranks
  sorted.forEach((s, i) => {
    s.rank = i + 1;
  });

  return sorted;
}

export function calculateTP(
  scheme: ScoringScheme,
  isWinner: boolean,
  isDraw: boolean
): number {
  if (isDraw) return scheme.drawTP;
  if (isWinner) return scheme.winTP;
  return scheme.lossTP;
}

/**
 * Calculate Secondary Points based on VP margin (official Season 4 rules).
 * Crushing Victory (5+ VP diff): Winner 4 SP / Loser 0 SP
 * Standard Victory (3-4 VP diff): Winner 3 SP / Loser 1 SP
 * Narrow Victory (0-2 VP diff): Winner 2 SP / Loser 2 SP
 * Tie: 0 SP each
 */
export function calculateSP(
  isWinner: boolean,
  isDraw: boolean,
  vpScored: number,
  vpAllowed: number
): number {
  if (isDraw) return 0;
  const vpDiff = Math.abs(vpScored - vpAllowed);
  if (isWinner) {
    if (vpDiff >= 5) return 4; // Crushing Victory
    if (vpDiff >= 3) return 3; // Standard Victory
    return 2;                  // Narrow Victory
  }
  // Loser
  if (vpDiff >= 5) return 0; // Crushing loss
  if (vpDiff >= 3) return 1; // Standard loss
  return 2;                  // Narrow loss
}

/**
 * Get the victory type label for display purposes.
 */
export function getVictoryLabel(
  winnerId: string | null,
  player1VP: number,
  player2VP: number
): string {
  if (winnerId === null) return "Tie";
  const vpDiff = Math.abs(player1VP - player2VP);
  if (vpDiff >= 5) return "Crushing Victory";
  if (vpDiff >= 3) return "Standard Victory";
  return "Narrow Victory";
}
