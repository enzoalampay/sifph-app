"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { Player } from "@/lib/types/player";
import { Tournament } from "@/lib/types/tournament";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

interface MatchRecord {
  date: string;
  tournamentName: string;
  tournamentId: string;
  roundNumber: number;
  opponentId: string | null;
  opponentName: string;
  result: "win" | "loss" | "draw" | "bye";
  vpScored: number;
  vpAllowed: number;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const { items: players, loaded: playersLoaded } = useEntityStorage<Player>(STORAGE_KEYS.PLAYERS);
  const { items: tournaments, loaded: tournamentsLoaded } = useEntityStorage<Tournament>(STORAGE_KEYS.TOURNAMENTS);

  const player = useMemo(
    () => players.find((p) => p.id === playerId) ?? null,
    [players, playerId]
  );

  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) {
      map.set(p.id, p.name);
    }
    return map;
  }, [players]);

  const matchHistory = useMemo<MatchRecord[]>(() => {
    if (!playerId || tournaments.length === 0) return [];

    const records: MatchRecord[] = [];

    for (const tournament of tournaments) {
      // Check if this player is in the tournament
      const isRegistered = tournament.players.some((tp) => tp.playerId === playerId);
      if (!isRegistered) continue;

      for (const round of tournament.rounds) {
        for (const pairing of round.pairings) {
          if (!pairing.result) continue;

          const isP1 = pairing.player1Id === playerId;
          const isP2 = pairing.player2Id === playerId;
          if (!isP1 && !isP2) continue;

          const opponentId = isP1 ? pairing.player2Id : pairing.player1Id;
          const vpScored = isP1 ? pairing.result.player1VP : pairing.result.player2VP;
          const vpAllowed = isP1 ? pairing.result.player2VP : pairing.result.player1VP;

          let result: MatchRecord["result"];
          if (opponentId === null) {
            result = "bye";
          } else if (pairing.result.winnerId === null) {
            result = "draw";
          } else if (pairing.result.winnerId === playerId) {
            result = "win";
          } else {
            result = "loss";
          }

          records.push({
            date: tournament.date,
            tournamentName: tournament.name,
            tournamentId: tournament.id,
            roundNumber: round.roundNumber,
            opponentId,
            opponentName: opponentId ? (playerNameMap.get(opponentId) ?? "Unknown") : "BYE",
            result,
            vpScored,
            vpAllowed,
          });
        }
      }
    }

    // Sort by date descending, then round descending
    records.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.roundNumber - a.roundNumber;
    });

    return records;
  }, [playerId, tournaments, playerNameMap]);

  const stats = useMemo(() => {
    const wins = matchHistory.filter((m) => m.result === "win" || m.result === "bye").length;
    const losses = matchHistory.filter((m) => m.result === "loss").length;
    const draws = matchHistory.filter((m) => m.result === "draw").length;
    const totalGames = matchHistory.length;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    return { totalGames, wins, losses, draws, winRate };
  }, [matchHistory]);

  if (!playersLoaded || !tournamentsLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-400 text-sm">Loading player data...</div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-stone-900 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/players"
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-500 transition-colors mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Players
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-stone-200">Player Not Found</h2>
          <p className="mt-2 text-sm text-stone-500">
            This player may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  const resultBadge = (result: MatchRecord["result"]) => {
    switch (result) {
      case "win":
        return <Badge variant="success">W</Badge>;
      case "loss":
        return <Badge variant="error">L</Badge>;
      case "draw":
        return <Badge variant="warning">D</Badge>;
      case "bye":
        return <Badge variant="info">BYE</Badge>;
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-stone-900 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/players"
        className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-500 transition-colors mb-4"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to Players
      </Link>

      <PageHeader
        title={player.name}
        description={player.nickname ? `"${player.nickname}"` : undefined}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Total Games
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-100">{stats.totalGames}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Wins</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{stats.wins}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Losses</p>
            <p className="mt-1 text-2xl font-bold text-red-400">{stats.losses}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Win Rate</p>
            <p className="mt-1 text-2xl font-bold text-amber-500">{stats.winRate}%</p>
          </div>
        </Card>
      </div>

      {/* Match History */}
      <h2 className="text-lg font-semibold text-stone-100 mb-4">Match History</h2>
      {matchHistory.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-stone-500 py-6">
            No matches played yet. Join a tournament to start building match history.
          </p>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-700 text-stone-400">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Tournament</th>
                  <th className="px-4 py-3 text-center font-medium">Round</th>
                  <th className="px-4 py-3 text-left font-medium">Opponent</th>
                  <th className="px-4 py-3 text-center font-medium">Result</th>
                  <th className="px-4 py-3 text-center font-medium">VP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {matchHistory.map((match, idx) => (
                  <tr key={idx} className="hover:bg-stone-800/50 transition-colors">
                    <td className="px-4 py-3 text-stone-300 whitespace-nowrap">
                      {new Date(match.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tournaments/${match.tournamentId}`}
                        className="text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        {match.tournamentName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-stone-300">
                      {match.roundNumber}
                    </td>
                    <td className="px-4 py-3 text-stone-200">
                      {match.opponentId ? (
                        <Link
                          href={`/players/${match.opponentId}`}
                          className="hover:text-amber-500 transition-colors"
                        >
                          {match.opponentName}
                        </Link>
                      ) : (
                        <span className="text-stone-500">BYE</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {resultBadge(match.result)}
                    </td>
                    <td className="px-4 py-3 text-center text-stone-300 whitespace-nowrap">
                      {match.vpScored} - {match.vpAllowed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
    </ProtectedRoute>
  );
}
