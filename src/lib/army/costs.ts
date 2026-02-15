import { ArmyList } from "../types/army-list";
import { findUnitById, findNCUById, findAttachmentById } from "../data/loader";

export function calculateTotalCost(army: ArmyList): number {
  let total = 0;

  // Unit costs
  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit) total += unit.cost;

    // Attachment costs
    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att?.cost) total += att.cost;
    }
  }

  // NCU costs
  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu) total += ncu.cost;
  }

  return total;
}

export function getRemainingPoints(army: ArmyList): number {
  return army.pointLimit - calculateTotalCost(army);
}

/**
 * Calculate total points spent on neutral-faction items.
 */
export function calculateNeutralCost(army: ArmyList): number {
  let total = 0;

  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit && unit.faction === "neutral") total += unit.cost;

    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att?.cost && att.faction === "neutral") total += att.cost;
    }
  }

  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu && ncu.faction === "neutral") total += ncu.cost;
  }

  return total;
}

/**
 * Maximum neutral points allowed (30% of total point limit, rounded down).
 */
export function getNeutralPointsCap(pointLimit: number): number {
  return Math.floor(pointLimit * 0.3);
}

/**
 * Free faction attachment points based on army point limit.
 * 30 pts → 3 free, 40 pts → 4 free, 50 pts → 5 free.
 * Only valid for attachments belonging to the army's selected faction (not neutral).
 */
export function getFreeAttachmentPoints(pointLimit: number): number {
  if (pointLimit <= 30) return 3;
  if (pointLimit <= 40) return 4;
  return 5;
}

/**
 * Calculate how many free attachment points have been used.
 * Only faction (non-neutral) non-commander attachments count.
 */
export function calculateFactionAttachmentCost(army: ArmyList): number {
  let total = 0;

  for (const slot of army.units) {
    for (const attId of slot.attachmentIds) {
      // Skip commander — it's not a regular attachment
      if (attId === army.commanderId) continue;
      const att = findAttachmentById(attId);
      // Only faction attachments (not neutral) contribute to free points
      if (att?.cost && att.faction !== "neutral" && att.faction === army.faction) {
        total += att.cost;
      }
    }
  }

  return total;
}

/**
 * Calculate total cost adjusted for free faction attachment points.
 * The discount = min(factionAttachmentCost, freeAllowance).
 */
export function calculateEffectiveTotalCost(army: ArmyList): number {
  const rawTotal = calculateTotalCost(army);
  const freeAllowance = getFreeAttachmentPoints(army.pointLimit);
  const factionAttCost = calculateFactionAttachmentCost(army);
  const discount = Math.min(factionAttCost, freeAllowance);
  return rawTotal - discount;
}
