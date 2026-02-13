import { ArmyList, ArmyValidationError } from "../types/army-list";
import {
  findUnitById,
  findNCUById,
  findAttachmentById,
} from "../data/loader";
import { calculateTotalCost, calculateNeutralCost, getNeutralPointsCap } from "./costs";

// Master validator
export function validateArmy(army: ArmyList): ArmyValidationError[] {
  return [
    ...validateStructure(army),
    ...validateFaction(army),
    ...validateNeutralCap(army),
    ...validateAttachments(army),
    ...validateUniqueness(army),
    ...validateRestrictions(army),
  ];
}

// Structural rules
function validateStructure(army: ArmyList): ArmyValidationError[] {
  const errors: ArmyValidationError[] = [];

  if (!army.commanderId) {
    errors.push({
      code: "NO_COMMANDER",
      message: "Army must have a commander.",
      severity: "error",
    });
  }

  if (army.commanderId && !army.commanderUnitSlotId) {
    errors.push({
      code: "COMMANDER_UNATTACHED",
      message: "Commander is not attached to a unit. Attach before saving.",
      severity: "warning",
    });
  }

  const totalCost = calculateTotalCost(army);
  if (totalCost > army.pointLimit) {
    errors.push({
      code: "OVER_POINTS",
      message: `Army costs ${totalCost}/${army.pointLimit} points (${totalCost - army.pointLimit} over).`,
      severity: "error",
    });
  }

  if (army.units.length === 0) {
    errors.push({
      code: "NO_UNITS",
      message: "Army must contain at least one combat unit.",
      severity: "error",
    });
  }

  return errors;
}

// Faction rules
function validateFaction(army: ArmyList): ArmyValidationError[] {
  const errors: ArmyValidationError[] = [];

  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit && unit.faction !== army.faction && unit.faction !== "neutral") {
      errors.push({
        code: "WRONG_FACTION_UNIT",
        message: `${unit.name} belongs to ${unit.faction}, not ${army.faction}.`,
        severity: "error",
        affectedIds: [slot.unitId],
      });
    }

    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att && att.faction !== army.faction && att.faction !== "neutral") {
        errors.push({
          code: "WRONG_FACTION_ATTACHMENT",
          message: `${att.name} belongs to ${att.faction}, not ${army.faction}.`,
          severity: "error",
          affectedIds: [attId],
        });
      }
    }
  }

  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu && ncu.faction !== army.faction && ncu.faction !== "neutral") {
      errors.push({
        code: "WRONG_FACTION_NCU",
        message: `${ncu.name} belongs to ${ncu.faction}, not ${army.faction}.`,
        severity: "error",
        affectedIds: [slot.ncuId],
      });
    }
  }

  return errors;
}

// Neutral points cap (30% of total army points)
function validateNeutralCap(army: ArmyList): ArmyValidationError[] {
  const errors: ArmyValidationError[] = [];

  // Only relevant for non-neutral armies
  if (army.faction === "neutral") return errors;

  const neutralCost = calculateNeutralCost(army);
  const cap = getNeutralPointsCap(army.pointLimit);

  if (neutralCost > cap) {
    errors.push({
      code: "NEUTRAL_OVER_CAP",
      message: `Neutral units cost ${neutralCost} pts but the cap is ${cap} pts (30% of ${army.pointLimit}).`,
      severity: "error",
    });
  }

  return errors;
}

// Attachment compatibility
function validateAttachments(army: ArmyList): ArmyValidationError[] {
  const errors: ArmyValidationError[] = [];

  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (!unit) continue;

    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (!att) continue;

      // Tray compatibility check
      if (att.tray && att.tray !== unit.tray) {
        errors.push({
          code: "TRAY_MISMATCH",
          message: `${att.name} (${att.tray}) cannot attach to ${unit.name} (${unit.tray}).`,
          severity: "error",
          affectedIds: [slot.unitId, attId],
        });
      }
    }

    // Check for too many non-commander attachments (usually max 1)
    const nonCommanderAttachments = slot.attachmentIds.filter(
      (id) => id !== army.commanderId
    );
    if (nonCommanderAttachments.length > 1) {
      errors.push({
        code: "TOO_MANY_ATTACHMENTS",
        message: `${unit.name} has too many attachments (max 1 non-commander).`,
        severity: "warning",
        affectedIds: [slot.unitId, ...nonCommanderAttachments],
      });
    }
  }

  return errors;
}

// Character uniqueness
function validateUniqueness(army: ArmyList): ArmyValidationError[] {
  const errors: ArmyValidationError[] = [];
  const characterNames = new Map<string, string>(); // name -> first occurrence description

  // Check units
  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit?.character) {
      if (characterNames.has(unit.name)) {
        errors.push({
          code: "DUPLICATE_CHARACTER",
          message: `${unit.name} is already in the army as ${characterNames.get(unit.name)}.`,
          severity: "error",
          affectedIds: [unit.id],
        });
      } else {
        characterNames.set(unit.name, `unit`);
      }
    }

    // Check attachments
    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att?.character) {
        if (characterNames.has(att.name)) {
          errors.push({
            code: "DUPLICATE_CHARACTER",
            message: `${att.name} is already in the army as ${characterNames.get(att.name)}.`,
            severity: "error",
            affectedIds: [att.id],
          });
        } else {
          characterNames.set(att.name, `attachment`);
        }
      }
    }
  }

  // Check NCUs
  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu?.character) {
      if (characterNames.has(ncu.name)) {
        errors.push({
          code: "DUPLICATE_CHARACTER",
          message: `${ncu.name} is already in the army as ${characterNames.get(ncu.name)}.`,
          severity: "error",
          affectedIds: [ncu.id],
        });
      } else {
        characterNames.set(ncu.name, `NCU`);
      }
    }
  }

  return errors;
}

// back_text restriction parsing
interface RestrictionRule {
  type: "requires" | "excludes" | "max_count";
  targetName?: string;
  maxCount?: number;
}

function parseBackText(backTexts: { text: string; name?: string }[]): RestrictionRule[] {
  const rules: RestrictionRule[] = [];

  for (const entry of backTexts) {
    const text = entry.text.toLowerCase();

    // "may only be fielded in an army that includes/including/containing X"
    const requiresMatch = text.match(
      /may only be fielded in an army (?:that includes|including|containing) ([^.]+)/
    );
    if (requiresMatch) {
      rules.push({ type: "requires", targetName: requiresMatch[1].trim() });
    }

    // "may not be fielded in an army that includes/containing X"
    const excludesMatch = text.match(
      /(?:may not|cannot|can't) be fielded in an army (?:that includes|containing|with) ([^.]+)/
    );
    if (excludesMatch) {
      rules.push({ type: "excludes", targetName: excludesMatch[1].trim() });
    }

    // "your army may not include X"
    const excludesMatch2 = text.match(
      /your army may not include ([^.]+)/
    );
    if (excludesMatch2) {
      rules.push({ type: "excludes", targetName: excludesMatch2[1].trim() });
    }

    // "limited to N per army"
    const maxMatch = text.match(/limited to (\d+) per army/);
    if (maxMatch) {
      rules.push({ type: "max_count", maxCount: parseInt(maxMatch[1]) });
    }
  }

  return rules;
}

function collectAllNames(army: ArmyList): Set<string> {
  const names = new Set<string>();

  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit) names.add(unit.name.toLowerCase());
    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att) names.add(att.name.toLowerCase());
    }
  }

  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu) names.add(ncu.name.toLowerCase());
  }

  return names;
}

function validateRestrictions(army: ArmyList): ArmyValidationError[] {
  const errors: ArmyValidationError[] = [];
  const allNames = collectAllNames(army);

  // Check restrictions on all units
  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit?.back_text) {
      const rules = parseBackText(unit.back_text);
      for (const rule of rules) {
        if (rule.type === "requires" && rule.targetName && !allNames.has(rule.targetName)) {
          errors.push({
            code: "MISSING_REQUIRED",
            message: `${unit.name} requires "${rule.targetName}" in the army.`,
            severity: "error",
            affectedIds: [unit.id],
          });
        }
        if (rule.type === "excludes" && rule.targetName && allNames.has(rule.targetName)) {
          errors.push({
            code: "EXCLUDED_CONFLICT",
            message: `${unit.name} cannot be in an army with "${rule.targetName}".`,
            severity: "error",
            affectedIds: [unit.id],
          });
        }
      }
    }

    // Check restrictions on attachments
    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att?.back_text) {
        const rules = parseBackText(att.back_text);
        for (const rule of rules) {
          if (rule.type === "requires" && rule.targetName && !allNames.has(rule.targetName)) {
            errors.push({
              code: "MISSING_REQUIRED",
              message: `${att.name} requires "${rule.targetName}" in the army.`,
              severity: "error",
              affectedIds: [att.id],
            });
          }
          if (rule.type === "excludes" && rule.targetName && allNames.has(rule.targetName)) {
            errors.push({
              code: "EXCLUDED_CONFLICT",
              message: `${att.name} cannot be in an army with "${rule.targetName}".`,
              severity: "error",
              affectedIds: [att.id],
            });
          }
        }
      }
    }
  }

  // Check restrictions on NCUs
  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu?.back_text) {
      const rules = parseBackText(ncu.back_text);
      for (const rule of rules) {
        if (rule.type === "requires" && rule.targetName && !allNames.has(rule.targetName)) {
          errors.push({
            code: "MISSING_REQUIRED",
            message: `${ncu.name} requires "${rule.targetName}" in the army.`,
            severity: "error",
            affectedIds: [ncu.id],
          });
        }
        if (rule.type === "excludes" && rule.targetName && allNames.has(rule.targetName)) {
          errors.push({
            code: "EXCLUDED_CONFLICT",
            message: `${ncu.name} cannot be in an army with "${rule.targetName}".`,
            severity: "error",
            affectedIds: [ncu.id],
          });
        }
      }
    }
  }

  return errors;
}
