// =============================================================================
// Playtest Data Loader - merges January 2026 Pre-Season playtest data with base
// =============================================================================

import type {
  FactionId,
  FactionData,
  AbilitiesMap,
  GameUnit,
  GameNCU,
  GameAttachment,
  GameTactics,
  AbilityDefinition,
} from "../types/game-data";

// Base data access
import {
  getFactionData,
  getAllAbilities as getBaseAbilities,
  findUnitById as baseFindUnitById,
  findNCUById as baseFindNCUById,
  findAttachmentById as baseFindAttachmentById,
  findTacticsById as baseFindTacticsById,
} from "./loader";

// Playtest overlays
import playtestStarkData from "@/data/playtest/stark.json";
import playtestLannisterData from "@/data/playtest/lannister.json";
import playtestAbilitiesData from "@/data/playtest/abilities.json";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PLAYTEST_FACTION_IDS: FactionId[] = ["stark", "lannister"];
const PLAYTEST_AVAILABLE_FACTIONS: FactionId[] = ["stark", "lannister", "neutral"];

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

const playtestOverlays: Partial<Record<FactionId, FactionData>> = {
  stark: playtestStarkData as unknown as FactionData,
  lannister: playtestLannisterData as unknown as FactionData,
};

const playtestAbilities: AbilitiesMap = playtestAbilitiesData as unknown as AbilitiesMap;

function mergeEntities<T extends { id: string }>(base: T[], overlay: T[]): T[] {
  const overlayIds = new Set(overlay.map((e) => e.id));
  return [...base.filter((e) => !overlayIds.has(e.id)), ...overlay];
}

// ---------------------------------------------------------------------------
// Build merged faction data
// ---------------------------------------------------------------------------

function buildPlaytestFactionData(factionId: FactionId): FactionData {
  const base = getFactionData(factionId);
  const overlay = playtestOverlays[factionId];
  if (!overlay) return base; // neutral or others — pass through unchanged

  const units = mergeEntities(base.unit ?? [], overlay.unit ?? []);
  const attachments = mergeEntities(base.attachment ?? [], overlay.attachment ?? []);
  const ncus = mergeEntities(base.ncu ?? [], overlay.ncu ?? []);

  // Tactics merge: replace base faction tactics entirely, keep base commander tactics
  // for commanders NOT overridden in playtest
  const overlayTacticIds = new Set((overlay.tactics ?? []).map((t) => t.id));
  const baseCmdTactics = (base.tactics ?? []).filter(
    (t) => t.commander && !overlayTacticIds.has(t.id)
  );
  const tactics = [...baseCmdTactics, ...(overlay.tactics ?? [])];

  return {
    _meta: base._meta,
    unit: units,
    ncu: ncus,
    attachment: attachments,
    tactics,
  };
}

// Pre-build merged data for playtest factions
const PLAYTEST_FACTION_DATA: Partial<Record<FactionId, FactionData>> = {};
for (const fid of PLAYTEST_AVAILABLE_FACTIONS) {
  PLAYTEST_FACTION_DATA[fid] = buildPlaytestFactionData(fid);
}

// Build lookup maps
const unitMap = new Map<string, GameUnit>();
const ncuMap = new Map<string, GameNCU>();
const attachmentMap = new Map<string, GameAttachment>();
const tacticsMap = new Map<string, GameTactics>();

for (const factionData of Object.values(PLAYTEST_FACTION_DATA)) {
  if (!factionData) continue;
  for (const unit of factionData.unit ?? []) unitMap.set(unit.id, unit);
  for (const ncu of factionData.ncu ?? []) ncuMap.set(ncu.id, ncu);
  for (const att of factionData.attachment ?? []) attachmentMap.set(att.id, att);
  for (const tac of factionData.tactics ?? []) tacticsMap.set(tac.id, tac);
}

// Merged abilities: base + playtest overrides
const mergedAbilities: AbilitiesMap = { ...getBaseAbilities(), ...playtestAbilities };

// ---------------------------------------------------------------------------
// Public API — mirrors loader.ts signatures
// ---------------------------------------------------------------------------

export function getPlaytestFactionData(factionId: FactionId): FactionData | undefined {
  return PLAYTEST_FACTION_DATA[factionId];
}

// ---- Abilities ----

export function getAbility(name: string): AbilityDefinition | undefined {
  return mergedAbilities[name];
}

export function getAllAbilities(): AbilitiesMap {
  return mergedAbilities;
}

// ---- Units ----

export function getFactionUnits(factionId: FactionId): GameUnit[] {
  return PLAYTEST_FACTION_DATA[factionId]?.unit ?? [];
}

export function getNeutralUnits(): GameUnit[] {
  return PLAYTEST_FACTION_DATA.neutral?.unit ?? [];
}

export function getAvailableUnits(factionId: FactionId): GameUnit[] {
  if (factionId === "neutral") return getNeutralUnits();
  return [...getFactionUnits(factionId), ...getNeutralUnits()];
}

export function findUnitById(id: string): GameUnit | undefined {
  return unitMap.get(id) ?? baseFindUnitById(id);
}

// ---- NCUs ----

export function getFactionNCUs(factionId: FactionId): GameNCU[] {
  return PLAYTEST_FACTION_DATA[factionId]?.ncu ?? [];
}

export function getNeutralNCUs(): GameNCU[] {
  return PLAYTEST_FACTION_DATA.neutral?.ncu ?? [];
}

export function getAvailableNCUs(factionId: FactionId): GameNCU[] {
  if (factionId === "neutral") return getNeutralNCUs();
  return [...getFactionNCUs(factionId), ...getNeutralNCUs()];
}

export function findNCUById(id: string): GameNCU | undefined {
  return ncuMap.get(id) ?? baseFindNCUById(id);
}

// ---- Attachments ----

export function getFactionAttachments(factionId: FactionId): GameAttachment[] {
  return PLAYTEST_FACTION_DATA[factionId]?.attachment ?? [];
}

export function getNeutralAttachments(): GameAttachment[] {
  return PLAYTEST_FACTION_DATA.neutral?.attachment ?? [];
}

export function getAvailableAttachments(factionId: FactionId): GameAttachment[] {
  if (factionId === "neutral") return getNeutralAttachments();
  return [...getFactionAttachments(factionId), ...getNeutralAttachments()];
}

export function getCommanders(factionId: FactionId): GameAttachment[] {
  const factionCommanders = getFactionAttachments(factionId).filter(
    (a) => a.commander
  );
  const neutralCommanders =
    factionId !== "neutral"
      ? getNeutralAttachments().filter((a) => a.commander)
      : [];
  return [...factionCommanders, ...neutralCommanders];
}

export function findAttachmentById(id: string): GameAttachment | undefined {
  return attachmentMap.get(id) ?? baseFindAttachmentById(id);
}

// ---- Tactics ----

export function getFactionTactics(factionId: FactionId): GameTactics[] {
  return PLAYTEST_FACTION_DATA[factionId]?.tactics ?? [];
}

export function getBaseFactionTactics(factionId: FactionId): GameTactics[] {
  return getFactionTactics(factionId).filter((t) => !t.commander);
}

export function getCommanderTactics(commanderId: string): GameTactics[] {
  const commander = findAttachmentById(commanderId);
  if (!commander?.tactics) return [];
  return commander.tactics
    .map((id) => tacticsMap.get(id) ?? baseFindTacticsById(id))
    .filter((t): t is GameTactics => t !== undefined);
}

export function findTacticsById(id: string): GameTactics | undefined {
  return tacticsMap.get(id) ?? baseFindTacticsById(id);
}

// ---- All entities (across playtest factions only) ----

export function getAllUnits(): GameUnit[] {
  return Array.from(unitMap.values());
}

export function getAllNCUs(): GameNCU[] {
  return Array.from(ncuMap.values());
}

export function getAllAttachments(): GameAttachment[] {
  return Array.from(attachmentMap.values());
}

export function getAllTactics(): GameTactics[] {
  return Array.from(tacticsMap.values());
}
