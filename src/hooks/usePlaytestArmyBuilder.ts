"use client";

import { useState, useCallback, useMemo } from "react";
import { ArmyList, createEmptyArmyList, ComputedTacticsDeck, ArmyValidationError } from "@/lib/types/army-list";
import { FactionId } from "@/lib/types/game-data";
import * as builder from "@/lib/army/builder";
import {
  calculateTotalCost,
  getRemainingPoints,
  calculateNeutralCost,
  getNeutralPointsCap,
  getFreeAttachmentPoints,
  calculateFactionAttachmentCost,
  calculateEffectiveTotalCost,
} from "@/lib/army/playtest-costs";
import { assembleTacticsDeck } from "@/lib/army/playtest-tactics";
import { validateArmy } from "@/lib/army/validator";

export function usePlaytestArmyBuilder(initialList?: ArmyList) {
  const [army, setArmy] = useState<ArmyList | null>(initialList ?? null);

  const initArmy = useCallback((faction: FactionId, pointLimit: number = 40) => {
    setArmy(createEmptyArmyList(faction, pointLimit));
  }, []);

  const loadArmy = useCallback((list: ArmyList) => {
    setArmy(list);
  }, []);

  // Unit operations
  const addUnit = useCallback((unitId: string) => {
    setArmy((prev) => prev ? builder.addUnit(prev, unitId) : prev);
  }, []);

  const removeUnit = useCallback((slotId: string) => {
    setArmy((prev) => prev ? builder.removeUnit(prev, slotId) : prev);
  }, []);

  // Attachment operations
  const addAttachment = useCallback((slotId: string, attachmentId: string) => {
    setArmy((prev) => prev ? builder.addAttachment(prev, slotId, attachmentId) : prev);
  }, []);

  const removeAttachment = useCallback((slotId: string, attachmentId: string) => {
    setArmy((prev) => prev ? builder.removeAttachment(prev, slotId, attachmentId) : prev);
  }, []);

  // Commander operations
  const setCommander = useCallback((commanderId: string, unitSlotId: string) => {
    setArmy((prev) => prev ? builder.setCommander(prev, commanderId, unitSlotId) : prev);
  }, []);

  const selectCommanderOnly = useCallback((commanderId: string) => {
    setArmy((prev) => prev ? builder.selectCommanderOnly(prev, commanderId) : prev);
  }, []);

  const removeCommander = useCallback(() => {
    setArmy((prev) => prev ? builder.removeCommander(prev) : prev);
  }, []);

  // NCU operations
  const addNCU = useCallback((ncuId: string) => {
    setArmy((prev) => prev ? builder.addNCU(prev, ncuId) : prev);
  }, []);

  const removeNCU = useCallback((slotId: string) => {
    setArmy((prev) => prev ? builder.removeNCU(prev, slotId) : prev);
  }, []);

  // Army settings
  const setName = useCallback((name: string) => {
    setArmy((prev) => prev ? builder.setArmyName(prev, name) : prev);
  }, []);

  const setPointLimit = useCallback((pointLimit: number) => {
    setArmy((prev) => prev ? builder.setPointLimit(prev, pointLimit) : prev);
  }, []);

  // Computed values
  const rawTotalCost = useMemo(() => (army ? calculateTotalCost(army) : 0), [army]);
  const totalCost = useMemo(() => (army ? calculateEffectiveTotalCost(army) : 0), [army]);
  const remaining = useMemo(() => (army ? army.pointLimit - calculateEffectiveTotalCost(army) : 0), [army]);
  const neutralCost = useMemo(() => (army ? calculateNeutralCost(army) : 0), [army]);
  const neutralCap = useMemo(() => (army ? getNeutralPointsCap(army.pointLimit) : 0), [army]);
  const freeAttachmentCap = useMemo(() => (army ? getFreeAttachmentPoints(army.pointLimit) : 0), [army]);
  const freeAttachmentUsed = useMemo(() => (army ? Math.min(calculateFactionAttachmentCost(army), getFreeAttachmentPoints(army.pointLimit)) : 0), [army]);
  const tacticsDeck: ComputedTacticsDeck | null = useMemo(
    () => (army ? assembleTacticsDeck(army) : null),
    [army]
  );
  const validationErrors: ArmyValidationError[] = useMemo(
    () => (army ? validateArmy(army) : []),
    [army]
  );
  const errors = useMemo(
    () => validationErrors.filter((e) => e.severity === "error"),
    [validationErrors]
  );
  const warnings = useMemo(
    () => validationErrors.filter((e) => e.severity === "warning"),
    [validationErrors]
  );
  const isValid = useMemo(() => errors.length === 0, [errors]);

  return {
    army,
    setArmy,
    initArmy,
    loadArmy,
    addUnit,
    removeUnit,
    addAttachment,
    removeAttachment,
    setCommander,
    selectCommanderOnly,
    removeCommander,
    addNCU,
    removeNCU,
    setName,
    setPointLimit,
    rawTotalCost,
    totalCost,
    remaining,
    neutralCost,
    neutralCap,
    freeAttachmentCap,
    freeAttachmentUsed,
    tacticsDeck,
    validationErrors,
    errors,
    warnings,
    isValid,
  };
}
