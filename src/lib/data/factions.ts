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
  /** Bright accent color for badges/text (readable on dark backgrounds) */
  color: string;
  /** Card-frame-derived color for container backgrounds & borders */
  cardColor: string;
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
    color: "#7a8a99",
    cardColor: "#515a62",
    bgColor: "bg-gray-700",
    textColor: "text-gray-300",
    crestUrl: `${CREST_BASE}/stark/crest.png`,
  },
  lannister: {
    id: "lannister",
    displayName: "House Lannister",
    shortName: "Lannister",
    color: "#a62030",
    cardColor: "#861b25",
    bgColor: "bg-red-900",
    textColor: "text-red-300",
    crestUrl: `${CREST_BASE}/lannister/crest.png`,
  },
  baratheon: {
    id: "baratheon",
    displayName: "House Baratheon",
    shortName: "Baratheon",
    color: "#F2A900",
    cardColor: "#F2A900",
    bgColor: "bg-yellow-900",
    textColor: "text-yellow-300",
    crestUrl: `${CREST_BASE}/baratheon/crest.png`,
  },
  bolton: {
    id: "bolton",
    displayName: "House Bolton",
    shortName: "Bolton",
    color: "#b56e80",
    cardColor: "#91556a",
    bgColor: "bg-red-950",
    textColor: "text-red-400",
    crestUrl: `${CREST_BASE}/bolton/crest.png`,
  },
  brotherhood: {
    id: "brotherhood",
    displayName: "Brotherhood Without Banners",
    shortName: "Brotherhood",
    color: "#5a8a50",
    cardColor: "#4a6741",
    bgColor: "bg-green-900",
    textColor: "text-green-300",
    crestUrl: `${CREST_BASE}/brotherhood/crest.png`,
  },
  freefolk: {
    id: "freefolk",
    displayName: "Free Folk",
    shortName: "Free Folk",
    color: "#8b7560",
    cardColor: "#2f2922",
    bgColor: "bg-stone-800",
    textColor: "text-stone-300",
    crestUrl: `${CREST_BASE}/freefolk/crest.png`,
  },
  greyjoy: {
    id: "greyjoy",
    displayName: "House Greyjoy",
    shortName: "Greyjoy",
    color: "#1a8a8a",
    cardColor: "#02363a",
    bgColor: "bg-teal-900",
    textColor: "text-teal-300",
    crestUrl: `${CREST_BASE}/greyjoy/crest.png`,
  },
  martell: {
    id: "martell",
    displayName: "House Martell",
    shortName: "Martell",
    color: "#FF8C00",
    cardColor: "#FF8C00",
    bgColor: "bg-orange-800",
    textColor: "text-orange-300",
    crestUrl: `${CREST_BASE}/martell/crest.png`,
  },
  neutral: {
    id: "neutral",
    displayName: "Neutral Forces",
    shortName: "Neutral",
    color: "#8a7560",
    cardColor: "#544334",
    bgColor: "bg-neutral-700",
    textColor: "text-neutral-300",
    crestUrl: `${CREST_BASE}/neutral/crest.png`,
  },
  nightswatch: {
    id: "nightswatch",
    displayName: "Night's Watch",
    shortName: "Night's Watch",
    color: "#6a7a8a",
    cardColor: "#212425",
    bgColor: "bg-zinc-800",
    textColor: "text-zinc-300",
    crestUrl: `${CREST_BASE}/nightswatch/crest.png`,
  },
  targaryen: {
    id: "targaryen",
    displayName: "House Targaryen",
    shortName: "Targaryen",
    color: "#8a2040",
    cardColor: "#5e102b",
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
