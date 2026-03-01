"use client";

import { useState, useRef, useEffect } from "react";
import { Player } from "@/lib/types/player";

interface PlayerAutocompleteProps {
  players: Player[];
  opponentName: string;
  opponentPlayerId?: string;
  onChangeOpponent: (name: string, playerId?: string) => void;
  error?: string;
}

export function PlayerAutocomplete({
  players,
  opponentName,
  opponentPlayerId,
  onChangeOpponent,
  error,
}: PlayerAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(opponentName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(opponentName);
  }, [opponentName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? players.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.nickname && p.nickname.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const handleInputChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    onChangeOpponent(value, undefined);
  };

  const handleSelect = (player: Player) => {
    setQuery(player.name);
    setOpen(false);
    onChangeOpponent(player.name, player.id);
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      <label className="block text-sm font-medium text-stone-300">
        Opponent
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search players or type a name"
          className={`
            w-full rounded-md border border-stone-600 bg-stone-800 px-3 py-2
            text-sm text-stone-100 placeholder-stone-500
            focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50
            ${error ? "border-red-500" : ""}
            ${opponentPlayerId ? "pr-20" : ""}
          `}
        />
        {opponentPlayerId && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded-full bg-green-900/60 border border-green-700/50 px-1.5 py-0.5 text-[10px] font-medium text-green-300">
            Linked
          </span>
        )}

        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-stone-600 bg-stone-800 shadow-lg">
            {filtered.slice(0, 8).map((player) => (
              <li
                key={player.id}
                onClick={() => handleSelect(player)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-stone-200 cursor-pointer hover:bg-stone-700 transition-colors"
              >
                <span className="font-medium">{player.name}</span>
                {player.nickname && (
                  <span className="text-stone-500 text-xs">
                    &quot;{player.nickname}&quot;
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
