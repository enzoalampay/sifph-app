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
import { CasualGame } from "@/lib/types/casual-game";
import { GiScrollUnfurled, GiTrophy, GiKnightBanner, GiSwordClash, GiChest, GiSpellBook, GiTestTubes } from "react-icons/gi";
import { IconType } from "react-icons";

const quickActions: { href: string; icon: IconType; title: string; description: string; color: string; iconColor?: string }[] = [
  {
    href: "/builder",
    icon: GiScrollUnfurled,
    title: "Build Army List",
    description: "Create a new army list for your next battle",
    color: "bg-amber-900/20 border-amber-800/30",
  },
  {
    href: "/tournaments/create",
    icon: GiTrophy,
    title: "Create Tournament",
    description: "Set up a new tournament event",
    color: "bg-purple-900/20 border-purple-800/30",
  },
  {
    href: "/players",
    icon: GiKnightBanner,
    title: "Manage Players",
    description: "Add and manage player profiles",
    color: "bg-blue-900/20 border-blue-800/30",
  },
  {
    href: "/games/log",
    icon: GiSwordClash,
    title: "Log a Game",
    description: "Record a casual game and track your battles",
    color: "bg-rose-900/20 border-rose-800/30",
  },
  {
    href: "/collection",
    icon: GiChest,
    title: "My Collection",
    description: "Track your model collection",
    color: "bg-green-900/20 border-green-800/30",
  },
  {
    href: "/wiki",
    icon: GiSpellBook,
    title: "Wiki",
    description: "Browse units, tactics, and game rules",
    color: "bg-stone-800/40 border-stone-700/30",
  },
  {
    href: "/playtest",
    icon: GiTestTubes,
    title: "Playtest Files",
    description: "January 2026 Pre-Season testing",
    color: "bg-teal-900/20 border-teal-800/30",
    iconColor: "text-teal-400/80",
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
  const { items: casualGames, loaded: gamesLoaded } =
    useEntityStorage<CasualGame>(STORAGE_KEYS.CASUAL_GAMES);

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
      <div className="text-center py-4 sm:py-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-stone-100 mb-2 font-[family-name:var(--font-cinzel)] tracking-wide">
          SIFPH
        </h1>
        <p className="text-stone-400 text-sm sm:text-lg">
          A Song of Ice and Fire: TMG — Tournament Manager & List Builder
        </p>
        <p className="text-stone-500 text-xs sm:text-sm mt-1">
          Song of Ice and Fire Philippines
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card hover className={`h-full ${action.color}`}>
                <Icon className={`w-7 h-7 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${action.iconColor ?? "text-amber-400/80"}`} />
                <h3 className="font-semibold text-stone-100">{action.title}</h3>
                <p className="text-sm text-stone-400 mt-1">
                  {action.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Stats Row */}
      {(listsLoaded || tournamentsLoaded || playersLoaded || gamesLoaded) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-amber-400">
              {armyLists.length}
            </div>
            <div className="text-xs sm:text-sm text-stone-400">Army Lists</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">
              {tournaments.length}
            </div>
            <div className="text-xs sm:text-sm text-stone-400">Tournaments</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">
              {players.length}
            </div>
            <div className="text-xs sm:text-sm text-stone-400">Players</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-rose-400">
              {casualGames.length}
            </div>
            <div className="text-xs sm:text-sm text-stone-400">Games Logged</div>
          </Card>
        </div>
      )}

      {/* Active Tournaments */}
      {activeTournaments.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-stone-100 mb-4">
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
            <h2 className="text-lg sm:text-xl font-semibold text-stone-100">
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
