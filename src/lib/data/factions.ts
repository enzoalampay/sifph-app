// =============================================================================
// Faction Registry - display metadata for each faction
// =============================================================================

import { FactionId } from "../types/game-data";

const CREST_BASE =
  "https://raw.githubusercontent.com/Pf2eTools/asoiaf-tmg-data/master/assets/warcouncil";

export interface FactionInfo {
  id: FactionId;
  displayName: string;
  shortName: string;
  color: string;
  bgColor: string;
  textColor: string;
  /** URL to the faction crest / sigil PNG */
  crestUrl: string;
}

export const FACTIONS: Record<FactionId, FactionInfo> = {
  stark: {
    id: "stark",
    displayName: "House Stark",
    shortName: "Stark",
    color: "#8B8B8B",
    bgColor: "bg-gray-700",
    textColor: "text-gray-300",
    crestUrl: `${CREST_BASE}/stark/crest.png`,
  },
  lannister: {
    id: "lannister",
    displayName: "House Lannister",
    shortName: "Lannister",
    color: "#C8102E",
    bgColor: "bg-red-900",
    textColor: "text-red-300",
    crestUrl: `${CREST_BASE}/lannister/crest.png`,
  },
  baratheon: {
    id: "baratheon",
    displayName: "House Baratheon",
    shortName: "Baratheon",
    color: "#F2A900",
    bgColor: "bg-yellow-900",
    textColor: "text-yellow-300",
    crestUrl: `${CREST_BASE}/baratheon/crest.png`,
  },
  bolton: {
    id: "bolton",
    displayName: "House Bolton",
    shortName: "Bolton",
    color: "#8B0000",
    bgColor: "bg-red-950",
    textColor: "text-red-400",
    crestUrl: `${CREST_BASE}/bolton/crest.png`,
  },
  brotherhood: {
    id: "brotherhood",
    displayName: "Brotherhood Without Banners",
    shortName: "Brotherhood",
    color: "#FF6B35",
    bgColor: "bg-orange-900",
    textColor: "text-orange-300",
    crestUrl: `${CREST_BASE}/brotherhood/crest.png`,
  },
  freefolk: {
    id: "freefolk",
    displayName: "Free Folk",
    shortName: "Free Folk",
    color: "#87CEEB",
    bgColor: "bg-sky-900",
    textColor: "text-sky-300",
    crestUrl: `${CREST_BASE}/freefolk/crest.png`,
  },
  greyjoy: {
    id: "greyjoy",
    displayName: "House Greyjoy",
    shortName: "Greyjoy",
    color: "#DAA520",
    bgColor: "bg-amber-900",
    textColor: "text-amber-300",
    crestUrl: `${CREST_BASE}/greyjoy/crest.png`,
  },
  martell: {
    id: "martell",
    displayName: "House Martell",
    shortName: "Martell",
    color: "#FF8C00",
    bgColor: "bg-orange-800",
    textColor: "text-orange-300",
    crestUrl: `${CREST_BASE}/martell/crest.png`,
  },
  neutral: {
    id: "neutral",
    displayName: "Neutral Forces",
    shortName: "Neutral",
    color: "#A0A0A0",
    bgColor: "bg-neutral-700",
    textColor: "text-neutral-300",
    crestUrl: `${CREST_BASE}/neutral/crest.png`,
  },
  nightswatch: {
    id: "nightswatch",
    displayName: "Night's Watch",
    shortName: "Night's Watch",
    color: "#1C1C1C",
    bgColor: "bg-zinc-800",
    textColor: "text-zinc-300",
    crestUrl: `${CREST_BASE}/nightswatch/crest.png`,
  },
  targaryen: {
    id: "targaryen",
    displayName: "House Targaryen",
    shortName: "Targaryen",
    color: "#B22222",
    bgColor: "bg-rose-900",
    textColor: "text-rose-300",
    crestUrl: `${CREST_BASE}/targaryen/crest.png`,
  },
};

export function getFactionInfo(factionId: FactionId): FactionInfo {
  return FACTIONS[factionId];
}

export function getFactionDisplayName(factionId: FactionId): string {
  return FACTIONS[factionId]?.displayName ?? factionId;
}
