"use client";

import { useState } from "react";
import { seedTestData, removeTestData, type SeedResult } from "@/lib/test/seed-tournament-data";

export default function DevSeedPage() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function addLog(msg: string) {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  function handleSeed() {
    setBusy(true);
    try {
      const result: SeedResult = seedTestData();
      addLog(
        `✅ Seeded: ${result.players} players, ${result.lists} army lists, ${result.tournaments} tournaments`
      );
      addLog("Refresh the /tournaments page to see the test data.");
    } catch (e) {
      addLog(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  function handleRemove() {
    setBusy(true);
    try {
      const result: SeedResult = removeTestData();
      addLog(
        `🗑️ Removed: ${result.players} players, ${result.lists} army lists, ${result.tournaments} tournaments`
      );
      if (result.players === 0 && result.lists === 0 && result.tournaments === 0) {
        addLog("No test data found to remove.");
      }
    } catch (e) {
      addLog(`❌ Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-stone-100">Dev — Seed Test Data</h1>
        <p className="text-sm text-stone-400">
          All test data uses the <code className="text-amber-400">__TEST__</code> ID prefix and{" "}
          <code className="text-amber-400">[TEST]</code> name prefix for easy identification and removal.
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleSeed}
            disabled={busy}
            className="rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 transition-colors"
          >
            Seed Test Data
          </button>
          <button
            onClick={handleRemove}
            disabled={busy}
            className="rounded-lg bg-red-700 px-6 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            Remove Test Data
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wide">What gets created:</h2>
          <ul className="text-sm text-stone-400 list-disc pl-5 space-y-1">
            <li>16 test players (2 per faction × 8 factions)</li>
            <li>32 army lists (2 per player, 40pts, different commanders)</li>
            <li>1 completed tournament — 8 players, 3 rounds with results</li>
            <li>1 draft tournament — 12 registered players (8 accepted, 4 pending)</li>
          </ul>
        </div>

        {log.length > 0 && (
          <div className="rounded-lg border border-stone-700 bg-stone-800 p-4">
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wide mb-2">Log</h2>
            <div className="space-y-1 font-mono text-xs text-stone-300">
              {log.map((entry, i) => (
                <p key={i}>{entry}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
