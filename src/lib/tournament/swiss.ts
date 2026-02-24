import { Round, Pairing, TournamentPlayer, PlayerStanding, ScoringScheme, DEFAULT_SCORING_SCHEME } from "../types/tournament";
import { generateId } from "../utils/id";

export function generateSwissPairings(
  players: TournamentPlayer[],
  rounds: Round[],
  standings: PlayerStanding[],
  scheme: ScoringScheme = DEFAULT_SCORING_SCHEME
): Pairing[] {
  const activePlayers = players.filter((p) => !p.dropped && p.status === "accepted");
  const standingMap = new Map(standings.map((s) => [s.playerId, s]));

  // Sort by standing (best first): TP -> SP -> Points destroyed -> SoS
  const sorted = [...activePlayers].sort((a, b) => {
    const sa = standingMap.get(a.playerId);
    const sb = standingMap.get(b.playerId);
    if (!sa || !sb) return 0;
    if (sb.tournamentPoints !== sa.tournamentPoints) return sb.tournamentPoints - sa.tournamentPoints;
    if (sb.secondaryPoints !== sa.secondaryPoints) return sb.secondaryPoints - sa.secondaryPoints;
    if (sb.pointsDestroyed !== sa.pointsDestroyed) return sb.pointsDestroyed - sa.pointsDestroyed;
    return sb.sos - sa.sos;
  });

  // Build previous opponents map
  const previousOpponents = new Map<string, Set<string>>();
  for (const round of rounds) {
    for (const pairing of round.pairings) {
      if (!pairing.player2Id) continue;

      if (!previousOpponents.has(pairing.player1Id)) {
        previousOpponents.set(pairing.player1Id, new Set());
      }
      previousOpponents.get(pairing.player1Id)!.add(pairing.player2Id);

      if (!previousOpponents.has(pairing.player2Id)) {
        previousOpponents.set(pairing.player2Id, new Set());
      }
      previousOpponents.get(pairing.player2Id)!.add(pairing.player1Id);
    }
  }

  // Handle bye (odd number of players)
  let byePlayer: TournamentPlayer | null = null;
  if (sorted.length % 2 !== 0) {
    const previousByes = new Set<string>();
    for (const round of rounds) {
      for (const pairing of round.pairings) {
        if (!pairing.player2Id) previousByes.add(pairing.player1Id);
      }
    }

    // Give bye to lowest-ranked player who hasn't had one
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (!previousByes.has(sorted[i].playerId)) {
        byePlayer = sorted.splice(i, 1)[0];
        break;
      }
    }
    // Fallback: if everyone has had a bye
    if (!byePlayer && sorted.length > 0) {
      byePlayer = sorted.pop()!;
    }
  }

  // Recursive pairing with backtracking
  const pairings = pairRecursive(sorted, previousOpponents, []);

  // Add bye (Win + Crushing Victory)
  if (byePlayer) {
    pairings.push({
      id: generateId(),
      player1Id: byePlayer.playerId,
      player2Id: null,
      result: {
        winnerId: byePlayer.playerId,
        player1VP: 0,
        player2VP: 0,
        player1TP: scheme.byeTP,
        player2TP: 0,
        player1SP: scheme.byeSP,
        player2SP: 0,
      },
    });
  }

  return pairings;
}

function pairRecursive(
  remaining: TournamentPlayer[],
  previousOpponents: Map<string, Set<string>>,
  currentPairings: Pairing[]
): Pairing[] {
  if (remaining.length === 0) return currentPairings;
  if (remaining.length === 1) return currentPairings; // shouldn't happen

  const player = remaining[0];
  const rest = remaining.slice(1);

  // Try each remaining player, preferring no-rematch
  for (let i = 0; i < rest.length; i++) {
    const opponent = rest[i];
    const prevOpp = previousOpponents.get(player.playerId) ?? new Set();

    if (prevOpp.has(opponent.playerId)) continue;

    const newRemaining = rest.filter((_, idx) => idx !== i);
    const newPairings: Pairing[] = [
      ...currentPairings,
      {
        id: generateId(),
        player1Id: player.playerId,
        player2Id: opponent.playerId,
      },
    ];

    const result = pairRecursive(newRemaining, previousOpponents, newPairings);
    if (result.length > 0 || newRemaining.length === 0) return result;
  }

  // Fallback: allow rematches
  for (let i = 0; i < rest.length; i++) {
    const opponent = rest[i];
    const newRemaining = rest.filter((_, idx) => idx !== i);
    const newPairings: Pairing[] = [
      ...currentPairings,
      {
        id: generateId(),
        player1Id: player.playerId,
        player2Id: opponent.playerId,
      },
    ];

    const result = pairRecursive(newRemaining, previousOpponents, newPairings);
    if (result.length > 0 || newRemaining.length === 0) return result;
  }

  return [];
}

// First round: random pairings
export function generateRandomPairings(
  players: TournamentPlayer[],
  scheme: ScoringScheme = DEFAULT_SCORING_SCHEME
): Pairing[] {
  const activePlayers = players.filter((p) => !p.dropped && p.status === "accepted");
  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);

  let byePlayer: TournamentPlayer | null = null;
  if (shuffled.length % 2 !== 0) {
    byePlayer = shuffled.pop()!;
  }

  const pairings: Pairing[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    pairings.push({
      id: generateId(),
      player1Id: shuffled[i].playerId,
      player2Id: shuffled[i + 1].playerId,
    });
  }

  if (byePlayer) {
    pairings.push({
      id: generateId(),
      player1Id: byePlayer.playerId,
      player2Id: null,
      result: {
        winnerId: byePlayer.playerId,
        player1VP: 0,
        player2VP: 0,
        player1TP: scheme.byeTP,
        player2TP: 0,
        player1SP: scheme.byeSP,
        player2SP: 0,
      },
    });
  }

  return pairings;
}
