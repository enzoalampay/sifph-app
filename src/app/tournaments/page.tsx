"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { Tournament } from "@/lib/types/tournament";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const activePlayers = tournament.players.filter((p) => !p.dropped).length;
  const totalPlayers = tournament.players.length;

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card hover>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-stone-100 truncate">
              {tournament.name}
            </h3>
            <p className="mt-1 text-sm text-stone-400">
              {new Date(tournament.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <StatusBadge status={tournament.status} />
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
            {activePlayers}{totalPlayers !== activePlayers ? `/${totalPlayers}` : ""} players
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"
                clipRule="evenodd"
              />
            </svg>
            {tournament.pointLimit} pts
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clipRule="evenodd"
              />
            </svg>
            {tournament.rounds.length}/{tournament.numberOfRounds} rounds
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default function TournamentsPage() {
  const { items: tournaments, loaded } = useEntityStorage<Tournament>(STORAGE_KEYS.TOURNAMENTS);

  const grouped = useMemo(() => {
    const active: Tournament[] = [];
    const draft: Tournament[] = [];
    const completed: Tournament[] = [];

    const sorted = [...tournaments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const t of sorted) {
      switch (t.status) {
        case "active":
          active.push(t);
          break;
        case "draft":
          draft.push(t);
          break;
        case "completed":
          completed.push(t);
          break;
      }
    }
    return { active, draft, completed };
  }, [tournaments]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-400 text-sm">Loading tournaments...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-stone-900 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Tournaments"
        description={`${tournaments.length} tournament${tournaments.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/tournaments/create">
            <Button>Create Tournament</Button>
          </Link>
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          title="No Tournaments Yet"
          description="Create your first tournament to start organizing competitive play."
          action={
            <Link href="/tournaments/create">
              <Button>Create Tournament</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Active
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.active.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}

          {grouped.draft.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Draft
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.draft.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}

          {grouped.completed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">
                Completed
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.completed.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
