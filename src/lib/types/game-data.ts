// =============================================================================
// Game Data Types - mirrors the JSON schemas from asoiaf-tmg-data repo
// =============================================================================

export type FactionId =
  | "stark"
  | "lannister"
  | "baratheon"
  | "bolton"
  | "brotherhood"
  | "freefolk"
  | "greyjoy"
  | "martell"
  | "neutral"
  | "nightswatch"
  | "targaryen";

export const ALL_FACTION_IDS: FactionId[] = [
  "stark",
  "lannister",
  "baratheon",
  "bolton",
  "brotherhood",
  "freefolk",
  "greyjoy",
  "martell",
  "neutral",
  "nightswatch",
  "targaryen",
];

// ---- Shared sub-types ----

export interface Attack {
  name: string;
  type: "melee" | "short" | "long";
  hit: number;
  dice: number[]; // dice per rank: [full, damaged, critical]
}

export interface InlineAbility {
  name: string;
  effect: string[];
}

export interface BackText {
  text: string;
  name?: string;
}

export interface Fluff {
  lore?: string;
  quote?: string;
}

export interface Tokens {
  name: string;
  number: number;
}

export type TrayType = "infantry" | "cavalry" | "solo" | "warmachine";

// ---- Core entity types ----

export interface GameUnit {
  id: string;
  name: string;
  faction: FactionId;
  version: string;
  role: "unit";
  abilities: string[]; // references to abilities.json keys
  attacks: Attack[];
  defense: number;
  morale: number;
  speed: number;
  cost: number;
  tray: TrayType;
  character?: boolean;
  wounds?: number;
  back_text?: BackText[];
  fluff?: Fluff;
  icon?: string;
  tokens?: Tokens;
}

export interface GameNCU {
  id: string;
  name: string;
  faction: FactionId;
  version: string;
  role: "ncu";
  title?: string;
  abilities: InlineAbility[];
  cost: number;
  character?: boolean;
  back_text?: BackText[];
  fluff?: Fluff;
  tokens?: Tokens;
}

export interface GameAttachment {
  id: string;
  name: string;
  faction: FactionId;
  version: string;
  role: "attachment";
  title?: string;
  abilities: string[]; // references to abilities.json keys
  tray: TrayType;
  character?: boolean;
  commander?: boolean;
  tactics?: string[]; // tactic IDs unlocked by this commander
  cost?: number;
  enemy?: boolean; // attaches to enemy units
  back_text?: BackText[];
  fluff?: Fluff;
  icon?: string;
  tokens?: Tokens;
}

export interface TacticsText {
  trigger: string;
  effect: string[];
}

export interface GameTactics {
  id: string;
  name: string;
  faction: FactionId;
  version: string;
  role: "tactics";
  text: TacticsText[];
  commander?: { id: string };
}

export interface GameSpecial {
  id: string;
  name: string;
  faction?: FactionId;
  version: string;
  role: "special";
  category: string;
  front?: Record<string, unknown>;
  back?: Record<string, unknown>;
}

// ---- Abilities dictionary ----

export interface AbilityDefinition {
  effect: string[];
  icons?: string[];
  trigger?: string;
}

export type AbilitiesMap = Record<string, AbilityDefinition>;

// ---- Faction data bundle (one per faction JSON file) ----

export interface FactionMeta {
  author?: string;
  id?: string;
  language?: string;
}

export interface FactionData {
  _meta: FactionMeta;
  unit: GameUnit[];
  ncu: GameNCU[];
  attachment: GameAttachment[];
  tactics: GameTactics[];
  special?: GameSpecial[];
}

// ---- Tactics Board (from game.json) ----

export interface TacticsBoard {
  id: string;
  name: string;
  version: string;
  role: "special";
  category: "tactics-board";
  front: Record<string, string[]>;
}

export interface GameDataFile {
  _meta: FactionMeta;
  unit: GameUnit[];
  ncu: GameNCU[];
  attachment: GameAttachment[];
  tactics: GameTactics[];
  special: (TacticsBoard | GameSpecial)[];
}
