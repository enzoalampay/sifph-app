import {
  Tournament,
  PlayerStanding,
  ScoringScheme,
  MatchResult,
} from "../types/tournament";

export function calculateStandings(tournament: Tournament): PlayerStanding[] {
  const standings = new Map<string, PlayerStanding>();

  // Initialize all players
  for (const tp of tournament.players) {
    standings.set(tp.playerId, {
      playerId: tp.playerId,
      playerName: "", // resolved by the caller
      tournamentPoints: 0,
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
        s1.vpScored += r.player1VP;
        s1.vpAllowed += r.player2VP;
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
          s2.vpScored += r.player2VP;
          s2.vpAllowed += r.player1VP;
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

  // Sort: TP desc -> VP diff desc -> SoS desc -> VP scored desc
  const sorted = [...standings.values()].sort((a, b) => {
    if (b.tournamentPoints !== a.tournamentPoints) return b.tournamentPoints - a.tournamentPoints;
    if (b.vpDiff !== a.vpDiff) return b.vpDiff - a.vpDiff;
    if (b.sos !== a.sos) return b.sos - a.sos;
    return b.vpScored - a.vpScored;
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
  isDraw: boolean,
  vpScored: number,
  vpAllowed: number
): number {
  if (isDraw) return scheme.drawTP;
  if (isWinner) return scheme.winTP;
  // Loser scoring based on VP margin
  const diff = vpAllowed - vpScored;
  if (diff <= 2) return scheme.lossCloseMarginsTP;
  if (diff <= 5) return scheme.lossMediumMarginsTP;
  return scheme.lossBaseTP;
}
