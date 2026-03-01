"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePlaytestArmyBuilder } from "@/hooks/usePlaytestArmyBuilder";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { ArmyList } from "@/lib/types/army-list";
import { useAuth } from "@/contexts/AuthContext";
import {
  FactionId,
  GameUnit,
  GameNCU,
  GameAttachment,
  GameTactics,
} from "@/lib/types/game-data";
import {
  getAvailableUnits,
  getAvailableNCUs,
  getAvailableAttachments,
  getCommanders,
  findUnitById,
  findNCUById,
  findAttachmentById,
  findTacticsById,
  getBaseFactionTactics,
  getCommanderTactics,
  PLAYTEST_FACTION_IDS,
} from "@/lib/data/playtest-loader";
import { getPortraitUrl } from "@/lib/utils/card-images";
import { FACTIONS, getFactionInfo } from "@/lib/data/factions";
import { searchFilter } from "@/lib/utils/search";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatLine } from "@/components/ui/StatLine";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { CardImageModal, useCardViewer } from "@/components/ui/CardImageModal";
import { HoverCardPreview } from "@/components/ui/HoverCardPreview";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Types for modal state
// ---------------------------------------------------------------------------

type BrowserTab = "units" | "ncus" | "attachments" | "commanders" | "tactics";

interface AttachModalState {
  open: boolean;
  attachmentId: string | null;
}

interface CommanderModalState {
  open: boolean;
  commanderId: string | null;
}

// Commander picker modal (triggered from left panel "Select Commander" button)
interface CommanderPickerState {
  open: boolean;
  step: "pick_commander";
  commanderId: string | null;
}

// ---------------------------------------------------------------------------
// Main Playtest Builder Page
// ---------------------------------------------------------------------------

export default function PlaytestBuilderPage() {
  const params = useParams<{ listId?: string }>();
  const router = useRouter();
  const listId = params?.listId ?? null;
  const { user } = useAuth();

  // Army builder hook
  const {
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
  } = usePlaytestArmyBuilder();

  // Entity storage for saved lists
  const entityStorage = useEntityStorage<ArmyList>(STORAGE_KEYS.PLAYTEST_ARMY_LISTS);

  // Save feedback
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Preview list modal
  const [previewList, setPreviewList] = useState<ArmyList | null>(null);

  // Search states for browser tabs
  const [unitSearch, setUnitSearch] = useState("");
  const [ncuSearch, setNcuSearch] = useState("");
  const [attachSearch, setAttachSearch] = useState("");

  // Modals
  const [attachModal, setAttachModal] = useState<AttachModalState>({
    open: false,
    attachmentId: null,
  });
  const [commanderModal, setCommanderModal] = useState<CommanderModalState>({
    open: false,
    commanderId: null,
  });

  // Commander picker modal (from left panel button)
  const [commanderPicker, setCommanderPicker] = useState<CommanderPickerState>({
    open: false,
    step: "pick_commander",
    commanderId: null,
  });

  // Per-unit "add attachment" modal: which unit slot is picking an attachment
  const [pickAttachForSlot, setPickAttachForSlot] = useState<string | null>(null);

  // Save confirmation modal (when commander is unattached)
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  // Card image viewer
  const { cardViewer, openCard, closeCard } = useCardViewer();

  // Load list from storage on mount if listId is present
  useEffect(() => {
    if (listId && entityStorage.loaded) {
      const loaded = entityStorage.load(listId);
      if (loaded) {
        loadArmy(loaded);
      }
    }
    // Only run when storage is loaded and listId is available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId, entityStorage.loaded]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const doSave = useCallback(() => {
    if (!army) return;
    if (!user) {
      setSaveMsg("Login to save");
      setTimeout(() => setSaveMsg(null), 2500);
      return;
    }
    entityStorage.save({ ...army, updatedAt: new Date().toISOString() });
    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(null), 1500);
  }, [army, entityStorage, user]);

  const handleSave = useCallback(() => {
    if (!army) return;
    if (!user) {
      setSaveMsg("Login to save");
      setTimeout(() => setSaveMsg(null), 2500);
      return;
    }
    // If commander is selected but not attached to a unit, prompt
    if (army.commanderId && !army.commanderUnitSlotId) {
      setSaveConfirmOpen(true);
      return;
    }
    doSave();
  }, [army, doSave, user]);

  const handleBack = useCallback(() => {
    setArmy(null); // clear army state
    router.push("/playtest/builder");
  }, [setArmy, router]);

  const handleDeleteList = useCallback(
    (id: string) => {
      entityStorage.remove(id);
    },
    [entityStorage]
  );

  const handleSelectFaction = useCallback(
    (factionId: FactionId) => {
      initArmy(factionId, 40);
    },
    [initArmy]
  );

  const handleAttachToSlot = useCallback(
    (slotId: string) => {
      if (attachModal.attachmentId) {
        addAttachment(slotId, attachModal.attachmentId);
        setAttachModal({ open: false, attachmentId: null });
      }
    },
    [attachModal.attachmentId, addAttachment]
  );

  const handleCommanderToSlot = useCallback(
    (slotId: string) => {
      if (commanderModal.commanderId) {
        setCommander(commanderModal.commanderId, slotId);
        setCommanderModal({ open: false, commanderId: null });
      }
    },
    [commanderModal.commanderId, setCommander]
  );

  const handlePickAttachment = useCallback(
    (attachmentId: string) => {
      if (pickAttachForSlot) {
        addAttachment(pickAttachForSlot, attachmentId);
        setPickAttachForSlot(null);
      }
    },
    [pickAttachForSlot, addAttachment]
  );

  // Commander picker: select commander (just set commander without unit)
  const handlePickerSelectCommander = useCallback((cmdId: string) => {
    selectCommanderOnly(cmdId);
    setCommanderPicker({ open: false, step: "pick_commander", commanderId: null });
  }, [selectCommanderOnly]);

  // ---------------------------------------------------------------------------
  // Derived data (only when army is active)
  // ---------------------------------------------------------------------------

  const factionInfo = army ? getFactionInfo(army.faction) : null;

  const availableUnits = useMemo(
    () => (army ? getAvailableUnits(army.faction) : []),
    [army?.faction]
  );

  const availableNCUs = useMemo(
    () => (army ? getAvailableNCUs(army.faction) : []),
    [army?.faction]
  );

  const availableAttachments = useMemo(
    () =>
      army
        ? getAvailableAttachments(army.faction).filter((a) => !a.commander)
        : [],
    [army?.faction]
  );

  const commanders = useMemo(
    () => (army ? getCommanders(army.faction) : []),
    [army?.faction]
  );

  const filteredUnits = useMemo(
    () => searchFilter(availableUnits, unitSearch, (u) => u.name)
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name)),
    [availableUnits, unitSearch]
  );

  const filteredNCUs = useMemo(
    () => searchFilter(availableNCUs, ncuSearch, (n) => n.name)
      .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name)),
    [availableNCUs, ncuSearch]
  );

  const filteredAttachments = useMemo(
    () => searchFilter(availableAttachments, attachSearch, (a) => a.name)
      .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name)),
    [availableAttachments, attachSearch]
  );

  // Tactics data
  const factionTacticsCards = useMemo(() => {
    if (!tacticsDeck) return [];
    return tacticsDeck.factionTactics
      .map((id) => findTacticsById(id))
      .filter((t): t is GameTactics => t !== undefined);
  }, [tacticsDeck]);

  const commanderTacticsCards = useMemo(() => {
    if (!tacticsDeck) return [];
    return tacticsDeck.commanderTactics
      .map((id) => findTacticsById(id))
      .filter((t): t is GameTactics => t !== undefined);
  }, [tacticsDeck]);

  // Resolved unit/ncu/attachment data for the army panel
  const resolvedUnits = useMemo(() => {
    if (!army) return [];
    return army.units.map((slot) => ({
      slot,
      unit: findUnitById(slot.unitId),
      attachments: slot.attachmentIds
        .map((aId) => findAttachmentById(aId))
        .filter((a): a is GameAttachment => a !== undefined),
    }));
  }, [army]);

  const resolvedNCUs = useMemo(() => {
    if (!army) return [];
    return army.ncus.map((slot) => ({
      slot,
      ncu: findNCUById(slot.ncuId),
    }));
  }, [army]);

  const commanderData = useMemo(() => {
    if (!army?.commanderId) return null;
    return findAttachmentById(army.commanderId);
  }, [army?.commanderId]);

  // Attachments available for the "pick attachment" per-slot modal
  const slotAttachments = useMemo(() => {
    if (!army || !pickAttachForSlot) return [];
    const slot = army.units.find((s) => s.id === pickAttachForSlot);
    const targetUnit = slot ? findUnitById(slot.unitId) : null;
    const all = getAvailableAttachments(army.faction).filter((a) => !a.commander);
    if (!targetUnit) return all;
    return all.filter((a) => a.tray === targetUnit.tray);
  }, [army?.faction, army, pickAttachForSlot]);

  // ----------- Duplicate Prevention -----------
  const usedCharacterUnitNames = useMemo(() => {
    if (!army) return new Set<string>();
    return new Set(
      army.units
        .map((slot) => findUnitById(slot.unitId))
        .filter((u): u is GameUnit => !!u && !!u.character)
        .map((u) => u.name)
    );
  }, [army]);

  const usedCharacterNCUNames = useMemo(() => {
    if (!army) return new Set<string>();
    return new Set(
      army.ncus
        .map((slot) => findNCUById(slot.ncuId))
        .filter((n): n is GameNCU => !!n && !!n.character)
        .map((n) => n.name)
    );
  }, [army]);

  const usedCharacterAttachmentNames = useMemo(() => {
    if (!army) return new Set<string>();
    const names: string[] = [];
    army.units.forEach((slot) => {
      slot.attachmentIds.forEach((aId) => {
        const att = findAttachmentById(aId);
        if (att && att.character) names.push(att.name);
      });
    });
    if (army.commanderId) {
      const cmd = findAttachmentById(army.commanderId);
      if (cmd) names.push(cmd.name);
    }
    return new Set(names);
  }, [army]);

  // ---------------------------------------------------------------------------
  // MODE 1: No army -- show saved lists + faction picker
  // ---------------------------------------------------------------------------

  if (!army) {
    return (
      <div className="min-h-screen bg-stone-900 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/playtest" className="text-stone-400 hover:text-stone-200 text-sm transition-colors mb-1 inline-block">&larr; Back to Playtest</Link>
          <PageHeader
            title="Playtest Builder"
            description="Build armies using January 2026 playtest cards"
          />
          <div className="mb-6">
            <Badge variant="info" size="sm">PLAYTEST</Badge>
          </div>

          {/* Saved Lists */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-stone-200 mb-4">
              Saved Lists
            </h2>
            {entityStorage.items.length === 0 ? (
              <EmptyState
                title="No saved lists"
                description="Create a new playtest army list below to get started."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {entityStorage.items.map((list) => {
                  const fi = getFactionInfo(list.faction);
                  return (
                    <Card key={list.id} padding="none" className="overflow-hidden">
                      <div className="flex items-center">
                        <div
                          className="w-1.5 shrink-0 self-stretch"
                          style={{ backgroundColor: fi.cardColor }}
                        />
                        <div className="flex items-center gap-3 flex-1 p-4">
                          <img
                            src={fi.crestUrl}
                            alt={`${fi.shortName} sigil`}
                            className="w-8 h-8 object-contain drop-shadow-md shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-stone-100 truncate">
                                  {list.name}
                                </p>
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {fi.displayName} &middot; {list.pointLimit} pts
                                </p>
                              </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewList(list)}
                              >
                                View
                              </Button>
                              <Link href={`/playtest/builder/${list.id}`}>
                                <Button variant="ghost" size="sm">
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteList(list.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                            <p className="text-[10px] text-stone-500 mt-2">
                              Updated{" "}
                              {new Date(list.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Create New List */}
          <section>
            <h2 className="text-lg font-semibold text-stone-200 mb-4">
              Create New List
            </h2>
            <p className="text-sm text-stone-400 mb-4">
              Select a faction to start building your playtest army.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PLAYTEST_FACTION_IDS.map((fid) => {
                const fi = FACTIONS[fid];
                return (
                  <Card
                    key={fid}
                    hover
                    padding="none"
                    className="overflow-hidden"
                    onClick={() => handleSelectFaction(fid)}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-1.5 shrink-0 self-stretch"
                        style={{ backgroundColor: fi.cardColor }}
                      />
                      <div className="flex items-center gap-3 flex-1 p-4">
                        <img
                          src={fi.crestUrl}
                          alt={`${fi.displayName} sigil`}
                          className="w-10 h-10 object-contain drop-shadow-lg"
                        />
                        <p className="text-sm font-medium text-stone-100">
                          {fi.displayName}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        {/* ---- MODAL: List Preview ---- */}
        <Modal
          isOpen={previewList !== null}
          onClose={() => setPreviewList(null)}
          title={previewList?.name ?? "Army List"}
          size="lg"
        >
          {previewList && (() => {
            const pFi = getFactionInfo(previewList.faction);
            const pCommander = previewList.commanderId ? findAttachmentById(previewList.commanderId) : null;
            const pUnits = previewList.units.map(s => ({
              slot: s,
              unit: findUnitById(s.unitId),
              attachments: s.attachmentIds.map(a => findAttachmentById(a)).filter((a): a is GameAttachment => !!a),
            }));
            const pNCUs = previewList.ncus.map(s => ({ slot: s, ncu: findNCUById(s.ncuId) }));
            const pTotalCost = pUnits.reduce((sum, u) => sum + (u.unit?.cost ?? 0) + u.attachments.reduce((as, a) => as + (a.cost ?? 0), 0), 0)
              + pNCUs.reduce((sum, n) => sum + (n.ncu?.cost ?? 0), 0)
              + (pCommander?.cost ?? 0);

            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-stone-700">
                  <img src={pFi.crestUrl} alt={pFi.shortName} className="w-10 h-10 object-contain drop-shadow" />
                  <div>
                    <p className="text-sm font-semibold text-stone-100">{pFi.displayName}</p>
                    <p className="text-xs text-stone-400">{pTotalCost}/{previewList.pointLimit} pts</p>
                  </div>
                </div>

                {/* Commander */}
                {pCommander && (
                  <div>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Commander</p>
                    <div className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: `${pFi.cardColor}25`, borderLeft: `3px solid ${pFi.cardColor}` }}>
                      <img src={getPortraitUrl(pCommander.id)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ backgroundColor: pFi.cardColor }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div>
                        <p className="text-sm font-medium text-stone-100">{pCommander.name}</p>
                        {pCommander.title && <p className="text-[10px] text-stone-400">{pCommander.title}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Units */}
                {pUnits.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Units ({pUnits.length})</p>
                    <div className="space-y-1.5">
                      {pUnits.map(({ slot, unit, attachments }) => (
                        <div key={slot.id} className="rounded-md p-2" style={{ backgroundColor: `${unit ? getFactionInfo(unit.faction).cardColor : pFi.cardColor}25`, borderLeft: `3px solid ${unit ? getFactionInfo(unit.faction).cardColor : pFi.cardColor}` }}>
                          <div className="flex items-center gap-2">
                            {unit && <img src={getPortraitUrl(unit.id)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ backgroundColor: getFactionInfo(unit.faction).cardColor }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-stone-100 truncate">{unit?.name ?? slot.unitId}</p>
                                {unit && <span className="text-[10px] text-stone-400">{unit.cost} pts</span>}
                              </div>
                              {attachments.length > 0 && (
                                <div className="mt-0.5">
                                  {attachments.map(att => (
                                    <p key={att.id} className="text-[10px] text-stone-400 pl-2">+ {att.name}{att.cost ? ` (${att.cost} pts)` : ''}</p>
                                  ))}
                                </div>
                              )}
                              {previewList.commanderUnitSlotId === slot.id && pCommander && (
                                <p className="text-[10px] text-amber-400 pl-2">★ {pCommander.name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NCUs */}
                {pNCUs.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">NCUs ({pNCUs.length})</p>
                    <div className="space-y-1.5">
                      {pNCUs.map(({ slot, ncu }) => (
                        <div key={slot.id} className="flex items-center gap-2 rounded-md p-2" style={{ backgroundColor: `${ncu ? getFactionInfo(ncu.faction).cardColor : pFi.cardColor}25`, borderLeft: `3px solid ${ncu ? getFactionInfo(ncu.faction).cardColor : pFi.cardColor}` }}>
                          {ncu && <img src={getPortraitUrl(ncu.id)} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ backgroundColor: getFactionInfo(ncu.faction).cardColor }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <div>
                            <p className="text-xs font-medium text-stone-100">{ncu?.name ?? slot.ncuId}</p>
                            {ncu && <span className="text-[10px] text-stone-400">{ncu.cost} pts</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-stone-700">
                  <Link href={`/playtest/builder/${previewList.id}`}>
                    <Button variant="primary" size="sm" onClick={() => setPreviewList(null)}>
                      Edit List
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setPreviewList(null)}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MODE 2: Army active -- full builder
  // ---------------------------------------------------------------------------

  const costColor =
    totalCost > army.pointLimit ? "text-red-400" : "text-green-400";

  return (
    <div className="min-h-screen bg-stone-900">
      {/* ---- Top Bar ---- */}
      <div className="sticky top-0 z-40 border-b border-stone-700 bg-stone-900/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4 sm:py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            &larr; Back
          </Button>

          <div className="flex-1 min-w-[180px] max-w-xs">
            <Input
              value={army.name}
              onChange={(e) => setName(e.target.value)}
              className="!py-1.5 text-sm"
              placeholder="Army name..."
            />
          </div>

          {factionInfo && (
            <div className="flex items-center gap-1.5">
              <img
                src={factionInfo.crestUrl}
                alt={`${factionInfo.shortName} sigil`}
                className="w-6 h-6 object-contain drop-shadow"
              />
              <Badge variant="faction" color={factionInfo.color}>
                {factionInfo.shortName}
              </Badge>
            </div>
          )}

          <Badge variant="info" size="sm">PT</Badge>

          <span className={`text-sm font-semibold ${costColor}`}>
            {totalCost}/{army.pointLimit} pts
          </span>
          {army.faction !== "neutral" && (
            <span className="text-sm font-semibold text-emerald-400">
              (Free: {freeAttachmentUsed}/{freeAttachmentCap})
            </span>
          )}

          {army.faction !== "neutral" && (
            <span className={`text-xs ${neutralCost > neutralCap ? "text-red-400" : "text-stone-500"}`}>
              Neutral: {neutralCost}/{neutralCap}
            </span>
          )}

          {/* Point Limit buttons */}
          <div className="flex items-center gap-1">
            {[30, 40, 50].map((pl) => (
              <button
                key={pl}
                onClick={() => setPointLimit(pl)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  army.pointLimit === pl
                    ? "bg-teal-700 border-teal-600 text-white"
                    : "bg-stone-800 border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-500"
                }`}
              >
                {pl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!user && (
              <span className="text-[10px] text-stone-500">
                <a href="/login" className="text-teal-500 hover:text-teal-400 underline">Login</a> to save
              </span>
            )}
            <Button variant="primary" size="sm" onClick={handleSave}>
              {saveMsg ?? "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* ---- Two Column Layout ---- */}
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* ---- LEFT: Your Army ---- */}
        <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
          <h2 className="text-lg font-semibold text-stone-100">Your Army</h2>

          {/* Commander Section */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-wide">
                Commander
              </h3>
            </div>
            {commanderData ? (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getPortraitUrl(commanderData.id)}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-stone-600"
                      style={{ backgroundColor: factionInfo!.cardColor }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      loading="lazy"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <HoverCardPreview cardId={commanderData.id} faction={army.faction}>
                          <span className="text-sm font-medium text-stone-100 hover:text-amber-400 transition-colors cursor-default">
                            {commanderData.name}
                          </span>
                        </HoverCardPreview>
                      <button
                        className="text-stone-500 hover:text-amber-400 transition-colors"
                        onClick={() => openCard(commanderData.id, commanderData.name, army.faction)}
                        title="View card"
                      >
                        <span className="text-[10px]">&#128065;</span>
                      </button>
                    </div>
                    {commanderData.title && (
                      <p className="text-xs text-stone-400">
                        {commanderData.title}
                      </p>
                    )}
                    {army.commanderUnitSlotId ? (() => {
                      const slot = army.units.find(s => s.id === army.commanderUnitSlotId);
                      const attachedUnit = slot ? findUnitById(slot.unitId) : null;
                      return attachedUnit ? (
                        <p className="text-xs text-green-500 mt-0.5">
                          ✓ Attached to {attachedUnit.name}
                        </p>
                      ) : null;
                    })() : (
                      <p className="text-xs text-amber-400 mt-0.5">
                        ⚠ Not attached to a unit
                      </p>
                    )}
                    </div>
                  </div>
                  <Button variant="danger" size="sm" onClick={removeCommander}>
                    Remove
                  </Button>
                </div>
                {/* Attach to Unit button when commander is not yet attached */}
                {!army.commanderUnitSlotId && army.units.length > 0 && (
                  <div className="mt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        setCommanderModal({
                          open: true,
                          commanderId: army.commanderId!,
                        })
                      }
                    >
                      Attach to Unit
                    </Button>
                  </div>
                )}
                {!army.commanderUnitSlotId && army.units.length === 0 && (
                  <p className="text-[10px] text-stone-500 mt-2">
                    Add a unit to attach the commander to.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <Badge variant="warning">
                  No Commander Selected
                </Badge>
                <div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setCommanderPicker({
                        open: true,
                        step: "pick_commander",
                        commanderId: null,
                      })
                    }
                  >
                    + Select Commander
                  </Button>
                </div>
                <p className="text-[10px] text-stone-500">
                  Choose a commander to lead your army.
                </p>
              </div>
            )}
          </Card>

          {/* Units Section */}
          <div>
            <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-wide mb-3">
              Units ({army.units.length})
            </h3>
            {army.units.length === 0 ? (
              <Card padding="md">
                <p className="text-sm text-stone-500 text-center py-4">
                  No units added. Browse units on the right panel and click to
                  add.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {resolvedUnits.map(({ slot, unit, attachments }) => {
                  const unitFi = unit ? getFactionInfo(unit.faction) : factionInfo!;
                  return (
                  <Card key={slot.id} padding="none">
                    <div className="flex">
                      <div className="w-1.5 shrink-0 self-stretch rounded-l-lg" style={{ backgroundColor: unitFi.cardColor }} />
                      <div className="flex-1 p-3" style={{ backgroundColor: `${unitFi.cardColor}20` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {unit && (
                              <img
                                src={getPortraitUrl(unit.id)}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-stone-600"
                                style={{ backgroundColor: unitFi.cardColor }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {unit ? (
                                  <>
                                    <HoverCardPreview cardId={unit.id} faction={unit.faction}>
                                      <span className="text-sm font-medium text-stone-100 hover:text-amber-400 transition-colors">
                                        {unit.name}
                                      </span>
                                    </HoverCardPreview>
                                    <button
                                      className="text-stone-500 hover:text-amber-400 transition-colors"
                                      onClick={() => openCard(unit.id, unit.name, unit.faction)}
                                      title="View card"
                                    >
                                      <span className="text-[10px]">&#128065;</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-sm font-medium text-stone-100">
                                    {slot.unitId}
                                  </span>
                                )}
                                {unit && (
                                  <Badge variant="default" size="sm">
                                    {unit.cost} pts
                                  </Badge>
                                )}
                                {unit && (
                                  <Badge variant="default" size="sm">
                                    {capitalize(unit.tray)}
                                  </Badge>
                                )}
                              </div>
                              {unit && (
                                <div className="mt-0.5">
                                  <StatLine defense={unit.defense} morale={unit.morale} speed={unit.speed} size="xs" />
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeUnit(slot.id)}
                          >
                            X
                          </Button>
                        </div>

                    {/* Attached attachments */}
                    {attachments.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-stone-700 space-y-1.5">
                        {attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={getPortraitUrl(att.id)}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-stone-600"
                                style={{ backgroundColor: getFactionInfo(att.faction).cardColor }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                              <HoverCardPreview cardId={att.id} faction={att.faction}>
                                <span className="text-xs text-stone-300 hover:text-amber-400 transition-colors">
                                  {att.name}
                                </span>
                              </HoverCardPreview>
                              <button
                                className="text-stone-500 hover:text-amber-400 transition-colors"
                                onClick={() => openCard(att.id, att.name, att.faction)}
                                title="View card"
                              >
                                <span className="text-[10px]">&#128065;</span>
                              </button>
                              {att.cost !== undefined && att.cost > 0 && (
                                <Badge variant="default" size="sm">
                                  +{att.cost} pts
                                </Badge>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                removeAttachment(slot.id, att.id)
                              }
                              className="text-xs text-red-400 hover:text-red-300 px-1.5"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Commander indicator */}
                    {army.commanderUnitSlotId === slot.id && commanderData && (
                      <div className="mt-2 pl-3 border-l-2 border-amber-700 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="warning" size="sm">
                            Commander
                          </Badge>
                          <p className="text-xs text-amber-300">
                            {commanderData.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Add Attachment button */}
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPickAttachForSlot(slot.id)}
                      >
                        + Add Attachment
                      </Button>
                    </div>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* NCUs Section */}
          <div>
            <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-wide mb-3">
              NCUs ({army.ncus.length})
            </h3>
            {army.ncus.length === 0 ? (
              <Card padding="md">
                <p className="text-sm text-stone-500 text-center py-4">
                  No NCUs added. Browse NCUs on the right panel and click to
                  add.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {resolvedNCUs.map(({ slot, ncu }) => {
                  const ncuFi = ncu ? getFactionInfo(ncu.faction) : factionInfo!;
                  return (
                  <Card key={slot.id} padding="none">
                    <div className="flex">
                      <div className="w-1.5 shrink-0 self-stretch rounded-l-lg" style={{ backgroundColor: ncuFi.cardColor }} />
                      <div className="flex-1 p-3" style={{ backgroundColor: `${ncuFi.cardColor}20` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {ncu && (
                              <img
                                src={getPortraitUrl(ncu.id)}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-stone-600"
                                style={{ backgroundColor: ncuFi.cardColor }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                loading="lazy"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {ncu ? (
                                  <>
                                    <HoverCardPreview cardId={ncu.id} faction={ncu.faction}>
                                      <span className="text-sm font-medium text-stone-100 hover:text-amber-400 transition-colors">
                                        {ncu.name}
                                      </span>
                                    </HoverCardPreview>
                                    <button
                                      className="text-stone-500 hover:text-amber-400 transition-colors"
                                      onClick={() => openCard(ncu.id, ncu.name, ncu.faction)}
                                      title="View card"
                                    >
                                      <span className="text-[10px]">&#128065;</span>
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-sm font-medium text-stone-100">
                                    {slot.ncuId}
                                  </span>
                                )}
                                {ncu && (
                                  <Badge variant="default" size="sm">
                                    {ncu.cost} pts
                                  </Badge>
                                )}
                              </div>
                              {ncu?.title && (
                                <p className="text-xs text-stone-400 mt-0.5">
                                  {ncu.title}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeNCU(slot.id)}
                          >
                            X
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tactics Deck Section */}
          {(factionTacticsCards.length > 0 || commanderTacticsCards.length > 0) && (
            <div>
              <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-wide mb-3">
                Tactics Deck ({factionTacticsCards.length + commanderTacticsCards.length} cards)
              </h3>
              <Card padding="md">
                {/* Faction Tactics */}
                {factionTacticsCards.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                      Faction Tactics
                    </p>
                    <div className="space-y-1">
                      {factionTacticsCards.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-stone-800 transition-colors"
                        >
                          <HoverCardPreview cardId={t.id} faction={t.faction}>
                            <span className="text-xs text-stone-200 hover:text-amber-400 transition-colors">
                              {t.name}
                            </span>
                          </HoverCardPreview>
                          <button
                            className="text-stone-600 hover:text-amber-400 transition-colors"
                            onClick={() => openCard(t.id, t.name, t.faction)}
                            title="View card"
                          >
                            <span className="text-[10px]">&#128065;</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Commander Tactics */}
                {commanderTacticsCards.length > 0 && (
                  <div className={factionTacticsCards.length > 0 ? "pt-2 border-t border-stone-700" : ""}>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                      Commander Tactics
                    </p>
                    <div className="space-y-1">
                      {commanderTacticsCards.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded px-2 py-1 -mx-2 hover:bg-stone-800 transition-colors"
                        >
                          <HoverCardPreview cardId={t.id} faction={t.faction}>
                            <span className="text-xs text-amber-300 hover:text-amber-400 transition-colors">
                              {t.name}
                            </span>
                          </HoverCardPreview>
                          <button
                            className="text-stone-600 hover:text-amber-400 transition-colors"
                            onClick={() => openCard(t.id, t.name, t.faction)}
                            title="View card"
                          >
                            <span className="text-[10px]">&#128065;</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state when no commander selected */}
                {commanderTacticsCards.length === 0 && army.commanderId === null && (
                  <div className={factionTacticsCards.length > 0 ? "pt-2 border-t border-stone-700" : ""}>
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                      Commander Tactics
                    </p>
                    <p className="text-[10px] text-stone-500 italic">
                      Select a commander to see their tactics cards.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Validation Section */}
          {(errors.length > 0 || warnings.length > 0) && (
            <Card padding="md">
              <h3 className="text-sm font-semibold text-stone-200 uppercase tracking-wide mb-2">
                Validation
              </h3>
              <div className="space-y-1">
                {errors.map((err, i) => (
                  <p key={`err-${i}`} className="text-xs text-red-400">
                    {err.message}
                  </p>
                ))}
                {warnings.map((w, i) => (
                  <p key={`warn-${i}`} className="text-xs text-amber-400">
                    {w.message}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ---- RIGHT: Tabbed Browser ---- */}
        <div className="w-full lg:w-96 xl:w-80 shrink-0">
          <Card padding="sm" className="sticky top-20">
            <Tabs
              tabs={[
                {
                  id: "units",
                  label: "Units",
                  count: availableUnits.length,
                  content: (
                    <div className="space-y-3">
                      <SearchInput
                        placeholder="Search units..."
                        value={unitSearch}
                        onChange={(e) => setUnitSearch(e.target.value)}
                        onClear={() => setUnitSearch("")}
                      />
                      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                        {filteredUnits.length === 0 ? (
                          <p className="text-xs text-stone-500 text-center py-4">
                            No units found.
                          </p>
                        ) : (
                          filteredUnits.map((u) => {
                            const isDuplicate = u.character && usedCharacterUnitNames.has(u.name);
                            const uFi = getFactionInfo(u.faction);
                            return (
                            <Card
                              key={u.id}
                              hover={!isDuplicate}
                              padding="none"
                              className={`overflow-hidden ${isDuplicate ? "opacity-40 cursor-not-allowed" : ""}`}
                              onClick={() => { if (!isDuplicate) addUnit(u.id); }}
                            >
                              <div className="flex">
                                <div className="w-14 shrink-0 overflow-hidden rounded-l-lg self-stretch" style={{ backgroundColor: uFi.cardColor }}>
                                  <img
                                    src={getPortraitUrl(u.id)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 p-2" style={{ backgroundColor: `${uFi.cardColor}18`, borderLeft: `4px solid ${uFi.cardColor}` }}>
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-stone-100 truncate">
                                        {u.name}
                                      </p>
                                      {isDuplicate && (
                                        <p className="text-[9px] text-red-400 mt-0.5">Character — already added</p>
                                      )}
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <Badge variant="default" size="sm">
                                          {u.cost} pts
                                        </Badge>
                                        <Badge variant="default" size="sm">
                                          {capitalize(u.tray)}
                                        </Badge>
                                        {u.character && (
                                          <Badge variant="warning" size="sm">
                                            Character
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="mt-1">
                                        <StatLine defense={u.defense} morale={u.morale} speed={u.speed} size="xs" />
                                      </div>
                                    </div>
                                    <button
                                      className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCard(u.id, u.name, u.faction);
                                      }}
                                      title="View card"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "ncus",
                  label: "NCUs",
                  count: availableNCUs.length,
                  content: (
                    <div className="space-y-3">
                      <SearchInput
                        placeholder="Search NCUs..."
                        value={ncuSearch}
                        onChange={(e) => setNcuSearch(e.target.value)}
                        onClear={() => setNcuSearch("")}
                      />
                      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                        {filteredNCUs.length === 0 ? (
                          <p className="text-xs text-stone-500 text-center py-4">
                            No NCUs found.
                          </p>
                        ) : (
                          filteredNCUs.map((n) => {
                            const isDuplicate = n.character && usedCharacterNCUNames.has(n.name);
                            const nFi = getFactionInfo(n.faction);
                            return (
                            <Card
                              key={n.id}
                              hover={!isDuplicate}
                              padding="none"
                              className={`overflow-hidden ${isDuplicate ? "opacity-40 cursor-not-allowed" : ""}`}
                              onClick={() => { if (!isDuplicate) addNCU(n.id); }}
                            >
                              <div className="flex">
                                <div className="w-14 shrink-0 overflow-hidden rounded-l-lg self-stretch" style={{ backgroundColor: nFi.cardColor }}>
                                  <img
                                    src={getPortraitUrl(n.id)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 p-2" style={{ backgroundColor: `${nFi.cardColor}18`, borderLeft: `4px solid ${nFi.cardColor}` }}>
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-stone-100 truncate">
                                        {n.name}
                                      </p>
                                      {isDuplicate && (
                                        <p className="text-[9px] text-red-400 mt-0.5">Character — already added</p>
                                      )}
                                      {n.title && (
                                        <p className="text-[10px] text-stone-400 truncate">
                                          {n.title}
                                        </p>
                                      )}
                                      <Badge
                                        variant="default"
                                        size="sm"
                                        className="mt-1"
                                      >
                                        {n.cost} pts
                                      </Badge>
                                    </div>
                                    <button
                                      className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCard(n.id, n.name, n.faction);
                                      }}
                                      title="View card"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "attachments",
                  label: "Attach",
                  count: availableAttachments.length,
                  content: (
                    <div className="space-y-3">
                      <SearchInput
                        placeholder="Search attachments..."
                        value={attachSearch}
                        onChange={(e) => setAttachSearch(e.target.value)}
                        onClear={() => setAttachSearch("")}
                      />
                      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                        {filteredAttachments.length === 0 ? (
                          <p className="text-xs text-stone-500 text-center py-4">
                            No attachments found.
                          </p>
                        ) : (
                          filteredAttachments.map((a) => {
                            const isDuplicate = a.character && usedCharacterAttachmentNames.has(a.name);
                            const aFi = getFactionInfo(a.faction);
                            return (
                            <Card
                              key={a.id}
                              hover={!isDuplicate}
                              padding="none"
                              className={`overflow-hidden ${isDuplicate ? "opacity-40 cursor-not-allowed" : ""}`}
                              onClick={() => {
                                if (!isDuplicate) {
                                  setAttachModal({
                                    open: true,
                                    attachmentId: a.id,
                                  });
                                }
                              }}
                            >
                              <div className="flex">
                                <div className="w-14 shrink-0 overflow-hidden rounded-l-lg self-stretch" style={{ backgroundColor: aFi.cardColor }}>
                                  <img
                                    src={getPortraitUrl(a.id)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 p-2" style={{ backgroundColor: `${aFi.cardColor}18`, borderLeft: `4px solid ${aFi.cardColor}` }}>
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-stone-100 truncate">
                                        {a.name}
                                      </p>
                                      {isDuplicate && (
                                        <p className="text-[9px] text-red-400 mt-0.5">Character — already added</p>
                                      )}
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        {a.cost !== undefined && a.cost > 0 && (
                                          <Badge variant="default" size="sm">
                                            +{a.cost} pts
                                          </Badge>
                                        )}
                                        <Badge variant="default" size="sm">
                                          {capitalize(a.tray)}
                                        </Badge>
                                      </div>
                                    </div>
                                    <button
                                      className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCard(a.id, a.name, a.faction);
                                      }}
                                      title="View card"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "commanders",
                  label: "Cmdr",
                  count: commanders.length,
                  content: (
                    <div className="space-y-2">
                      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                        {commanders.length === 0 ? (
                          <p className="text-xs text-stone-500 text-center py-4">
                            No commanders available.
                          </p>
                        ) : (
                          commanders.map((c) => {
                            const cFi = getFactionInfo(c.faction);
                            return (
                            <Card
                              key={c.id}
                              hover
                              padding="none"
                              className="overflow-hidden"
                              onClick={() => {
                                selectCommanderOnly(c.id);
                              }}
                            >
                              <div className="flex">
                                {/* Character portrait thumbnail */}
                                <div className="w-14 shrink-0 overflow-hidden rounded-l-lg self-stretch" style={{ backgroundColor: cFi.cardColor }}>
                                  <img
                                    src={getPortraitUrl(c.id)}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0 p-2" style={{ backgroundColor: `${cFi.cardColor}18`, borderLeft: `4px solid ${cFi.cardColor}` }}>
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-medium text-stone-100 truncate">
                                          {c.name}
                                        </p>
                                        {c.faction === "neutral" && (
                                          <Badge variant="info" size="sm">
                                            Neutral
                                          </Badge>
                                        )}
                                      </div>
                                      {c.title && (
                                        <p className="text-[10px] text-stone-400 truncate">
                                          {c.title}
                                        </p>
                                      )}
                                      {c.cost != null && (
                                        <Badge variant="default" size="sm" className="mt-1">
                                          {c.cost} pts
                                        </Badge>
                                      )}
                                    </div>
                                    <button
                                      className="shrink-0 p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openCard(c.id, c.name, c.faction);
                                      }}
                                      title="View card"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </Card>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "tactics",
                  label: "Tactics",
                  content: (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      <div>
                        <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wide mb-2">
                          Faction Tactics
                        </h4>
                        {factionTacticsCards.length === 0 ? (
                          <p className="text-[10px] text-stone-500">
                            No faction tactics.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {factionTacticsCards.map((t) => (
                              <Card
                                key={t.id}
                                padding="sm"
                                hover
                                onClick={() =>
                                  openCard(t.id, t.name, t.faction)
                                }
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-stone-100">
                                    {t.name}
                                  </p>
                                  <svg className="w-3.5 h-3.5 shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wide mb-2">
                          Commander Tactics
                        </h4>
                        {commanderTacticsCards.length === 0 ? (
                          <p className="text-[10px] text-stone-500">
                            {army.commanderId
                              ? "No commander tactics."
                              : "Select a commander to see tactics."}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {commanderTacticsCards.map((t) => (
                              <Card
                                key={t.id}
                                padding="sm"
                                hover
                                onClick={() =>
                                  openCard(t.id, t.name, t.faction)
                                }
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-stone-100">
                                    {t.name}
                                  </p>
                                  <svg className="w-3.5 h-3.5 shrink-0 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {/* ---- MODAL: Pick unit slot for attachment (from browser tab) ---- */}
      <Modal
        isOpen={attachModal.open}
        onClose={() => setAttachModal({ open: false, attachmentId: null })}
        title="Attach to which unit?"
        size="sm"
      >
        {(() => {
          const selectedAtt = attachModal.attachmentId ? findAttachmentById(attachModal.attachmentId) : null;
          const compatibleUnits = resolvedUnits.filter(({ unit }) => {
            if (!unit || !selectedAtt) return true;
            return unit.tray === selectedAtt.tray;
          });
          if (army.units.length === 0) {
            return (
              <p className="text-sm text-stone-400">
                Add a unit first before attaching.
              </p>
            );
          }
          if (compatibleUnits.length === 0) {
            return (
              <div className="space-y-2">
                <p className="text-sm text-stone-400">
                  No compatible units. This attachment requires a <span className="text-amber-400 font-medium">{selectedAtt?.tray ? capitalize(selectedAtt.tray) : ""}</span> unit.
                </p>
              </div>
            );
          }
          return (
            <div className="space-y-2">
              {selectedAtt && (
                <p className="text-[10px] text-stone-500 mb-1">
                  Showing only {capitalize(selectedAtt.tray)} units (matching attachment tray type)
                </p>
              )}
              {compatibleUnits.map(({ slot, unit }) => (
                <Card
                  key={slot.id}
                  hover
                  padding="sm"
                  onClick={() => handleAttachToSlot(slot.id)}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-stone-100">
                      {unit?.name ?? slot.unitId}
                    </p>
                    {unit && (
                      <Badge variant="default" size="sm">{capitalize(unit.tray)}</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </Modal>

      {/* ---- MODAL: Pick unit slot for commander ---- */}
      <Modal
        isOpen={commanderModal.open}
        onClose={() =>
          setCommanderModal({ open: false, commanderId: null })
        }
        title="Attach commander to which unit?"
        size="sm"
      >
        {(() => {
          const selectedCmd = commanderModal.commanderId ? findAttachmentById(commanderModal.commanderId) : null;
          const compatibleUnits = resolvedUnits.filter(({ unit }) => {
            if (!unit || !selectedCmd) return true;
            return unit.tray === selectedCmd.tray;
          });
          if (army.units.length === 0) {
            return (
              <p className="text-sm text-stone-400">
                Add a unit first before selecting a commander.
              </p>
            );
          }
          if (compatibleUnits.length === 0) {
            return (
              <p className="text-sm text-stone-400">
                No compatible units. The commander requires a <span className="text-amber-400 font-medium">{selectedCmd?.tray ? capitalize(selectedCmd.tray) : ""}</span> unit.
              </p>
            );
          }
          return (
            <div className="space-y-2">
              {selectedCmd && (
                <p className="text-[10px] text-stone-500 mb-1">
                  Showing only {capitalize(selectedCmd.tray)} units (matching commander tray type)
                </p>
              )}
              {compatibleUnits.map(({ slot, unit }) => (
                <Card
                  key={slot.id}
                  hover
                  padding="sm"
                  onClick={() => handleCommanderToSlot(slot.id)}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-stone-100">
                      {unit?.name ?? slot.unitId}
                    </p>
                    {unit && (
                      <Badge variant="default" size="sm">{capitalize(unit.tray)}</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </Modal>

      {/* ---- MODAL: Commander Picker (from left panel button) ---- */}
      <Modal
        isOpen={commanderPicker.open}
        onClose={() =>
          setCommanderPicker({ open: false, step: "pick_commander", commanderId: null })
        }
        title="Select Commander"
        size="lg"
      >
        {commanders.length === 0 ? (
          <p className="text-sm text-stone-400">
            No commanders available for this faction.
          </p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {commanders.map((c) => (
              <Card
                key={c.id}
                hover
                padding="sm"
                onClick={() => handlePickerSelectCommander(c.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-stone-100 truncate">
                        {c.name}
                      </p>
                      {c.faction === "neutral" && (
                        <Badge variant="info" size="sm">
                          Neutral
                        </Badge>
                      )}
                    </div>
                    {c.title && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {c.title}
                      </p>
                    )}
                  </div>
                  <button
                    className="shrink-0 p-1.5 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCard(c.id, c.name, c.faction);
                    }}
                    title="View card"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* ---- MODAL: Save Confirmation (unattached commander) ---- */}
      <Modal
        isOpen={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        title="Commander Not Attached"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-300">
            Your commander <span className="text-amber-400 font-medium">{commanderData?.name}</span> is not attached to any unit. Are you sure you want to save?
          </p>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaveConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSaveConfirmOpen(false);
                doSave();
              }}
            >
              Save Anyway
            </Button>
          </div>
        </div>
      </Modal>

      {/* ---- MODAL: Card Image Viewer ---- */}
      <CardImageModal
        isOpen={cardViewer.isOpen}
        onClose={closeCard}
        cardId={cardViewer.cardId}
        cardName={cardViewer.cardName}
        faction={cardViewer.faction}
      />

      {/* ---- MODAL: Pick attachment for a specific unit slot (from "Add Attachment" button) ---- */}
      <Modal
        isOpen={pickAttachForSlot !== null}
        onClose={() => setPickAttachForSlot(null)}
        title="Select Attachment"
        size="lg"
      >
        {slotAttachments.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-stone-400">
              No compatible attachments available.
            </p>
            {pickAttachForSlot && (() => {
              const slot = army.units.find((s) => s.id === pickAttachForSlot);
              const targetUnit = slot ? findUnitById(slot.unitId) : null;
              return targetUnit ? (
                <p className="text-[10px] text-stone-500">
                  This unit requires <span className="text-amber-400">{capitalize(targetUnit.tray)}</span> attachments.
                </p>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {pickAttachForSlot && (() => {
              const slot = army.units.find((s) => s.id === pickAttachForSlot);
              const targetUnit = slot ? findUnitById(slot.unitId) : null;
              return targetUnit ? (
                <p className="text-[10px] text-stone-500 mb-1">
                  Showing {capitalize(targetUnit.tray)} attachments for {targetUnit.name}
                </p>
              ) : null;
            })()}
            {slotAttachments.map((a) => {
              const isDuplicate = a.character && usedCharacterAttachmentNames.has(a.name);
              return (
              <Card
                key={a.id}
                hover={!isDuplicate}
                padding="none"
                className={`overflow-hidden ${isDuplicate ? "opacity-40 cursor-not-allowed" : ""}`}
                onClick={() => { if (!isDuplicate) handlePickAttachment(a.id); }}
              >
                <div className="flex">
                  <div className="w-12 h-14 shrink-0 overflow-hidden rounded-l-lg" style={{ backgroundColor: getFactionInfo(a.faction).cardColor }}>
                    <img
                      src={getPortraitUrl(a.id)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 p-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-stone-100 truncate">
                          {a.name}
                        </p>
                        {isDuplicate && (
                          <p className="text-[9px] text-red-400">Character — already added</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.cost !== undefined && a.cost > 0 && (
                            <Badge variant="default" size="sm">
                              +{a.cost} pts
                            </Badge>
                          )}
                          <Badge variant="default" size="sm">
                            {capitalize(a.tray)}
                          </Badge>
                        </div>
                      </div>
                      <button
                        className="shrink-0 p-1.5 rounded hover:bg-stone-700 text-stone-500 hover:text-amber-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCard(a.id, a.name, a.faction);
                        }}
                        title="View card"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
