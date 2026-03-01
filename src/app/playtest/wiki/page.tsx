"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FactionId,
  GameUnit,
  GameNCU,
  GameAttachment,
  GameTactics,
  AbilityDefinition,
} from "@/lib/types/game-data";
import {
  getAllUnits,
  getAllNCUs,
  getAllAttachments,
  getAllTactics,
  getAbility,
  getAllAbilities,
} from "@/lib/data/playtest-loader";
import { FACTIONS, getFactionInfo } from "@/lib/data/factions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardImageModal, useCardViewer } from "@/components/ui/CardImageModal";
import { getPortraitUrl } from "@/lib/utils/card-images";
import { StatLine } from "@/components/ui/StatLine";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PLAYTEST_WIKI_FACTIONS: FactionId[] = ["stark", "lannister", "neutral"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WikiTab = "units" | "attachments" | "ncus" | "tactics" | "abilities" | "orders";

const WIKI_TABS: { id: WikiTab; label: string }[] = [
  { id: "units", label: "Units" },
  { id: "attachments", label: "Attachments" },
  { id: "ncus", label: "NCUs" },
  { id: "tactics", label: "Tactics" },
  { id: "abilities", label: "Abilities" },
  { id: "orders", label: "Orders" },
];

interface WikiAbilityEntry {
  name: string;
  displayName: string;
  definition: AbilityDefinition;
  units: GameUnit[];
  attachments: GameAttachment[];
  factions: Set<FactionId>;
}

// ---------------------------------------------------------------------------
// Faction filter pills
// ---------------------------------------------------------------------------

function FactionFilter({
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: {
  selected: Set<FactionId>;
  onToggle: (fid: FactionId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const allSelected = selected.size === PLAYTEST_WIKI_FACTIONS.length;
  const noneSelected = selected.size === 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={onSelectAll}
          disabled={allSelected}
          className={`text-[10px] font-medium uppercase tracking-wide transition-colors ${
            allSelected ? "text-stone-600 cursor-default" : "text-teal-500 hover:text-teal-400"
          }`}
        >
          Select All
        </button>
        <span className="text-stone-700">|</span>
        <button
          onClick={onDeselectAll}
          disabled={noneSelected}
          className={`text-[10px] font-medium uppercase tracking-wide transition-colors ${
            noneSelected ? "text-stone-600 cursor-default" : "text-teal-500 hover:text-teal-400"
          }`}
        >
          Deselect All
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PLAYTEST_WIKI_FACTIONS.map((fid) => {
          const fi = FACTIONS[fid];
          const active = selected.has(fid);
          return (
            <button
              key={fid}
              onClick={() => onToggle(fid)}
              className={`
                flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all
                ${
                  active
                    ? "border-teal-600 bg-teal-900/30 text-teal-300"
                    : "border-stone-700 bg-stone-800/50 text-stone-500 hover:text-stone-300 hover:border-stone-600"
                }
              `}
            >
              <img
                src={fi.crestUrl}
                alt={fi.shortName}
                className="w-4 h-4 object-contain"
              />
              {fi.shortName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expandable detail card
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-stone-500">{label}</span>
      <span className="text-stone-300">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Playtest Wiki Page
// ---------------------------------------------------------------------------

export default function PlaytestWikiPage() {
  const [activeTab, setActiveTab] = useState<WikiTab>("units");
  const [search, setSearch] = useState("");
  const [factionFilter, setFactionFilter] = useState<Set<FactionId>>(
    new Set(PLAYTEST_WIKI_FACTIONS)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Card viewer
  const { cardViewer, openCard, closeCard } = useCardViewer();

  // Toggle faction filter
  const handleToggleFaction = (fid: FactionId) => {
    setFactionFilter((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) {
        next.delete(fid);
      } else {
        next.add(fid);
      }
      return next;
    });
  };

  const handleSelectAll = () => setFactionFilter(new Set(PLAYTEST_WIKI_FACTIONS));
  const handleDeselectAll = () => setFactionFilter(new Set());

  // Data
  const allUnits = useMemo(() => getAllUnits(), []);
  const allNCUs = useMemo(() => getAllNCUs(), []);
  const allAttachments = useMemo(() => getAllAttachments(), []);
  const allTactics = useMemo(() => getAllTactics(), []);

  // Filtered and searched
  const filteredUnits = useMemo(() => {
    return allUnits
      .filter((u) => factionFilter.has(u.faction))
      .filter(
        (u) =>
          !search ||
          u.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allUnits, factionFilter, search]);

  const filteredNCUs = useMemo(() => {
    return allNCUs
      .filter((n) => factionFilter.has(n.faction))
      .filter(
        (n) =>
          !search ||
          n.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allNCUs, factionFilter, search]);

  const filteredAttachments = useMemo(() => {
    return allAttachments
      .filter((a) => factionFilter.has(a.faction))
      .filter(
        (a) =>
          !search ||
          a.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allAttachments, factionFilter, search]);

  const filteredTactics = useMemo(() => {
    return allTactics
      .filter((t) => factionFilter.has(t.faction))
      .filter(
        (t) =>
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allTactics, factionFilter, search]);

  // Build ability & order entries with possessor cross-references
  const { abilityEntries, orderEntries } = useMemo(() => {
    const abilitiesMap = getAllAbilities();
    const possessorMap = new Map<string, { units: GameUnit[]; attachments: GameAttachment[] }>();

    for (const unit of allUnits) {
      for (const aName of unit.abilities) {
        const key = aName.toUpperCase();
        if (!possessorMap.has(key)) possessorMap.set(key, { units: [], attachments: [] });
        possessorMap.get(key)!.units.push(unit);
      }
    }
    for (const att of allAttachments) {
      for (const aName of att.abilities) {
        const key = aName.toUpperCase();
        if (!possessorMap.has(key)) possessorMap.set(key, { units: [], attachments: [] });
        possessorMap.get(key)!.attachments.push(att);
      }
    }

    const abilities: WikiAbilityEntry[] = [];
    const orders: WikiAbilityEntry[] = [];

    for (const [name, definition] of Object.entries(abilitiesMap)) {
      const possessors = possessorMap.get(name) ?? { units: [], attachments: [] };
      const factions = new Set<FactionId>();
      for (const u of possessors.units) factions.add(u.faction);
      for (const a of possessors.attachments) factions.add(a.faction);

      const isOrder = name.startsWith("ORDER: ");
      const displayName = isOrder ? name.slice(7) : name;

      const entry: WikiAbilityEntry = {
        name,
        displayName,
        definition,
        units: possessors.units,
        attachments: possessors.attachments,
        factions,
      };

      if (isOrder) {
        orders.push(entry);
      } else {
        abilities.push(entry);
      }
    }

    abilities.sort((a, b) => a.displayName.localeCompare(b.displayName));
    orders.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { abilityEntries: abilities, orderEntries: orders };
  }, [allUnits, allAttachments]);

  // Filter abilities by search and faction
  const filteredAbilities = useMemo(() => {
    return abilityEntries.filter((entry) => {
      const matchesSearch =
        !search || entry.displayName.toLowerCase().includes(search.toLowerCase());
      const matchesFaction =
        entry.factions.size === 0 ||
        [...entry.factions].some((f) => factionFilter.has(f));
      return matchesSearch && matchesFaction;
    });
  }, [abilityEntries, factionFilter, search]);

  const filteredOrders = useMemo(() => {
    return orderEntries.filter((entry) => {
      const matchesSearch =
        !search || entry.displayName.toLowerCase().includes(search.toLowerCase());
      const matchesFaction =
        entry.factions.size === 0 ||
        [...entry.factions].some((f) => factionFilter.has(f));
      return matchesSearch && matchesFaction;
    });
  }, [orderEntries, factionFilter, search]);

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Reset search when switching tabs
  const handleTabChange = (tab: WikiTab) => {
    setActiveTab(tab);
    setSearch("");
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-stone-900 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/playtest" className="text-stone-400 hover:text-stone-200 text-sm transition-colors">&larr; Back</Link>
        </div>
        <PageHeader
          title="Playtest Wiki"
          description="Browse all playtest card data and abilities — January 2026 Pre-Season"
        />
        <div className="mb-4">
          <Badge variant="info" size="sm">PLAYTEST</Badge>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-700 mb-6 overflow-x-auto">
          {WIKI_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-400"
                    : "border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-600"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Faction Filter */}
        <div className="mb-4 space-y-3">
          <SearchInput
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
          />
          <FactionFilter
            selected={factionFilter}
            onToggle={handleToggleFaction}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>

        {/* ============================================================= */}
        {/* UNITS TAB                                                      */}
        {/* ============================================================= */}
        {activeTab === "units" && (
          <div>
            <p className="text-xs text-stone-500 mb-3">
              {filteredUnits.length} unit{filteredUnits.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {filteredUnits.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-stone-500 text-center py-6">
                    No units match your search or filter.
                  </p>
                </Card>
              ) : (
                filteredUnits.map((u) => {
                  const fi = getFactionInfo(u.faction);
                  const isExpanded = expandedId === u.id;
                  return (
                    <Card
                      key={u.id}
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div className="flex items-stretch">
                        <div
                          className="w-1.5 shrink-0 self-stretch"
                          style={{ backgroundColor: fi.cardColor }}
                        />
                        <div className="flex-1 min-w-0 p-2.5 sm:p-3" style={{ backgroundColor: `${fi.cardColor}20` }}>
                          <div className="flex items-stretch justify-between gap-2">
                            <div
                              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                              onClick={() => toggleExpanded(u.id)}
                            >
                              <img
                                src={fi.crestUrl}
                                alt={fi.shortName}
                                className="w-5 h-5 object-contain shrink-0"
                              />
                              <p className="text-sm font-medium text-stone-100 truncate">
                                {u.name}
                              </p>
                              <Badge variant="default" size="sm">
                                {u.cost} pts
                              </Badge>
                              <Badge variant="default" size="sm">
                                {capitalize(u.tray)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="w-10 self-stretch overflow-hidden rounded-sm">
                                <img
                                  src={getPortraitUrl(u.id)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                              <button
                                className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-teal-400 transition-colors"
                                onClick={() =>
                                  openCard(u.id, u.name, u.faction)
                                }
                                title="View card"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5">
                              <StatLine defense={u.defense} morale={u.morale} speed={u.speed} />
                              <DetailRow label="Faction" value={fi.displayName} />
                              {u.attacks.map((atk, i) => (
                                <div
                                  key={i}
                                  className="text-xs border-t border-stone-800 pt-1.5 mt-1.5"
                                >
                                  <p className="text-stone-300 font-medium">
                                    {atk.name}{" "}
                                    <span className="text-stone-500">
                                      ({atk.type})
                                    </span>
                                  </p>
                                  <p className="text-stone-500">
                                    Hit: {atk.hit}+ &middot; Dice:{" "}
                                    {atk.dice.join("/")}
                                  </p>
                                </div>
                              ))}
                              {u.abilities.length > 0 && (
                                <div className="border-t border-stone-800 pt-1.5 mt-1.5">
                                  <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-1">
                                    Abilities
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {u.abilities.map((aName) => (
                                      <Badge
                                        key={aName}
                                        variant="info"
                                        size="sm"
                                      >
                                        {aName}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* ATTACHMENTS TAB                                                */}
        {/* ============================================================= */}
        {activeTab === "attachments" && (
          <div>
            <p className="text-xs text-stone-500 mb-3">
              {filteredAttachments.length} attachment
              {filteredAttachments.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {filteredAttachments.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-stone-500 text-center py-6">
                    No attachments match your search or filter.
                  </p>
                </Card>
              ) : (
                filteredAttachments.map((a) => {
                  const fi = getFactionInfo(a.faction);
                  const isExpanded = expandedId === a.id;
                  return (
                    <Card
                      key={a.id}
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div className="flex items-stretch">
                        <div
                          className="w-1.5 shrink-0 self-stretch"
                          style={{ backgroundColor: fi.cardColor }}
                        />
                        <div className="flex-1 min-w-0 p-2.5 sm:p-3" style={{ backgroundColor: `${fi.cardColor}20` }}>
                          <div className="flex items-stretch justify-between gap-2">
                            <div
                              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                              onClick={() => toggleExpanded(a.id)}
                            >
                              <img
                                src={fi.crestUrl}
                                alt={fi.shortName}
                                className="w-5 h-5 object-contain shrink-0"
                              />
                              <p className="text-sm font-medium text-stone-100 truncate">
                                {a.name}
                              </p>
                              {a.cost !== undefined && a.cost > 0 && (
                                <Badge variant="default" size="sm">
                                  +{a.cost} pts
                                </Badge>
                              )}
                              {a.cost === 0 && (
                                <Badge variant="default" size="sm">
                                  Free
                                </Badge>
                              )}
                              <Badge variant="default" size="sm">
                                {capitalize(a.tray)}
                              </Badge>
                              {a.commander && (
                                <Badge variant="warning" size="sm">
                                  Commander
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="w-10 self-stretch overflow-hidden rounded-sm">
                                <img
                                  src={getPortraitUrl(a.id)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                              <button
                                className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-teal-400 transition-colors"
                                onClick={() =>
                                  openCard(a.id, a.name, a.faction)
                                }
                                title="View card"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {a.title && (
                            <p className="text-xs text-stone-400 mt-0.5 ml-7">
                              {a.title}
                            </p>
                          )}

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5">
                              <DetailRow
                                label="Faction"
                                value={fi.displayName}
                              />
                              <DetailRow label="Tray" value={capitalize(a.tray)} />
                              {a.commander && (
                                <DetailRow label="Type" value="Commander" />
                              )}
                              {a.character && (
                                <DetailRow label="Character" value="Yes" />
                              )}
                              {a.abilities.length > 0 && (
                                <div className="border-t border-stone-800 pt-1.5 mt-1.5">
                                  <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-1">
                                    Abilities
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {a.abilities.map((aName) => (
                                      <Badge
                                        key={aName}
                                        variant="info"
                                        size="sm"
                                      >
                                        {aName}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* NCUs TAB                                                       */}
        {/* ============================================================= */}
        {activeTab === "ncus" && (
          <div>
            <p className="text-xs text-stone-500 mb-3">
              {filteredNCUs.length} NCU{filteredNCUs.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {filteredNCUs.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-stone-500 text-center py-6">
                    No NCUs match your search or filter.
                  </p>
                </Card>
              ) : (
                filteredNCUs.map((n) => {
                  const fi = getFactionInfo(n.faction);
                  const isExpanded = expandedId === n.id;
                  return (
                    <Card
                      key={n.id}
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div className="flex items-stretch">
                        <div
                          className="w-1.5 shrink-0 self-stretch"
                          style={{ backgroundColor: fi.cardColor }}
                        />
                        <div className="flex-1 min-w-0 p-2.5 sm:p-3" style={{ backgroundColor: `${fi.cardColor}20` }}>
                          <div className="flex items-stretch justify-between gap-2">
                            <div
                              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                              onClick={() => toggleExpanded(n.id)}
                            >
                              <img
                                src={fi.crestUrl}
                                alt={fi.shortName}
                                className="w-5 h-5 object-contain shrink-0"
                              />
                              <p className="text-sm font-medium text-stone-100 truncate">
                                {n.name}
                              </p>
                              <Badge variant="default" size="sm">
                                {n.cost} pts
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="w-10 self-stretch overflow-hidden rounded-sm">
                                <img
                                  src={getPortraitUrl(n.id)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                              <button
                                className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-teal-400 transition-colors"
                                onClick={() =>
                                  openCard(n.id, n.name, n.faction)
                                }
                                title="View card"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {n.title && (
                            <p className="text-xs text-stone-400 mt-0.5 ml-7">
                              {n.title}
                            </p>
                          )}

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-stone-800 space-y-1.5">
                              <DetailRow
                                label="Faction"
                                value={fi.displayName}
                              />
                              <DetailRow label="Cost" value={`${n.cost} pts`} />
                              {n.character && (
                                <DetailRow label="Character" value="Yes" />
                              )}
                              {n.abilities.length > 0 && (
                                <div className="border-t border-stone-800 pt-1.5 mt-1.5">
                                  <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-1">
                                    Abilities
                                  </p>
                                  <div className="space-y-2">
                                    {n.abilities.map((ab, i) => (
                                      <div key={i}>
                                        <p className="text-xs font-medium text-stone-300">
                                          {ab.name}
                                        </p>
                                        {ab.effect.map((line, j) => (
                                          <p
                                            key={j}
                                            className="text-[11px] text-stone-500 leading-relaxed"
                                          >
                                            {line}
                                          </p>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TACTICS TAB                                                    */}
        {/* ============================================================= */}
        {activeTab === "tactics" && (
          <div>
            <p className="text-xs text-stone-500 mb-3">
              {filteredTactics.length} tactics card
              {filteredTactics.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {filteredTactics.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-stone-500 text-center py-6">
                    No tactics cards match your search or filter.
                  </p>
                </Card>
              ) : (
                filteredTactics.map((t) => {
                  const fi = getFactionInfo(t.faction);
                  const isExpanded = expandedId === t.id;
                  return (
                    <Card
                      key={t.id}
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-1.5 shrink-0 self-stretch"
                          style={{ backgroundColor: fi.cardColor }}
                        />
                        <div className="flex-1 min-w-0 p-2.5 sm:p-3" style={{ backgroundColor: `${fi.cardColor}20` }}>
                          <div className="flex items-center justify-between gap-2">
                            <div
                              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                              onClick={() => toggleExpanded(t.id)}
                            >
                              <img
                                src={fi.crestUrl}
                                alt={fi.shortName}
                                className="w-5 h-5 object-contain shrink-0"
                              />
                              <p className="text-sm font-medium text-stone-100 truncate">
                                {t.name}
                              </p>
                              {t.commander && (
                                <Badge variant="warning" size="sm">
                                  Commander
                                </Badge>
                              )}
                            </div>
                            <button
                              className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-teal-400 transition-colors"
                              onClick={() =>
                                openCard(t.id, t.name, t.faction)
                              }
                              title="View card"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-stone-800 space-y-2">
                              <DetailRow
                                label="Faction"
                                value={fi.displayName}
                              />
                              {t.commander && (
                                <DetailRow
                                  label="Commander Card"
                                  value="Yes"
                                />
                              )}
                              {t.text.map((entry, i) => (
                                <div
                                  key={i}
                                  className="border-t border-stone-800 pt-2"
                                >
                                  <p className="text-xs font-medium text-teal-400 mb-0.5">
                                    {entry.trigger}
                                  </p>
                                  {entry.effect.map((line, j) => (
                                    <p
                                      key={j}
                                      className="text-[11px] text-stone-400 leading-relaxed"
                                    >
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* ABILITIES TAB                                                  */}
        {/* ============================================================= */}
        {activeTab === "abilities" && (
          <div>
            <p className="text-xs text-stone-500 mb-3">
              {filteredAbilities.length} abilit{filteredAbilities.length !== 1 ? "ies" : "y"}
            </p>
            <div className="space-y-2">
              {filteredAbilities.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-stone-500 text-center py-6">
                    No abilities match your search or filter.
                  </p>
                </Card>
              ) : (
                filteredAbilities.map((entry) => {
                  const isExpanded = expandedId === `ability-${entry.name}`;
                  return (
                    <Card
                      key={entry.name}
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div className="p-3">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleExpanded(`ability-${entry.name}`)}
                        >
                          <p className="text-sm font-medium text-stone-100">
                            {entry.displayName}
                          </p>
                          {entry.definition.trigger && (
                            <Badge variant="warning" size="sm">
                              Triggered
                            </Badge>
                          )}
                          <span className="text-[10px] text-stone-600 ml-auto">
                            {entry.units.length + entry.attachments.length} possessor{entry.units.length + entry.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-800 space-y-3">
                            {entry.definition.trigger && (
                              <div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-0.5">
                                  Trigger
                                </p>
                                <p className="text-xs text-teal-400">
                                  {entry.definition.trigger}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-0.5">
                                Effect
                              </p>
                              {entry.definition.effect.map((line, i) => (
                                <p
                                  key={i}
                                  className="text-[11px] text-stone-400 leading-relaxed"
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                            {(entry.units.length > 0 || entry.attachments.length > 0) && (
                              <div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-1">
                                  Possessed By
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {entry.units.map((u) => {
                                    const fi = getFactionInfo(u.faction);
                                    return (
                                      <span
                                        key={u.id}
                                        className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-800/50 px-2 py-0.5 text-[10px] text-stone-300"
                                      >
                                        <img
                                          src={fi.crestUrl}
                                          alt={fi.shortName}
                                          className="w-3 h-3 object-contain"
                                        />
                                        {u.name}
                                      </span>
                                    );
                                  })}
                                  {entry.attachments.map((a) => {
                                    const fi = getFactionInfo(a.faction);
                                    return (
                                      <span
                                        key={a.id}
                                        className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-800/50 px-2 py-0.5 text-[10px] text-stone-300"
                                      >
                                        <img
                                          src={fi.crestUrl}
                                          alt={fi.shortName}
                                          className="w-3 h-3 object-contain"
                                        />
                                        {a.name}
                                        <span className="text-stone-600">(Att)</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* ORDERS TAB                                                     */}
        {/* ============================================================= */}
        {activeTab === "orders" && (
          <div>
            <p className="text-xs text-stone-500 mb-3">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {filteredOrders.length === 0 ? (
                <Card padding="md">
                  <p className="text-sm text-stone-500 text-center py-6">
                    No orders match your search or filter.
                  </p>
                </Card>
              ) : (
                filteredOrders.map((entry) => {
                  const isExpanded = expandedId === `order-${entry.name}`;
                  return (
                    <Card
                      key={entry.name}
                      padding="none"
                      className="overflow-hidden"
                    >
                      <div className="p-3">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleExpanded(`order-${entry.name}`)}
                        >
                          <Badge variant="warning" size="sm">
                            Order
                          </Badge>
                          <p className="text-sm font-medium text-stone-100">
                            {entry.displayName}
                          </p>
                          <span className="text-[10px] text-stone-600 ml-auto">
                            {entry.units.length + entry.attachments.length} possessor{entry.units.length + entry.attachments.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-stone-800 space-y-3">
                            {entry.definition.trigger && (
                              <div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-0.5">
                                  Trigger
                                </p>
                                <p className="text-xs text-teal-400">
                                  {entry.definition.trigger}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-0.5">
                                Effect
                              </p>
                              {entry.definition.effect.map((line, i) => (
                                <p
                                  key={i}
                                  className="text-[11px] text-stone-400 leading-relaxed"
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                            {(entry.units.length > 0 || entry.attachments.length > 0) && (
                              <div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold mb-1">
                                  Possessed By
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {entry.units.map((u) => {
                                    const fi = getFactionInfo(u.faction);
                                    return (
                                      <span
                                        key={u.id}
                                        className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-800/50 px-2 py-0.5 text-[10px] text-stone-300"
                                      >
                                        <img
                                          src={fi.crestUrl}
                                          alt={fi.shortName}
                                          className="w-3 h-3 object-contain"
                                        />
                                        {u.name}
                                      </span>
                                    );
                                  })}
                                  {entry.attachments.map((a) => {
                                    const fi = getFactionInfo(a.faction);
                                    return (
                                      <span
                                        key={a.id}
                                        className="inline-flex items-center gap-1 rounded-full border border-stone-700 bg-stone-800/50 px-2 py-0.5 text-[10px] text-stone-300"
                                      >
                                        <img
                                          src={fi.crestUrl}
                                          alt={fi.shortName}
                                          className="w-3 h-3 object-contain"
                                        />
                                        {a.name}
                                        <span className="text-stone-600">(Att)</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Image Viewer */}
      <CardImageModal
        isOpen={cardViewer.isOpen}
        onClose={closeCard}
        cardId={cardViewer.cardId}
        cardName={cardViewer.cardName}
        faction={cardViewer.faction}
      />
    </div>
  );
}
