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
