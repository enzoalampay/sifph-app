/**
 * WarCouncil Import — Decode a WarCouncil share code into an army list.
 *
 * The WarCouncil app exports army lists as Base64-encoded protobuf messages.
 * The protobuf structure:
 *   Field 2 (string): Army name
 *   Field 3 (varint): Faction code (1=Lannister, 2=Stark, etc.)
 *   Field 4 (varint): Point limit
 *   Field 5 (varint): Unknown flag (always 1?)
 *   Field 11 (repeated sub-msg): Combat unit slots
 *     Sub-field 1 (varint): Unit ID (1xxxx)
 *     Sub-field 2 (varint): Attachment ID (2xxxx)
 *   Field 12 (repeated varint): NCU IDs (3xxxx)
 *
 * The numeric IDs match the game data string IDs from asoiaf-tmg-data.
 */

import { FactionId } from "@/lib/types/game-data";
import { ArmyList, ArmyUnitSlot, ArmyNCUSlot } from "@/lib/types/army-list";
import { findUnitById, findAttachmentById, findNCUById } from "@/lib/data/loader";
import { generateId } from "@/lib/utils/id";

// ---------------------------------------------------------------------------
// Faction code mapping (WarCouncil varint → FactionId)
// ---------------------------------------------------------------------------

const WC_FACTION_MAP: Record<number, FactionId> = {
  1: "lannister",
  2: "stark",
  3: "freefolk",
  4: "neutral",
  5: "nightswatch",
  6: "baratheon",
  7: "targaryen",
  8: "greyjoy",
  9: "martell",
  10: "bolton",
  11: "brotherhood",
};

// ---------------------------------------------------------------------------
// Protobuf-lite decoder (no external deps)
// ---------------------------------------------------------------------------

function decodeVarint(buf: Uint8Array, offset: number): [number, number] {
  let val = 0;
  let shift = 0;
  let i = offset;
  while (i < buf.length) {
    const b = buf[i];
    val |= (b & 0x7f) << shift;
    shift += 7;
    i++;
    if ((b & 0x80) === 0) break;
  }
  return [val, i];
}

interface WCUnitSlot {
  unitId: number;
  attachmentId: number | null;
}

interface WCDecodedList {
  name: string;
  factionCode: number;
  faction: FactionId | null;
  pointLimit: number;
  units: WCUnitSlot[];
  ncuIds: number[];
}

function decodeProtobuf(buf: Uint8Array): WCDecodedList {
  const result: WCDecodedList = {
    name: "",
    factionCode: 0,
    faction: null,
    pointLimit: 40,
    units: [],
    ncuIds: [],
  };

  let i = 0;
  while (i < buf.length) {
    const byte = buf[i];
    const fieldNum = byte >> 3;
    const wireType = byte & 0x07;
    i++;

    if (wireType === 0) {
      // Varint
      const [val, next] = decodeVarint(buf, i);
      i = next;

      if (fieldNum === 3) result.factionCode = val;
      else if (fieldNum === 4) result.pointLimit = val;
      else if (fieldNum === 12) result.ncuIds.push(val);
      // Field 5 and 13 (special/enemy attachments) are ignored for now
    } else if (wireType === 2) {
      // Length-delimited
      const [len, lenNext] = decodeVarint(buf, i);
      i = lenNext;
      const data = buf.slice(i, i + len);
      i += len;

      if (fieldNum === 2) {
        // Army name
        result.name = new TextDecoder().decode(data);
      } else if (fieldNum === 11) {
        // Unit slot sub-message
        const slot: WCUnitSlot = { unitId: 0, attachmentId: null };
        let j = 0;
        while (j < data.length) {
          const sb = data[j];
          const sfn = sb >> 3;
          const swt = sb & 0x07;
          j++;
          if (swt === 0) {
            const [sval, snext] = decodeVarint(data, j);
            j = snext;
            if (sfn === 1) slot.unitId = sval;
            else if (sfn === 2) slot.attachmentId = sval;
          } else {
            // Skip unknown wire types in sub-message
            break;
          }
        }
        if (slot.unitId > 0) {
          result.units.push(slot);
        }
      }
    } else {
      // Unknown wire type — skip byte
      // (Wire type 5 = 32-bit, etc.)
    }
  }

  result.faction = WC_FACTION_MAP[result.factionCode] ?? null;
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface WCImportResult {
  success: boolean;
  error?: string;
  army?: ArmyList;
  warnings: string[];
  decoded?: WCDecodedList;
}

/**
 * Decode a WarCouncil share code and convert it into an ArmyList.
 */
export function importWarCouncilCode(code: string): WCImportResult {
  const warnings: string[] = [];

  // Strip whitespace
  const trimmed = code.trim();
  if (!trimmed) {
    return { success: false, error: "Empty code", warnings };
  }

  // Base64 decode
  let buf: Uint8Array;
  try {
    const binary = atob(trimmed);
    buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      buf[i] = binary.charCodeAt(i);
    }
  } catch {
    return { success: false, error: "Invalid code — could not decode Base64.", warnings };
  }

  // Decode protobuf
  let decoded: WCDecodedList;
  try {
    decoded = decodeProtobuf(buf);
  } catch {
    return { success: false, error: "Invalid code — could not parse data.", warnings };
  }

  // Validate faction
  if (!decoded.faction) {
    return {
      success: false,
      error: `Unknown faction code: ${decoded.factionCode}`,
      warnings,
      decoded,
    };
  }

  // Build army list
  const now = new Date().toISOString();
  const armyId = generateId();

  // Find commander — look through all attachment IDs for one marked as commander
  let commanderId: string | null = null;
  let commanderUnitSlotId: string | null = null;

  // Build unit slots
  const units: ArmyUnitSlot[] = [];
  for (const wcSlot of decoded.units) {
    const unitIdStr = String(wcSlot.unitId);
    const unit = findUnitById(unitIdStr);
    if (!unit) {
      warnings.push(`Unit ID ${unitIdStr} not found in game data — skipped.`);
      continue;
    }

    const slotId = generateId();
    const attachmentIds: string[] = [];

    if (wcSlot.attachmentId) {
      const attIdStr = String(wcSlot.attachmentId);
      const att = findAttachmentById(attIdStr);
      if (att) {
        attachmentIds.push(attIdStr);
        if (att.commander) {
          commanderId = attIdStr;
          commanderUnitSlotId = slotId;
        }
      } else {
        warnings.push(`Attachment ID ${attIdStr} not found in game data — skipped.`);
      }
    }

    units.push({ id: slotId, unitId: unitIdStr, attachmentIds });
  }

  // Build NCU slots
  const ncus: ArmyNCUSlot[] = [];
  for (const ncuId of decoded.ncuIds) {
    const ncuIdStr = String(ncuId);
    const ncu = findNCUById(ncuIdStr);
    if (!ncu) {
      warnings.push(`NCU ID ${ncuIdStr} not found in game data — skipped.`);
      continue;
    }
    ncus.push({ id: generateId(), ncuId: ncuIdStr });
  }

  const army: ArmyList = {
    id: armyId,
    name: decoded.name || `Imported ${decoded.faction} list`,
    faction: decoded.faction,
    pointLimit: decoded.pointLimit,
    commanderId,
    commanderUnitSlotId,
    units,
    ncus,
    createdAt: now,
    updatedAt: now,
  };

  return { success: true, army, warnings, decoded };
}
