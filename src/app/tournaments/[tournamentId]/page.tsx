"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { Player } from "@/lib/types/player";
import { FactionId, ALL_FACTION_IDS } from "@/lib/types/game-data";
import {
  Tournament,
  PlayerStanding,
  GameMode,
  ALL_GAME_MODES,
  normalizeTournament,
  TournamentPlayer,
} from "@/lib/types/tournament";
import { ArmyList } from "@/lib/types/army-list";
import { FACTIONS, getFactionInfo } from "@/lib/data/factions";
import { Select } from "@/components/ui/Select";
import { calculateStandings, getVictoryLabel } from "@/lib/tournament/standings";
import * as tm from "@/lib/tournament/manager";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ArmyListPreview } from "@/components/tournament/ArmyListPreview";

type TabView = "standings" | "rounds" | "players" | "lists";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Tournament["status"] }) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "draft":
      return <Badge variant="warning">Draft</Badge>;
    case "completed":
      return <Badge variant="default">Completed</Badge>;
  }
}

function PlayerStatusBadge({ status }: { status: TournamentPlayer["status"] }) {
  switch (status) {
    case "accepted":
      return <Badge variant="success" size="sm">Accepted</Badge>;
    case "pending":
      return <Badge variant="warning" size="sm">Pending</Badge>;
    case "rejected":
      return <Badge variant="error" size="sm">Rejected</Badge>;
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-amber-400 font-bold">1st</span>;
  if (rank === 2) return <span className="text-stone-300 font-bold">2nd</span>;
  if (rank === 3) return <span className="text-amber-700 font-bold">3rd</span>;
  return <span className="text-stone-400">{rank}</span>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const tournamentId = params.tournamentId as string;

  const {
    items: tournaments,
    save: saveTournament,
    loaded: tournamentsLoaded,
  } = useEntityStorage<Tournament>(STORAGE_KEYS.TOURNAMENTS);
  const { items: players, loaded: playersLoaded } = useEntityStorage<Player>(STORAGE_KEYS.PLAYERS);
  const { items: armyLists, loaded: armyListsLoaded } = useEntityStorage<ArmyList>(
    STORAGE_KEYS.ARMY_LISTS
  );

  const tournament = useMemo(() => {
    const raw = tournaments.find((t) => t.id === tournamentId);
    if (!raw) return null;
    return normalizeTournament(raw as unknown as Record<string, unknown>);
  }, [tournaments, tournamentId]);

  const isAdmin = useMemo(
    () => !!(user && tournament && tournament.adminUserId === user.id),
    [user, tournament]
  );

  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) map.set(p.id, p.name);
    return map;
  }, [players]);

  const armyListMap = useMemo(() => {
    const map = new Map<string, ArmyList>();
    for (const al of armyLists) map.set(al.id, al);
    return map;
  }, [armyLists]);

  // ---- Categorized players ----
  const pendingPlayers = useMemo(
    () => (tournament?.players.filter((p) => p.status === "pending") ?? []),
    [tournament]
  );
  const acceptedPlayers = useMemo(
    () => (tournament?.players.filter((p) => p.status === "accepted") ?? []),
    [tournament]
  );
  const rejectedPlayers = useMemo(
    () => (tournament?.players.filter((p) => p.status === "rejected") ?? []),
    [tournament]
  );

  // ---- View state ----
  const [activeTab, setActiveTab] = useState<TabView>("standings");
  const [selectedRound, setSelectedRound] = useState<number>(1);

  // ---- Modals ----
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultPairingId, setResultPairingId] = useState<string | null>(null);
  const [resultRound, setResultRound] = useState<number>(1);
  const [resultWinner, setResultWinner] = useState<string | null | "draw">(null);
  const [resultP1VP, setResultP1VP] = useState("");
  const [resultP2VP, setResultP2VP] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [resultGameMode, setResultGameMode] = useState("");
  const [resultP1Killed, setResultP1Killed] = useState("");
  const [resultP2Killed, setResultP2Killed] = useState("");
  const [resultP1ListId, setResultP1ListId] = useState("");
  const [resultP2ListId, setResultP2ListId] = useState("");

  // Faction + list assignment modal
  const [factionModalPlayer, setFactionModalPlayer] = useState<string | null>(null);
  const [listModalPlayer, setListModalPlayer] = useState<string | null>(null);

  // Army list preview modal
  const [previewListData, setPreviewListData] = useState<ArmyList | null>(null);

  // Sync selectedRound when rounds change
  useEffect(() => {
    if (tournament && tournament.rounds.length > 0) {
      const maxRound = Math.max(...tournament.rounds.map((r) => r.roundNumber));
      setSelectedRound(maxRound);
    }
  }, [tournament?.rounds.length]);

  // ---- Computed ----
  const standings = useMemo<PlayerStanding[]>(() => {
    if (!tournament) return [];
    const raw = calculateStandings(tournament);
    return raw.map((s) => ({
      ...s,
      playerName: playerNameMap.get(s.playerId) ?? "Unknown",
    }));
  }, [tournament, playerNameMap]);

  const currentRound = useMemo(
    () => tournament?.rounds.find((r) => r.roundNumber === selectedRound) ?? null,
    [tournament, selectedRound]
  );

  const unregisteredPlayers = useMemo(() => {
    if (!tournament) return [];
    const registeredIds = new Set(tournament.players.map((tp) => tp.playerId));
    return players.filter((p) => !registeredIds.has(p.id));
  }, [tournament, players]);

  // Lists for a player being assigned
  const listModalPlayerData = useMemo(() => {
    if (!tournament || !listModalPlayer) return null;
    return tournament.players.find((p) => p.playerId === listModalPlayer) ?? null;
  }, [tournament, listModalPlayer]);

  const availableListsForPlayer = useMemo(() => {
    if (!listModalPlayerData) return [];
    const faction = listModalPlayerData.faction;
    if (!faction) return armyLists;
    return armyLists.filter((al) => al.faction === faction);
  }, [listModalPlayerData, armyLists]);

  // ---- Helpers to save tournament ----
  const updateTournament = useCallback(
    (updated: Tournament) => {
      saveTournament(updated);
    },
    [saveTournament]
  );

  // ---- Actions ----
  const handleStartTournament = useCallback(() => {
    if (!tournament) return;
    const accepted = tournament.players.filter((p) => p.status === "accepted");
    if (accepted.length < 2) return;
    const updated = tm.startTournament(tournament);
    updateTournament(updated);
  }, [tournament, updateTournament]);

  const handleCompleteTournament = useCallback(() => {
    if (!tournament) return;
    const updated = tm.completeTournament(tournament);
    updateTournament(updated);
  }, [tournament, updateTournament]);

  const handleGenerateRound = useCallback(() => {
    if (!tournament) return;
    const nextRound = tm.getNextRoundNumber(tournament);
    const updated = tm.generatePairingsForRound(tournament, nextRound);
    updateTournament(updated);
    setSelectedRound(nextRound);
    setActiveTab("rounds");
  }, [tournament, updateTournament]);

  const handleAddPlayer = useCallback(
    (playerId: string) => {
      if (!tournament) return;
      // Admin adds directly as accepted
      const updated = tm.addPlayer(tournament, playerId, "accepted");
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  const handleAcceptPlayer = useCallback(
    (playerId: string) => {
      if (!tournament) return;
      const updated = tm.acceptPlayer(tournament, playerId);
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  const handleRejectPlayer = useCallback(
    (playerId: string) => {
      if (!tournament) return;
      const updated = tm.rejectPlayer(tournament, playerId);
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  const handleRemovePlayer = useCallback(
    (playerId: string) => {
      if (!tournament) return;
      const updated = tm.removePlayer(tournament, playerId);
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  const handleDropPlayer = useCallback(
    (playerId: string) => {
      if (!tournament) return;
      const updated = tm.dropPlayer(tournament, playerId);
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  const handleToggleListsRevealed = useCallback(() => {
    if (!tournament) return;
    const updated = tm.toggleListsRevealed(tournament);
    updateTournament(updated);
  }, [tournament, updateTournament]);

  const handleLockLists = useCallback(() => {
    if (!tournament) return;
    const updated = tm.lockLists(tournament, armyListMap);
    updateTournament(updated);
  }, [tournament, armyListMap, updateTournament]);

  const handleUnlockLists = useCallback(() => {
    if (!tournament) return;
    const updated = tm.unlockLists(tournament);
    updateTournament(updated);
  }, [tournament, updateTournament]);

  const getListForDisplay = useCallback(
    (listId: string, playerId: string): ArmyList | null => {
      if (tournament?.listsLocked) {
        const locked = tournament.lockedLists.find(
          (l) => l.listId === listId && l.playerId === playerId
        );
        return locked?.snapshot ?? null;
      }
      return armyListMap.get(listId) ?? null;
    },
    [tournament, armyListMap]
  );

  const handleSetFaction = useCallback(
    (playerId: string, faction: FactionId) => {
      if (!tournament || tournament.listsLocked) return;
      const updated = tm.setPlayerFaction(tournament, playerId, faction);
      updateTournament(updated);
      setFactionModalPlayer(null);
    },
    [tournament, updateTournament]
  );

  const handleAddList = useCallback(
    (playerId: string, listId: string) => {
      if (!tournament || tournament.listsLocked) return;
      const updated = tm.addPlayerList(tournament, playerId, listId);
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  const handleRemoveList = useCallback(
    (playerId: string, listId: string) => {
      if (!tournament || tournament.listsLocked) return;
      const updated = tm.removePlayerList(tournament, playerId, listId);
      updateTournament(updated);
    },
    [tournament, updateTournament]
  );

  // Sign up (non-admin)
  const handleSignUp = useCallback(() => {
    if (!tournament || !user) return;
    const updated = tm.addPlayer(tournament, user.id, "pending");
    updateTournament(updated);
  }, [tournament, user, updateTournament]);

  const openResultModal = useCallback(
    (pairingId: string, roundNumber: number) => {
      setResultPairingId(pairingId);
      setResultRound(roundNumber);
      setResultWinner(null);
      setResultP1VP("");
      setResultP2VP("");
      setResultNotes("");
      setResultGameMode("");
      setResultP1Killed("");
      setResultP2Killed("");
      setResultP1ListId("");
      setResultP2ListId("");
      setResultModalOpen(true);
    },
    []
  );

  const handleSubmitResult = useCallback(() => {
    if (!tournament || !resultPairingId) return;
    const p1vp = parseInt(resultP1VP, 10) || 0;
    const p2vp = parseInt(resultP2VP, 10) || 0;
    const winnerId = resultWinner === "draw" ? null : (resultWinner as string | null);

    const p1killed = resultP1Killed ? parseInt(resultP1Killed, 10) : undefined;
    const p2killed = resultP2Killed ? parseInt(resultP2Killed, 10) : undefined;

    const updated = tm.recordMatchResult(
      tournament,
      resultRound,
      resultPairingId,
      winnerId,
      p1vp,
      p2vp,
      {
        notes: resultNotes.trim() || undefined,
        gameMode: resultGameMode ? (resultGameMode as GameMode) : undefined,
        player1PointsKilled: p1killed,
        player2PointsKilled: p2killed,
        player1ListId: resultP1ListId || undefined,
        player2ListId: resultP2ListId || undefined,
      }
    );
    updateTournament(updated);
    setResultModalOpen(false);
  }, [tournament, resultPairingId, resultRound, resultWinner, resultP1VP, resultP2VP, resultNotes, resultGameMode, resultP1Killed, resultP2Killed, resultP1ListId, resultP2ListId, updateTournament]);

  // ---- Loading / Not found ----
  if (!tournamentsLoaded || !playersLoaded || !armyListsLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-400 text-sm">Loading tournament...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-stone-900 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <Link
          href="/tournaments"
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-500 transition-colors mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Tournaments
        </Link>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-stone-200">Tournament Not Found</h2>
          <p className="mt-2 text-sm text-stone-500">This tournament may have been deleted.</p>
        </div>
      </div>
    );
  }

  const canGenerate = tm.canGenerateNextRound(tournament);
  const nextRoundNumber = tm.getNextRoundNumber(tournament);

  // Check if current user is signed up
  const myRegistration = user
    ? tournament.players.find((p) => p.playerId === user.id)
    : null;
  const canSignUp =
    user &&
    !myRegistration &&
    tournament.status === "draft" &&
    acceptedPlayers.length + pendingPlayers.length < tournament.maxPlayers;

  // ---- Get pairing's info for result modal ----
  const resultPairing = currentRound?.pairings.find((p) => p.id === resultPairingId) ?? null;
  const resultP1Name = resultPairing ? (playerNameMap.get(resultPairing.player1Id) ?? "Player 1") : "Player 1";
  const resultP2Name = resultPairing?.player2Id
    ? (playerNameMap.get(resultPairing.player2Id) ?? "Player 2")
    : "BYE";

  const tabs: TabView[] = ["standings", "players", "lists", "rounds"];

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-stone-900 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-500 transition-colors mb-4"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to Tournaments
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-stone-100">{tournament.name}</h1>
              <StatusBadge status={tournament.status} />
              {isAdmin && (
                <Badge variant="info" size="sm">Admin</Badge>
              )}
            </div>
            {tournament.description && (
              <p className="mt-1 text-sm text-stone-400">{tournament.description}</p>
            )}
            <div className="mt-1 flex items-center gap-3 text-sm text-stone-400 flex-wrap">
              <span>
                {new Date(tournament.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-stone-600">|</span>
              <span>{tournament.pointLimit} pts</span>
              <span className="text-stone-600">|</span>
              <span>{tournament.numberOfRounds} rounds</span>
              <span className="text-stone-600">|</span>
              <span>Max {tournament.maxPlayers} players</span>
              {tournament.requiredLists > 1 && (
                <>
                  <span className="text-stone-600">|</span>
                  <span>{tournament.requiredLists} lists required</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {canSignUp && (
              <Button variant="secondary" onClick={handleSignUp}>
                Sign Up
              </Button>
            )}
            {isAdmin && tournament.status === "draft" && (
              <Button
                onClick={handleStartTournament}
                disabled={acceptedPlayers.length < 2}
              >
                Start Tournament
              </Button>
            )}
            {isAdmin && tournament.status === "active" && (
              <Button variant="secondary" onClick={handleCompleteTournament}>
                Complete Tournament
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-700 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap
              ${
                activeTab === tab
                  ? "border-amber-500 text-amber-500"
                  : "border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-600"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================================================================= */}
      {/* STANDINGS VIEW                                                     */}
      {/* ================================================================= */}
      {activeTab === "standings" && (
        <div>
          {standings.length === 0 ? (
            <EmptyState
              title="No Standings Yet"
              description="Add players and start the tournament to see standings."
            />
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-700 text-stone-400">
                      <th className="px-3 py-3 text-center font-medium w-10">#</th>
                      <th className="px-3 py-3 text-left font-medium">Player</th>
                      <th className="px-3 py-3 text-center font-medium">TP</th>
                      <th className="px-3 py-3 text-center font-medium">SP</th>
                      <th className="px-3 py-3 text-center font-medium">VP+</th>
                      <th className="px-3 py-3 text-center font-medium">VP-</th>
                      <th className="px-3 py-3 text-center font-medium">Diff</th>
                      <th className="px-3 py-3 text-center font-medium">Killed</th>
                      <th className="px-3 py-3 text-center font-medium">W-D-L</th>
                      <th className="px-3 py-3 text-center font-medium">SoS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {standings.map((s) => {
                      const rowHighlight =
                        s.rank === 1
                          ? "bg-amber-900/10"
                          : s.rank === 2
                          ? "bg-stone-700/20"
                          : s.rank === 3
                          ? "bg-amber-800/10"
                          : "";
                      return (
                        <tr
                          key={s.playerId}
                          className={`hover:bg-stone-800/50 transition-colors ${rowHighlight}`}
                        >
                          <td className="px-3 py-3 text-center">
                            <RankBadge rank={s.rank} />
                          </td>
                          <td className="px-3 py-3 text-stone-100 font-medium">
                            <Link
                              href={`/players/${s.playerId}`}
                              className="hover:text-amber-500 transition-colors"
                            >
                              {s.playerName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-center text-amber-500 font-semibold">
                            {s.tournamentPoints}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-300">
                            {s.secondaryPoints}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-300">{s.vpScored}</td>
                          <td className="px-3 py-3 text-center text-stone-300">{s.vpAllowed}</td>
                          <td
                            className={`px-3 py-3 text-center font-medium ${
                              s.vpDiff > 0
                                ? "text-green-400"
                                : s.vpDiff < 0
                                ? "text-red-400"
                                : "text-stone-400"
                            }`}
                          >
                            {s.vpDiff > 0 ? "+" : ""}
                            {s.vpDiff}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-300">
                            {s.pointsDestroyed}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-300">
                            {s.wins}-{s.draws}-{s.losses}
                          </td>
                          <td className="px-3 py-3 text-center text-stone-400">
                            {s.sos.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* PLAYERS VIEW                                                       */}
      {/* ================================================================= */}
      {activeTab === "players" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-stone-400">
              {acceptedPlayers.length} accepted
              {pendingPlayers.length > 0 && `, ${pendingPlayers.length} pending`}
              {" / "}{tournament.maxPlayers} max
            </p>
            {isAdmin && tournament.status === "draft" && (
              <Button size="sm" onClick={() => setAddPlayerModalOpen(true)}>
                Add Player
              </Button>
            )}
          </div>

          {tournament.players.length === 0 ? (
            <EmptyState
              title="No Players Yet"
              description={isAdmin ? "Add players to this tournament to get started." : "No one has signed up yet."}
              action={
                isAdmin && tournament.status === "draft" ? (
                  <Button onClick={() => setAddPlayerModalOpen(true)}>Add Player</Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Pending section */}
              {pendingPlayers.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                    Pending ({pendingPlayers.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingPlayers.map((tp) => {
                      const name = playerNameMap.get(tp.playerId) ?? tp.playerId;
                      return (
                        <Card key={tp.playerId}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-medium text-stone-100 truncate">{name}</span>
                              <PlayerStatusBadge status={tp.status} />
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-2 ml-2">
                                <Button size="sm" onClick={() => handleAcceptPlayer(tp.playerId)}>
                                  Accept
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => handleRejectPlayer(tp.playerId)}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Accepted section */}
              {acceptedPlayers.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                    Accepted ({acceptedPlayers.length})
                  </h3>
                  <div className="space-y-2">
                    {acceptedPlayers.map((tp) => {
                      const name = playerNameMap.get(tp.playerId) ?? tp.playerId;
                      const factionInfo = tp.faction ? getFactionInfo(tp.faction) : null;
                      return (
                        <Card key={tp.playerId}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <Link
                                href={`/players/${tp.playerId}`}
                                className="font-medium text-stone-100 hover:text-amber-500 transition-colors truncate"
                              >
                                {name}
                              </Link>
                              {tp.dropped && <Badge variant="error" size="sm">Dropped</Badge>}
                              {factionInfo && (
                                <Badge variant="faction" size="sm" color={factionInfo.color}>
                                  {factionInfo.shortName}
                                </Badge>
                              )}
                              <span className="text-xs text-stone-500">
                                {tp.armyListIds.length}/{tournament.requiredLists} lists
                              </span>
                              {tournament.listsLocked && (
                                <Badge variant="error" size="sm">Locked</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {isAdmin && tournament.status === "draft" && !tournament.listsLocked && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setFactionModalPlayer(tp.playerId)}
                                  >
                                    Faction
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setListModalPlayer(tp.playerId)}
                                  >
                                    Lists
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleRemovePlayer(tp.playerId)}
                                  >
                                    Remove
                                  </Button>
                                </>
                              )}
                              {/* Players can manage their own faction/lists */}
                              {!isAdmin && user && tp.playerId === user.id && tournament.status === "draft" && !tournament.listsLocked && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setFactionModalPlayer(tp.playerId)}
                                  >
                                    Faction
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setListModalPlayer(tp.playerId)}
                                  >
                                    Lists
                                  </Button>
                                </>
                              )}
                              {isAdmin && tournament.status === "active" && !tp.dropped && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDropPlayer(tp.playerId)}
                                >
                                  Drop
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rejected section */}
              {rejectedPlayers.length > 0 && isAdmin && (
                <div>
                  <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                    Rejected ({rejectedPlayers.length})
                  </h3>
                  <div className="space-y-2">
                    {rejectedPlayers.map((tp) => {
                      const name = playerNameMap.get(tp.playerId) ?? tp.playerId;
                      return (
                        <Card key={tp.playerId}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-medium text-stone-400 truncate">{name}</span>
                              <PlayerStatusBadge status={tp.status} />
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => handleAcceptPlayer(tp.playerId)}>
                              Accept
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* LISTS VIEW                                                         */}
      {/* ================================================================= */}
      {activeTab === "lists" && (
        <div>
          {isAdmin && (
            <div className="mb-4 space-y-3">
              {/* Lock / Unlock row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-stone-400">
                    {tournament.listsLocked ? "Lists are locked" : "Lists are unlocked"}
                  </p>
                  <Badge variant={tournament.listsLocked ? "error" : "warning"} size="sm">
                    {tournament.listsLocked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant={tournament.listsLocked ? "secondary" : "danger"}
                  onClick={tournament.listsLocked ? handleUnlockLists : handleLockLists}
                >
                  {tournament.listsLocked ? "Unlock Lists" : "Lock Lists"}
                </Button>
              </div>
              {/* Reveal / Hide row */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-400">
                  {tournament.listsRevealed ? "Lists are visible to all players" : "Lists are hidden from players"}
                </p>
                <Button size="sm" variant="secondary" onClick={handleToggleListsRevealed}>
                  {tournament.listsRevealed ? "Hide Lists" : "Reveal Lists"}
                </Button>
              </div>
            </div>
          )}

          {!isAdmin && !tournament.listsRevealed ? (
            <EmptyState
              title="Lists Hidden"
              description="Army lists are hidden until the tournament admin reveals them."
            />
          ) : (
            <div>
              {acceptedPlayers.length === 0 ? (
                <EmptyState
                  title="No Players"
                  description="No accepted players to show lists for."
                />
              ) : (
                <div className="space-y-3">
                  {acceptedPlayers.map((tp) => {
                    const name = playerNameMap.get(tp.playerId) ?? tp.playerId;
                    const factionInfo = tp.faction ? getFactionInfo(tp.faction) : null;
                    return (
                      <Card key={tp.playerId}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-stone-100">{name}</span>
                          {factionInfo && (
                            <Badge variant="faction" size="sm" color={factionInfo.color}>
                              {factionInfo.shortName}
                            </Badge>
                          )}
                        </div>
                        {tp.armyListIds.length === 0 ? (
                          <p className="text-xs text-stone-500 italic">No lists registered</p>
                        ) : (
                          <div className="space-y-1.5">
                            {tp.armyListIds.map((listId) => {
                              const list = getListForDisplay(listId, tp.playerId);
                              if (!list) return (
                                <p key={listId} className="text-xs text-stone-500">Unknown list</p>
                              );
                              const listFaction = getFactionInfo(list.faction);
                              return (
                                <div key={listId} className="flex items-center gap-2 text-sm">
                                  <Badge variant="faction" size="sm" color={listFaction.color}>
                                    {listFaction.shortName}
                                  </Badge>
                                  <span className="text-stone-300">{list.name}</span>
                                  <span className="text-stone-500 text-xs">{list.pointLimit}pts</span>
                                  {(isAdmin || tournament.listsRevealed) && (
                                    <button
                                      className="text-stone-500 hover:text-amber-400 transition-colors ml-auto"
                                      onClick={() => setPreviewListData(list)}
                                      title="View list details"
                                    >
                                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* ROUNDS VIEW                                                        */}
      {/* ================================================================= */}
      {activeTab === "rounds" && (
        <div>
          {/* Round selector + generate button */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {tournament.rounds.map((round) => (
              <button
                key={round.roundNumber}
                onClick={() => setSelectedRound(round.roundNumber)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${
                    selectedRound === round.roundNumber
                      ? "bg-amber-700 text-white"
                      : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  }
                `}
              >
                Round {round.roundNumber}
                {round.status === "completed" && (
                  <svg
                    className="inline-block ml-1 h-3.5 w-3.5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
            {isAdmin && canGenerate && (
              <Button size="sm" onClick={handleGenerateRound}>
                Generate Round {nextRoundNumber}
              </Button>
            )}
          </div>

          {/* Pairings for selected round */}
          {tournament.rounds.length === 0 ? (
            <EmptyState
              title="No Rounds Yet"
              description={
                tournament.status === "draft"
                  ? "Start the tournament to generate the first round."
                  : "Generate the first round to begin."
              }
            />
          ) : currentRound ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentRound.pairings.map((pairing) => {
                const p1Name = playerNameMap.get(pairing.player1Id) ?? "Unknown";
                const p2Name = pairing.player2Id
                  ? (playerNameMap.get(pairing.player2Id) ?? "Unknown")
                  : null;
                const isBye = pairing.player2Id === null;
                const hasResult = !!pairing.result;

                return (
                  <Card key={pairing.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium truncate ${
                              hasResult && pairing.result?.winnerId === pairing.player1Id
                                ? "text-amber-500"
                                : "text-stone-200"
                            }`}
                          >
                            {p1Name}
                          </span>
                          <span className="text-stone-600 text-xs">vs</span>
                          {isBye ? (
                            <span className="text-stone-500 italic">BYE</span>
                          ) : (
                            <span
                              className={`font-medium truncate ${
                                hasResult && pairing.result?.winnerId === pairing.player2Id
                                  ? "text-amber-500"
                                  : "text-stone-200"
                              }`}
                            >
                              {p2Name}
                            </span>
                          )}
                        </div>

                        {hasResult && (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <span className="text-stone-300 font-mono">
                                {pairing.result!.player1VP} - {pairing.result!.player2VP}
                              </span>
                              <Badge
                                variant={
                                  isBye ? "info"
                                    : pairing.result!.winnerId === null ? "warning"
                                    : "success"
                                }
                                size="sm"
                              >
                                {isBye
                                  ? "BYE"
                                  : getVictoryLabel(pairing.result!.winnerId, pairing.result!.player1VP, pairing.result!.player2VP)
                                }
                              </Badge>
                              <span className="text-[10px] text-stone-500">
                                {pairing.result!.player1TP}/{pairing.result!.player1SP ?? 0} - {pairing.result!.player2TP}/{pairing.result!.player2SP ?? 0} TP/SP
                              </span>
                              {pairing.result!.gameMode && (
                                <Badge variant="default" size="sm">
                                  {pairing.result!.gameMode}
                                </Badge>
                              )}
                            </div>
                            {(pairing.result!.player1PointsKilled !== undefined ||
                              pairing.result!.player2PointsKilled !== undefined ||
                              pairing.result!.player1ListId ||
                              pairing.result!.player2ListId) && (
                              <div className="flex items-center gap-3 text-[10px] text-stone-500 flex-wrap">
                                {pairing.result!.player1PointsKilled !== undefined &&
                                  pairing.result!.player2PointsKilled !== undefined && (
                                    <span>
                                      Killed: {pairing.result!.player1PointsKilled} - {pairing.result!.player2PointsKilled} pts
                                    </span>
                                  )}
                                {pairing.result!.player1ListId && (() => {
                                  const list = armyListMap.get(pairing.result!.player1ListId!);
                                  return list ? <span>{p1Name}: {list.name}</span> : null;
                                })()}
                                {pairing.result!.player2ListId && (() => {
                                  const list = armyListMap.get(pairing.result!.player2ListId!);
                                  return list ? <span>{p2Name}: {list.name}</span> : null;
                                })()}
                              </div>
                            )}
                            {pairing.result!.notes && (
                              <p className="text-xs text-stone-500 truncate">
                                {pairing.result!.notes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {!hasResult && isAdmin && tournament.status === "active" && !isBye && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openResultModal(pairing.id, currentRound.roundNumber)}
                        >
                          Enter Result
                        </Button>
                      )}

                      {!hasResult && isBye && tournament.status === "active" && (
                        <Badge variant="info" size="sm">
                          BYE
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Round Not Found"
              description="Select a round from the buttons above."
            />
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* ADD PLAYER MODAL                                                   */}
      {/* ================================================================= */}
      <Modal
        isOpen={addPlayerModalOpen}
        onClose={() => setAddPlayerModalOpen(false)}
        title="Add Player to Tournament"
      >
        {unregisteredPlayers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-stone-400">
              All players are already registered in this tournament.
            </p>
            <Link href="/players" className="text-sm text-amber-500 hover:text-amber-400 mt-2 inline-block">
              Create new players first
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {unregisteredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-md border border-stone-700 bg-stone-800 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-200 truncate">{player.name}</p>
                  {player.nickname && (
                    <p className="text-xs text-stone-500">&ldquo;{player.nickname}&rdquo;</p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    handleAddPlayer(player.id);
                  }}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={() => setAddPlayerModalOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>

      {/* ================================================================= */}
      {/* FACTION SELECTION MODAL                                            */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!factionModalPlayer}
        onClose={() => setFactionModalPlayer(null)}
        title="Select Faction"
      >
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {ALL_FACTION_IDS.map((fid) => {
            const fi = getFactionInfo(fid);
            const isSelected = factionModalPlayer
              ? tournament.players.find((p) => p.playerId === factionModalPlayer)?.faction === fid
              : false;
            return (
              <button
                key={fid}
                onClick={() => {
                  if (factionModalPlayer) {
                    handleSetFaction(factionModalPlayer, fid);
                  }
                }}
                className={`
                  rounded-md border px-3 py-2.5 text-sm font-medium transition-all text-center
                  ${
                    isSelected
                      ? "border-amber-500 bg-amber-700/30 text-amber-300"
                      : "border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-500"
                  }
                `}
              >
                {fi.displayName}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={() => setFactionModalPlayer(null)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* ================================================================= */}
      {/* ARMY LIST ASSIGNMENT MODAL                                         */}
      {/* ================================================================= */}
      <Modal
        isOpen={!!listModalPlayer}
        onClose={() => setListModalPlayer(null)}
        title="Manage Army Lists"
      >
        {listModalPlayerData && (
          <div className="space-y-4">
            {/* Currently assigned lists */}
            {listModalPlayerData.armyListIds.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                  Assigned ({listModalPlayerData.armyListIds.length}/{tournament.requiredLists})
                </p>
                <div className="space-y-2">
                  {listModalPlayerData.armyListIds.map((listId) => {
                    const list = armyListMap.get(listId);
                    if (!list) return null;
                    const fi = getFactionInfo(list.faction);
                    return (
                      <div
                        key={listId}
                        className="flex items-center justify-between rounded-md border border-stone-700 bg-stone-800 px-4 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="faction" size="sm" color={fi.color}>
                            {fi.shortName}
                          </Badge>
                          <span className="text-sm text-stone-200 truncate">{list.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveList(listModalPlayerData.playerId, listId)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available lists to add */}
            {listModalPlayerData.armyListIds.length < tournament.requiredLists && (
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                  Available Lists
                  {listModalPlayerData.faction && (
                    <span className="text-stone-500"> (filtered by {getFactionInfo(listModalPlayerData.faction).displayName})</span>
                  )}
                </p>
                {availableListsForPlayer.length === 0 ? (
                  <p className="text-sm text-stone-500 py-2">
                    No matching saved lists found.{" "}
                    <Link href="/builder" className="text-amber-500 hover:text-amber-400">
                      Build a list first
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableListsForPlayer
                      .filter((al) => !listModalPlayerData.armyListIds.includes(al.id))
                      .map((al) => {
                        const fi = getFactionInfo(al.faction);
                        return (
                          <div
                            key={al.id}
                            className="flex items-center justify-between rounded-md border border-stone-700 bg-stone-800 px-4 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="faction" size="sm" color={fi.color}>
                                {fi.shortName}
                              </Badge>
                              <span className="text-sm text-stone-200 truncate">{al.name}</span>
                              <span className="text-xs text-stone-500">{al.pointLimit}pts</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddList(listModalPlayerData.playerId, al.id)}
                            >
                              Add
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={() => setListModalPlayer(null)}>
            Done
          </Button>
        </div>
      </Modal>

      {/* ================================================================= */}
      {/* ENTER RESULT MODAL                                                 */}
      {/* ================================================================= */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="Enter Match Result"
      >
        {resultPairing && (
          <div className="space-y-5">
            {/* Winner selection */}
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-2">Winner</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setResultWinner(resultPairing.player1Id)}
                  className={`
                    rounded-md border px-3 py-2.5 text-sm font-medium transition-all text-center
                    ${
                      resultWinner === resultPairing.player1Id
                        ? "border-amber-500 bg-amber-700/30 text-amber-300"
                        : "border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-500"
                    }
                  `}
                >
                  {resultP1Name}
                </button>
                <button
                  type="button"
                  onClick={() => setResultWinner("draw")}
                  className={`
                    rounded-md border px-3 py-2.5 text-sm font-medium transition-all text-center
                    ${
                      resultWinner === "draw"
                        ? "border-amber-500 bg-amber-700/30 text-amber-300"
                        : "border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-500"
                    }
                  `}
                >
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setResultWinner(resultPairing.player2Id ?? resultPairing.player1Id)
                  }
                  className={`
                    rounded-md border px-3 py-2.5 text-sm font-medium transition-all text-center
                    ${
                      resultWinner === resultPairing.player2Id
                        ? "border-amber-500 bg-amber-700/30 text-amber-300"
                        : "border-stone-600 bg-stone-800 text-stone-300 hover:border-stone-500"
                    }
                  `}
                >
                  {resultP2Name}
                </button>
              </div>
            </div>

            {/* VP inputs */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`${resultP1Name} VP`}
                type="number"
                min={0}
                value={resultP1VP}
                onChange={(e) => setResultP1VP(e.target.value)}
                placeholder="0"
              />
              <Input
                label={`${resultP2Name} VP`}
                type="number"
                min={0}
                value={resultP2VP}
                onChange={(e) => setResultP2VP(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Optional fields divider */}
            <div className="border-t border-stone-700 pt-4">
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-3">
                Optional Details
              </p>

              {/* Game Mode */}
              <Select
                label="Game Mode"
                value={resultGameMode}
                onChange={(e) => setResultGameMode(e.target.value)}
                options={[
                  { value: "", label: "— Not specified —" },
                  ...ALL_GAME_MODES.map((gm) => ({ value: gm, label: gm })),
                ]}
              />

              {/* Points Killed */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input
                  label={`${resultP1Name} Pts Killed`}
                  type="number"
                  min={0}
                  value={resultP1Killed}
                  onChange={(e) => setResultP1Killed(e.target.value)}
                  placeholder="—"
                />
                <Input
                  label={`${resultP2Name} Pts Killed`}
                  type="number"
                  min={0}
                  value={resultP2Killed}
                  onChange={(e) => setResultP2Killed(e.target.value)}
                  placeholder="—"
                />
              </div>

              {/* Army List Used */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Select
                  label={`${resultP1Name} List`}
                  value={resultP1ListId}
                  onChange={(e) => setResultP1ListId(e.target.value)}
                  options={[
                    { value: "", label: "— Not specified —" },
                    ...armyLists.map((al) => ({
                      value: al.id,
                      label: `${al.name} (${getFactionInfo(al.faction).shortName})`,
                    })),
                  ]}
                />
                <Select
                  label={`${resultP2Name} List`}
                  value={resultP2ListId}
                  onChange={(e) => setResultP2ListId(e.target.value)}
                  options={[
                    { value: "", label: "— Not specified —" },
                    ...armyLists.map((al) => ({
                      value: al.id,
                      label: `${al.name} (${getFactionInfo(al.faction).shortName})`,
                    })),
                  ]}
                />
              </div>
            </div>

            {/* Notes */}
            <Input
              label="Notes (optional)"
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              placeholder="Any notes about the match..."
            />

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setResultModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitResult} disabled={resultWinner === null}>
                Submit Result
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================================================================= */}
      {/* ARMY LIST PREVIEW MODAL                                            */}
      {/* ================================================================= */}
      <Modal
        isOpen={previewListData !== null}
        onClose={() => setPreviewListData(null)}
        title={previewListData?.name ?? "Army List"}
        size="lg"
      >
        {previewListData && (
          <ArmyListPreview
            list={previewListData}
            onOpenInBuilder={
              !tournament.listsLocked
                ? () => {
                    window.open(`/builder/${previewListData.id}`, "_blank");
                  }
                : undefined
            }
          />
        )}
      </Modal>
    </div>
    </ProtectedRoute>
  );
}
