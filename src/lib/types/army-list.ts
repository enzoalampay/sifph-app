// =============================================================================
// Army List Domain Types
// =============================================================================

import { FactionId } from "./game-data";

export interface ArmyUnitSlot {
  id: string; // slot UUID
  unitId: string; // references GameUnit.id
  attachmentIds: string[]; // references GameAttachment.id (usually 0 or 1)
}

export interface ArmyNCUSlot {
  id: string; // slot UUID
  ncuId: string; // references GameNCU.id
}

export interface ArmyList {
  id: string; // UUID
  name: string;
  faction: FactionId;
  pointLimit: number; // 30, 40, or 50
  commanderId: string | null; // references GameAttachment.id where commander=true
  commanderUnitSlotId: string | null; // which unit slot the commander is attached to
  units: ArmyUnitSlot[];
  ncus: ArmyNCUSlot[];
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  playerId?: string; // linked player if any
}

export interface ArmyValidationError {
  code: string;
  message: string;
  severity: "error" | "warning";
  affectedIds?: string[];
}

export interface ComputedTacticsDeck {
  factionTactics: string[]; // tactic IDs from the faction (non-commander)
  commanderTactics: string[]; // tactic IDs from the commander
}

export const DEFAULT_POINT_LIMITS = [30, 40, 50] as const;

export function createEmptyArmyList(
  faction: FactionId,
  pointLimit: number = 40
): ArmyList {
  return {
    id: crypto.randomUUID(),
    name: "New Army List",
    faction,
    pointLimit,
    commanderId: null,
    commanderUnitSlotId: null,
    units: [],
    ncus: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
