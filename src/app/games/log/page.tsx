"use client";

import { Suspense, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { CasualGame, createCasualGame } from "@/lib/types/casual-game";
import { ArmyList } from "@/lib/types/army-list";
import { Player } from "@/lib/types/player";
import { ALL_GAME_MODES } from "@/lib/types/tournament";
import { ALL_FACTION_IDS } from "@/lib/types/game-data";
import { getFactionInfo } from "@/lib/data/factions";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlayerAutocomplete } from "@/components/games/PlayerAutocomplete";
import { GiPhotoCamera } from "react-icons/gi";

const FACTION_OPTIONS = ALL_FACTION_IDS.map((id) => ({
  value: id,
  label: getFactionInfo(id).displayName,
}));

const GAME_MODE_OPTIONS = ALL_GAME_MODES.map((mode) => ({
  value: mode,
  label: mode,
}));

export default function LogGamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="text-stone-400 text-sm">Loading...</div></div>}>
      <LogGameForm />
    </Suspense>
  );
}

function LogGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user } = useAuth();

  const { items: games, save } = useEntityStorage<CasualGame>(
    STORAGE_KEYS.CASUAL_GAMES
  );
  const { items: armyLists } = useEntityStorage<ArmyList>(
    STORAGE_KEYS.ARMY_LISTS
  );
  const { items: players } = useEntityStorage<Player>(STORAGE_KEYS.PLAYERS);

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [faction, setFaction] = useState(ALL_FACTION_IDS[0]);
  const [armyListId, setArmyListId] = useState("");
  const [location, setLocation] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [opponentPlayerId, setOpponentPlayerId] = useState<string | undefined>();
  const [gameMode, setGameMode] = useState(ALL_GAME_MODES[0]);
  const [playerScore, setPlayerScore] = useState("0");
  const [opponentScore, setOpponentScore] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (editId && games.length > 0 && !initialized) {
      const game = games.find((g) => g.id === editId);
      if (game) {
        setDate(game.date);
        setFaction(game.faction);
        setArmyListId(game.armyListId ?? "");
        setLocation(game.location);
        setOpponentName(game.opponentName);
        setOpponentPlayerId(game.opponentPlayerId);
        setGameMode(game.gameMode);
        setPlayerScore(String(game.playerScore));
        setOpponentScore(String(game.opponentScore));
        setRemarks(game.remarks ?? "");
        setInitialized(true);
      }
    }
  }, [editId, games, initialized]);

  // Filter army lists by selected faction
  const filteredLists = useMemo(
    () => armyLists.filter((l) => l.faction === faction),
    [armyLists, faction]
  );

  const armyListOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...filteredLists.map((l) => ({
        value: l.id,
        label: `${l.name} (${l.pointLimit}pts)`,
      })),
    ],
    [filteredLists]
  );

  // Reset army list when faction changes
  const handleFactionChange = useCallback(
    (newFaction: string) => {
      setFaction(newFaction as typeof faction);
      setArmyListId("");
    },
    []
  );

  const handleOpponentChange = useCallback(
    (name: string, playerId?: string) => {
      setOpponentName(name);
      setOpponentPlayerId(playerId);
      if (errors.opponentName) setErrors((prev) => ({ ...prev, opponentName: "" }));
    },
    [errors.opponentName]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!opponentName.trim()) {
      newErrors.opponentName = "Opponent name is required";
    }

    if (!location.trim()) {
      newErrors.location = "Location is required";
    }

    const ps = parseInt(playerScore, 10);
    if (isNaN(ps) || ps < 0) {
      newErrors.playerScore = "Score must be 0 or greater";
    }

    const os = parseInt(opponentScore, 10);
    if (isNaN(os) || os < 0) {
      newErrors.opponentScore = "Score must be 0 or greater";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [date, opponentName, location, playerScore, opponentScore]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    if (!user) return;

    const params = {
      loggedByUserId: user.id,
      date,
      faction,
      armyListId: armyListId || undefined,
      location: location.trim(),
      gameMode,
      opponentPlayerId,
      opponentName: opponentName.trim(),
      playerScore: parseInt(playerScore, 10),
      opponentScore: parseInt(opponentScore, 10),
      remarks: remarks.trim() || undefined,
    };

    if (editId) {
      const existing = games.find((g) => g.id === editId);
      if (existing) {
        let result: CasualGame["result"];
        if (params.playerScore > params.opponentScore) result = "win";
        else if (params.playerScore < params.opponentScore) result = "loss";
        else result = "draw";

        save({
          ...existing,
          ...params,
          result,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      const game = createCasualGame(params);
      save(game);
    }

    router.push("/games");
  }, [
    validate, user, date, faction, armyListId, location, gameMode,
    opponentPlayerId, opponentName, playerScore, opponentScore, remarks,
    editId, games, save, router,
  ]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-stone-900 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <Link
          href="/games"
          className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-amber-500 transition-colors mb-4"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Game Log
        </Link>

        <PageHeader title={editId ? "Edit Game" : "Log a Game"} />

        <Card className="max-w-lg">
          <div className="space-y-5">
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
              label="Your Faction"
              options={FACTION_OPTIONS}
              value={faction}
              onChange={(e) => handleFactionChange(e.target.value)}
            />

            <Select
              label="Army List (optional)"
              options={armyListOptions}
              value={armyListId}
              onChange={(e) => setArmyListId(e.target.value)}
            />

            <Input
              label="Location"
              placeholder="e.g., Ludo Boardgame Bar & Cafe"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (errors.location)
                  setErrors((prev) => ({ ...prev, location: "" }));
              }}
              error={errors.location}
            />

            <PlayerAutocomplete
              players={players}
              opponentName={opponentName}
              opponentPlayerId={opponentPlayerId}
              onChangeOpponent={handleOpponentChange}
              error={errors.opponentName}
            />

            <Select
              label="Game Mode"
              options={GAME_MODE_OPTIONS}
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value as typeof gameMode)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Your Score"
                type="number"
                min={0}
                value={playerScore}
                onChange={(e) => {
                  setPlayerScore(e.target.value);
                  if (errors.playerScore)
                    setErrors((prev) => ({ ...prev, playerScore: "" }));
                }}
                error={errors.playerScore}
              />
              <Input
                label="Opponent Score"
                type="number"
                min={0}
                value={opponentScore}
                onChange={(e) => {
                  setOpponentScore(e.target.value);
                  if (errors.opponentScore)
                    setErrors((prev) => ({ ...prev, opponentScore: "" }));
                }}
                error={errors.opponentScore}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">
                Remarks (optional)
              </label>
              <textarea
                className="w-full rounded-md border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[80px] resize-y"
                placeholder="Notes about the game, memorable moments..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            {/* Photos placeholder */}
            <div className="rounded-md border border-dashed border-stone-600 bg-stone-800/50 p-4 text-center">
              <GiPhotoCamera className="w-6 h-6 mx-auto text-stone-600 mb-1" />
              <p className="text-xs text-stone-500">
                Photo uploads coming in a future update
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-700">
              <Link href="/games">
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button onClick={handleSubmit}>
                {editId ? "Save Changes" : "Save Game Log"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
