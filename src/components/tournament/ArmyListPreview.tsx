"use client";

import { ArmyList } from "@/lib/types/army-list";
import { GameAttachment } from "@/lib/types/game-data";
import { getFactionInfo } from "@/lib/data/factions";
import {
  findUnitById,
  findNCUById,
  findAttachmentById,
  getBaseFactionTactics,
  getCommanderTactics,
} from "@/lib/data/loader";
import { getPortraitUrl } from "@/lib/utils/card-images";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ArmyListPreviewProps {
  list: ArmyList;
  onOpenInBuilder?: () => void;
}

export function ArmyListPreview({ list, onOpenInBuilder }: ArmyListPreviewProps) {
  const fi = getFactionInfo(list.faction);
  const commander = list.commanderId
    ? findAttachmentById(list.commanderId)
    : null;

  const units = list.units.map((s) => ({
    slot: s,
    unit: findUnitById(s.unitId),
    attachments: s.attachmentIds
      .map((a) => findAttachmentById(a))
      .filter((a): a is GameAttachment => !!a),
  }));

  const ncus = list.ncus.map((s) => ({
    slot: s,
    ncu: findNCUById(s.ncuId),
  }));

  const totalCost =
    units.reduce(
      (sum, u) =>
        sum +
        (u.unit?.cost ?? 0) +
        u.attachments.reduce((as, a) => as + (a.cost ?? 0), 0),
      0
    ) +
    ncus.reduce((sum, n) => sum + (n.ncu?.cost ?? 0), 0) +
    (commander?.cost ?? 0);

  const factionTactics = getBaseFactionTactics(list.faction);
  const commanderTactics = list.commanderId
    ? getCommanderTactics(list.commanderId)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-stone-700">
        <img
          src={fi.crestUrl}
          alt={fi.shortName}
          className="w-10 h-10 object-contain drop-shadow"
        />
        <div>
          <p className="text-sm font-semibold text-stone-100">
            {fi.displayName}
          </p>
          <p className="text-xs text-stone-400">
            {totalCost}/{list.pointLimit} pts
          </p>
        </div>
        <Badge variant="faction" size="sm" color={fi.color} className="ml-auto">
          {fi.shortName}
        </Badge>
      </div>

      {/* Commander */}
      {commander && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Commander
          </p>
          <div
            className="flex items-center gap-2 rounded-md p-2"
            style={{
              backgroundColor: `${fi.cardColor}25`,
              borderLeft: `3px solid ${fi.cardColor}`,
            }}
          >
            <img
              src={getPortraitUrl(commander.id)}
              alt=""
              className="w-8 h-8 rounded-full object-cover bg-stone-800 shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <p className="text-sm font-medium text-stone-100">
                {commander.name}
              </p>
              {commander.title && (
                <p className="text-[10px] text-stone-400">{commander.title}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Units */}
      {units.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Units ({units.length})
          </p>
          <div className="space-y-1.5">
            {units.map(({ slot, unit, attachments }) => {
              const uFi = unit ? getFactionInfo(unit.faction) : fi;
              return (
                <div
                  key={slot.id}
                  className="rounded-md p-2"
                  style={{
                    backgroundColor: `${uFi.cardColor}25`,
                    borderLeft: `3px solid ${uFi.cardColor}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {unit && (
                      <img
                        src={getPortraitUrl(unit.id)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover bg-stone-800 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-stone-100 truncate">
                          {unit?.name ?? slot.unitId}
                        </p>
                        {unit && (
                          <span className="text-[10px] text-stone-400">
                            {unit.cost} pts
                          </span>
                        )}
                      </div>
                      {attachments.length > 0 && (
                        <div className="mt-0.5">
                          {attachments.map((att) => (
                            <p
                              key={att.id}
                              className="text-[10px] text-stone-400 pl-2"
                            >
                              + {att.name}
                              {att.cost ? ` (${att.cost} pts)` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                      {list.commanderUnitSlotId === slot.id && commander && (
                        <p className="text-[10px] text-amber-400 pl-2">
                          ★ {commander.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NCUs */}
      {ncus.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            NCUs ({ncus.length})
          </p>
          <div className="space-y-1.5">
            {ncus.map(({ slot, ncu }) => {
              const nFi = ncu ? getFactionInfo(ncu.faction) : fi;
              return (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 rounded-md p-2"
                  style={{
                    backgroundColor: `${nFi.cardColor}25`,
                    borderLeft: `3px solid ${nFi.cardColor}`,
                  }}
                >
                  {ncu && (
                    <img
                      src={getPortraitUrl(ncu.id)}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover bg-stone-800 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div>
                    <p className="text-xs font-medium text-stone-100">
                      {ncu?.name ?? slot.ncuId}
                    </p>
                    {ncu && (
                      <span className="text-[10px] text-stone-400">
                        {ncu.cost} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tactics Deck */}
      {(factionTactics.length > 0 || commanderTactics.length > 0) && (
        <div>
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Tactics Deck
          </p>
          <div className="space-y-1">
            {factionTactics.map((t) => (
              <p key={t.id} className="text-xs text-stone-300 pl-2">
                {t.name}
              </p>
            ))}
            {commanderTactics.length > 0 && (
              <>
                <p className="text-[10px] text-amber-400 mt-1.5 font-medium">
                  Commander Tactics
                </p>
                {commanderTactics.map((t) => (
                  <p key={t.id} className="text-xs text-stone-300 pl-2">
                    {t.name}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {onOpenInBuilder && (
        <div className="flex items-center gap-2 pt-2 border-t border-stone-700">
          <Button variant="secondary" size="sm" onClick={onOpenInBuilder}>
            Open in Builder
          </Button>
        </div>
      )}
    </div>
  );
}
