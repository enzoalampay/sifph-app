// =============================================================================
// Game Data Loader - static imports of all faction JSON files
// =============================================================================

import type {
  FactionId,
  FactionData,
  AbilitiesMap,
  GameUnit,
  GameNCU,
  GameAttachment,
  GameTactics,
  GameSpecial,
  AbilityDefinition,
} from "../types/game-data";

// Static imports of all faction data
import abilitiesData from "@/data/en/abilities.json";
import gameData from "@/data/en/game.json";
import starkData from "@/data/en/stark.json";
import lannisterData from "@/data/en/lannister.json";
import baratheonData from "@/data/en/baratheon.json";
import boltonData from "@/data/en/bolton.json";
import brotherhoodData from "@/data/en/brotherhood.json";
import freefolkData from "@/data/en/freefolk.json";
import greyjoyData from "@/data/en/greyjoy.json";
import martellData from "@/data/en/martell.json";
import neutralData from "@/data/en/neutral.json";
import nightswatchData from "@/data/en/nightswatch.json";
import targaryenData from "@/data/en/targaryen.json";

// Cast to typed data
const abilities: AbilitiesMap = abilitiesData as unknown as AbilitiesMap;

const FACTION_DATA: Record<FactionId, FactionData> = {
  stark: starkData as unknown as FactionData,
  lannister: lannisterData as unknown as FactionData,
  baratheon: baratheonData as unknown as FactionData,
  bolton: boltonData as unknown as FactionData,
  brotherhood: brotherhoodData as unknown as FactionData,
  freefolk: freefolkData as unknown as FactionData,
  greyjoy: greyjoyData as unknown as FactionData,
  martell: martellData as unknown as FactionData,
  neutral: neutralData as unknown as FactionData,
  nightswatch: nightswatchData as unknown as FactionData,
  targaryen: targaryenData as unknown as FactionData,
};

// Build lookup maps for fast ID-based access
const unitMap = new Map<string, GameUnit>();
const ncuMap = new Map<string, GameNCU>();
const attachmentMap = new Map<string, GameAttachment>();
const tacticsMap = new Map<string, GameTactics>();
const specialMap = new Map<string, GameSpecial>();

for (const factionData of Object.values(FACTION_DATA)) {
  for (const unit of factionData.unit ?? []) unitMap.set(unit.id, unit);
  for (const ncu of factionData.ncu ?? []) ncuMap.set(ncu.id, ncu);
  for (const att of factionData.attachment ?? []) attachmentMap.set(att.id, att);
  for (const tac of factionData.tactics ?? []) tacticsMap.set(tac.id, tac);
  for (const spec of factionData.special ?? []) specialMap.set(spec.id, spec);
}

// ---- Faction data access ----

export function getFactionData(factionId: FactionId): FactionData {
  return FACTION_DATA[factionId];
}

export function getGameData() {
  return gameData;
}

// ---- Ability lookup ----

export function getAbility(name: string): AbilityDefinition | undefined {
  return abilities[name];
}

export function getAllAbilities(): AbilitiesMap {
  return abilities;
}

// ---- Units ----

export function getFactionUnits(factionId: FactionId): GameUnit[] {
  return FACTION_DATA[factionId]?.unit ?? [];
}

export function getNeutralUnits(): GameUnit[] {
  return FACTION_DATA.neutral?.unit ?? [];
}

export function getAvailableUnits(factionId: FactionId): GameUnit[] {
  if (factionId === "neutral") return getNeutralUnits();
  return [...getFactionUnits(factionId), ...getNeutralUnits()];
}

export function findUnitById(id: string): GameUnit | undefined {
  return unitMap.get(id);
}

// ---- NCUs ----

export function getFactionNCUs(factionId: FactionId): GameNCU[] {
  return FACTION_DATA[factionId]?.ncu ?? [];
}

export function getNeutralNCUs(): GameNCU[] {
  return FACTION_DATA.neutral?.ncu ?? [];
}

export function getAvailableNCUs(factionId: FactionId): GameNCU[] {
  if (factionId === "neutral") return getNeutralNCUs();
  return [...getFactionNCUs(factionId), ...getNeutralNCUs()];
}

export function findNCUById(id: string): GameNCU | undefined {
  return ncuMap.get(id);
}

// ---- Attachments ----

export function getFactionAttachments(factionId: FactionId): GameAttachment[] {
  return FACTION_DATA[factionId]?.attachment ?? [];
}

export function getNeutralAttachments(): GameAttachment[] {
  return FACTION_DATA.neutral?.attachment ?? [];
}

export function getAvailableAttachments(
  factionId: FactionId
): GameAttachment[] {
  if (factionId === "neutral") return getNeutralAttachments();
  return [...getFactionAttachments(factionId), ...getNeutralAttachments()];
}

export function getCommanders(factionId: FactionId): GameAttachment[] {
  const factionCommanders = getFactionAttachments(factionId).filter(
    (a) => a.commander
  );
  // Also include neutral commanders
  const neutralCommanders =
    factionId !== "neutral"
      ? getNeutralAttachments().filter((a) => a.commander)
      : [];
  return [...factionCommanders, ...neutralCommanders];
}

export function findAttachmentById(
  id: string
): GameAttachment | undefined {
  return attachmentMap.get(id);
}

// ---- Tactics ----

export function getFactionTactics(factionId: FactionId): GameTactics[] {
  return FACTION_DATA[factionId]?.tactics ?? [];
}

export function getBaseFactionTactics(factionId: FactionId): GameTactics[] {
  return getFactionTactics(factionId).filter((t) => !t.commander);
}

export function getCommanderTactics(commanderId: string): GameTactics[] {
  const commander = findAttachmentById(commanderId);
  if (!commander?.tactics) return [];
  return commander.tactics
    .map((id) => tacticsMap.get(id))
    .filter((t): t is GameTactics => t !== undefined);
}

export function findTacticsById(id: string): GameTactics | undefined {
  return tacticsMap.get(id);
}

// ---- Specials ----

export function findSpecialById(id: string): GameSpecial | undefined {
  return specialMap.get(id);
}

// ---- All entities across all factions ----

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

// ---- Combined lookup for any entity by ID ----

export function findEntityById(
  id: string
):
  | { type: "unit"; data: GameUnit }
  | { type: "ncu"; data: GameNCU }
  | { type: "attachment"; data: GameAttachment }
  | { type: "tactics"; data: GameTactics }
  | undefined {
  const unit = unitMap.get(id);
  if (unit) return { type: "unit", data: unit };

  const ncu = ncuMap.get(id);
  if (ncu) return { type: "ncu", data: ncu };

  const att = attachmentMap.get(id);
  if (att) return { type: "attachment", data: att };

  const tac = tacticsMap.get(id);
  if (tac) return { type: "tactics", data: tac };

  return undefined;
}
