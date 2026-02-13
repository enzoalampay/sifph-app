import { ArmyList, ComputedTacticsDeck } from "../types/army-list";
import { getBaseFactionTactics, getCommanderTactics } from "../data/loader";

export function assembleTacticsDeck(army: ArmyList): ComputedTacticsDeck {
  const factionTactics = getBaseFactionTactics(army.faction).map((t) => t.id);

  let commanderTactics: string[] = [];
  if (army.commanderId) {
    commanderTactics = getCommanderTactics(army.commanderId).map((t) => t.id);
  }

  return {
    factionTactics,
    commanderTactics,
  };
}

export function getTotalTacticsCards(deck: ComputedTacticsDeck): number {
  return deck.factionTactics.length + deck.commanderTactics.length;
}
