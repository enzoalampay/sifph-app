// =============================================================================
// Collection Domain Types
// =============================================================================

import { FactionId } from "./game-data";

export interface CollectionEntry {
  itemId: string;
  itemType: "unit" | "ncu" | "attachment";
  faction: FactionId;
  owned: boolean;
  quantity: number;
}

export type Collection = Record<string, CollectionEntry>;
