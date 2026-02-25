import { ArmyList } from "../types/army-list";
import { findUnitById, findNCUById, findAttachmentById } from "../data/playtest-loader";

export function calculateTotalCost(army: ArmyList): number {
  let total = 0;

  for (const slot of army.units) {
    const unit = findUnitById(slot.unitId);
    if (unit) total += unit.cost;

    for (const attId of slot.attachmentIds) {
      const att = findAttachmentById(attId);
      if (att?.cost) total += att.cost;
    }
  }

  for (const slot of army.ncus) {
    const ncu = findNCUById(slot.ncuId);
    if (ncu) total += ncu.cost;
  }

  return total;
}

export function getRemainingPoints(army: ArmyList): number {
  return army.pointLimit - calculateTotalCost(army);
}

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

export function getNeutralPointsCap(pointLimit: number): number {
  return Math.floor(pointLimit * 0.3);
}

export function getFreeAttachmentPoints(pointLimit: number): number {
  if (pointLimit <= 30) return 3;
  if (pointLimit <= 40) return 4;
  return 5;
}

export function calculateFactionAttachmentCost(army: ArmyList): number {
  let total = 0;

  for (const slot of army.units) {
    for (const attId of slot.attachmentIds) {
      if (attId === army.commanderId) continue;
      const att = findAttachmentById(attId);
      if (att?.cost && att.faction !== "neutral" && att.faction === army.faction) {
        total += att.cost;
      }
    }
  }

  return total;
}

export function calculateEffectiveTotalCost(army: ArmyList): number {
  const rawTotal = calculateTotalCost(army);
  const freeAllowance = getFreeAttachmentPoints(army.pointLimit);
  const factionAttCost = calculateFactionAttachmentCost(army);
  const discount = Math.min(factionAttCost, freeAllowance);
  return rawTotal - discount;
}
