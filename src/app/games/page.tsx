"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { CasualGame } from "@/lib/types/casual-game";
import { getFactionInfo } from "@/lib/data/factions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GiSwordClash } from "react-icons/gi";

export default function GamesPage() {
  const { items: games, remove, loaded } = useEntityStorage<CasualGame>(
    STORAGE_KEYS.CASUAL_GAMES
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sortedGames = useMemo(
    () =>
      [...games].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [games]
  );

  const stats = useMemo(() => {
    const wins = games.filter((g) => g.result === "win").length;
    const losses = games.filter((g) => g.result === "loss").length;
    const draws = games.filter((g) => g.result === "draw").length;
    return { total: games.length, wins, losses, draws };
  }, [games]);

  const handleDelete = (id: string) => {
    remove(id);
    setDeleteConfirmId(null);
  };

  const resultBadge = (result: CasualGame["result"]) => {
    switch (result) {
      case "win":
        return <Badge variant="success">W</Badge>;
      case "loss":
        return <Badge variant="error">L</Badge>;
      case "draw":
        return <Badge variant="warning">D</Badge>;
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-400 text-sm">Loading game log...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-stone-900 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <PageHeader
          title="Game Log"
          description={
            games.length > 0
              ? `${stats.total} games — ${stats.wins}W / ${stats.losses}L / ${stats.draws}D`
              : "Record your casual games"
          }
          action={
            <Link href="/games/log">
              <Button>Log a Game</Button>
            </Link>
          }
        />

        {sortedGames.length === 0 ? (
          <EmptyState
            icon={<GiSwordClash className="w-12 h-12" />}
            title="No games logged yet"
            description="Record your first casual game to start tracking your battle history."
            action={
              <Link href="/games/log">
                <Button>Log a Game</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {sortedGames.map((game) => {
              const faction = getFactionInfo(game.faction);
              return (
                <Card key={game.id} padding="none">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Game info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={faction.crestUrl}
                          alt={faction.shortName}
                          className="w-8 h-8 object-contain drop-shadow shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-stone-100">
                              vs.{" "}
                              {game.opponentPlayerId ? (
                                <Link
                                  href={`/players/${game.opponentPlayerId}`}
                                  className="text-amber-500 hover:text-amber-400 transition-colors"
                                >
                                  {game.opponentName}
                                </Link>
                              ) : (
                                game.opponentName
                              )}
                            </span>
                            {resultBadge(game.result)}
                            <span className="text-sm font-medium text-stone-300">
                              {game.playerScore} - {game.opponentScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="faction" color={faction.color} size="sm">
                              {faction.shortName}
                            </Badge>
                            <span className="text-xs text-stone-500">
                              {new Date(game.date).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-stone-500">
                              {game.gameMode}
                            </span>
                            {game.location && (
                              <span className="text-xs text-stone-500 truncate max-w-[200px]">
                                @ {game.location}
                              </span>
                            )}
                          </div>
                          {game.remarks && (
                            <p className="text-xs text-stone-400 mt-1.5 line-clamp-2">
                              {game.remarks}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/games/log?edit=${game.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        {deleteConfirmId === game.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(game.id)}
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(game.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
