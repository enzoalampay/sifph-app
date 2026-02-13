"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { Tournament, createTournament } from "@/lib/types/tournament";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const POINT_LIMIT_OPTIONS = [
  { value: "30", label: "30 Points" },
  { value: "40", label: "40 Points" },
  { value: "50", label: "50 Points" },
];

export default function CreateTournamentPage() {
  const router = useRouter();
  const { save } = useEntityStorage<Tournament>(STORAGE_KEYS.TOURNAMENTS);

  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pointLimit, setPointLimit] = useState("40");
  const [numberOfRounds, setNumberOfRounds] = useState("3");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Tournament name is required";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    const rounds = parseInt(numberOfRounds, 10);
    if (isNaN(rounds) || rounds < 1 || rounds > 8) {
      newErrors.numberOfRounds = "Number of rounds must be between 1 and 8";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, date, numberOfRounds]);

  const handleCreate = useCallback(() => {
    if (!validate()) return;

    const tournament = createTournament(
      name.trim(),
      date,
      parseInt(pointLimit, 10),
      parseInt(numberOfRounds, 10)
    );

    save(tournament);
    router.push(`/tournaments/${tournament.id}`);
  }, [name, date, pointLimit, numberOfRounds, validate, save, router]);

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-stone-900 px-4 py-6 sm:px-6 lg:px-8">
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

      <PageHeader title="Create Tournament" />

      <Card className="max-w-lg">
        <div className="space-y-5">
          <Input
            label="Tournament Name"
            placeholder="e.g. SIFPH Monthly #12"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={errors.name}
            autoFocus
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
            }}
            error={errors.date}
          />

          <Select
            label="Point Limit"
            options={POINT_LIMIT_OPTIONS}
            value={pointLimit}
            onChange={(e) => setPointLimit(e.target.value)}
          />

          <Input
            label="Number of Rounds"
            type="number"
            min={1}
            max={8}
            value={numberOfRounds}
            onChange={(e) => {
              setNumberOfRounds(e.target.value);
              if (errors.numberOfRounds)
                setErrors((prev) => ({ ...prev, numberOfRounds: "" }));
            }}
            error={errors.numberOfRounds}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-700">
            <Link href="/tournaments">
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Button onClick={handleCreate}>Create Tournament</Button>
          </div>
        </div>
      </Card>
    </div>
    </ProtectedRoute>
  );
}
