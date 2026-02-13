"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { ArmyList } from "@/lib/types/army-list";
import { Tournament } from "@/lib/types/tournament";
import { Player } from "@/lib/types/player";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { getFactionInfo } from "@/lib/data/factions";
import { Badge } from "@/components/ui/Badge";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const quickActions = [
  {
    href: "/builder",
    icon: "📜",
    title: "Build Army List",
    description: "Create a new army list for your next battle",
    color: "bg-amber-900/20 border-amber-800/30",
  },
  {
    href: "/tournaments/create",
    icon: "🏆",
    title: "Create Tournament",
    description: "Set up a new tournament event",
    color: "bg-purple-900/20 border-purple-800/30",
  },
  {
    href: "/players",
    icon: "👤",
    title: "Manage Players",
    description: "Add and manage player profiles",
    color: "bg-blue-900/20 border-blue-800/30",
  },
  {
    href: "/collection",
    icon: "📦",
    title: "My Collection",
    description: "Track your model collection",
    color: "bg-green-900/20 border-green-800/30",
  },
  {
    href: "/wiki",
    icon: "📖",
    title: "Wiki",
    description: "Browse units, tactics, and game rules",
    color: "bg-stone-800/40 border-stone-700/30",
  },
];

export default function DashboardPage() {
  const { items: armyLists, loaded: listsLoaded } = useEntityStorage<ArmyList>(
    STORAGE_KEYS.ARMY_LISTS
  );
  const { items: tournaments, loaded: tournamentsLoaded } =
    useEntityStorage<Tournament>(STORAGE_KEYS.TOURNAMENTS);
  const { items: players, loaded: playersLoaded } = useEntityStorage<Player>(
    STORAGE_KEYS.PLAYERS
  );

  const recentLists = [...armyLists]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const activeTournaments = tournaments.filter((t) => t.status === "active");

  return (
    <ProtectedRoute>
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-stone-100 mb-2">
          SIFPH
        </h1>
        <p className="text-stone-400 text-lg">
          A Song of Ice and Fire: TMG — Tournament Manager & List Builder
        </p>
        <p className="text-stone-500 text-sm mt-1">
          Song of Ice and Fire Philippines
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card hover className={`h-full ${action.color}`}>
              <div className="text-3xl mb-3">{action.icon}</div>
              <h3 className="font-semibold text-stone-100">{action.title}</h3>
              <p className="text-sm text-stone-400 mt-1">
                {action.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Row */}
      {(listsLoaded || tournamentsLoaded || playersLoaded) && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="text-3xl font-bold text-amber-400">
              {armyLists.length}
            </div>
            <div className="text-sm text-stone-400">Army Lists</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {tournaments.length}
            </div>
            <div className="text-sm text-stone-400">Tournaments</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {players.length}
            </div>
            <div className="text-sm text-stone-400">Players</div>
          </Card>
        </div>
      )}

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-stone-100 mb-4">
            Active Tournaments
          </h2>
          <div className="grid gap-3">
            {activeTournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`}>
                <Card hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-100">
                        {t.name}
                      </h3>
                      <p className="text-sm text-stone-400">
                        {t.players.length} players &middot;{" "}
                        {t.rounds.length}/{t.numberOfRounds} rounds &middot;{" "}
                        {t.pointLimit} pts
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Lists */}
      {recentLists.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-stone-100">
              Recent Army Lists
            </h2>
            <Link href="/builder">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="grid gap-3">
            {recentLists.map((list) => {
              const faction = getFactionInfo(list.faction);
              return (
                <Link key={list.id} href={`/builder/${list.id}`}>
                  <Card hover>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-stone-100">
                          {list.name}
                        </h3>
                        <p className="text-sm text-stone-400">
                          {list.units.length} units &middot;{" "}
                          {list.ncus.length} NCUs &middot;{" "}
                          {list.pointLimit} pts
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img
                          src={faction.crestUrl}
                          alt={`${faction.shortName} sigil`}
                          className="w-6 h-6 object-contain drop-shadow"
                        />
                        <Badge variant="faction" color={faction.color}>
                          {faction.shortName}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}
