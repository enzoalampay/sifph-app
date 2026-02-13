import { ArmyList, ArmyUnitSlot, ArmyNCUSlot } from "../types/army-list";
import { generateId } from "../utils/id";
import { findAttachmentById } from "../data/loader";

function stamp(army: ArmyList): ArmyList {
  return { ...army, updatedAt: new Date().toISOString() };
}

export function addUnit(army: ArmyList, unitId: string): ArmyList {
  const slot: ArmyUnitSlot = {
    id: generateId(),
    unitId,
    attachmentIds: [],
  };
  return stamp({ ...army, units: [...army.units, slot] });
}

export function removeUnit(army: ArmyList, slotId: string): ArmyList {
  const slot = army.units.find((u) => u.id === slotId);
  let updated = { ...army, units: army.units.filter((u) => u.id !== slotId) };

  // If this slot held the commander, unset commander
  if (army.commanderUnitSlotId === slotId) {
    updated.commanderId = null;
    updated.commanderUnitSlotId = null;
  }

  return stamp(updated);
}

export function addAttachment(
  army: ArmyList,
  slotId: string,
  attachmentId: string
): ArmyList {
  const units = army.units.map((slot) =>
    slot.id === slotId
      ? { ...slot, attachmentIds: [...slot.attachmentIds, attachmentId] }
      : slot
  );
  return stamp({ ...army, units });
}

export function removeAttachment(
  army: ArmyList,
  slotId: string,
  attachmentId: string
): ArmyList {
  let updated = {
    ...army,
    units: army.units.map((slot) =>
      slot.id === slotId
        ? {
            ...slot,
            attachmentIds: slot.attachmentIds.filter((a) => a !== attachmentId),
          }
        : slot
    ),
  };

  // If removing the commander attachment
  if (attachmentId === army.commanderId) {
    updated.commanderId = null;
    updated.commanderUnitSlotId = null;
  }

  return stamp(updated);
}

export function setCommander(
  army: ArmyList,
  commanderId: string,
  unitSlotId: string
): ArmyList {
  // First remove old commander from any slot if exists
  let units = army.units;
  if (army.commanderId && army.commanderUnitSlotId) {
    units = units.map((slot) =>
      slot.id === army.commanderUnitSlotId
        ? {
            ...slot,
            attachmentIds: slot.attachmentIds.filter(
              (a) => a !== army.commanderId
            ),
          }
        : slot
    );
  }

  // Add new commander to the target slot
  units = units.map((slot) =>
    slot.id === unitSlotId
      ? { ...slot, attachmentIds: [...slot.attachmentIds, commanderId] }
      : slot
  );

  return stamp({
    ...army,
    units,
    commanderId,
    commanderUnitSlotId: unitSlotId,
  });
}

export function selectCommanderOnly(
  army: ArmyList,
  commanderId: string
): ArmyList {
  // Remove old commander from unit slot if it was attached
  let units = army.units;
  if (army.commanderId && army.commanderUnitSlotId) {
    units = units.map((slot) =>
      slot.id === army.commanderUnitSlotId
        ? {
            ...slot,
            attachmentIds: slot.attachmentIds.filter(
              (a) => a !== army.commanderId
            ),
          }
        : slot
    );
  }

  return stamp({
    ...army,
    units,
    commanderId,
    commanderUnitSlotId: null, // not attached to any unit yet
  });
}

export function removeCommander(army: ArmyList): ArmyList {
  if (!army.commanderId) return army;

  const commanderId = army.commanderId;
  let units = army.units;

  // Remove from unit slot if attached
  if (army.commanderUnitSlotId) {
    units = units.map((slot) =>
      slot.id === army.commanderUnitSlotId
        ? {
            ...slot,
            attachmentIds: slot.attachmentIds.filter((a) => a !== commanderId),
          }
        : slot
    );
  }

  return stamp({
    ...army,
    units,
    commanderId: null,
    commanderUnitSlotId: null,
  });
}

export function addNCU(army: ArmyList, ncuId: string): ArmyList {
  const slot: ArmyNCUSlot = {
    id: generateId(),
    ncuId,
  };
  return stamp({ ...army, ncus: [...army.ncus, slot] });
}

export function removeNCU(army: ArmyList, slotId: string): ArmyList {
  return stamp({ ...army, ncus: army.ncus.filter((n) => n.id !== slotId) });
}

export function setArmyName(army: ArmyList, name: string): ArmyList {
  return stamp({ ...army, name });
}

export function setPointLimit(army: ArmyList, pointLimit: number): ArmyList {
  return stamp({ ...army, pointLimit });
}
