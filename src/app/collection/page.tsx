"use client";

import { useState, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { Collection, CollectionEntry } from "@/lib/types/collection";
import { FactionId, ALL_FACTION_IDS } from "@/lib/types/game-data";
import { getAvailableUnits, getAvailableNCUs, getAvailableAttachments } from "@/lib/data/loader";
import { FACTIONS, getFactionInfo } from "@/lib/data/factions";
import { searchFilter } from "@/lib/utils/search";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

type ItemType = "unit" | "ncu" | "attachment";
type ViewFilter = "all" | ItemType;

interface GameItem {
  id: string;
  name: string;
  faction: FactionId;
  type: ItemType;
  cost: number;
  subtitle?: string;
}

function getAllGameItems(): GameItem[] {
  const items: GameItem[] = [];

  for (const factionId of ALL_FACTION_IDS) {
    // Units
    for (const unit of getAvailableUnits(factionId)) {
      if (!items.find((i) => i.id === unit.id)) {
        items.push({
          id: unit.id,
          name: unit.name,
          faction: unit.faction,
          type: "unit",
          cost: unit.cost,
          subtitle: unit.tray,
        });
      }
    }

    // NCUs
    for (const ncu of getAvailableNCUs(factionId)) {
      if (!items.find((i) => i.id === ncu.id)) {
        items.push({
          id: ncu.id,
          name: ncu.name,
          faction: ncu.faction,
          type: "ncu",
          cost: ncu.cost,
          subtitle: ncu.title,
        });
      }
    }

    // Attachments
    for (const att of getAvailableAttachments(factionId)) {
      if (!items.find((i) => i.id === att.id)) {
        items.push({
          id: att.id,
          name: att.name,
          faction: att.faction,
          type: "attachment",
          cost: att.cost ?? 0,
          subtitle: att.title ?? (att.commander ? "Commander" : att.tray),
        });
      }
    }
  }

  return items;
}

export default function CollectionPage() {
  const [collection, setCollection] = useLocalStorage<Collection>(
    STORAGE_KEYS.COLLECTION,
    {}
  );
  const [search, setSearch] = useState("");
  const [factionFilter, setFactionFilter] = useState<FactionId | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ViewFilter>("all");

  const allItems = useMemo(() => getAllGameItems(), []);

  const filteredItems = useMemo(() => {
    let items = allItems;

    // Faction filter
    if (factionFilter !== "all") {
      items = items.filter((i) => i.faction === factionFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      items = items.filter((i) => i.type === typeFilter);
    }

    // Search
    items = searchFilter(items, search, (i) => `${i.name} ${i.subtitle ?? ""}`);

    return items;
  }, [allItems, factionFilter, typeFilter, search]);

  // Group by faction
  const groupedItems = useMemo(() => {
    const groups = new Map<FactionId, GameItem[]>();
    for (const item of filteredItems) {
      if (!groups.has(item.faction)) groups.set(item.faction, []);
      groups.get(item.faction)!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const toggleOwned = (item: GameItem) => {
    const entry = collection[item.id];
    if (entry?.owned) {
      // Remove from collection
      const updated = { ...collection };
      delete updated[item.id];
      setCollection(updated);
    } else {
      // Add to collection
      setCollection({
        ...collection,
        [item.id]: {
          itemId: item.id,
          itemType: item.type,
          faction: item.faction,
          owned: true,
          quantity: 1,
        },
      });
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    const entry = collection[itemId];
    if (!entry) return;
    setCollection({
      ...collection,
      [itemId]: { ...entry, quantity },
    });
  };

  const ownedCount = Object.values(collection).filter((e) => e.owned).length;

  return (
    <ProtectedRoute>
    <div className="space-y-6">
      <PageHeader
        title="My Collection"
        description={`${ownedCount} items owned out of ${allItems.length} total`}
      />

      {/* Filters */}
      <div className="space-y-3">
        <SearchInput
          placeholder="Search models..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
        />

        {/* Faction filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFactionFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
              factionFilter === "all"
                ? "bg-amber-900/40 border-amber-600 text-amber-300"
                : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
            }`}
          >
            All Factions
          </button>
          {ALL_FACTION_IDS.map((fid) => {
            const f = getFactionInfo(fid);
            return (
              <button
                key={fid}
                onClick={() => setFactionFilter(fid)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  factionFilter === fid
                    ? "border-amber-600 text-amber-300"
                    : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
                }`}
                style={
                  factionFilter === fid
                    ? { backgroundColor: `${f.cardColor}25`, borderColor: f.color }
                    : {}
                }
              >
                {f.shortName}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {(["all", "unit", "ncu", "attachment"] as ViewFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                typeFilter === t
                  ? "bg-amber-900/40 border-amber-600 text-amber-300"
                  : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
            >
              {t === "all" ? "All Types" : t === "ncu" ? "NCUs" : t.charAt(0).toUpperCase() + t.slice(1) + "s"}
            </button>
          ))}
        </div>
      </div>

      {/* Items grouped by faction */}
      {Array.from(groupedItems.entries()).map(([factionId, items]) => {
        const faction = getFactionInfo(factionId);
        return (
          <div key={factionId}>
            <h3
              className="text-sm font-semibold mb-3 flex items-center gap-2"
              style={{ color: faction.color }}
            >
              <img
                src={faction.crestUrl}
                alt={`${faction.shortName} sigil`}
                className="w-6 h-6 object-contain drop-shadow"
              />
              {faction.displayName}
              <span className="text-stone-500 font-normal">
                ({items.filter((i) => collection[i.id]?.owned).length}/{items.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {items.map((item) => {
                const entry = collection[item.id];
                const isOwned = entry?.owned ?? false;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                      isOwned
                        ? "bg-stone-800/90 border-green-800/50"
                        : "bg-stone-900/50 border-stone-800 opacity-60 hover:opacity-80"
                    }`}
                    onClick={() => toggleOwned(item)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isOwned
                          ? "bg-green-700 border-green-600"
                          : "border-stone-600"
                      }`}
                    >
                      {isOwned && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-200 truncate uppercase">
                        {item.name}
                      </div>
                      <div className="text-xs text-stone-500">
                        {item.subtitle} &middot; {item.cost} pts
                      </div>
                    </div>

                    {/* Type badge */}
                    <Badge size="sm" variant="default">
                      {item.type === "ncu" ? "NCU" : item.type}
                    </Badge>

                    {/* Quantity */}
                    {isOwned && (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, (entry?.quantity ?? 1) - 1)}
                          className="w-6 h-6 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs text-stone-300 w-4 text-center">
                          {entry?.quantity ?? 1}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, (entry?.quantity ?? 1) + 1)}
                          className="w-6 h-6 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filteredItems.length === 0 && (
        <EmptyState
          title="No items found"
          description="Try adjusting your search or filters."
        />
      )}
    </div>
    </ProtectedRoute>
  );
}
